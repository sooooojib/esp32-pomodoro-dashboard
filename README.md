# ⚡ AVENGERS FOCUS HUD • ESP32-S3 Physical Companion

A playful, comic pop-art **Avengers-themed** web dashboard companion built for a physical ESP32-S3 IoT Pomodoro Timer. Synced in real-time with physical hardware via Supabase.

![Hardware](https://img.shields.io/badge/Hardware-ESP32--S3-E62429?style=for-the-badge&logo=espressif&logoColor=white)
![Supabase Realtime](https://img.shields.io/badge/Database-Supabase%20Realtime-00F0FF?style=for-the-badge&logo=supabase&logoColor=black)
![Aesthetic](https://img.shields.io/badge/Theme-Avengers%20%7C%20Marvel%20Comic%20HUD-FFD700?style=for-the-badge&logo=marvel&logoColor=black)

---

## ✨ Features

- **🕹️ Pure Hardware Mirror (Zero Web Distraction)**:
  - Web play/pause controls have been intentionally removed! The physical button on your desk ESP32-S3 is the sole commander.
  - The website acts as a high-tech **S.H.I.E.L.D. Tactical HUD** that responds in real-time to physical button presses.

- **🦸‍♂️ "Assemble Your Operator" — 5 Playable Avengers**:
  - 🦾 **Iron Man (Tony Stark)**: Repulsor beam charge, HUD targeting, high-tech snarky quotes, and repulsor SFX.
  - 🛡️ **Captain America (Steve Rogers)**: Vibranium star shield, military discipline, motivational quotes, and shield ricochet SFX.
  - ⚡ **Thor (Odinson)**: Winged helmet, crackling Mjolnir lightning bolts, Asgardian thunder quotes, and thunder boom SFX.
  - 🕷️ **Spider-Man (Peter Parker)**: Web-slinging, spider-sense tingles, friendly quips, and web-zip SFX.
  - 🟢 **Hulk (Bruce Banner)**: Gamma green power meter, roaring battle cries, and seismic smash SFX.

- **💎 Infinity Gauntlet 4-Cycle Tracker**:
  - Each completed Pomodoro lights up an Infinity Stone:
    1. 🟣 **Power Stone**
    2. 🔵 **Space Stone**
    3. 🔴 **Reality Stone**
    4. 🟠 **Soul Stone**
  - Completing all 4 unlocks the **Shawarma Long Break** with a gold confetti fanfare!

- **🛡️ S.H.I.E.L.D. Clearance & Gamification (30 Ranked Tiers)**:
  - Earn +10 XP per focus minute with an exponential difficulty curve across 30 classified clearance ranks:
    - *Tier 1 (Recruitment)*: Rank 1 S.H.I.E.L.D. Cadet to Rank 4 Level 4 Clearance Agent
    - *Tier 2 (Special Ops)*: Rank 5 Tactical Strike Operative to Rank 8 Wakandan War Dog
    - *Tier 3 (Avengers Protocol)*: Rank 9 Reserve Avenger to Rank 13 Arc Reactor Pioneer
    - *Tier 4 (Earth's Mightiest)*: Rank 14 Asgardian Battle Tested to Rank 18 Nanotech Warrior
    - *Tier 5 (Mastermind & Mystics)*: Rank 19 Stark Mastermind to Rank 22 Eye of Agamotto Keeper
    - *Tier 6 (Cosmic Guardians)*: Rank 23 Nova Corps Centurion to Rank 26 Phoenix Force Avatar
    - *Tier 7 (Omniversal Legends)*: Rank 27 Multiverse Guardian to Rank 30 The One Above All
  - **Classified Dossier Modal**: Click the "30 RANKS" button or the Clearance Card to inspect your active standing, cleared badges, and XP distance to apex ranks.
  - **Metrics**: Threats Smashed (Work sessions), Arc Reactor Output (Hours), Serum Recovery (Break time).

- **🔊 100% Self-Contained Web Audio API SFX**:
  - Authentic 8-bit sound effects for repulsors, shield clangs, thunder, and web-zips. No external mp3 files required!
  - Audio toggle with persistent mute state in `localStorage`.

---

## 🗄️ Database Schema (Supabase)

- **`device_state` (Row `id = 1`)**:
  - Columns: `phase` ('WORK', 'SHORT_BREAK', 'LONG_BREAK', 'SPECIAL'), `is_running` (boolean), `remaining_seconds` (int), `total_phase_seconds` (int), `pomodoro_count` (int, 0–4), `updated_at`.
- **`session_logs`**:
  - Columns: `id`, `phase` ('WORK', 'SHORT_BREAK', 'LONG_BREAK', 'SPECIAL'), `duration_minutes` (int), `completed_at` (ISO timestamp).

---

## 🚀 Quick Start

Open `index.html` in your web browser or run:
```bash
python3 -m http.server 8080
```
Visit `http://localhost:8080/index.html`.

---

## ⚡ Supabase Keep-Alive (Free Tier Inactivity Prevention)

Supabase Free Tier projects pause automatically after 7 days without queries. A GitHub Action workflow ([keep-alive.yml](.github/workflows/keep-alive.yml)) runs every 3 days via cron to query `device_state`, keeping your database active 24/7 without manual intervention.

To trigger it manually anytime:
1. Navigate to **Actions** in your GitHub repository.
2. Select **Keep Supabase Active**.
3. Click **Run workflow**.
