# 🍅 PomoBoy 3000 • ESP32-S3 IoT Pomodoro Companion

A playful, character-rich Neo-Brutalist web dashboard built for a physical ESP32-S3 IoT Pomodoro Timer. Synced in real-time with physical hardware via Supabase.

![PomoBoy 3000 Preview](https://img.shields.io/badge/Hardware-ESP32--S3-FF4343?style=for-the-badge&logo=espressif&logoColor=white)
![Supabase Realtime](https://img.shields.io/badge/Database-Supabase%20Realtime-00F0A8?style=for-the-badge&logo=supabase&logoColor=black)
![Styling](https://img.shields.io/badge/Aesthetic-Neo--Brutalist%20Arcade-FFE144?style=for-the-badge&logo=retroarch&logoColor=black)

---

## ✨ Features

- **🕹️ Anti-AI / Neo-Brutalist Arcade Aesthetic**:
  - Chunky tactile buttons (`active:translate` 3D press effects).
  - High-energy pop color palette (Tomato Red `#FF4343`, Sun Yellow `#FFE144`, Mint Green `#00F0A8`, Bubblegum Cyan `#38E1FF`).
  - Google Fonts: **Fredoka** (playful headers), **Space Grotesk** (brutalist body), and **VT323 / Silkscreen** (8-bit arcade telemetry).

- **🍅 Reactive Mascot — "Tommy the Pomodoro"**:
  - **Work Mode**: Focused face, karate headband, anime focus eyes, and steam puffs rising from his stem.
  - **Break Mode**: Pixel sunglasses, chill smile, rosy cheeks, and sipping a juice box.
  - **Paused Mode**: Tilted head with a bouncing `?` question mark bubble.
  - **Pokeable**: Click/tap Tommy to trigger a bounce animation, 8-bit squeak, and random motivational speech lines.

- **📡 Realtime Physical Hardware Sync**:
  - Seamless two-way synchronization with ESP32-S3 via Supabase Realtime WebSocket (`device_state`, row `id = 1`).
  - Smooth local JavaScript 1-second countdown ticker when running to eliminate lag and reduce database reads.
  - Instant re-sync whenever hardware buttons are pressed on the ESP32.
  - Tactile on-screen web remote buttons (`START / PAUSE`, `SKIP PHASE`, `RESET`, `CELEBRATE`).

- **🏆 Gamification & Analytics**:
  - **XP & Rank Progression**: Earn +10 XP per completed focus minute to rank up from *Sprout Cadet* to *Salsa Sovereign*.
  - **Session Breakdown**: Focus vs. Rest ratio bar and daily statistics (*Tomatoes Smashed*, *Zone Time Hours*, *Chill Breaks*).
  - **Harvest Ledger**: Real-time log of completed sessions fetched from `session_logs`.

- **🔊 Web Audio API Synthesizer (Zero External MP3s)**:
  - 100% self-contained 8-bit sound effects (clicks, timer ticks, power-ups, fanfare).
  - Header audio toggle (`SFX ON` / `SFX MUTED`) saved in `localStorage`.
  - Confetti party explosion powered by `canvas-confetti`.

---

## 🗄️ Database Architecture (Supabase)

### 1. `device_state` (Live Sync Row)
Tracks the real-time state of the physical timer:
- `id`: `1`
- `phase`: `'WORK'` | `'SHORT_BREAK'` | `'LONG_BREAK'`
- `is_running`: boolean
- `remaining_seconds`: integer (e.g. `1500`, `300`, `900`)
- `total_phase_seconds`: integer
- `pomodoro_count`: integer (`0` to `4`)
- `updated_at`: timestamp

### 2. `session_logs` (Historical Log)
Records completed focus and break intervals:
- `id`: integer / uuid
- `phase`: `'WORK'` | `'SHORT_BREAK'` | `'LONG_BREAK'`
- `duration_minutes`: integer
- `completed_at`: timestamp

---

## 🚀 Quick Start / Local Testing

Because this dashboard is fully self-contained in `index.html` with CDN dependencies (Tailwind, Supabase JS, Canvas Confetti, Google Fonts), you can run it immediately without complex build steps:

```bash
# Option 1: Python simple server
python3 -m http.server 8080

# Option 2: Node.js npx serve
npx serve .

# Option 3: Simply open index.html in any modern web browser!
open index.html
```

---

## 🌐 Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings** > **Pages** in your GitHub repository.
3. Under **Branch**, select `main` and folder `/ (root)`.
4. Click **Save**. Your PomoBoy 3000 dashboard will be live on the web!
