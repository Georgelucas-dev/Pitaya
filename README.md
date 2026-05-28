<div align="center">
  <img src="./src/Assets/Pitaya%20logo.png" alt="Pitaya" width="500" />

  <h1>Pitaya</h1>

  <p>A sharp, opinionated AI with a Brazilian Gen Z attitude — and a memory.</p>

  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/model-llama--3.3--70b-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/db-postgresql-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/tts-piper-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/license-ISC-lightgrey?style=flat-square" />
</div>

---

## Overview

Pitaya is a fullstack AI chatbot with persistent memory, voice output, and two interfaces — a web client and a terminal CLI. It runs on [Groq](https://groq.com) (Llama 3.3 70b), stores conversation history in PostgreSQL, and speaks via [Piper TTS](https://github.com/rhasspy/piper).

---

## Features

- **Persistent memory** — conversations are stored in PostgreSQL and recalled across sessions
- **Multiple personas** — swap personalities via the database
- **Voice output** — local text-to-speech with Piper, zero API cost
- **Web client** — terminal-style chat interface in the browser
- **CLI** — full-featured terminal app with theme-aware colors
- **Conversation management** — `/title`, `/convos`, `/rm` across both interfaces

---

## Project Structure

```
pitaya/
├── client/               # Web interface
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── server/               # Express API
│   ├── index.js
│   ├── routes/
│   │   └── chat.js
│   ├── services/
│   │   ├── llama.js      # Groq API
│   │   ├── persona.js    # Persona queries
│   │   └── tts.js        # Piper TTS
│   ├── memory/
│   │   └── memory.js     # Conversation history
│   └── database/
│       ├── db.js         # PostgreSQL pool
│       └── seed.js       # Persona seed script
│
├── terminal/             # CLI app
│   ├── index.js
│   └── theme.js          # Omarchy theme reader
│
└── shared/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- [Piper TTS](https://github.com/rhasspy/piper) with `en_US-lessac-medium` model
- A [Groq](https://console.groq.com) API key

### Installation

```bash
git clone https://github.com/Georgelucas-dev/Pitaya.git
cd Pitaya
npm install
```

### Environment

Create a `.env` file at the root:

```env
LLAMA_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://postgres@localhost:5432/pitaya
PORT=3000
```

### Database setup

```bash
psql -U postgres -c "CREATE DATABASE pitaya;"
psql -U postgres -d pitaya -c "
  CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    system_prompt TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER REFERENCES personas(id),
    title VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
"
node server/database/seed.js
```

### Run

```bash
# Start the server
node server/index.js

# Open the web client
# Open client/index.html in your browser

# Or use the terminal CLI
pitaya
```

To install the CLI globally:

```bash
npm link --workspace=@pitaya/terminal
```

---

## Commands

Available in both the web client and terminal:

| Command | Description |
|---|---|
| `/help` | List all commands |
| `/convos` | List past conversations |
| `/title <name>` | Name the current conversation |
| `/rm` | Delete the current conversation |
| `/rm <id>` | Delete a specific conversation |
| `/clear` | Clear the screen (web only) |
| `/exit` | Exit the terminal (CLI only) |

---

## API

The server exposes a simple REST API:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/start` | Start a new conversation |
| `POST` | `/api/chat/:id` | Send a message |
| `GET` | `/api/chat/convos` | List all conversations |
| `PATCH` | `/api/chat/:id/title` | Rename a conversation |
| `DELETE` | `/api/chat/:id` | Delete a conversation |
| `GET` | `/health` | Server health check |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server | Express 5 |
| AI Model | Llama 3.3 70b via Groq |
| Database | PostgreSQL + `pg` |
| TTS | Piper (local) |
| Client | Vanilla JS |
| CLI | Node.js readline |

---

<div align="center">
  <sub>Built by <a href="https://github.com/Georgelucas-dev">George Lucas</a></sub>
</div>