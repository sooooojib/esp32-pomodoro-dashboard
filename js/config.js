        // =========================================================================
        // 1. SUPABASE CLIENT & VIEW NAVIGATION
        // =========================================================================
        const SUPABASE_URL = "https://ykncypzibxorhaatyqah.supabase.co";
        const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbmN5cHppYnhvcmhhYXR5cWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxOTE4MDgsImV4cCI6MjEwNzc2NzgwOH0.cVWlzZOw5et55NiYcp3n1g6ophDvmp-GgCHyo9Vf5sI";

        let supabaseClient = null;
        try {
            if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_KEY) {
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            }
        } catch (err) {
            console.warn("Supabase client init:", err);
        }

        let currentActiveView = 'live-hud';

        const TARGET_TIMEZONE = 'Asia/Dhaka';

        function isCustomPhase(phase) {
            return phase === 'SPECIAL' || phase === 'CUSTOM';
        }

        // Convert UTC/ISO timestamp or Date object to 'YYYY-MM-DD' in Asia/Dhaka (UTC+6)
        function getDhakaDateKey(timestamp) {
            if (!timestamp) return null;
            const d = new Date(timestamp);
            if (isNaN(d.getTime())) return null;
            try {
                return d.toLocaleDateString('en-CA', { timeZone: TARGET_TIMEZONE });
            } catch (e) {
                // Fallback: manually apply +6h offset if browser lacks timeZone support
                const offsetMs = 6 * 60 * 60 * 1000;
                const dhakaDate = new Date(d.getTime() + offsetMs);
                return dhakaDate.toISOString().slice(0, 10);
            }
        }

        // Get 0-23 hour in Asia/Dhaka (UTC+6)
        function getDhakaHour(timestamp) {
            if (!timestamp) return 0;
            const d = new Date(timestamp);
            if (isNaN(d.getTime())) return 0;
            try {
                const str = d.toLocaleString('en-US', { timeZone: TARGET_TIMEZONE, hour: 'numeric', hourCycle: 'h23' });
                const h = parseInt(str, 10);
                return isNaN(h) ? 0 : (h % 24);
            } catch (e) {
                const offsetMs = 6 * 60 * 60 * 1000;
                const dhakaDate = new Date(d.getTime() + offsetMs);
                return dhakaDate.getUTCHours();
            }
        }

        // Check if an ISO timestamp belongs to "today" in Asia/Dhaka (UTC+6)
        function isDhakaToday(timestamp) {
            const key = getDhakaDateKey(timestamp);
            if (!key) return false;
            const todayKey = getDhakaDateKey(new Date());
            return key === todayKey;
        }

        function switchView(viewName) {
            currentActiveView = viewName;
            if (typeof AudioEngine !== 'undefined') {
                if (AudioEngine.uiTick) AudioEngine.uiTick();
            }

            const liveHudView = document.getElementById('live-hud-view');
            const statsView = document.getElementById('stats-view');
            const tabLive = document.getElementById('tab-live-hud');
            const tabStats = document.getElementById('tab-stats');

            if (viewName === 'live-hud') {
                if (liveHudView) liveHudView.classList.remove('hidden');
                if (statsView) statsView.classList.add('hidden');

                if (tabLive) {
                    tabLive.className = "neo-btn px-5 py-2.5 font-comic tracking-wide text-lg border-2 border-black bg-[#FACC15] text-black shadow-neo flex items-center gap-2 cursor-pointer transition-all";
                }
                if (tabStats) {
                    tabStats.className = "neo-btn px-5 py-2.5 font-comic tracking-wide text-lg border-2 border-black bg-white text-zinc-600 hover:bg-zinc-100 shadow-neo flex items-center gap-2 cursor-pointer transition-all";
                }
            } else {
                if (liveHudView) liveHudView.classList.add('hidden');
                if (statsView) statsView.classList.remove('hidden');

                if (tabLive) {
                    tabLive.className = "neo-btn px-5 py-2.5 font-comic tracking-wide text-lg border-2 border-black bg-white text-zinc-600 hover:bg-zinc-100 shadow-neo flex items-center gap-2 cursor-pointer transition-all";
                }
                if (tabStats) {
                    tabStats.className = "neo-btn px-5 py-2.5 font-comic tracking-wide text-lg border-2 border-black bg-[#FACC15] text-black shadow-neo flex items-center gap-2 cursor-pointer transition-all";
                }

                loadTacticalStats();
            }

            if (window.lucide) lucide.createIcons();
        }

