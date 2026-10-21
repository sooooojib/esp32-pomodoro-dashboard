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

        function isCustomPhase(phase) {
            return phase === 'SPECIAL' || phase === 'CUSTOM';
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

