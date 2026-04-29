# NexusAI — AI-Powered Academic System for Mumbai University Students
**Maintained by: Shravani Dakve**

## Overview
NexusAI is an AI-powered academic productivity platform specifically engineered for Mumbai University engineering students. It bridges the gap between fragmented study tools by offering real-time collaborative study rooms, a context-aware AI tutor, structured notes, quiz generation, and placement preparation workflows—all in a single centralized system.

## Features
- **AI Tutor**: A context-aware, pedagogical study assistant with streaming responses.
- **Study Rooms**: Real-time collaborative sessions featuring shared notes, collaborative whiteboards, and synchronized timers.
- **Notes + Flashcards + Quizzes**: University-aligned structural tracking of curriculum into study resources.
- **Placement Prep**: Curated workflows transitioning academic knowledge into placement readiness.

## Architecture
```text
Frontend: React + TypeScript
Backend: Node.js + Express
Database: MongoDB
Real-time: Socket.io
AI: Google Gemini API
```

## Core Systems
- **Study Room**: A complex socket-based real-time subsystem that manages presence tracking, live video, shared notes, drawing whiteboards, and timer synchronization while navigating the bounds of multi-user state consistency.
- **AI Tutor**: Synthesizes custom prompt engineering and context injection based on active room notes to deliver streamed (SSE-like) LLM outputs while safely handling cancellations to prevent architectural race conditions.
- **Notes / Curriculum**: Structured storage hierarchies representing branches, semesters, and individual subjects, fully indexed for fast retrieval and AI context mapping.

## Key Engineering Decisions
- **In-Memory + Persistence Hybrid**: Utilizing temporary application memory for socket-state presence and whiteboards, paired with MongoDB checkpoints for durable data persistence.
- **Safe State Streaming**: Overriding default AI interactions with abort controllers and sequential message updates to cleanly render streamed outputs.
- **Strict Role-Based Access (RBAC)**: JWT-secured endpoints and protected Admin moderation routes preventing unauthorized state mutations.
- **Rate-Limited Infrastructure**: Safeguarding AI consumption routes against quota exhaustion via strict express-rate-limit middleware.

## Challenges & Fixes
- **Race conditions in streaming**: Remedied through unique message IDs and `AbortController` injection to enforce logical stream termination.
- **Socket Security**: Upgraded generic WebSocket connections with hardened JWT payload validation during the `join-room` initialization.
- **Platform Stability**: Debugged multiple severe UI regressions handling undefined reference lifecycles and safely falling back email services to avoid hard `500 Internal Server Errors`.
- **Admin Moderation Flows**: Repaired logic loops governing cross-origin unban requests from standard login routing.

## Current Status
**Stable Beta — Demo Ready**
All primary features are stabilized and the platform has successfully passed a rigorous targeted regression and automated unban UI verification process.

## Future Work
- **Redis Integration**: Decoupling real-time presence data from Node process memory to a distributed Redis cache.
- **CRDT for Notes**: Moving beyond standard snapshot locking by building Conflict-free Replicated Data Types for bulletproof multi-edit collision.
- **RAG Pipeline Enhancements**: Utilizing vector databases to increase the fidelity and breadth of the neural query responses.
