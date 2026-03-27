<div align="center">

<img src="https://img.shields.io/badge/NexusAI-Educational%20Platform-6d28d9?style=for-the-badge&logo=react&logoColor=white" alt="NexusAI" />

# 🧠 NexusAI

### AI-Orchestrated Educational Platform for Mumbai University Students

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://mongoosejs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**One platform. Every tool a Mumbai University engineering student needs — powered by AI.**

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [AI Stack](#-ai-stack) · [Database](#-database) · [API Reference](#-api-reference)

</div>

---

## 📖 About

NexusAI is a full-stack educational platform built specifically for **Mumbai University (MU) engineering students**. It solves the fragmentation problem — students no longer need to juggle circulars, past papers, placement prep, and study groups across 10 different apps.

Everything lives here: real-time collaborative study rooms with autonomous AI moderation, live MU circular scraping, past question paper analysis, curriculum-aware AI tutoring, and a data-driven placement intelligence engine — all backed by a 4-provider AI reliability chain.

---

## ✨ Features

### 🤖 AI-Powered Learning
- **AI Tutor** — Streaming chat powered by Groq LLaMA 3.3 70B, fully aware of the MU syllabus and marking schemes
- **Topic Predictor** — Ingests MU past question papers, runs frequency analysis across 6 modules, and predicts high-yield exam topics
- **Mock Paper Generator** — AI generates full MU-format question papers with proper module distribution
- **Smart Flashcard & Quiz Generation** — Auto-generated from uploaded notes (text or PDF)

### 🏠 Collaborative Study Rooms (Real-Time)
- WebSocket-based rooms with live chat, shared whiteboard, and synchronized notes
- **Autonomous AI Moderation (3-Tier):**
  - Tier 1 (Reflex) — Blocks explicit content instantly
  - Tier 2 (Vibe Check) — Sentiment analysis warns the room
  - Tier 3 (Context Scan) — Every 7 messages, AI analyzes full context and intervenes if needed
- **Knowledge Gap Detection** — AI automatically identifies what the group doesn't understand and surfaces it
- Study techniques: Pomodoro, Feynman Method, Spaced Repetition — all synchronized across participants
- Host controls: mute participants, manage resources, shared quiz mode

### 🎓 Mumbai University Integration
- **Live University Hub** — Real-time scraping of `mu.ac.in` circulars, exam timetables, and `mumresults.in` results (auto-refreshes every 6 hours via cron)
- **Curriculum Explorer** — Complete MU 6-module syllabus browser for all branches (FE/SE/TE/BE)
- **MU Paper Bank** — Upload and ingest past question papers; AI extracts and structures each question
- **ATKT / GPA Calculator** — MU-specific grade and backlog calculations

### 💼 Placement Intelligence
- **Placement Predictor** — Data-driven probability engine using college tier, CGPA, skills, and target company (results: 5–95%)
- **Company Hub** — MU-affiliated college placement stats (SPIT, VJTI, DJSCE, TSEC…), company profiles, startup ecosystem
- **Placement Tracker** — Track your application journey
- **Practice Simulators:**
  - TCS NQT (Numerical, Verbal, Reasoning)
  - Capgemini Exceller Drive (Quant, Logical, Technical)
  - HR Interview Simulator
  - Group Discussion Simulator
  - Viva Simulator (oral exam roleplay)

### 📝 Notes & Resources
- Rich text notes + file upload (PDF, images up to 20MB)
- AI-powered: summarize, generate quiz, generate flashcards from any note
- Per-course organization, shared study room resources

### 🏆 Gamification
- XP system with dynamic leveling formula: `Level = floor((1 + sqrt(1 + 8*XP/1000)) / 2)`
- Coins earned on level-ups, Badges for achievements
- Daily streak tracking, Global leaderboard

### 🌐 Community
- Course-specific threaded forums
- Upvotes, Best Answer tagging, PYQ (Previous Year Question) tagging
- Real-time live updates via Socket.IO

### 📊 AI Insights
- Personal usage analytics dashboard
- AI-generated study pattern feedback
- Tool usage heatmaps and recommendations

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                     │
│   Vite · TypeScript · Framer Motion · Recharts · Socket.IO  │
│   45 Pages  ·  27 Components  ·  17 Services                │
└───────────────────────┬─────────────────────────────────────┘
                        │  HTTP REST + WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│               BACKEND (Node.js / Express 5)                  │
│   19 API Routes · JWT Auth · Rate Limiting · Helmet · CORS  │
└──────────┬────────────────────────────┬─────────────────────┘
           │                            │
┌──────────▼──────────┐   ┌────────────▼──────────────────────┐
│   MongoDB (Atlas)   │   │        AI PROVIDER LAYER          │
│   26 Collections    │   │  ① Groq — LLaMA 3.3 70B (primary) │
│   Mongoose ODM      │   │  ② Mistral via OpenRouter          │
└─────────────────────┘   │  ③ Google Gemini 1.5 Pro          │
                          │  ④ Ollama phi3 (local fallback)    │
                          └───────────────────────────────────┘

  node-cron (every 6 hrs)
       └──► Scrape mu.ac.in + mumresults.in ──► MongoDB
```

---

## 🤖 AI Stack

NexusAI uses a **multi-provider AI routing system** that assigns the right model to the right feature and falls back automatically on failure.

| Feature | Provider | Model |
|---------|----------|-------|
| AI Tutor Chat | **Groq** | LLaMA 3.3 70B Versatile |
| Quiz Generation | **Groq** | LLaMA 3.3 70B (JSON mode) |
| Flashcard Generation | **Groq** | LLaMA 3.3 70B |
| Viva Simulator | **Groq** | LLaMA 3.3 70B |
| Code Helper | **Groq** | LLaMA 3.3 70B |
| Study Plan | **Mistral** | mistral-large-2411 (OpenRouter) |
| Mock Paper | **Mistral** | mistral-large-2411 (OpenRouter) |
| Summarization | **Mistral** | mistral-large-2411 (OpenRouter) |
| Fallback (all) | **Gemini** | gemini-1.5-pro |
| Offline Fallback | **Ollama** | phi3 (local) |

### AI Fallback Chain
```
Primary Provider failure
    → Gemini 1.5 Pro
        → Ollama phi3 (local, always available)
```

---

## 🗄 Database

26 MongoDB collections covering:

| Collection | Purpose |
|-----------|---------|
| `User` | Profile, gamification (xp/coins/level/streak/badges), personalization |
| `StudyRoom` | Room state, participants, techniqueState, knowledgeGaps, sharedNotes |
| `Message` | Chat history per room |
| `Note` | Text and file notes per course |
| `MUPastQuestion` | Ingested MU past paper questions (subject, branch, FE–BE, module 1-6, tags) |
| `UniversityCircular` | Live MU circulars (SHA1-deduplicated) |
| `PlacementAttempt` | Simulator attempt results with section breakdown |
| `PlacementData` | MU college placement package stats |
| `StudyPlan` | AI-generated day-by-day study plans |
| `Thread / Post` | Community forum |
| `PersonalizationEvent` | Tool usage events for AI personalization |
| + 15 more | Curriculum, Flashcard, Quiz, Goal, Session, Resource, GameScore… |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas URI or local MongoDB
- API Keys: [Groq](https://console.groq.com), [OpenRouter](https://openrouter.ai), [Gemini](https://ai.google.dev)

### 1. Clone

```bash
git clone https://github.com/yourusername/NexusAI.git
cd NexusAI
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env
cp .env.example .env
# Fill in: VITE_API_BASE_URL, VITE_GEMINI_API_KEY
```

### 3. Backend Setup

```bash
cd backend
npm install

# Create backend/.env
cp .env.example .env
# Fill in: MONGODB_URI, JWT_SECRET, GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
npm start         # production
# OR
npm run dev       # nodemon (hot reload)

# Terminal 2 — Frontend
cd ..
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:3001`

---

## ⚙️ Environment Variables

### Frontend (`.env`)

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GEMINI_API_KEY=your_gemini_key
VITE_AI_DOC_CONTEXT_MAX_CHARS=60000
VITE_AI_DOC_QUIZ_CONTEXT_MAX_CHARS=20000
VITE_AI_DOC_MAX_FILE_MB=20
```

### Backend (`backend/.env`)

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/nexusai
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register with personalization data |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/verify` | ✅ | Verify token + get user profile |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| POST | `/api/auth/forgot-password` | ❌ | Send reset email |
| POST | `/api/gemini/...` | ✅ | AI generation (chat, quiz, flashcards, etc.) |
| POST | `/api/placement/predict` | ✅ | Placement probability prediction |
| GET | `/api/placement/dashboard` | ❌ | Placement stats + simulators |
| POST | `/api/placement/simulators/:slug/submit` | ✅ | Submit simulator answers |
| GET | `/api/university/circulars` | ❌ | Live MU circulars |
| GET | `/api/curriculum/:branch/:year` | ✅ | MU syllabus by branch/year |
| GET/POST | `/api/notes` | ✅ | CRUD notes (text + file) |
| GET/POST | `/api/community/threads` | ✅ | Community threads |
| GET/POST | `/api/study-plan` | ✅ | AI study plans |
| GET | `/api/analytics` | ✅ | User insights and analytics |
| GET | `/api/gamification/leaderboard` | ✅ | XP leaderboard |

### WebSocket Events

| Event (Client → Server) | Description |
|--------------------------|-------------|
| `join-room` | Join a study room |
| `send-message` | Send chat message (moderated) |
| `draw` | Whiteboard stroke sync |
| `clear-whiteboard` | Clear whiteboard for all |
| `leave-room` | Leave room |
| `request-moderation` | Manually trigger AI context analysis |

| Event (Server → Client) | Description |
|--------------------------|-------------|
| `room-update` | Full room state update |
| `receive-message` | New chat message |
| `knowledge-gaps-updated` | AI-detected knowledge gaps |
| `user-typing` | Typing indicator |
| `room-error` | Room-level error |

---

## 📁 Project Structure

```
NexusAI/
├── pages/              # 45 page components
│   ├── Dashboard.tsx
│   ├── StudyRoom.tsx   # Core — 96KB, real-time collaborative room
│   ├── TopicPredictor.tsx
│   ├── PlacementPredictor.tsx
│   └── ...
├── components/         # 27 shared components
│   ├── Sidebar.tsx
│   ├── StudyRoomNotesPanel.tsx
│   ├── StudyToolsPanel.tsx
│   └── ...
├── services/           # 17 frontend API service layers
│   ├── geminiService.ts
│   ├── placementService.ts
│   └── ...
├── contexts/           # AuthContext, ModeContext
├── types.ts            # Shared TypeScript types
├── App.tsx             # Router + ProtectedRoute
│
└── backend/
    ├── server.js       # Express app setup
    ├── socketHandler.js# WebSocket + AI moderation
    ├── routes/         # 19 API route files
    ├── models/         # 26 Mongoose models
    ├── services/
    │   ├── aiProvider.js      # Multi-provider AI routing
    │   ├── scraperService.js  # MU website scraper
    │   ├── muAnalysisService.js # Past paper analysis
    │   ├── geminiService.js   # Knowledge gap detection
    │   └── moderatorService.js
    ├── middleware/
    │   └── auth.js     # JWT middleware
    ├── cron/
    │   └── muScraper.js # Scheduled MU data refresh
    └── utils/
        └── placementLogic.js # Placement scoring engine
```

---

## 🏆 Gamification System

NexusAI uses a dynamic leveling formula:

```
Level = floor((1 + sqrt(1 + 8 × XP / 1000)) / 2)
Coins earned on level-up = newLevel × 10
Badge XP bonus = +100 XP per badge
```

XP is awarded for: completing quizzes, taking simulator attempts, creating notes, joining study rooms, earning badges, and daily streaks.

---

## 🌐 MU Scraper

The automated scraper runs every 6 hours and pulls from 3 sources:

| Source | Data |
|--------|------|
| `mu.ac.in/circular` | Academic, Exam, Event, Admin circulars |
| `mu.ac.in/examination` | Exam timetables |
| `mumresults.in` | Semester results |

Deduplication uses SHA1 hash of `title + link` — safe to run frequently without creating duplicates.

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
npm test

# Seed MU past paper samples (10 records)
npm run seed:mu-pyq-samples
```

---

## 🔮 Roadmap

- [ ] React Native mobile app
- [ ] Voice AI Tutor (TTS + STT)
- [ ] MU Result push notifications
- [ ] Google Calendar assignment integration
- [ ] ML-based study partner matching
- [ ] Inter-college leaderboard (verified college email)
- [ ] Offline PWA mode (Service Worker + IndexedDB)
- [ ] Faculty dashboard (paper uploads + room monitoring)

---

## 🤝 Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for Mumbai University students

**[Live Demo](http://localhost:5173)** · **[API Docs](#-api-reference)** · **[Report Bug](issues)** · **[Request Feature](issues)**

</div>
