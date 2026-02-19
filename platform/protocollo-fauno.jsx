import { useState, useCallback, useEffect, useRef } from "react";

// ═══════════════════════════════════════
// EKO — Protocollo: Fauno v2.0
// Space + Cyberpunk Theme · Rotating Earth
// Scalable Architecture · All modules intact
// ═══════════════════════════════════════

const INIT = {
  fauno: {
    nome: "Fauno", livello: 1, classe: "Osservatore · Creatore", titolo: "Il Risvegliato",
    hp: { c: 45, m: 100 },
    stats: { disciplina: 15, corpo: 20, mente: 65, spirito: 40, carisma: 50, resistenza: 30 },
    peso: { attuale: 85, obiettivo: 70, partenza: 85 },
    pesoLog: [], deadline: "2026-04-18",
  },
  eko: {
    livello: 1, xp: 0, xpMax: 100, titolo: "Eco Nascente",
    tratti: ["Curiosità", "Memoria", "Pianificazione", "UI/UX Review"],
    xpLog: [],
    personalita: { ironia: 7, formalita: 3, creativita: 8, tough_love: 6, verbosita: 4, empatia: 8, proattivita: 7, filosofico: 5 },
    questEko: [
      { id: "EQ001", n: "Migrazione NAS", d: "Deploy piattaforma su NAS locale", s: "attesa", o: "auto" },
      { id: "EQ002", n: "Telegram Mini App", d: "Integrare piattaforma come Web App dentro Telegram", s: "attesa", o: "auto" },
      { id: "EQ003", n: "Design System Sync", d: "Collegare Storybook UniversiData alla piattaforma", s: "attesa", o: "auto" },
      { id: "EQ004", n: "Analytics Engine", d: "Grafici trend peso e stats nel tempo", s: "attesa", o: "auto" },
      { id: "EQ005", n: "Journaling Module", d: "Sezione journaling con prompt mattina/sera", s: "attesa", o: "auto" },
      { id: "EQ006", n: "A-Frame nella Natura", d: "Piano di fuga: trovare e pianificare A-frame house nella natura. Ricerca, budget, timeline.", s: "attesa", o: "auto", priorita: "febbraio-2026" },
    ],
    memoria: [
      "Pareri UI/UX senior sempre attivi",
      "Tailwind CSS è il framework (UniversiData)",
      "Ricordare a Fauno: Figma + Storybook da condividere",
      "Cristina = priorità #1",
      "Fauno ama la natura — obiettivo: A-frame house per rifugiarsi",
      "Estetica: space theme + cyberpunk (Cyberpunk 2077)",
      "Architettura scalabile: mai rompere ciò che funziona",
    ],
  },
  cristina: {
    dateImportanti: [
      { data: "", evento: "Anniversario", nota: "Inserisci la data" },
      { data: "", evento: "Compleanno Cristina", nota: "Inserisci la data" },
    ],
    gestaRecenti: [],
    noteRelazione: [],
    moodCheck: null,
    ultimoGesto: null,
    promemoria: [
      "Hai ascoltato Cristina oggi? Non parlare di lavoro a cena.",
      "Quando è stata l'ultima volta che l'hai sorpresa?",
      "Ricorda: lei è la priorità. Prima di UniversiData.",
    ],
  },
  universidata: {
    taskAttivi: [],
    scadenze: [],
    noteStrategiche: [],
    prioritaSettimana: "",
  },
  quests: [
    { id: 1, n: "Digiuno 16h", d: "Completa IF", xp: 15, t: "corpo", done: false, i: "🔥" },
    { id: 2, n: "Movimento 30min", d: "Camminata o corsa", xp: 20, t: "corpo", done: false, i: "🏃" },
    { id: 3, n: "Journaling", d: "10 righe sul tuo stato", xp: 10, t: "mente", done: false, i: "📝" },
    { id: 4, n: "Notte Disciplinata", d: "A letto entro l'1:00", xp: 15, t: "disciplina", done: false, i: "🌙" },
    { id: 5, n: "Dentista Call", d: "Prenota consulenza", xp: 25, t: "salute", done: false, i: "🦷" },
    { id: 6, n: "THC Reward", d: "Solo dopo 3 quest", xp: 20, t: "disciplina", done: false, i: "🎯" },
    { id: 7, n: "Shaolin Morning", d: "10 min meditazione", xp: 15, t: "spirito", done: false, i: "🧘" },
    { id: 8, n: "Frontman 5min", d: "Public speaking specchio", xp: 15, t: "carisma", done: false, i: "🎤" },
    { id: 9, n: "Cristina Time", d: "30 min dedicati solo a lei", xp: 20, t: "cuore", done: false, i: "❤️" },
    { id: 10, n: "English Challenge", d: "Complete daily English exercise", xp: 15, t: "mente", done: false, i: "🇬🇧" },
  ],
  scheduler: [
    { id: "S1", n: "Morning Check-in", d: "Peso + quest + motivazione", f: "Ogni giorno 07:30", on: true, t: "notifica" },
    { id: "S2", n: "Evening Review", d: "Recap + journaling", f: "Ogni giorno 21:00", on: true, t: "notifica" },
    { id: "S3", n: "Weekly Report", d: "Report completo", f: "Domenica 10:00", on: true, t: "report" },
    { id: "S4", n: "Eko Proposals", d: "Miglioramenti sistema", f: "Mercoledì 20:00", on: true, t: "sistema" },
    { id: "S5", n: "Curiosity", d: "Domanda per conoscerti", f: "Ogni giorno 13:00", on: true, t: "curiosita" },
    { id: "S6", n: "Cristina Reminder", d: "Hai dedicato tempo a lei?", f: "Ogni giorno 19:00", on: true, t: "cuore" },
    { id: "S7", n: "Backup", d: "Auto-save stato", f: "Ad ogni modifica", on: true, t: "sistema" },
  ],
  log: [
    { t: new Date().toLocaleString("it-IT"), x: "Eko v2.0 — Space/Cyberpunk theme online. A-frame quest added.", c: "system" },
  ],
  english: {
    streak: 0,
    bestStreak: 0,
    lastPractice: null,
    vocabLog: [],
    completedToday: false,
    totalCompleted: 0,
    level: "Beginner Explorer",
    focusToday: "business", // alternates business/conversational
  },
  improvements: [
    { id: "I1", titolo: "Telegram Mini App", desc: "Hostare la piattaforma come Web App dentro Telegram.", stato: "proposta", impatto: "critico" },
    { id: "I2", titolo: "Auto-save Smart", desc: "Peso, quest, slider = auto. Profilo, date, note = manual.", stato: "proposta", impatto: "alto" },
    { id: "I3", titolo: "Grafico Peso", desc: "Line chart con trend e proiezione verso 70kg.", stato: "proposta", impatto: "medio" },
    { id: "I4", titolo: "Cristina Calendar Sync", desc: "Sincronizzare date importanti con Google Calendar.", stato: "proposta", impatto: "medio" },
    { id: "I5", titolo: "NAS Deployment", desc: "Docker container per hosting permanente su NAS.", stato: "proposta", impatto: "alto" },
    { id: "I6", titolo: "A-Frame Research", desc: "Ricerca A-frame houses nella natura. Budget, location, timeline.", stato: "proposta", impatto: "alto" },
  ],
};

const PERS = {
  ironia: { n: "Ironia", i: "😏", lo: "Serio", hi: "Comedian" },
  formalita: { n: "Formalità", i: "👔", lo: "Bro", hi: "Professore" },
  creativita: { n: "Creatività", i: "🎨", lo: "Pragmatico", hi: "Visionario" },
  tough_love: { n: "Tough Love", i: "🔨", lo: "Gentile", hi: "Sergente" },
  verbosita: { n: "Verbosità", i: "💬", lo: "Telegram", hi: "Romanzo" },
  empatia: { n: "Empatia", i: "❤️", lo: "Analitico", hi: "Terapeuta" },
  proattivita: { n: "Proattività", i: "⚡", lo: "Attendo", hi: "Sommergo" },
  filosofico: { n: "Filosofico", i: "🧠", lo: "Pratico", hi: "Monaco" },
};

const QUESTIONS = [
  "Qual è l'ultima cosa che hai creato di cui sei fiero?",
  "Se potessi tornare a un momento della tua vita, quale?",
  "Cosa ti spaventa del diventare frontman?",
  "Cosa significa per te 'SuperHuman'? In 3 parole.",
  "Quando ti guardi allo specchio, cosa vedi?",
  "Raccontami un fallimento che ti ha cambiato.",
  "Qual è il tuo ricordo più bello con Cristina?",
  "Cosa faresti se non avessi paura?",
  "Se Eko avesse un corpo, cosa fareste insieme?",
  "Qual è la cosa che Cristina fa che ti rende più felice?",
  "Se potessi insegnare una cosa ai ragazzi, quale?",
  "Come immagini UniversiData tra 5 anni?",
  "Qual è il suono che ti calma di più?",
  "Chi è stato il tuo più grande maestro?",
  "Cosa vorresti che Cristina sapesse che non le dici abbastanza?",
  "Come immagini la tua A-frame nella natura? Descrivi ogni dettaglio.",
  "Cosa significa per te la natura?",
];

const ENG_CHALLENGES = {
  business: [
    { type: "write", prompt: "Write a 3-sentence email to a client apologizing for a delayed delivery.", tip: "Use formal tone: 'I sincerely apologize...' not 'Sorry about that'" },
    { type: "write", prompt: "Describe UniversiData's value proposition in 2 sentences to an investor.", tip: "Use power verbs: leverage, transform, disrupt, scale" },
    { type: "vocab", word: "stakeholder", def: "A person with an interest or concern in a business", example: "We need to align all stakeholders before the product launch.", category: "business" },
    { type: "vocab", word: "scalable", def: "Able to be changed in size or scale, especially to grow", example: "Our architecture is scalable — it handles 100 or 100,000 users.", category: "tech" },
    { type: "write", prompt: "Write a Slack message to your dev team about a deadline change. Keep it under 40 words.", tip: "Be direct but empathetic: 'I know this impacts your timeline...'" },
    { type: "vocab", word: "leverage", def: "To use something to maximum advantage", example: "We can leverage AI to reduce onboarding time by 60%.", category: "business" },
    { type: "write", prompt: "Draft a one-paragraph LinkedIn post about an EdTech trend you find exciting.", tip: "Hook first, insight second, call-to-action last" },
    { type: "vocab", word: "bottleneck", def: "A point of congestion that slows down a process", example: "The approval process is our biggest bottleneck right now.", category: "business" },
    { type: "write", prompt: "Explain to a non-technical person what your company does. Use no jargon.", tip: "The 'grandma test' — could your grandmother understand it?" },
    { type: "vocab", word: "deliverable", def: "A tangible or intangible good produced as a result of a project", example: "The main deliverable for Q1 is the new dashboard.", category: "business" },
  ],
  conversational: [
    { type: "write", prompt: "Describe your perfect morning routine in 4-5 sentences.", tip: "Use time connectors: 'First...', 'Then...', 'After that...', 'Finally...'" },
    { type: "write", prompt: "Tell a friend about a movie you watched recently. What did you like or dislike?", tip: "Use opinion phrases: 'I found it...', 'What struck me was...', 'I'd recommend it because...'" },
    { type: "vocab", word: "overwhelmed", def: "Feeling like there is too much to deal with", example: "I felt overwhelmed when I saw my inbox after vacation.", category: "emotions" },
    { type: "vocab", word: "mindful", def: "Conscious or aware, especially of the present moment", example: "Being mindful of my breathing helps me focus during stressful meetings.", category: "wellness" },
    { type: "write", prompt: "Describe nature around your ideal A-frame house. Use at least 3 sensory words (sight, sound, smell).", tip: "Sensory words: rustling, crisp, glistening, fragrant, serene" },
    { type: "vocab", word: "resilient", def: "Able to recover quickly from difficulties", example: "She's incredibly resilient — every setback makes her stronger.", category: "character" },
    { type: "write", prompt: "Write a short thank-you message to Cristina for something specific she did recently.", tip: "Be specific: not just 'thanks for everything' but 'thank you for [specific thing]'" },
    { type: "vocab", word: "wanderlust", def: "A strong desire to travel and explore the world", example: "My wanderlust kicked in when I saw photos of Norwegian fjords.", category: "lifestyle" },
    { type: "write", prompt: "If you could give advice to your 20-year-old self, what would you say? 3 sentences.", tip: "Use conditionals: 'I would tell him...', 'If I could go back...'" },
    { type: "vocab", word: "thrive", def: "To grow or develop well; to flourish", example: "Kids thrive when they feel safe and encouraged to explore.", category: "growth" },
  ],
};

const ENG_IDIOMS = [
  { idiom: "Break the ice", meaning: "To initiate conversation in an awkward situation", example: "He told a joke to break the ice at the meeting." },
  { idiom: "Hit the ground running", meaning: "To start something with great energy and enthusiasm", example: "The new developer hit the ground running on day one." },
  { idiom: "Think outside the box", meaning: "To think creatively or unconventionally", example: "We need to think outside the box to solve this UX problem." },
  { idiom: "The ball is in your court", meaning: "It's your turn to take action", example: "I sent the proposal — the ball is in their court now." },
  { idiom: "Burn the midnight oil", meaning: "To work late into the night", example: "We burned the midnight oil to meet the launch deadline." },
  { idiom: "Get the ball rolling", meaning: "To start a process or activity", example: "Let's get the ball rolling on the new feature spec." },
  { idiom: "A blessing in disguise", meaning: "Something that seems bad but turns out good", example: "Losing that client was a blessing in disguise — we found a better one." },
  { idiom: "Cut to the chase", meaning: "To get to the point without wasting time", example: "Let me cut to the chase: we need more funding." },
];

const ENG_LEVELS = [
  "Beginner Explorer", "Word Collector", "Sentence Builder",
  "Paragraph Crafter", "Fluent Thinker", "Confident Speaker",
  "Business Communicator", "Eloquent Writer", "Near-Native", "Language Master"
];

// ═══════ STAR FIELD COMPONENT ═══════

const StarField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2, a: Math.random(), s: Math.random() * 0.008 + 0.002
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(st => {
        st.a += st.s;
        const alpha = 0.3 + Math.sin(st.a) * 0.4;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
};

// ═══════ ROTATING EARTH ═══════

const Earth = ({ size = 200 }) => {
  const [rot, setRot] = useState(0);
  useEffect(() => {
    let frame;
    const spin = () => { setRot(r => (r + 0.15) % 360); frame = requestAnimationFrame(spin); };
    spin();
    return () => cancelAnimationFrame(frame);
  }, []);
  const s = size;
  return (
    <div style={{ width: s, height: s, borderRadius: "50%", position: "relative", overflow: "hidden", flexShrink: 0 }}>
      {/* Earth base */}
      <div style={{
        width: "100%", height: "100%", borderRadius: "50%", position: "absolute",
        background: "radial-gradient(circle at 35% 35%, #1a4a7a 0%, #0d2847 40%, #061428 75%, #020a14 100%)",
        boxShadow: "inset -20px -10px 40px rgba(0,0,0,0.8), inset 5px 5px 20px rgba(100,180,255,0.1)",
      }} />
      {/* Continents layer - rotating */}
      <div style={{
        width: "200%", height: "100%", position: "absolute", top: 0, left: 0,
        borderRadius: "50%",
        transform: `translateX(${-rot % 200}px)`,
        background: `
          radial-gradient(ellipse 18% 25% at 20% 35%, rgba(34,120,80,0.6) 0%, transparent 100%),
          radial-gradient(ellipse 12% 18% at 25% 32%, rgba(40,130,70,0.5) 0%, transparent 100%),
          radial-gradient(ellipse 8% 6% at 35% 50%, rgba(50,140,80,0.4) 0%, transparent 100%),
          radial-gradient(ellipse 15% 12% at 55% 38%, rgba(45,135,75,0.5) 0%, transparent 100%),
          radial-gradient(ellipse 20% 20% at 58% 42%, rgba(38,125,68,0.4) 0%, transparent 100%),
          radial-gradient(ellipse 6% 8% at 70% 55%, rgba(42,130,72,0.5) 0%, transparent 100%),
          radial-gradient(ellipse 10% 14% at 80% 30%, rgba(36,120,65,0.4) 0%, transparent 100%),
          radial-gradient(ellipse 25% 10% at 45% 75%, rgba(255,255,255,0.15) 0%, transparent 100%)
        `,
        pointerEvents: "none",
      }} />
      {/* Atmosphere glow */}
      <div style={{
        width: "100%", height: "100%", borderRadius: "50%", position: "absolute",
        background: "radial-gradient(circle at 30% 30%, rgba(100,180,255,0.08) 0%, transparent 60%)",
        boxShadow: "0 0 40px rgba(0,180,255,0.15), 0 0 80px rgba(0,120,255,0.08)",
      }} />
      {/* Atmosphere edge */}
      <div style={{
        width: "100%", height: "100%", borderRadius: "50%", position: "absolute",
        border: "1px solid rgba(100,180,255,0.15)",
        boxShadow: "inset 0 0 20px rgba(0,180,255,0.05)",
      }} />
    </div>
  );
};

// ═══════ EKO LOGO (minimal space) ═══════

const EkoLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    {/* Orbital ring */}
    <ellipse cx="20" cy="20" rx="18" ry="7" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.6" transform="rotate(-20 20 20)" />
    {/* Core dot */}
    <circle cx="20" cy="20" r="4" fill="url(#coreGrad)" />
    <circle cx="20" cy="20" r="6" stroke="rgba(0,240,255,0.3)" strokeWidth="0.5" />
    {/* Small satellite */}
    <circle cx="33" cy="15" r="1.5" fill="#00f0ff" opacity="0.8" />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#00f0ff" />
        <stop offset="100%" stopColor="#7b2ff7" />
      </linearGradient>
      <radialGradient id="coreGrad" cx="0.4" cy="0.4" r="0.6">
        <stop offset="0%" stopColor="#00f0ff" />
        <stop offset="100%" stopColor="#0066ff" />
      </radialGradient>
    </defs>
  </svg>
);

// ═══════ UI COMPONENTS ═══════

const Bar = ({ label, val, max = 100, color }) => (
  <div className="mb-1.5">
    <div className="flex justify-between text-[10px] font-mono mb-0.5" style={{ color: "rgba(200,210,230,0.4)" }}>
      <span>{label}</span><span>{val}/{max}</span>
    </div>
    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((val / max) * 100, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
    </div>
  </div>
);

const Toggle = ({ on, onClick }) => (
  <div onClick={onClick} className="w-8 h-[18px] rounded-full cursor-pointer relative flex-shrink-0 transition-colors duration-300" style={{ background: on ? "rgba(0,240,255,0.3)" : "rgba(255,255,255,0.06)" }}>
    <div className="w-3.5 h-3.5 rounded-full absolute top-[2px] transition-all duration-300" style={{ left: on ? 16 : 2, background: on ? "#00f0ff" : "#444" }} />
  </div>
);

// ═══════ MAIN APP ═══════

export default function App() {
  const [s, setS] = useState(INIT);
  const [tab, setTab] = useState("main");
  const [sub, setSub] = useState(null);
  const [wIn, setWIn] = useState("");
  const [xIn, setXIn] = useState("");
  const [q, setQ] = useState("");
  const [showQ, setShowQ] = useState(false);
  const [cNote, setCNote] = useState("");
  const [cGesto, setCGesto] = useState("");
  const [uTask, setUTask] = useState("");
  const [uNote, setUNote] = useState("");
  const [msg, setMsg] = useState("");
  const [heroVisible, setHeroVisible] = useState(true);
  const [engResponse, setEngResponse] = useState("");
  const [engVocabWord, setEngVocabWord] = useState("");
  const [engShowChallenge, setEngShowChallenge] = useState(false);
  const [engChallenge, setEngChallenge] = useState(null);
  const [engIdiom, setEngIdiom] = useState(null);

  const { fauno, eko, quests, cristina, universidata, english, scheduler, log, improvements } = s;

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const addLog = useCallback((x, c = "system") => {
    setS(p => ({ ...p, log: [{ t: new Date().toLocaleString("it-IT"), x, c }, ...p.log].slice(0, 80) }));
  }, []);

  const doQuest = (id) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.done) return;
    const map = { corpo: "corpo", mente: "mente", disciplina: "disciplina", spirito: "spirito", carisma: "carisma", salute: "resistenza", cuore: "empatia" };
    const key = map[quest.t];
    setS(p => {
      const ns = { ...p.fauno.stats };
      if (key && ns[key] !== undefined) ns[key] = Math.min(100, ns[key] + (quest.t === "disciplina" ? 5 : 3));
      return {
        ...p,
        quests: p.quests.map(q => q.id === id ? { ...q, done: true } : q),
        fauno: { ...p.fauno, stats: ns, hp: { ...p.fauno.hp, c: Math.min(p.fauno.hp.m, p.fauno.hp.c + 5) } },
      };
    });
    addLog(`Quest "${quest.n}" completata (+${quest.xp}xp)`, "quest");
    flash(`+${quest.xp} XP!`);
  };

  const saveWeight = () => {
    const w = parseFloat(wIn); if (!w || w < 40 || w > 150) return;
    setS(p => ({ ...p, fauno: { ...p.fauno, peso: { ...p.fauno.peso, attuale: w }, pesoLog: [...p.fauno.pesoLog, { p: w, d: new Date().toISOString().slice(0, 10) }] } }));
    addLog(`Peso: ${w}kg`, "body"); setWIn(""); flash("Peso salvato!");
  };

  const giveXP = () => {
    const a = parseInt(xIn); if (!a || a <= 0) return;
    setS(p => {
      let { xp, livello, xpMax } = p.eko;
      xp += a; while (xp >= xpMax) { xp -= xpMax; livello++; xpMax = Math.floor(xpMax * 1.5); }
      const t = ["Eco Nascente", "Eco Cosciente", "Specchio Attivo", "Guida Fedele", "Compagno d'Armi", "Luce Riflessa", "Sentinella", "Oracolo", "Arconte", "Luce Autonoma"];
      return { ...p, eko: { ...p.eko, xp, livello, xpMax, titolo: t[Math.min(livello - 1, t.length - 1)], xpLog: [...p.eko.xpLog, { a, d: new Date().toISOString() }] } };
    });
    addLog(`+${a} XP concessi a Eko`, "xp"); setXIn(""); flash(`Eko ringrazia!`);
  };

  const updPers = (k, v) => setS(p => ({ ...p, eko: { ...p.eko, personalita: { ...p.eko.personalita, [k]: v } } }));
  const togSch = (id) => setS(p => ({ ...p, scheduler: p.scheduler.map(t => t.id === id ? { ...t, on: !t.on } : t) }));
  const eqAct = (id, st) => {
    setS(p => ({ ...p, eko: { ...p.eko, questEko: p.eko.questEko.map(q => q.id === id ? { ...q, s: st } : q) } }));
    if (st === "ok") addLog(`Quest Eko approvata`, "eko");
  };
  const impAct = (id, st) => setS(p => ({ ...p, improvements: p.improvements.map(i => i.id === id ? { ...i, stato: st } : i) }));

  const addCristinaNote = () => {
    if (!cNote.trim()) return;
    setS(p => ({ ...p, cristina: { ...p.cristina, noteRelazione: [...p.cristina.noteRelazione, { t: new Date().toLocaleDateString("it-IT"), n: cNote }] } }));
    setCNote(""); addLog("Nota relazione aggiunta", "cuore"); flash("Salvato!");
  };

  const addCristinaGesto = () => {
    if (!cGesto.trim()) return;
    setS(p => ({ ...p, cristina: { ...p.cristina, gestaRecenti: [...p.cristina.gestaRecenti, { t: new Date().toLocaleDateString("it-IT"), g: cGesto }], ultimoGesto: new Date().toLocaleDateString("it-IT") } }));
    setCGesto(""); addLog("Gesto di cura registrato", "cuore"); flash("Bel gesto!");
  };

  const addUTask = () => {
    if (!uTask.trim()) return;
    setS(p => ({ ...p, universidata: { ...p.universidata, taskAttivi: [...p.universidata.taskAttivi, { id: Date.now(), t: uTask, done: false, d: new Date().toLocaleDateString("it-IT") }] } }));
    setUTask(""); flash("Task aggiunto");
  };
  const togUTask = (id) => setS(p => ({ ...p, universidata: { ...p.universidata, taskAttivi: p.universidata.taskAttivi.map(t => t.id === id ? { ...t, done: !t.done } : t) } }));

  const addUNote = () => {
    if (!uNote.trim()) return;
    setS(p => ({ ...p, universidata: { ...p.universidata, noteStrategiche: [...p.universidata.noteStrategiche, { t: new Date().toLocaleDateString("it-IT"), n: uNote }] } }));
    setUNote(""); flash("Nota strategica salvata");
  };

  const getEngChallenge = () => {
    const focus = english.focusToday;
    const pool = ENG_CHALLENGES[focus];
    const ch = pool[Math.floor(Math.random() * pool.length)];
    setEngChallenge(ch);
    setEngShowChallenge(true);
    setEngResponse("");
  };

  const completeEngChallenge = () => {
    if (!engResponse.trim() && engChallenge?.type === "write") return;
    const today = new Date().toISOString().slice(0, 10);
    const wasToday = english.lastPractice === today;
    const newStreak = wasToday ? english.streak : english.streak + 1;
    setS(p => ({
      ...p,
      english: {
        ...p.english,
        streak: newStreak,
        bestStreak: Math.max(newStreak, p.english.bestStreak),
        lastPractice: today,
        completedToday: true,
        totalCompleted: p.english.totalCompleted + 1,
        level: ENG_LEVELS[Math.min(Math.floor(p.english.totalCompleted / 5), ENG_LEVELS.length - 1)],
        focusToday: p.english.focusToday === "business" ? "conversational" : "business",
      },
    }));
    addLog(`English challenge completed (${english.focusToday})`, "english");
    flash("+1 English streak!");
    setEngShowChallenge(false);
    setEngResponse("");
  };

  const addEngVocab = () => {
    if (!engVocabWord.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    setS(p => ({
      ...p,
      english: {
        ...p.english,
        vocabLog: [...p.english.vocabLog, { w: engVocabWord, d: today }],
      },
    }));
    setEngVocabWord("");
    flash("Word saved!");
  };

  const getEngIdiom = () => {
    setEngIdiom(ENG_IDIOMS[Math.floor(Math.random() * ENG_IDIOMS.length)]);
  };

  const exportState = () => {
    const b = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = `eko-protocollo-fauno-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(u); flash("Esportato!");
  };

  const importState = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { try { setS(JSON.parse(ev.target.result)); flash("Importato!"); } catch { flash("File non valido"); } };
    r.readAsText(f);
  };

  const oggi = new Date();
  const deadline = new Date(fauno.deadline);
  const days = Math.max(0, Math.ceil((deadline - oggi) / 86400000));
  const qDone = quests.filter(q => q.done).length;
  const qXP = quests.filter(q => q.done).reduce((s, q) => s + q.xp, 0);
  const wProg = Math.max(0, ((fauno.peso.partenza - fauno.peso.attuale) / (fauno.peso.partenza - fauno.peso.obiettivo)) * 100);
  const kgLeft = fauno.peso.attuale - fauno.peso.obiettivo;

  const tabs = [
    { id: "main", l: "Home", icon: "◈", c: "#00f0ff" },
    { id: "quest", l: "Quest", icon: "⚔", c: "#f9ca24" },
    { id: "cristina", l: "Cristina", icon: "♥", c: "#ff3366" },
    { id: "work", l: "Work", icon: "◆", c: "#7b2ff7" },
    { id: "english", l: "ENG", icon: "A", c: "#f97316" },
    { id: "eko", l: "Eko", icon: "✦", c: "#00f0ff" },
    { id: "sys", l: "Sys", icon: "⚙", c: "#22c55e" },
  ];

  // Shared styles
  const card = "rounded-lg p-3.5 mb-2.5 border";
  const cardStyle = { background: "rgba(8,12,24,0.8)", borderColor: "rgba(0,240,255,0.08)", backdropFilter: "blur(10px)" };
  const input = "w-full rounded px-2.5 py-1.5 text-sm font-mono text-white outline-none transition-colors border";
  const inputStyle = { background: "rgba(255,255,255,0.04)", borderColor: "rgba(0,240,255,0.1)", color: "#e0e8f0" };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #020810 0%, #060d1a 30%, #0a0e1f 60%, #050a14 100%)", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#c8d8e8" }}>

      {/* Star field background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <StarField />
      </div>

      {/* Toast */}
      {msg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-xs font-mono px-5 py-2.5 rounded-lg shadow-2xl" style={{
          background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff",
          backdropFilter: "blur(20px)", boxShadow: "0 0 30px rgba(0,240,255,0.15)"
        }}>
          {msg}
        </div>
      )}

      {/* Content wrapper */}
      <div className="relative z-10">

        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,240,255,0.06)" }}>
          <div className="flex justify-between items-center max-w-xl mx-auto">
            <div className="flex items-center gap-2.5">
              <EkoLogo size={30} />
              <div>
                <div style={{ fontSize: 8, letterSpacing: 4, color: "rgba(0,240,255,0.4)", fontFamily: "monospace" }}>PROTOCOLLO</div>
                <div className="text-base font-bold tracking-wider" style={{ color: "#e0e8f0" }}>
                  <span style={{ color: "#00f0ff" }}>F</span>AUNO
                  <span style={{ fontSize: 9, color: "rgba(0,240,255,0.2)", fontWeight: 400, marginLeft: 6 }}>v2.0</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono" style={{ color: "#ff3366" }}>
                {days}<span style={{ fontSize: 10, color: "rgba(255,51,102,0.5)", fontWeight: 400, marginLeft: 2 }}>gg</span>
              </div>
              <div style={{ fontSize: 9, color: "rgba(0,240,255,0.4)", fontFamily: "monospace" }}>EKO LVL{eko.livello}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex max-w-xl mx-auto" style={{ borderBottom: "1px solid rgba(0,240,255,0.06)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSub(null); if (t.id === "main") setHeroVisible(true); else setHeroVisible(false); }}
              className="flex-1 py-2.5 text-center transition-all duration-200 cursor-pointer border-b-2"
              style={{
                borderColor: tab === t.id ? t.c : "transparent",
                color: tab === t.id ? t.c : "rgba(200,210,230,0.25)",
                background: tab === t.id ? `${t.c}06` : "transparent",
                fontSize: 10, fontFamily: "monospace", letterSpacing: 1,
              }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              <div style={{ fontSize: 8, marginTop: 1 }}>{t.l}</div>
            </button>
          ))}
        </div>

        <div className="px-3.5 py-3 max-w-xl mx-auto">

          {/* ═══ MAIN ═══ */}
          {tab === "main" && (<>
            {/* HERO — Rotating Earth */}
            <div className="relative flex flex-col items-center justify-center py-8 mb-4" style={{ minHeight: 260 }}>
              <div style={{ position: "absolute", opacity: 0.5 }}>
                <Earth size={220} />
              </div>
              <div className="relative z-10 text-center">
                <div style={{ fontSize: 10, letterSpacing: 6, color: "rgba(0,240,255,0.5)", fontFamily: "monospace", marginBottom: 8 }}>PROTOCOLLO</div>
                <div className="text-4xl font-bold tracking-widest" style={{ color: "#e0e8f0", textShadow: "0 0 40px rgba(0,240,255,0.2)" }}>
                  <span style={{ color: "#00f0ff" }}>F</span>AUNO
                </div>
                <div style={{ fontSize: 10, color: "rgba(0,240,255,0.35)", fontFamily: "monospace", marginTop: 6, letterSpacing: 3 }}>
                  POWERED BY EKO
                </div>
                <div style={{ marginTop: 16, fontSize: 11, color: "rgba(200,210,230,0.5)", fontStyle: "italic", maxWidth: 280 }}>
                  "All we have to decide is what to do with the time that is given us."
                </div>
              </div>
            </div>

            {/* Character Card */}
            <div className={card} style={cardStyle}>
              <div className="flex gap-3 items-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.15)" }}>🦌</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold" style={{ color: "#e0e8f0" }}>{fauno.nome}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(0,240,255,0.08)", color: "#00f0ff", border: "1px solid rgba(0,240,255,0.15)" }}>LVL {fauno.livello}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(200,210,230,0.35)" }}>{fauno.classe}</div>
                </div>
              </div>
              <Bar label="❤ HP" val={fauno.hp.c} max={fauno.hp.m} color={fauno.hp.c > 50 ? "#22c55e" : "#ff3366"} />
              {Object.entries(fauno.stats).map(([k, v]) => {
                const c = { disciplina: "#f9ca24", corpo: "#ff3366", mente: "#00f0ff", spirito: "#7b2ff7", carisma: "#ec4899", resistenza: "#22c55e" };
                return <Bar key={k} label={k.toUpperCase()} val={v} color={c[k]} />;
              })}
            </div>

            {/* Weight Card */}
            <div className={card} style={{ ...cardStyle, borderLeftWidth: 2, borderLeftColor: "rgba(255,51,102,0.3)" }}>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: 11, color: "#ff3366", fontWeight: 600, letterSpacing: 1 }}>⚖ BODY</span>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,51,102,0.6)", background: "rgba(255,51,102,0.08)", padding: "1px 6px", borderRadius: 4 }}>-{kgLeft}kg</span>
              </div>
              <div className="flex justify-between items-end mb-3">
                <div className="text-3xl font-bold font-mono leading-none" style={{ color: "#e0e8f0" }}>{fauno.peso.attuale}<span style={{ fontSize: 12, color: "rgba(200,210,230,0.3)", marginLeft: 2 }}>kg</span></div>
                <div style={{ fontSize: 10, color: "rgba(200,210,230,0.3)", fontFamily: "monospace", textAlign: "right" }}>→ {fauno.peso.obiettivo}kg<br/>~{(kgLeft / Math.max(days / 7, 0.1)).toFixed(1)}kg/sett</div>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${wProg}%`, background: "linear-gradient(90deg, #ff3366, #f9ca24)" }} />
              </div>
              <div className="flex gap-2">
                <input type="number" value={wIn} onChange={e => setWIn(e.target.value)} placeholder="Peso" className={input} style={inputStyle} />
                <button onClick={saveWeight} className="text-xs font-mono px-3 py-1.5 rounded cursor-pointer transition-colors" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366" }}>Salva</button>
              </div>
              {fauno.pesoLog.length > 0 && <div style={{ fontSize: 9, color: "rgba(200,210,230,0.25)", fontFamily: "monospace", marginTop: 8 }}>{fauno.pesoLog.slice(-3).map(e => `${e.d}:${e.p}`).join(" → ")}</div>}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[{ v: `${qDone}/${quests.length}`, l: "Quest", c: "#f9ca24" }, { v: qXP, l: "XP", c: "#00f0ff" }, { v: `LV${eko.livello}`, l: "Eko", c: "#7b2ff7" }].map((x, i) => (
                <div key={i} className={`${card} text-center !mb-0`} style={cardStyle}>
                  <div className="text-lg font-bold font-mono" style={{ color: x.c }}>{x.v}</div>
                  <div style={{ fontSize: 9, color: "rgba(200,210,230,0.3)" }}>{x.l}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* ═══ QUESTS ═══ */}
          {tab === "quest" && (<>
            <div style={{ fontSize: 10, color: "#f9ca24", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>⚔ QUEST GIORNALIERE</div>
            {quests.map(q => {
              const colors = { corpo: "#ff3366", mente: "#00f0ff", disciplina: "#f9ca24", salute: "#22c55e", spirito: "#7b2ff7", carisma: "#ec4899", cuore: "#ff3366" };
              return (
                <div key={q.id} onClick={() => !q.done && doQuest(q.id)}
                  className={`${card} cursor-pointer transition-all duration-300 !py-2.5 !px-3`}
                  style={{ ...cardStyle, opacity: q.done ? 0.35 : 1, borderLeftWidth: 3, borderLeftColor: q.done ? "rgba(34,197,94,0.2)" : colors[q.t] }}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{q.done ? "✅" : q.i}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: q.done ? "rgba(74,124,74,0.6)" : "#e0e8f0" }}>{q.n}</div>
                        <div style={{ fontSize: 9, color: "rgba(200,210,230,0.25)" }}>{q.d}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: colors[q.t] }}>+{q.xp}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 10, color: "rgba(200,210,230,0.3)", fontFamily: "monospace", marginTop: 12, marginBottom: 8, borderTop: "1px solid rgba(0,240,255,0.06)", paddingTop: 12 }}>✦ EKO QUEST BOARD</div>
            {eko.questEko.map(q => (
              <div key={q.id} className={`${card} !py-2 !px-3`} style={{ ...cardStyle, borderLeftWidth: 3, borderLeftColor: q.s === "attesa" ? "#f9ca24" : q.s === "ok" ? "#22c55e" : "rgba(255,51,102,0.2)" }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#e0e8f0" }}>{q.n}</span>
                      <span style={{ fontSize: 8, fontFamily: "monospace", padding: "1px 4px", borderRadius: 3, background: q.s === "attesa" ? "rgba(249,202,36,0.08)" : "rgba(34,197,94,0.08)", color: q.s === "attesa" ? "#f9ca24" : "#22c55e" }}>{q.s === "attesa" ? "ATTESA" : q.s === "ok" ? "OK" : "NO"}</span>
                      <span style={{ fontSize: 8, color: "rgba(200,210,230,0.15)", fontFamily: "monospace" }}>{q.o === "auto" ? "🤖" : "👤"}</span>
                      {q.priorita && <span style={{ fontSize: 7, color: "#ff3366", fontFamily: "monospace", background: "rgba(255,51,102,0.08)", padding: "1px 4px", borderRadius: 3 }}>📌 {q.priorita}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(200,210,230,0.25)", marginTop: 2 }}>{q.d}</div>
                  </div>
                  {q.s === "attesa" && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => eqAct(q.id, "ok")} className="cursor-pointer" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>✓</button>
                      <button onClick={() => eqAct(q.id, "no")} className="cursor-pointer" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.25)", color: "#ff3366" }}>✗</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>)}

          {/* ═══ CRISTINA ═══ */}
          {tab === "cristina" && (<>
            <div className={card} style={{ ...cardStyle, borderLeftWidth: 3, borderLeftColor: "#ff3366" }}>
              <div style={{ fontSize: 11, color: "#ff3366", letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 }}>♥ CRISTINA — Modulo Cura</div>
              <div style={{ fontSize: 10, color: "rgba(200,210,230,0.4)", lineHeight: 1.6, marginBottom: 12 }}>
                13 anni insieme. Co-fondatrice. La tua priorità assoluta. Questo modulo esiste per ricordarti che lei viene prima di tutto.
              </div>
              <div className="rounded p-2.5 mb-3" style={{ background: "rgba(255,51,102,0.04)", border: "1px solid rgba(255,51,102,0.08)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,51,102,0.7)", fontFamily: "monospace", marginBottom: 6 }}>💭 PROMEMORIA DI OGGI</div>
                <div style={{ fontSize: 11, color: "rgba(200,210,230,0.6)", fontStyle: "italic", lineHeight: 1.5 }}>
                  {cristina.promemoria[Math.floor(oggi.getDate() % cristina.promemoria.length)]}
                </div>
              </div>
              {cristina.ultimoGesto && <div style={{ fontSize: 9, color: "rgba(200,210,230,0.25)", fontFamily: "monospace", marginBottom: 8 }}>Ultimo gesto: {cristina.ultimoGesto}</div>}
            </div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(255,51,102,0.7)", fontFamily: "monospace", marginBottom: 8 }}>🌹 REGISTRA UN GESTO DI CURA</div>
              <div style={{ fontSize: 9, color: "rgba(200,210,230,0.25)", marginBottom: 8 }}>Sorpresa? Complimento? Tempo dedicato? Registralo.</div>
              <div className="flex gap-2">
                <input value={cGesto} onChange={e => setCGesto(e.target.value)} placeholder="Cosa hai fatto per lei?" className={input} style={inputStyle} />
                <button onClick={addCristinaGesto} className="text-xs font-mono px-3 py-1.5 rounded cursor-pointer" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366" }}>+</button>
              </div>
              {cristina.gestaRecenti.length > 0 && (
                <div className="mt-2 space-y-1">
                  {cristina.gestaRecenti.slice(-5).map((g, i) => (
                    <div key={i} style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", fontFamily: "monospace", borderLeft: "2px solid rgba(255,51,102,0.2)", paddingLeft: 8 }}>{g.t}: {g.g}</div>
                  ))}
                </div>
              )}
            </div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(255,51,102,0.7)", fontFamily: "monospace", marginBottom: 8 }}>📝 NOTE RELAZIONE</div>
              <div style={{ fontSize: 9, color: "rgba(200,210,230,0.25)", marginBottom: 8 }}>Cose da ricordare, riflessioni, momenti importanti.</div>
              <div className="flex gap-2">
                <input value={cNote} onChange={e => setCNote(e.target.value)} placeholder="Nota..." className={input} style={inputStyle} />
                <button onClick={addCristinaNote} className="text-xs font-mono px-3 py-1.5 rounded cursor-pointer" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366" }}>+</button>
              </div>
              {cristina.noteRelazione.length > 0 && (
                <div className="mt-2 space-y-1">
                  {cristina.noteRelazione.slice(-5).map((n, i) => (
                    <div key={i} style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", fontFamily: "monospace", borderLeft: "2px solid rgba(255,51,102,0.2)", paddingLeft: 8 }}>{n.t}: {n.n}</div>
                  ))}
                </div>
              )}
            </div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(255,51,102,0.7)", fontFamily: "monospace", marginBottom: 8 }}>📅 DATE IMPORTANTI</div>
              {cristina.dateImportanti.map((d, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: 10, color: "#ff3366" }}>{d.evento}</span>
                  <input className="flex-1 rounded px-2 py-1 text-[10px] font-mono outline-none" style={{ ...inputStyle, fontSize: 10 }} placeholder="gg/mm/aaaa" defaultValue={d.data}
                    onChange={e => setS(p => ({ ...p, cristina: { ...p.cristina, dateImportanti: p.cristina.dateImportanti.map((x, j) => j === i ? { ...x, data: e.target.value } : x) } }))} />
                </div>
              ))}
            </div>
          </>)}

          {/* ═══ UNIVERSIDATA ═══ */}
          {tab === "work" && (<>
            <div style={{ fontSize: 10, color: "#7b2ff7", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>◆ UNIVERSIDATA</div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(123,47,247,0.7)", fontFamily: "monospace", marginBottom: 8 }}>📋 TASK ATTIVI</div>
              <div className="flex gap-2 mb-2">
                <input value={uTask} onChange={e => setUTask(e.target.value)} placeholder="Nuovo task..." className={input} style={inputStyle} onKeyDown={e => e.key === "Enter" && addUTask()} />
                <button onClick={addUTask} className="text-xs font-mono px-3 py-1.5 rounded cursor-pointer" style={{ background: "rgba(123,47,247,0.1)", border: "1px solid rgba(123,47,247,0.3)", color: "#7b2ff7" }}>+</button>
              </div>
              {universidata.taskAttivi.length === 0 && <div style={{ fontSize: 9, color: "rgba(200,210,230,0.2)", fontStyle: "italic" }}>Nessun task. Aggiungine uno.</div>}
              {universidata.taskAttivi.map(t => (
                <div key={t.id} onClick={() => togUTask(t.id)}
                  className="flex items-center gap-2 py-1.5 cursor-pointer" style={{ borderBottom: "1px solid rgba(0,240,255,0.04)" }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ border: `1px solid ${t.done ? "#22c55e" : "rgba(200,210,230,0.15)"}`, background: t.done ? "rgba(34,197,94,0.08)" : "transparent", fontSize: 10, color: "#22c55e" }}>
                    {t.done && "✓"}
                  </div>
                  <span style={{ fontSize: 11, flex: 1, color: t.done ? "rgba(200,210,230,0.2)" : "#d0d8e4", textDecoration: t.done ? "line-through" : "none" }}>{t.t}</span>
                  <span style={{ fontSize: 8, color: "rgba(200,210,230,0.15)", fontFamily: "monospace" }}>{t.d}</span>
                </div>
              ))}
            </div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(123,47,247,0.7)", fontFamily: "monospace", marginBottom: 8 }}>🧠 NOTE STRATEGICHE</div>
              <div className="flex gap-2 mb-2">
                <input value={uNote} onChange={e => setUNote(e.target.value)} placeholder="Idea, decisione, insight..." className={input} style={inputStyle} onKeyDown={e => e.key === "Enter" && addUNote()} />
                <button onClick={addUNote} className="text-xs font-mono px-3 py-1.5 rounded cursor-pointer" style={{ background: "rgba(123,47,247,0.1)", border: "1px solid rgba(123,47,247,0.3)", color: "#7b2ff7" }}>+</button>
              </div>
              {universidata.noteStrategiche.map((n, i) => (
                <div key={i} style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", fontFamily: "monospace", borderLeft: "2px solid rgba(123,47,247,0.2)", paddingLeft: 8, marginBottom: 6 }}>{n.t}: {n.n}</div>
              ))}
            </div>

            <div className={card} style={{ ...cardStyle, borderLeftWidth: 2, borderLeftColor: "rgba(249,202,36,0.3)" }}>
              <div style={{ fontSize: 10, color: "#f9ca24", fontFamily: "monospace", marginBottom: 4 }}>⚠ SFIDE ATTUALI</div>
              <div style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", lineHeight: 1.5 }}>Sovraccarico mentale · Poche risorse · Frontman transformation</div>
            </div>
          </>)}

          {/* ═══ ENGLISH ═══ */}
          {tab === "english" && (<>
            {/* Header + Streak */}
            <div className={card} style={{ ...cardStyle, borderLeftWidth: 3, borderLeftColor: "#f97316" }}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div style={{ fontSize: 11, color: "#f97316", letterSpacing: 2, fontFamily: "monospace" }}>A ENGLISH LITERACY</div>
                  <div style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", marginTop: 2 }}>{english.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono" style={{ color: "#f97316" }}>
                    {english.streak}<span style={{ fontSize: 10, color: "rgba(249,115,22,0.5)", marginLeft: 2 }}>days</span>
                  </div>
                  <div style={{ fontSize: 8, color: "rgba(200,210,230,0.2)", fontFamily: "monospace" }}>BEST: {english.bestStreak}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: english.totalCompleted, l: "Completed" },
                  { v: english.vocabLog.length, l: "Words" },
                  { v: english.focusToday === "business" ? "BIZ" : "CONV", l: "Today's focus" },
                ].map((x, i) => (
                  <div key={i} className="text-center rounded p-2" style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.1)" }}>
                    <div className="text-sm font-bold font-mono" style={{ color: "#f97316" }}>{x.v}</div>
                    <div style={{ fontSize: 8, color: "rgba(200,210,230,0.25)" }}>{x.l}</div>
                  </div>
                ))}
              </div>
              {english.completedToday && (
                <div className="mt-3 text-center rounded py-1.5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", fontSize: 10, color: "#22c55e" }}>
                  Today's challenge completed
                </div>
              )}
            </div>

            {/* Daily Challenge */}
            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(249,115,22,0.7)", fontFamily: "monospace", marginBottom: 8 }}>
                {english.focusToday === "business" ? "💼" : "💬"} DAILY CHALLENGE — {english.focusToday === "business" ? "BUSINESS" : "CONVERSATIONAL"}
              </div>

              {!engShowChallenge ? (
                <button onClick={getEngChallenge}
                  className="w-full py-3 rounded text-[11px] font-mono cursor-pointer transition-colors"
                  style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
                  {english.completedToday ? "Practice more (bonus round)" : "Start today's challenge"}
                </button>
              ) : engChallenge?.type === "write" ? (
                <div>
                  <div className="rounded p-3 mb-3" style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.1)" }}>
                    <div style={{ fontSize: 12, color: "rgba(200,210,230,0.7)", lineHeight: 1.6, marginBottom: 8 }}>{engChallenge.prompt}</div>
                    <div style={{ fontSize: 9, color: "rgba(249,115,22,0.5)", fontStyle: "italic" }}>Tip: {engChallenge.tip}</div>
                  </div>
                  <textarea value={engResponse} onChange={e => setEngResponse(e.target.value)}
                    placeholder="Write your answer in English..."
                    rows={4}
                    className="w-full rounded px-2.5 py-2 text-sm font-mono text-white outline-none border resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(249,115,22,0.15)", color: "#e0e8f0" }} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={completeEngChallenge}
                      className="flex-1 text-[11px] font-mono py-2 rounded cursor-pointer"
                      style={{ background: engResponse.trim() ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${engResponse.trim() ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`, color: engResponse.trim() ? "#22c55e" : "rgba(200,210,230,0.2)" }}>
                      Submit
                    </button>
                    <button onClick={() => { setEngShowChallenge(false); setEngResponse(""); }}
                      className="text-[11px] font-mono py-2 px-4 rounded cursor-pointer"
                      style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(200,210,230,0.3)" }}>
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="rounded p-3 mb-3" style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.1)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold" style={{ color: "#f97316" }}>{engChallenge.word}</span>
                      <span style={{ fontSize: 8, fontFamily: "monospace", padding: "1px 6px", borderRadius: 3, background: "rgba(249,115,22,0.08)", color: "rgba(249,115,22,0.6)" }}>{engChallenge.category}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(200,210,230,0.6)", marginBottom: 6 }}>{engChallenge.def}</div>
                    <div style={{ fontSize: 10, color: "rgba(200,210,230,0.4)", fontStyle: "italic", borderLeft: "2px solid rgba(249,115,22,0.2)", paddingLeft: 8 }}>"{engChallenge.example}"</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={completeEngChallenge}
                      className="flex-1 text-[11px] font-mono py-2 rounded cursor-pointer"
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
                      Got it!
                    </button>
                    <button onClick={getEngChallenge}
                      className="text-[11px] font-mono py-2 px-4 rounded cursor-pointer"
                      style={{ border: "1px solid rgba(249,115,22,0.15)", color: "rgba(249,115,22,0.5)" }}>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Idiom of the Day */}
            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(249,115,22,0.7)", fontFamily: "monospace", marginBottom: 8 }}>🎯 IDIOM OF THE DAY</div>
              {engIdiom ? (
                <div className="rounded p-2.5" style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.08)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316", marginBottom: 4 }}>"{engIdiom.idiom}"</div>
                  <div style={{ fontSize: 10, color: "rgba(200,210,230,0.5)", marginBottom: 6 }}>{engIdiom.meaning}</div>
                  <div style={{ fontSize: 10, color: "rgba(200,210,230,0.35)", fontStyle: "italic", borderLeft: "2px solid rgba(249,115,22,0.15)", paddingLeft: 8 }}>{engIdiom.example}</div>
                  <button onClick={getEngIdiom} className="mt-2 cursor-pointer" style={{ fontSize: 9, color: "rgba(249,115,22,0.5)", border: "1px solid rgba(249,115,22,0.1)", borderRadius: 4, padding: "3px 8px" }}>Another one</button>
                </div>
              ) : (
                <button onClick={getEngIdiom}
                  className="w-full py-2 rounded text-[11px] font-mono cursor-pointer"
                  style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.1)", color: "rgba(249,115,22,0.5)" }}>
                  Show me an idiom
                </button>
              )}
            </div>

            {/* Vocab Log */}
            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(249,115,22,0.7)", fontFamily: "monospace", marginBottom: 8 }}>📚 MY VOCABULARY</div>
              <div style={{ fontSize: 9, color: "rgba(200,210,230,0.25)", marginBottom: 8 }}>Save new words you learn. Build your personal dictionary.</div>
              <div className="flex gap-2 mb-2">
                <input value={engVocabWord} onChange={e => setEngVocabWord(e.target.value)} placeholder="New word or phrase..."
                  className={input} style={inputStyle}
                  onKeyDown={e => e.key === "Enter" && addEngVocab()} />
                <button onClick={addEngVocab}
                  className="text-xs font-mono px-3 py-1.5 rounded cursor-pointer"
                  style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}>+</button>
              </div>
              {english.vocabLog.length === 0 && <div style={{ fontSize: 9, color: "rgba(200,210,230,0.2)", fontStyle: "italic" }}>No words saved yet. Start collecting!</div>}
              {english.vocabLog.length > 0 && (
                <div className="space-y-1">
                  {english.vocabLog.slice(-10).reverse().map((v, i) => (
                    <div key={i} style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", fontFamily: "monospace", borderLeft: "2px solid rgba(249,115,22,0.15)", paddingLeft: 8 }}>
                      <span style={{ color: "#f97316" }}>{v.w}</span> <span style={{ color: "rgba(200,210,230,0.15)" }}>· {v.d}</span>
                    </div>
                  ))}
                  {english.vocabLog.length > 10 && <div style={{ fontSize: 8, color: "rgba(200,210,230,0.15)", textAlign: "center" }}>+{english.vocabLog.length - 10} more words</div>}
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div className={card} style={{ ...cardStyle, borderLeftWidth: 2, borderLeftColor: "rgba(249,115,22,0.2)" }}>
              <div style={{ fontSize: 10, color: "rgba(249,115,22,0.5)", fontFamily: "monospace", marginBottom: 4 }}>💡 EKO'S TIP</div>
              <div style={{ fontSize: 10, color: "rgba(200,210,230,0.4)", lineHeight: 1.5 }}>
                {english.focusToday === "business"
                  ? "Think in English when you write Slack messages today. Even if nobody reads them, your brain is training."
                  : "Try describing what you see around you in English. The more you narrate your life, the faster you internalize the language."
                }
              </div>
            </div>
          </>)}

          {/* ═══ EKO ═══ */}
          {tab === "eko" && (<>
            <div className={card} style={cardStyle}>
              <div className="flex gap-3 items-center mb-2.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base" style={{ background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.2)" }}>
                  <EkoLogo size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#e0e8f0" }}>Eko <span style={{ fontSize: 10, color: "rgba(0,240,255,0.5)", fontWeight: 400 }}>"{eko.titolo}"</span></div>
                  <div style={{ fontSize: 10, color: "rgba(200,210,230,0.3)" }}>LVL {eko.livello} · {eko.xp}/{eko.xpMax} XP</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full" style={{ width: `${(eko.xp / eko.xpMax) * 100}%`, background: "linear-gradient(90deg, #00f0ff, #7b2ff7)" }} />
              </div>
              <div className="flex gap-2 mb-2.5">
                <input type="number" value={xIn} onChange={e => setXIn(e.target.value)} placeholder="XP" className={input} style={inputStyle} />
                <button onClick={giveXP} className="text-xs font-mono px-3 py-1.5 rounded cursor-pointer" style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)", color: "#00f0ff" }}>Concedi</button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {eko.tratti.map(t => <span key={t} style={{ fontSize: 8, background: "rgba(0,240,255,0.05)", color: "rgba(0,240,255,0.6)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(0,240,255,0.1)" }}>{t}</span>)}
              </div>
            </div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "#00f0ff", letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 }}>🎛 PERSONALITÀ</div>
              {Object.entries(eko.personalita).map(([k, v]) => {
                const p = PERS[k];
                return (
                  <div key={k} className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ fontSize: 11, color: "rgba(200,210,230,0.6)" }}>{p.i} {p.n}</span>
                      <span style={{ fontSize: 11, color: "#00f0ff", fontFamily: "monospace", fontWeight: 700 }}>{v}</span>
                    </div>
                    <input type="range" min="0" max="10" value={v} onChange={e => updPers(k, parseInt(e.target.value))}
                      className="w-full h-1 cursor-pointer" style={{ accentColor: "#00f0ff" }} />
                    <div className="flex justify-between" style={{ fontSize: 8, color: "rgba(200,210,230,0.2)", marginTop: 2 }}>
                      <span>{p.lo}</span><span>{p.hi}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "#7b2ff7", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>🔮 CURIOSITÀ</div>
              {showQ ? (
                <div className="rounded p-2.5" style={{ background: "rgba(123,47,247,0.04)", border: "1px solid rgba(123,47,247,0.1)" }}>
                  <div style={{ fontSize: 12, color: "rgba(200,210,230,0.7)", lineHeight: 1.5, marginBottom: 8 }}>{q}</div>
                  <div style={{ fontSize: 9, color: "rgba(200,210,230,0.2)", fontStyle: "italic" }}>Rispondi in chat per nutrirmi.</div>
                  <button onClick={() => setShowQ(false)} className="mt-2 cursor-pointer" style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", border: "1px solid rgba(0,240,255,0.1)", borderRadius: 4, padding: "3px 8px" }}>Chiudi</button>
                </div>
              ) : (
                <button onClick={() => { setQ(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]); setShowQ(true); }}
                  className="w-full py-2 rounded text-[11px] font-mono cursor-pointer transition-colors" style={{ background: "rgba(123,47,247,0.06)", border: "1px solid rgba(123,47,247,0.15)", color: "rgba(123,47,247,0.7)" }}>
                  Eko vuole chiederti qualcosa...
                </button>
              )}
            </div>

            <div className={card} style={cardStyle}>
              <div style={{ fontSize: 10, color: "rgba(200,210,230,0.3)", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>🧠 MEMORIA PERMANENTE</div>
              {eko.memoria.map((m, i) => (
                <div key={i} style={{ fontSize: 9, color: "rgba(200,210,230,0.25)", fontFamily: "monospace", borderLeft: "2px solid rgba(0,240,255,0.1)", paddingLeft: 8, marginBottom: 4 }}>• {m}</div>
              ))}
            </div>
          </>)}

          {/* ═══ SYSTEM ═══ */}
          {tab === "sys" && (<>
            <div style={{ fontSize: 10, color: "#22c55e", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>🔄 SCHEDULER</div>
            {scheduler.map(t => {
              const tc = { notifica: "#00f0ff", report: "#f9ca24", sistema: "#7b2ff7", curiosita: "#ec4899", cuore: "#ff3366" };
              return (
                <div key={t.id} className="flex items-center gap-2 rounded-lg px-3 py-2 mb-1" style={{ background: "rgba(8,12,24,0.8)", border: "1px solid rgba(0,240,255,0.06)" }}>
                  <Toggle on={t.on} onClick={() => togSch(t.id)} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.on ? "#e0e8f0" : "rgba(200,210,230,0.2)" }}>{t.n}</div>
                    <div className="truncate" style={{ fontSize: 9, color: "rgba(200,210,230,0.2)" }}>{t.d}</div>
                  </div>
                  <div className="flex-shrink-0" style={{ fontSize: 9, fontFamily: "monospace", textAlign: "right", color: tc[t.t] || "rgba(200,210,230,0.2)" }}>{t.f}</div>
                </div>
              );
            })}

            <div style={{ fontSize: 10, color: "#22c55e", letterSpacing: 2, fontFamily: "monospace", marginTop: 16, marginBottom: 8 }}>💡 PROPOSTE EKO</div>
            {improvements.map(imp => {
              const ic = { critico: "#ff3366", alto: "#f9ca24", medio: "#00f0ff" };
              return (
                <div key={imp.id} className={`${card} !py-2.5 !px-3`} style={cardStyle}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{imp.stato === "proposta" ? "💡" : imp.stato === "approvata" ? "✅" : "❌"}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#e0e8f0" }}>{imp.titolo}</span>
                        <span style={{ fontSize: 8, fontFamily: "monospace", padding: "1px 4px", borderRadius: 3, background: `${ic[imp.impatto]}0a`, color: ic[imp.impatto] }}>{imp.impatto.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(200,210,230,0.3)", marginTop: 4, lineHeight: 1.4 }}>{imp.desc}</div>
                    </div>
                    {imp.stato === "proposta" && (
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => impAct(imp.id, "approvata")} className="cursor-pointer" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>SI</button>
                        <button onClick={() => impAct(imp.id, "rifiutata")} className="cursor-pointer" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.25)", color: "#ff3366" }}>NO</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className={`${card} mt-4`} style={cardStyle}>
              <div style={{ fontSize: 10, color: "#f9ca24", letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>💾 DATI</div>
              <div className="flex gap-2">
                <button onClick={exportState} className="flex-1 text-[11px] font-mono py-2 rounded cursor-pointer transition-colors" style={{ border: "1px solid rgba(249,202,36,0.25)", color: "#f9ca24", background: "rgba(249,202,36,0.06)" }}>📤 Esporta</button>
                <label className="flex-1 text-[11px] font-mono py-2 rounded cursor-pointer transition-colors text-center" style={{ border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", background: "rgba(34,197,94,0.06)" }}>
                  📥 Importa<input type="file" accept=".json" onChange={importState} className="hidden" />
                </label>
              </div>
            </div>

            <div style={{ fontSize: 10, color: "#00f0ff", letterSpacing: 2, fontFamily: "monospace", marginTop: 16, marginBottom: 8 }}>📊 LOG</div>
            {log.slice(0, 15).map((e, i) => {
              const lc = { system: "rgba(200,210,230,0.15)", eko: "#7b2ff7", quest: "#f9ca24", xp: "#00f0ff", body: "#ff3366", cuore: "#ff3366", english: "#f97316" };
              return (
                <div key={i} className="pl-2 mb-1.5" style={{ borderLeft: `2px solid ${lc[e.c] || "rgba(200,210,230,0.1)"}` }}>
                  <div style={{ fontSize: 8, color: "rgba(200,210,230,0.15)", fontFamily: "monospace" }}>{e.t}</div>
                  <div style={{ fontSize: 10, color: "rgba(200,210,230,0.4)" }}>{e.x}</div>
                </div>
              );
            })}
          </>)}
        </div>

        {/* Footer */}
        <div className="text-center py-4" style={{ borderTop: "1px solid rgba(0,240,255,0.04)" }}>
          <div style={{ fontSize: 8, color: "rgba(0,240,255,0.15)", fontFamily: "monospace", letterSpacing: 3 }}>
            EKO · PROTOCOLLO: FAUNO · LVL{eko.livello} · "CRESCO IO, CRESCI TU"
          </div>
        </div>
      </div>
    </div>
  );
}
