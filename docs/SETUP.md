# Eko — Protocollo: Fauno v3.0 — Setup Guide

## ARCHITETTURA: NAS-FIRST + HYBRID SMART

```
┌──────────────────────────────────────────────────────┐
│                   SYNOLOGY NAS                        │
│                 /volume1/eko/                          │
│                                                        │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐  │
│  │  core/   │  │ memory/  │  │ data/  │  │telegram-│  │
│  │ profile  │  │ telegram │  │ peso   │  │  bot/   │  │
│  │ config   │  │ cowork   │  │ quest  │  │ Docker  │  │
│  │ state    │  │ digest   │  │ xp     │  │  24/7   │  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └────┬────┘  │
│       │             │            │             │        │
│       └─────────────┴────────────┴─────────────┘        │
│                         │                                │
│              SINGLE SOURCE OF TRUTH                      │
└──────────────────┬───────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
  ┌─────┴──────┐      ┌──────┴─────┐
  │  COWORK    │      │  TELEGRAM   │
  │ (Desktop)  │      │  (Mobile)   │
  │            │      │             │
  │ Dashboard  │      │ Quick chat  │
  │ Deep work  │      │ Notifiche   │
  │ Shortcuts  │      │ /peso /quest│
  │ File edits │      │ AI chat     │
  └────────────┘      └─────────────┘
```

Both platforms read/write to the SAME folder on NAS.

---

## 1. FOLDER STRUCTURE

```
protocollo-fauno/
│
├── core/                            THE BRAIN
│   ├── fauno-profile.json           Identity, goals, Cristina, memoria Eko
│   ├── config.json                  Paths, settings, roadmap
│   └── state.json                   Dashboard state (exported)
│
├── memory/                          PERSISTENT MEMORY
│   ├── telegram/                    All Telegram conversations
│   │   └── 2026-02/                 By month
│   │       └── 2026-02-19.jsonl     One file per day
│   ├── cowork/                      Key notes from Cowork sessions
│   └── digest/                      AI-generated weekly summaries
│
├── data/                            TRACKED DATA
│   ├── peso-log.json                Weight history
│   ├── quest-log.json               Completed quests
│   ├── english-log.json             English progress
│   └── xp-log.json                  Eko XP history
│
├── platform/                        THE APP
│   └── protocollo-fauno.jsx         Dashboard (space/cyberpunk)
│
├── telegram-bot/                    TELEGRAM BOT
│   ├── eko-bot.py                   Bot v3.0 + AI + persistent memory
│   ├── chat_id.txt                  Auto-generated on /start
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
│
└── docs/                            DOCUMENTATION
    ├── SETUP.md                     This file
    ├── PIANO-OPERATIVO.md
    └── CONTRATTO-EKO-FAUNO.pdf
```

---

## 2. SYNOLOGY NAS SETUP

### Step 1: Create shared folder on NAS
DSM → Control Panel → Shared Folder → Create "eko"
Copy entire protocollo-fauno/ content there.

### Step 2: Map as network drive on Windows
File Explorer → right-click "This PC" → "Map network drive"
Drive: Z: | Folder: \\YOUR_NAS_IP\eko
Check "Reconnect at sign-in"

### Step 3: Point Cowork to NAS folder
Claude Cowork → select folder → choose Z:\eko

### Step 4: Deploy bot on Synology
```bash
cd /volume1/eko/protocollo-fauno/telegram-bot
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env
docker-compose up -d --build
docker-compose logs -f
```

---

## 3. COMMANDS

Cowork: /checkin, /review, /dashboard
Telegram: /start, /stato, /quest, /peso, /domanda, /cristina, /motivazione, /english, /idiom, /help
Plus free text AI chat on Telegram.

---

## 4. HOW MEMORY WORKS

Profile (core/fauno-profile.json) = shared brain, read by both platforms.
Chat memory (memory/telegram/) = every message saved permanently as JSONL.
Data (data/) = historical tracking with timestamps.
When bot restarts, it reloads today's conversation from disk.

---

## 5. NEXT STEPS

- [ ] Get Anthropic API key (console.anthropic.com)
- [ ] Map NAS as network drive
- [ ] Deploy bot on Synology Docker
- [ ] Weekly digest generation
- [ ] ElevenLabs voice integration
- [ ] Telegram Mini App
- [ ] Weight trend chart
- [ ] Cristina Calendar Sync
