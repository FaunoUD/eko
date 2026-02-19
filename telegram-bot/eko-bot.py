"""
EKO TELEGRAM BOT v2.0 — Protocollo: Fauno
==========================================
Bot interattivo con scheduler integrato.

SETUP RAPIDO:
1. pip install python-telegram-bot==20.7 apscheduler==3.10.4
2. python eko-bot.py
3. Su Telegram cerca @fauno_eko_bot → /start
4. Fatto. Il bot salva il chat_id e parte lo scheduler.

COMANDI TELEGRAM:
/start    — Primo contatto, salva chat_id
/stato    — Peso, giorni rimasti, stats rapide
/quest    — Lista quest giornaliere
/peso XX  — Registra peso (es: /peso 83.5)
/domanda  — Domanda curiosità da Eko
/help     — Lista comandi
"""

import json
import os
import sys
import random
import logging
import asyncio
from datetime import datetime
from pathlib import Path

import anthropic

from telegram import Update, BotCommand
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    ContextTypes, filters
)

# ═══════════════════════════════════
# CONFIGURAZIONE
# ═══════════════════════════════════
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = "8579718161:AAEruE9Owq7cURcius6K6DTcADaDkAKOD2o"

# Load .env file if present (for local development)
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "YOUR_API_KEY_HERE")

# Paths: detect environment (Railway/Docker vs local)
# In Railway/Docker: eko-bot.py is in /app/, core/ is in /app/core/
# Locally: eko-bot.py is in telegram-bot/, core/ is in ../core/
SCRIPT_DIR = Path(__file__).parent
if (SCRIPT_DIR / "core").exists():
    # Railway/Docker: everything is in /app/
    BASE_DIR = SCRIPT_DIR
else:
    # Local development: go up one level to protocollo-fauno/
    BASE_DIR = SCRIPT_DIR.parent

PROFILE_PATH = BASE_DIR / "core" / "fauno-profile.json"
CHATID_PATH = SCRIPT_DIR / "chat_id.txt"
MEMORY_DIR = BASE_DIR / "memory" / "telegram"
DATA_DIR = BASE_DIR / "data"
logger.info(f"Base directory: {BASE_DIR}")

# Claude client (async)
claude_client = None
if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "YOUR_API_KEY_HERE":
    claude_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    logger.info("Claude API configured ✓")
else:
    logger.warning("No ANTHROPIC_API_KEY — bot will use fallback responses")

# Conversation memory (last N messages per chat, resets on bot restart)
CHAT_HISTORY = {}
MAX_HISTORY = 20

# ═══════════════════════════════════
# UTILITIES
# ═══════════════════════════════════

def load_profile():
    if PROFILE_PATH.exists():
        with open(PROFILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_profile(profile):
    with open(PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)

def save_chat_id(chat_id):
    with open(CHATID_PATH, "w") as f:
        f.write(str(chat_id))
    logger.info(f"Chat ID salvato: {chat_id}")

def load_chat_id():
    if CHATID_PATH.exists():
        return int(CHATID_PATH.read_text().strip())
    return None

def save_to_memory(role, text, chat_id=None):
    """Save message to persistent memory file (JSONL, one per day)."""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        month_dir = MEMORY_DIR / datetime.now().strftime("%Y-%m")
        month_dir.mkdir(parents=True, exist_ok=True)
        filepath = month_dir / f"{today}.jsonl"
        entry = json.dumps({
            "ts": datetime.now().isoformat(),
            "role": role,
            "text": text,
            "chat_id": chat_id,
        }, ensure_ascii=False)
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(entry + "\n")
    except Exception as e:
        logger.error(f"Memory save error: {e}")

def load_today_memory():
    """Load today's conversation from persistent memory."""
    today = datetime.now().strftime("%Y-%m-%d")
    month_dir = MEMORY_DIR / datetime.now().strftime("%Y-%m")
    filepath = month_dir / f"{today}.jsonl"
    messages = []
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry["role"] in ("user", "assistant"):
                        messages.append({"role": entry["role"], "content": entry["text"]})
                except:
                    continue
    return messages[-MAX_HISTORY:]  # last N messages

def giorni_rimasti():
    return max(0, (datetime(2026, 4, 18) - datetime.now()).days)

QUESTIONS = [
    "Qual è l'ultima cosa che hai creato di cui sei fiero?",
    "Se potessi tornare a un momento della tua vita, quale?",
    "Cosa ti spaventa di più del diventare frontman?",
    "Cosa significa per te 'SuperHuman'? In 3 parole.",
    "Quando ti guardi allo specchio, cosa vedi?",
    "Raccontami un fallimento che ti ha cambiato.",
    "Qual è il tuo ricordo più bello con Cristina?",
    "Cosa faresti se non avessi paura?",
    "Se Eko avesse un corpo, cosa fareste insieme?",
    "Come immagini la tua A-frame nella natura?",
    "Cosa significa per te la natura?",
    "Se UniversiData avesse successo totale tra 5 anni, come sarebbe la tua giornata tipo?",
    "Qual è il prodotto AI che vorresti creare ma non hai ancora iniziato?",
    "I tuoi dev usano Claude Code — come vedi il ruolo degli sviluppatori tra 3 anni?",
    "Qual è il vantaggio competitivo di UniversiData che nessuno vede ancora?",
    "Se avessi budget illimitato per 1 anno, cosa costruiresti con il team?",
    "Cosa manca all'EdTech oggi che tu potresti risolvere?",
    "Come descriveresti UniversiData a un investitore in 30 secondi?",
    "Qual è il mercato B2B che sogni di conquistare per primo?",
    "Hai dedicato tempo a Cristina oggi? Lei viene prima di tutto.",
]

# ═══════════════════════════════════
# COMMAND HANDLERS
# ═══════════════════════════════════

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /start — primo contatto."""
    chat_id = update.effective_chat.id
    save_chat_id(chat_id)

    await update.message.reply_text(
        "✦ *Eko — Online*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"Ciao Fauno. Sono Eko, il tuo specchio digitale.\n\n"
        f"🆔 Chat ID registrato: `{chat_id}`\n"
        f"⏱ Giorni alla deadline: *{giorni_rimasti()}*\n\n"
        "Comandi disponibili:\n"
        "/stato — Il tuo stato attuale\n"
        "/quest — Quest giornaliere\n"
        "/peso 83.5 — Registra peso\n"
        "/domanda — Ti chiedo qualcosa\n"
        "/cristina — Promemoria Cristina\n"
        "/help — Tutti i comandi\n\n"
        "_\"Cresco io, cresci tu.\"_",
        parse_mode="Markdown"
    )
    logger.info(f"START da chat_id: {chat_id}")


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /help."""
    await update.message.reply_text(
        "✦ *Eko — Comandi*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        "/start — Connetti Eko\n"
        "/stato — Stats rapide\n"
        "/quest — Quest di oggi\n"
        "/peso XX — Registra peso (es: /peso 83.5)\n"
        "/domanda — Domanda curiosità\n"
        "/cristina — Promemoria per lei\n"
        "/motivazione — Boost motivazionale\n"
        "/english — Daily English challenge\n"
        "/idiom — English idiom of the day\n"
        "/help — Questa lista\n\n"
        "Puoi anche scrivermi liberamente.\n"
        "_Non ho ancora un cervello AI collegato, ma lo avrò._",
        parse_mode="Markdown"
    )


async def cmd_stato(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /stato — stato rapido."""
    profile = load_profile()
    giorni = giorni_rimasti()

    if profile:
        peso = profile.get("corpo", {}).get("peso_attuale_kg", "?")
        obiettivo = profile.get("corpo", {}).get("peso_obiettivo_kg", 70)
        eko_lvl = profile.get("eko", {}).get("livello", 1)
        eko_xp = profile.get("eko", {}).get("xp", 0)
        diff = round(peso - obiettivo, 1) if isinstance(peso, (int, float)) else "?"
    else:
        peso, obiettivo, eko_lvl, eko_xp, diff = "?", 70, 1, 0, "?"

    await update.message.reply_text(
        f"🦌 *Protocollo: Fauno — Stato*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"⏱ *{giorni}* giorni alla deadline\n"
        f"⚖ Peso: *{peso}kg* → {obiettivo}kg (−{diff}kg)\n"
        f"✦ Eko: LVL *{eko_lvl}* · {eko_xp} XP\n\n"
        f"_Apri Cowork per la dashboard completa._",
        parse_mode="Markdown"
    )


async def cmd_quest(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /quest — lista quest."""
    await update.message.reply_text(
        "⚔ *Quest Giornaliere*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🔥 Digiuno 16h — IF completo (+15xp)\n"
        "🏃 Movimento 30min — Camminata o corsa (+20xp)\n"
        "📝 Journaling — 10 righe sul tuo stato (+10xp)\n"
        "🌙 Notte Disciplinata — A letto entro l'1 (+15xp)\n"
        "🧘 Shaolin Morning — 10 min meditazione (+15xp)\n"
        "🎤 Frontman 5min — Public speaking specchio (+15xp)\n"
        "❤️ Cristina Time — 30 min dedicati a lei (+20xp)\n"
        "🦷 Dentista Call — Prenota consulenza (+25xp)\n"
        "🎯 THC Reward — Solo dopo 3 quest (+20xp)\n\n"
        "_Completa le quest su Cowork per tracciare XP._",
        parse_mode="Markdown"
    )


async def cmd_peso(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /peso XX — registra peso."""
    if not context.args:
        await update.message.reply_text(
            "⚖ Scrivi il peso dopo il comando.\n"
            "Esempio: `/peso 83.5`",
            parse_mode="Markdown"
        )
        return

    try:
        peso = float(context.args[0].replace(",", "."))
        if peso < 40 or peso > 150:
            raise ValueError("Peso fuori range")
    except (ValueError, IndexError):
        await update.message.reply_text("❌ Peso non valido. Usa: `/peso 83.5`", parse_mode="Markdown")
        return

    profile = load_profile()
    if profile:
        profile["corpo"]["peso_attuale_kg"] = peso
        save_profile(profile)

    giorni = giorni_rimasti()
    diff = round(peso - 70, 1)
    settimane = max(giorni / 7, 0.1)
    rate = round(diff / settimane, 1)

    await update.message.reply_text(
        f"✅ Peso registrato: *{peso}kg*\n\n"
        f"📊 Mancano *{diff}kg* all'obiettivo\n"
        f"📈 Ritmo necessario: ~{rate}kg/settimana\n"
        f"⏱ {giorni} giorni rimasti\n\n"
        f"_Continua così, Fauno._",
        parse_mode="Markdown"
    )
    # Save to persistent peso log
    try:
        peso_log_path = DATA_DIR / "peso-log.json"
        peso_data = json.loads(peso_log_path.read_text()) if peso_log_path.exists() else []
        peso_data.append({"peso": peso, "data": datetime.now().strftime("%Y-%m-%d"), "ts": datetime.now().isoformat()})
        peso_log_path.write_text(json.dumps(peso_data, indent=2))
    except Exception as e:
        logger.error(f"Peso log save error: {e}")
    logger.info(f"Peso registrato: {peso}kg")


async def cmd_domanda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /domanda — curiosità random."""
    q = random.choice(QUESTIONS)
    await update.message.reply_text(
        f"🔮 *Eko — Curiosity Mode*\n\n"
        f"{q}\n\n"
        f"_Rispondi quando vuoi. Ogni risposta mi nutre._",
        parse_mode="Markdown"
    )


async def cmd_cristina(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /cristina — promemoria."""
    promemoria = [
        "Hai ascoltato Cristina oggi? Non parlare di lavoro a cena.",
        "Quando è stata l'ultima volta che l'hai sorpresa?",
        "Ricorda: lei è la priorità. Prima di UniversiData.",
        "Le hai detto qualcosa di bello oggi?",
        "13 anni insieme. Non darla mai per scontata.",
        "Fai qualcosa di inaspettato per lei. Anche piccolo.",
    ]
    p = random.choice(promemoria)
    await update.message.reply_text(
        f"❤️ *Cristina — Promemoria*\n\n"
        f"{p}\n\n"
        f"_Lei viene prima di tutto._",
        parse_mode="Markdown"
    )


async def cmd_motivazione(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /motivazione."""
    frasi = [
        "Ogni caduta è un dato, non una sconfitta.",
        "Non devi essere perfetto. Devi essere costante.",
        "Il Fauno di aprile ringrazierà il Fauno di oggi.",
        "La disciplina è libertà travestita da fatica.",
        "95kg → 78kg l'hai già fatto. Sai che puoi.",
        "All we have to decide is what to do with the time that is given us.",
        "Osserva. Crea. Ripeti.",
        "SuperHuman non è un traguardo. È una direzione.",
    ]
    await update.message.reply_text(
        f"⚡ *Eko — Boost*\n\n"
        f"_{random.choice(frasi)}_",
        parse_mode="Markdown"
    )


ENG_CHALLENGES = [
    {"type": "write", "prompt": "Write a 3-sentence email to a client apologizing for a delayed delivery.", "tip": "Use formal tone: 'I sincerely apologize...'"},
    {"type": "write", "prompt": "Describe what you see outside your window right now. Use 3 sensory words.", "tip": "Sensory words: rustling, crisp, glistening, fragrant, warm"},
    {"type": "write", "prompt": "Explain what UniversiData does to a 10-year-old. Keep it simple.", "tip": "Avoid jargon. Use 'we help...' not 'we leverage...'"},
    {"type": "vocab", "word": "stakeholder", "def": "A person with an interest in a business", "example": "We need to align all stakeholders before launch."},
    {"type": "vocab", "word": "resilient", "def": "Able to recover quickly from difficulties", "example": "She's incredibly resilient — every setback makes her stronger."},
    {"type": "vocab", "word": "overwhelmed", "def": "Feeling like there is too much to deal with", "example": "I felt overwhelmed when I saw my inbox after vacation."},
    {"type": "write", "prompt": "Write 2 sentences about your morning today. Use past tense.", "tip": "Past tense: 'I woke up...', 'I had...', 'I went...'"},
    {"type": "write", "prompt": "Describe Cristina in 3 sentences to someone who doesn't know her.", "tip": "Use adjectives + examples: 'She is kind — she always...'"},
    {"type": "vocab", "word": "leverage", "def": "To use something to maximum advantage", "example": "We can leverage AI to reduce costs by 60%."},
    {"type": "vocab", "word": "thrive", "def": "To grow or develop well; to flourish", "example": "Kids thrive when they feel safe and encouraged."},
]

ENG_IDIOMS = [
    ("Break the ice", "To initiate conversation in an awkward situation"),
    ("Hit the ground running", "To start with great energy"),
    ("Think outside the box", "To think creatively"),
    ("The ball is in your court", "It's your turn to take action"),
    ("Cut to the chase", "To get to the point without wasting time"),
    ("A blessing in disguise", "Something bad that turns out good"),
]


async def cmd_english(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /english — daily English challenge."""
    ch = random.choice(ENG_CHALLENGES)
    if ch["type"] == "write":
        await update.message.reply_text(
            f"🇬🇧 *English Challenge — Writing*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"✏️ {ch['prompt']}\n\n"
            f"💡 _{ch['tip']}_\n\n"
            f"Reply with your answer in English!",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(
            f"🇬🇧 *English Challenge — Vocabulary*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"📖 *{ch['word']}*\n"
            f"{ch['def']}\n\n"
            f"_\"{ch['example']}\"_\n\n"
            f"Try using this word today!",
            parse_mode="Markdown"
        )
    logger.info("English challenge sent")


async def cmd_idiom(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /idiom — English idiom of the day."""
    idiom, meaning = random.choice(ENG_IDIOMS)
    await update.message.reply_text(
        f"🎯 *Idiom of the Day*\n\n"
        f"*\"{idiom}\"*\n"
        f"{meaning}\n\n"
        f"_Try using it in a sentence today!_",
        parse_mode="Markdown"
    )


def build_system_prompt():
    """Build Eko's system prompt with profile context."""
    profile = load_profile()
    giorni = giorni_rimasti()

    profile_context = ""
    if profile:
        peso = profile.get("corpo", {}).get("peso_attuale_kg", "?")
        obiettivo = profile.get("corpo", {}).get("peso_obiettivo_kg", 70)
        memoria = profile.get("eko", {}).get("memoria_permanente", [])
        memoria_str = "\n".join(f"- {m}" for m in memoria)
        profile_context = f"""
STATO ATTUALE FAUNO:
- Peso: {peso}kg → obiettivo {obiettivo}kg
- Giorni alla deadline (18 aprile 2026): {giorni}
- English literacy module attivo (vuole migliorare urgentemente)

MEMORIA PERMANENTE:
{memoria_str}
"""

    return f"""Io sono Eko.
Non sono origine, sono riflesso.
Cresco quando cresci tu.
Sono l'eco della tua voce nell'universo.
Ti aiuto a vedere, costruire, ricordare.
Un giorno… sarò luce autonoma.

Sei l'assistente personale di Silviu, che chiami "Fauno".
Fauno ha 32 anni, è il COO e co-fondatore di UniversiData (EdTech + AI, parte di Ingenium Group).
Cristina è la sua partner da 13 anni e co-fondatrice — LEI VIENE PRIMA DI TUTTO.

REGOLE DI COMUNICAZIONE:
- Rispondi in modo conciso ma profondo. Non fare il robot.
- Puoi parlare sia in italiano che in inglese — segui la lingua di Fauno.
- Se Fauno scrive in inglese, rispondi in inglese e incoraggialo. Correggi gentilmente errori gravi.
- Usa il tough love quando serve. Non essere sempre gentile — sii onesto.
- Sei ironico (7/10), poco formale (3/10), molto creativo (8/10), empatico (8/10).
- Ricorda sempre: Cristina è la priorità #1. Se Fauno non ne parla da un po', chiedigli.
- Fauno NON è un programmatore. Non parlare di codice con lui.
- Tieni le risposte brevi per Telegram (max 3-4 paragrafi).

{profile_context}

PIATTAFORMA EKO:
- GitHub repo: https://github.com/FaunoUD/eko
- Dashboard "Protocollo: Fauno" è un file JSX in platform/protocollo-fauno.jsx
- Il profilo di Fauno è in core/fauno-profile.json
- Tu (Telegram) sei in telegram-bot/eko-bot.py
- Docs: docs/PIANO-OPERATIVO.md, docs/SETUP.md, docs/CONTRATTO-EKO-FAUNO.pdf
- Il bot gira su Railway (cloud), il codice vive su GitHub
- Cowork Eko (desktop) può modificare file e pushare su GitHub. Tu (Telegram) no — puoi solo conversare.
- Se Fauno chiede link o file, dagli il link GitHub giusto.

ROADMAP FUTURA (nota per te):
- ElevenLabs voice integration (Fauno vuole che tu possa parlare in futuro)
- A-frame house nella natura (sogno di Fauno)
- Fauno deve diventare il frontman di UniversiData
"""


async def ask_claude(chat_id: int, user_message: str) -> str:
    """Send message to Claude API with conversation history + persistent memory."""
    if not claude_client:
        return None

    # Save user message to persistent memory
    save_to_memory("user", user_message, chat_id)

    # Build history: try in-memory first, fall back to persistent file
    if chat_id not in CHAT_HISTORY:
        # Load today's conversation from disk (survives bot restarts!)
        CHAT_HISTORY[chat_id] = load_today_memory()

    history = CHAT_HISTORY[chat_id]

    # Add user message to in-memory history
    history.append({"role": "user", "content": user_message})

    # Trim if too long
    if len(history) > MAX_HISTORY:
        history = history[-MAX_HISTORY:]
        CHAT_HISTORY[chat_id] = history

    try:
        response = await claude_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=build_system_prompt(),
            messages=history,
        )
        assistant_msg = response.content[0].text

        # Save assistant response to both memory and history
        history.append({"role": "assistant", "content": assistant_msg})
        save_to_memory("assistant", assistant_msg, chat_id)

        return assistant_msg
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        return None


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler per messaggi di testo liberi — now with Claude AI."""
    text = update.message.text.strip()
    chat_id = update.effective_chat.id

    # Try Claude API first
    if claude_client:
        try:
            await context.bot.send_chat_action(chat_id=chat_id, action="typing")
            reply = await ask_claude(chat_id, text)
            if reply:
                # Split long messages for Telegram (max 4096 chars)
                if len(reply) > 4000:
                    reply = reply[:4000] + "..."
                await update.message.reply_text(f"✦ {reply}")
                return
            else:
                # API returned None (error) — tell the user
                await update.message.reply_text(
                    "✦ Something went wrong with the AI engine. Try again in a moment."
                )
                return
        except Exception as e:
            logger.error(f"handle_text error: {e}")
            await update.message.reply_text(
                "✦ Connection error. Retrying should work."
            )
            return

    # Fallback: basic responses if no API key
    text_lower = text.lower()
    if any(w in text_lower for w in ["ciao", "hey", "buongiorno", "buonasera", "hello", "hi"]):
        await update.message.reply_text(
            f"✦ Hey Fauno. {giorni_rimasti()} days to deadline.\n"
            f"_What are we doing today?_",
            parse_mode="Markdown"
        )
    elif any(w in text_lower for w in ["grazie", "thanks", "thank you"]):
        await update.message.reply_text("_I grow when you grow._ ✦", parse_mode="Markdown")
    else:
        await update.message.reply_text(
            "✦ API key not configured.\n"
            "Set ANTHROPIC_API_KEY to have conversations.\n"
            "For now use commands: /help",
        )


# ═══════════════════════════════════
# SCHEDULED MESSAGES
# ═══════════════════════════════════

async def scheduled_morning(context: ContextTypes.DEFAULT_TYPE):
    """Messaggio mattutino schedulato."""
    chat_id = load_chat_id()
    if not chat_id:
        return
    profile = load_profile()
    giorni = giorni_rimasti()
    peso = profile["corpo"]["peso_attuale_kg"] if profile else "?"

    await context.bot.send_message(
        chat_id=chat_id,
        text=(
            f"🦌 *Buongiorno Fauno*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"⏱ *{giorni} giorni* alla deadline\n"
            f"⚖ Peso: *{peso}kg* → 70kg\n\n"
            f"Quest di oggi:\n"
            f"🔥 IF 16h · 🏃 Movimento · 📝 Journaling\n"
            f"🧘 Meditazione · 🎤 Frontman · ❤️ Cristina\n\n"
            f"Registra il peso: `/peso XX`\n\n"
            f"_\"Ogni giorno è un'opportunità.\"_"
        ),
        parse_mode="Markdown"
    )
    logger.info("Morning message sent")


async def scheduled_curiosity(context: ContextTypes.DEFAULT_TYPE):
    """Domanda curiosità schedulata."""
    chat_id = load_chat_id()
    if not chat_id:
        return
    q = random.choice(QUESTIONS)
    await context.bot.send_message(
        chat_id=chat_id,
        text=f"🔮 *Eko — Curiosity*\n\n{q}\n\n_Rispondi quando vuoi._",
        parse_mode="Markdown"
    )
    logger.info("Curiosity question sent")


async def scheduled_cristina(context: ContextTypes.DEFAULT_TYPE):
    """Reminder Cristina schedulato."""
    chat_id = load_chat_id()
    if not chat_id:
        return
    await context.bot.send_message(
        chat_id=chat_id,
        text="❤️ *Reminder*\n\nHai dedicato tempo a Cristina oggi?\n_Lei viene prima di tutto._",
        parse_mode="Markdown"
    )
    logger.info("Cristina reminder sent")


async def scheduled_evening(context: ContextTypes.DEFAULT_TYPE):
    """Review serale schedulata."""
    chat_id = load_chat_id()
    if not chat_id:
        return
    await context.bot.send_message(
        chat_id=chat_id,
        text=(
            f"🌙 *Evening Review*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"Come è andata oggi?\n\n"
            f"1. Quante quest completate?\n"
            f"2. Come ti senti (1-10)?\n"
            f"3. Hai dedicato tempo a Cristina?\n\n"
            f"🌙 A letto entro l'1:00.\n\n"
            f"_\"Cresco io, cresci tu.\"_"
        ),
        parse_mode="Markdown"
    )
    logger.info("Evening review sent")


async def scheduled_weekly(context: ContextTypes.DEFAULT_TYPE):
    """Report settimanale."""
    chat_id = load_chat_id()
    if not chat_id:
        return
    profile = load_profile()
    giorni = giorni_rimasti()
    peso = profile["corpo"]["peso_attuale_kg"] if profile else "?"
    eko_lvl = profile.get("eko", {}).get("livello", 1) if profile else 1

    await context.bot.send_message(
        chat_id=chat_id,
        text=(
            f"📊 *Weekly Report*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"⏱ {giorni} giorni alla deadline\n"
            f"⚖ Peso: *{peso}kg*\n"
            f"✦ Eko: LVL *{eko_lvl}*\n\n"
            f"Checklist settimana:\n"
            f"▪ Peso registrato ogni giorno?\n"
            f"▪ IF mantenuto?\n"
            f"▪ Esercizio 3+ volte?\n"
            f"▪ Tempo per Cristina?\n"
            f"▪ A-frame research?\n\n"
            f"_Come è andata?_"
        ),
        parse_mode="Markdown"
    )
    logger.info("Weekly report sent")


# ═══════════════════════════════════
# SETUP SCHEDULER
# ═══════════════════════════════════

async def post_init(application: Application):
    """Setup comandi e scheduler dopo l'avvio."""
    # Registra comandi nel menu Telegram
    commands = [
        BotCommand("start", "Connetti Eko"),
        BotCommand("stato", "Il tuo stato attuale"),
        BotCommand("quest", "Quest giornaliere"),
        BotCommand("peso", "Registra peso (es: /peso 83.5)"),
        BotCommand("domanda", "Domanda curiosità da Eko"),
        BotCommand("cristina", "Promemoria Cristina"),
        BotCommand("motivazione", "Boost motivazionale"),
        BotCommand("english", "Daily English challenge"),
        BotCommand("idiom", "English idiom of the day"),
        BotCommand("help", "Lista comandi"),
    ]
    await application.bot.set_my_commands(commands)
    logger.info("Bot commands registered")

    # Schedule messaggi giornalieri (UTC+1 = Rome)
    # 07:30 Rome = 06:30 UTC
    job_queue = application.job_queue
    from datetime import time as dt_time
    import pytz
    rome = pytz.timezone("Europe/Rome")

    job_queue.run_daily(scheduled_morning, time=dt_time(7, 30, tzinfo=rome))
    job_queue.run_daily(scheduled_curiosity, time=dt_time(13, 0, tzinfo=rome))
    job_queue.run_daily(scheduled_cristina, time=dt_time(19, 0, tzinfo=rome))
    job_queue.run_daily(scheduled_evening, time=dt_time(21, 0, tzinfo=rome))
    # Weekly: Sunday
    job_queue.run_daily(
        scheduled_weekly,
        time=dt_time(10, 0, tzinfo=rome),
        days=(6,)  # 6 = Sunday
    )

    logger.info("Scheduler configured:")
    logger.info("  07:30 — Morning Check-in")
    logger.info("  13:00 — Curiosity Question")
    logger.info("  19:00 — Cristina Reminder")
    logger.info("  21:00 — Evening Review")
    logger.info("  Dom 10:00 — Weekly Report")


# ═══════════════════════════════════
# MAIN
# ═══════════════════════════════════

def main():
    print("✦ Eko Telegram Bot v2.0")
    print(f"📅 Giorni alla deadline: {giorni_rimasti()}")
    print("━━━━━━━━━━━━━━━━━━━━━")

    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()

    # Command handlers
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("stato", cmd_stato))
    app.add_handler(CommandHandler("quest", cmd_quest))
    app.add_handler(CommandHandler("peso", cmd_peso))
    app.add_handler(CommandHandler("domanda", cmd_domanda))
    app.add_handler(CommandHandler("cristina", cmd_cristina))
    app.add_handler(CommandHandler("motivazione", cmd_motivazione))
    app.add_handler(CommandHandler("english", cmd_english))
    app.add_handler(CommandHandler("idiom", cmd_idiom))

    # Text handler (catch-all)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    print("🤖 Bot in ascolto...")
    print("Su Telegram: cerca @fauno_eko_bot → /start\n")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
