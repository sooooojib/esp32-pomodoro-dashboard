        // =========================================================================
        // 7. S.H.I.E.L.D. ANALYTICS & GAMIFICATION (TACTICAL DEBRIEF & MISSION LOGS)
        // =========================================================================
        let hardwareState = {
            phase: 'WORK',
            is_running: false,
            pomodoro_count: 0
        };

        let tacticalDebriefState = {
            totalSingleSessions: 0,
            fullOperations: 0,
            currentWaveProgress: 0,
            currentWave: 1,
            totalFocusMinutes: 0
        };

        const MISSION_SLOTS = [
            { id: 1, name: "MISSION ALPHA" },
            { id: 2, name: "MISSION BETA" },
            { id: 3, name: "MISSION GAMMA" },
            { id: 4, name: "MISSION DELTA" }
        ];

        // Utility: Check if a given ISO timestamp occurred on the current calendar date in Asia/Dhaka (UTC+6)
        function isLocalToday(timestamp) {
            if (!timestamp) return false;
            return typeof isDhakaToday === 'function' ? isDhakaToday(timestamp) : false;
        }

        // S.H.I.E.L.D. Mission status: Synchronized directly with live ESP32 pomodoro_count & database
        function renderTacticalMissions() {
            const isCustom = (typeof hardwareState !== 'undefined' && typeof isCustomPhase === 'function' && isCustomPhase(hardwareState.phase));
            const isCustomRunning = (typeof hardwareState !== 'undefined' && hardwareState.is_running && isCustom);

            // 1. Derive active module index directly from ESP32 hardware state
            // If in custom session phase, standard 25m wave progress is preserved and does not jump
            const espModuleIndex = (typeof hardwareState !== 'undefined' && Number.isInteger(hardwareState.pomodoro_count) && !isCustom) 
                ? hardwareState.pomodoro_count 
                : (tacticalDebriefState.currentWaveProgress || 0);

            // Effective progress inside the active 4-module wave
            const effectiveWaveProgress = (typeof isEspConnected !== 'undefined' && isEspConnected && !isCustom)
                ? espModuleIndex
                : Math.max(tacticalDebriefState.currentWaveProgress || 0, (isCustom ? 0 : espModuleIndex));

            // 2. Synchronize Deployment Wave Number (4/4 completed wave remains on current wave until next starts)
            const waveNumber = (effectiveWaveProgress === 4 && tacticalDebriefState.fullOperations > 0)
                ? tacticalDebriefState.fullOperations
                : (tacticalDebriefState.fullOperations + 1);
            tacticalDebriefState.currentWave = waveNumber;

            // 3. Update Header Badge (Strictly today's completed sessions from Supabase including custom sessions)
            const todayText = document.getElementById('today-sessions-text');
            if (todayText) todayText.innerText = `TODAY: ${tacticalDebriefState.totalSingleSessions} SESSIONS`;

            // 4. Update Inner Deployment Container Header
            const waveTitle = document.getElementById('deployment-wave-title');
            const waveObj = document.getElementById('wave-objective-counter');
            if (waveTitle) {
                if (isCustomRunning) {
                    waveTitle.innerHTML = `<span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span> SPECIAL OPS IN PROGRESS // WAVE #${waveNumber}</span>`;
                } else {
                    waveTitle.innerText = `DEPLOYMENT WAVE #${waveNumber} (4 SESSIONS)`;
                }
            }
            if (waveObj) {
                if (isCustomRunning) {
                    waveObj.innerHTML = `<span class="bg-[#7C3AED] text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-black shadow-[1px_1px_0px_#000]">SPECIAL SPRINT</span>`;
                } else {
                    waveObj.innerText = `OBJECTIVE: ${effectiveWaveProgress} / 4 DONE`;
                }
            }

            // 5. Update Bottom Metrics
            const focusMinsText = document.getElementById('total-focus-mins-text');
            const protocolsText = document.getElementById('full-protocols-text');
            if (focusMinsText) focusMinsText.innerText = `${tacticalDebriefState.totalFocusMinutes} MINS`;
            if (protocolsText) protocolsText.innerText = `${tacticalDebriefState.fullOperations}x [4/4]`;

            // 6. Update 2x2 Grid of Mission Cards
            const grid = document.getElementById('daily-milestones-grid');
            if (!grid) return;

            const isWorkRunning = hardwareState.is_running && hardwareState.phase === 'WORK';
            const isWorkPaused = !hardwareState.is_running && hardwareState.phase === 'WORK';
            // Slot ID is 1-based: pomodoro_count 0 -> Slot 1 (Alpha), strictly tied to regular WORK
            const activeSlotId = isWorkRunning ? (espModuleIndex + 1) : null;
            const pausedSlotId = isWorkPaused ? (espModuleIndex + 1) : null;

            grid.innerHTML = MISSION_SLOTS.map(m => {
                // If this is the active slot running currently
                const isActive = isWorkRunning && (m.id === activeSlotId);
                // If a slot is accomplished in this wave
                const isAccomplished = !isActive && (m.id <= effectiveWaveProgress);

                if (isActive) {
                    return `
                        <div class="mission-card w-full bg-amber-50 text-black border-[3px] border-black rounded-xl px-3 py-2.5 font-mono flex items-center justify-between ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9),2px_2px_0px_#000] animate-pulse select-none cursor-default">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span class="w-6 h-6 rounded-lg border-2 border-black bg-amber-400 text-black flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-[1px_1px_0px_#000]">${m.id}</span>
                                <span class="text-xs sm:text-[13px] font-mono font-bold tracking-wider uppercase whitespace-nowrap text-black">${m.name}</span>
                            </div>
                            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 border border-black animate-ping shrink-0 mr-1" title="Hardware Mission Running"></span>
                        </div>
                    `;
                } else if (isAccomplished) {
                    return `
                        <div class="mission-card w-full bg-[#10B981] text-black border-[3px] border-black rounded-xl px-3 py-2.5 font-mono flex items-center justify-between shadow-[2px_2px_0px_#000] select-none cursor-default">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span class="w-6 h-6 rounded-lg border-2 border-black bg-black text-[#10B981] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]">
                                    <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>
                                </span>
                                <span class="text-xs sm:text-[13px] font-mono font-bold tracking-wider uppercase line-through opacity-80 whitespace-nowrap text-black">${m.name}</span>
                            </div>
                            <span class="font-mono font-black text-[9px] sm:text-[10px] tracking-wider uppercase bg-[#FACC15] text-black border-2 border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000] rotate-[-2deg] shrink-0 whitespace-nowrap inline-flex items-center gap-1 ml-1.5">
                                <span>ACCOMPLISHED</span>
                                <i data-lucide="check" class="w-2.5 h-2.5 stroke-[3]"></i>
                            </span>
                        </div>
                    `;
                } else if (pausedSlotId && m.id === pausedSlotId) {
                    return `
                        <div class="mission-card w-full bg-amber-50/70 text-black border-[3px] border-black rounded-xl px-3 py-2.5 font-mono flex items-center justify-between shadow-[2px_2px_0px_#000] select-none cursor-default">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span class="w-6 h-6 rounded-lg border-2 border-black bg-amber-300 text-black flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-[1px_1px_0px_#000]">${m.id}</span>
                                <span class="text-xs sm:text-[13px] font-mono font-bold tracking-wider uppercase whitespace-nowrap text-black">${m.name}</span>
                            </div>
                            <span class="font-mono font-bold text-[9px] sm:text-[10px] tracking-wider uppercase bg-amber-300 text-black border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000] shrink-0 ml-1.5 whitespace-nowrap">PAUSED</span>
                        </div>
                    `;
                } else {
                    return `
                        <div class="mission-card w-full bg-white text-black border-[3px] border-black rounded-xl px-3 py-2.5 font-mono flex items-center justify-between shadow-[2px_2px_0px_#000] select-none cursor-default">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span class="w-6 h-6 rounded-lg border-2 border-black bg-zinc-100 text-black flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-[1px_1px_0px_#000]">${m.id}</span>
                                <span class="text-xs sm:text-[13px] font-mono font-bold tracking-wider uppercase whitespace-nowrap text-black">${m.name}</span>
                            </div>
                            <span class="text-[10px] font-mono text-zinc-500 font-bold tracking-wider shrink-0 ml-1.5 whitespace-nowrap">STANDBY</span>
                        </div>
                    `;
                }
            }).join('');

            if (window.lucide) lucide.createIcons();
        }

        async function updateTacticalDebrief() {
            try {
                let allLogs = null;
                if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                    const { data, error } = await supabaseClient
                        .from('session_logs')
                        .select('*')
                        .order('completed_at', { ascending: false });

                    if (!error && data && data.length > 0) {
                        allLogs = data;
                        if (typeof tacticalArchiveData !== 'undefined') {
                            tacticalArchiveData.allLogs = data;
                            tacticalArchiveData.workLogs = data.filter(l => l.phase === 'WORK' || (typeof isCustomPhase === 'function' && isCustomPhase(l.phase)));
                        }
                    }
                }

                // If Supabase has no logs or query failed, fallback to tacticalArchiveData or showcase logs
                if (!allLogs || allLogs.length === 0) {
                    if (typeof tacticalArchiveData !== 'undefined' && tacticalArchiveData.allLogs && tacticalArchiveData.allLogs.length > 0) {
                        allLogs = tacticalArchiveData.allLogs;
                    }
                }

                if (allLogs && allLogs.length > 0) {
                    // Filter logs by completed_at occurring today in Asia/Dhaka (UTC+6):
                    const logs = allLogs.filter(l => isLocalToday(l.completed_at || l.created_at || l.timestamp));
                    const todayLogs = logs.filter(l => l.phase === 'WORK' || (typeof isCustomPhase === 'function' && isCustomPhase(l.phase)));

                    const workLogs = logs.filter(l => l.phase === 'WORK');
                    const customLogs = logs.filter(l => typeof isCustomPhase === 'function' && isCustomPhase(l.phase));

                    // Wave slots strictly tied to regular Pomodoros:
                    const totalStandardWork = workLogs.length;
                    const fullOperations = Math.floor(totalStandardWork / 4);
                    const currentWaveProgress = totalStandardWork % 4;
                    const currentWave = fullOperations + 1;

                    // 1. Sum Actual duration_minutes directly from each row rather than multiplying by fixed numbers
                    const totalFocusMinutes = todayLogs.reduce((acc, l) => acc + (Number(l.duration_minutes) || 0), 0);

                    const totalSingleSessions = todayLogs.length;

                    tacticalDebriefState.totalSingleSessions = totalSingleSessions;
                    tacticalDebriefState.totalFocusMinutes = totalFocusMinutes;
                    tacticalDebriefState.fullOperations = fullOperations;
                    tacticalDebriefState.currentWaveProgress = currentWaveProgress;
                    tacticalDebriefState.currentWave = currentWave;

                    renderTacticalMissions();
                    return;
                }
            } catch (err) {
                console.warn("updateTacticalDebrief query error:", err);
            }
            renderTacticalMissions();
        }

        async function loadAnalytics() {
            try {
                let logs = null;
                if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                    const { data, error } = await supabaseClient
                        .from('session_logs')
                        .select('*')
                        .order('completed_at', { ascending: false });
                    if (!error && data && data.length > 0) {
                        logs = data;
                    }
                }

                if (!logs || logs.length === 0) {
                    if (typeof tacticalArchiveData !== 'undefined' && tacticalArchiveData.allLogs && tacticalArchiveData.allLogs.length > 0) {
                        logs = tacticalArchiveData.allLogs;
                    }
                }

                if (!logs || logs.length === 0) {
                    logs = [
                        { phase: 'WORK', duration_minutes: 25, completed_at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
                        { phase: 'SHORT_BREAK', duration_minutes: 5, completed_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
                        { phase: 'WORK', duration_minutes: 25, completed_at: new Date(Date.now() - 70 * 60 * 1000).toISOString() },
                        { phase: 'WORK', duration_minutes: 25, completed_at: new Date(Date.now() - 100 * 60 * 1000).toISOString() }
                    ];
                }

                let allTimeFocusMinutes = 0;
                let todayWorkCount = 0;
                let todayBreakCount = 0;
                let todayFocusMinutes = 0;

                logs.forEach(session => {
                    const isFocus = session.phase === 'WORK' || (typeof isCustomPhase === 'function' && isCustomPhase(session.phase));
                    const dur = Number(session.duration_minutes) || (isFocus ? 25 : (session.phase === 'LONG_BREAK' ? 15 : 5));
                    const ts = session.completed_at || session.created_at || session.timestamp;
                    const isToday = isLocalToday(ts);

                    if (isFocus) {
                        allTimeFocusMinutes += dur;
                        if (isToday) {
                            todayWorkCount++;
                            todayFocusMinutes += dur;
                        }
                    } else {
                        if (isToday) {
                            todayBreakCount++;
                        }
                    }
                });

                const focusHoursEl = document.getElementById('stat-focus-hours');
                const smashedEl = document.getElementById('stat-smashed');
                const breakCountEl = document.getElementById('stat-break-count');

                // Strictly update HUD stat cards with today's values only
                if (focusHoursEl) focusHoursEl.innerText = (todayFocusMinutes / 60).toFixed(1);
                if (smashedEl) smashedEl.innerText = todayWorkCount;
                if (breakCountEl) breakCountEl.innerText = todayBreakCount;

                updateShieldClearance(allTimeFocusMinutes);
                renderMissionDebriefs(logs.slice(0, 8));
                await updateTacticalDebrief();

            } catch (err) {
                console.warn("Analytics load error:", err);
            }
        }

        const SHIELD_RANKS = [
            // Tier 1: Field Recruitment (0 - 3,200 XP | 0 - 5.3 hrs)
            { level: 1,  name: "S.H.I.E.L.D. CADET",            minXP: 0,       maxXP: 500,     tier: "Recruit",         hours: "0.8h" },
            { level: 2,  name: "FIELD INITIATE",               minXP: 500,     maxXP: 1200,    tier: "Recruit",         hours: "2.0h" },
            { level: 3,  name: "COMMUNICATIONS SPECIALIST",    minXP: 1200,    maxXP: 2100,    tier: "Recruit",         hours: "3.5h" },
            { level: 4,  name: "LEVEL 4 CLEARANCE AGENT",      minXP: 2100,    maxXP: 3200,    tier: "Field Agent",     hours: "5.3h" },

            // Tier 2: Special Operations (3,200 - 11,200 XP | ~5.3 - 18.6 hrs)
            { level: 5,  name: "TACTICAL STRIKE OPERATIVE",    minXP: 3200,    maxXP: 4600,    tier: "Field Agent",     hours: "7.6h" },
            { level: 6,  name: "SHADOW INFILTRATOR",           minXP: 4600,    maxXP: 6400,    tier: "Field Agent",     hours: "10.6h" },
            { level: 7,  name: "BLACK OPS RECON",              minXP: 6400,    maxXP: 8600,    tier: "Special Ops",     hours: "14.3h" },
            { level: 8,  name: "WAKANDAN WAR DOG",             minXP: 8600,    maxXP: 11200,   tier: "Special Ops",     hours: "18.6h" },

            // Tier 3: Avengers Protocol (11,200 - 36,500 XP | ~18.6 - 60.8 hrs)
            { level: 9,  name: "RESERVE AVENGER",              minXP: 11200,   maxXP: 14500,   tier: "Avenger Initiate", hours: "24.1h" },
            { level: 10, name: "VIBRANIUM SENTINEL",           minXP: 14500,   maxXP: 18500,   tier: "Avenger",         hours: "30.8h" },
            { level: 11, name: "SUPER SOLDIER",                minXP: 18500,   maxXP: 23500,   tier: "Avenger",         hours: "39.1h" },
            { level: 12, name: "QUANTUM REALM EXPLORER",       minXP: 23500,   maxXP: 29500,   tier: "Avenger",         hours: "49.1h" },
            { level: 13, name: "ARC REACTOR PIONEER",          minXP: 29500,   maxXP: 36500,   tier: "Avenger Elite",   hours: "60.8h" },

            // Tier 4: Earth's Mightiest (36,500 - 97,000 XP | ~60.8 - 161.6 hrs)
            { level: 14, name: "ASGARDIAN BATTLE TESTED",      minXP: 36500,   maxXP: 45000,   tier: "Earth's Mightiest", hours: "75h" },
            { level: 15, name: "TITAN BREAKER",                minXP: 45000,   maxXP: 55000,   tier: "Earth's Mightiest", hours: "91h" },
            { level: 16, name: "GAMMA RADIATED GOLIATH",       minXP: 55000,   maxXP: 67000,   tier: "Earth's Mightiest", hours: "111h" },
            { level: 17, name: "GOD OF THUNDER",               minXP: 67000,   maxXP: 81000,   tier: "Earth's Mightiest", hours: "135h" },
            { level: 18, name: "NANOTECH WARRIOR",             minXP: 81000,   maxXP: 97000,   tier: "Stark Vanguard",  hours: "161h" },

            // Tier 5: Mastermind & Mystic Arts (97,000 - 195,000 XP | ~161.6 - 325 hrs)
            { level: 19, name: "STARK MASTERMIND",             minXP: 97000,   maxXP: 116000,  tier: "Stark Vanguard",  hours: "193h" },
            { level: 20, name: "MYSTIC ARTS ADEPT",            minXP: 116000,  maxXP: 138000,  tier: "Master Mystic",   hours: "230h" },
            { level: 21, name: "SORCERER SUPREME",             minXP: 138000,  maxXP: 164000,  tier: "Master Mystic",   hours: "273h" },
            { level: 22, name: "EYE OF AGAMOTTO KEEPER",       minXP: 164000,  maxXP: 195000,  tier: "Cosmic Sentinel", hours: "325h" },

            // Tier 6: Cosmic Guardians (195,000 - 390,000 XP | ~325 - 650 hrs)
            { level: 23, name: "NOVA CORPS CENTURION",         minXP: 195000,  maxXP: 232000,  tier: "Cosmic Guardian", hours: "386h" },
            { level: 24, name: "COSMIC DEFENDER",              minXP: 232000,  maxXP: 276000,  tier: "Cosmic Guardian", hours: "460h" },
            { level: 25, name: "CELESTIAL HARBINGER",          minXP: 276000,  maxXP: 328000,  tier: "Cosmic Guardian", hours: "546h" },
            { level: 26, name: "PHOENIX FORCE AVATAR",         minXP: 328000,  maxXP: 390000,  tier: "Cosmic Entity",   hours: "650h" },

            // Tier 7: Omniversal & Multiverse Legends (390,000 - 1,000,000+ XP | 650 - 1,600+ hrs)
            { level: 27, name: "MULTIVERSE GUARDIAN",          minXP: 390000,  maxXP: 465000,  tier: "Omniversal",      hours: "775h" },
            { level: 28, name: "INFINITY GAUNTLET BEARER",     minXP: 465000,  maxXP: 555000,  tier: "Omniversal",      hours: "925h" },
            { level: 29, name: "LIVING TRIBUNAL ARBITER",      minXP: 555000,  maxXP: 700000,  tier: "Omniversal",      hours: "1166h" },
            { level: 30, name: "THE ONE ABOVE ALL",            minXP: 700000,  maxXP: null,    tier: "Supreme Deity",   hours: "1166h+" }
        ];

        window.SHIELD_RANKS = SHIELD_RANKS;

        function updateShieldClearance(totalMinutes) {
            const totalXP = Math.max(0, Math.round(totalMinutes * 10));
            window.latestTotalXP = totalXP;

            let currentRank = SHIELD_RANKS[0];
            let currentRankIndex = 0;

            for (let i = 0; i < SHIELD_RANKS.length; i++) {
                if (totalXP >= SHIELD_RANKS[i].minXP) {
                    currentRank = SHIELD_RANKS[i];
                    currentRankIndex = i;
                }
            }

            const nextRank = SHIELD_RANKS[currentRankIndex + 1] || null;

            const titleEl = document.getElementById('xp-rank-title');
            const badgeEl = document.getElementById('xp-level-badge');
            const counterEl = document.getElementById('xp-counter-text');
            const fillBarEl = document.getElementById('xp-fill-bar');
            const nextRankEl = document.getElementById('xp-next-rank-text');

            if (titleEl) titleEl.innerText = currentRank.name;
            if (badgeEl) {
                badgeEl.innerText = `RANK ${currentRank.level}`;
                if (currentRank.level >= 27) {
                    badgeEl.className = "hud-badge bg-gradient-to-r from-purple-700 to-indigo-800 text-[#FACC15] border-2 border-black";
                } else if (currentRank.level >= 19) {
                    badgeEl.className = "hud-badge bg-gradient-to-r from-amber-500 to-rose-600 text-black border-2 border-black";
                } else if (currentRank.level >= 9) {
                    badgeEl.className = "hud-badge bg-[#06B6D4] text-black border-2 border-black";
                } else {
                    badgeEl.className = "hud-badge bg-black text-[#FACC15] border-2 border-black";
                }
            }

            let xpPct = 100;
            if (currentRank.maxXP) {
                const xpInLevel = totalXP - currentRank.minXP;
                const xpSpan = currentRank.maxXP - currentRank.minXP;
                xpPct = Math.min(100, Math.max(5, Math.round((xpInLevel / xpSpan) * 100)));
                if (counterEl) counterEl.innerText = `${totalXP} / ${currentRank.maxXP} XP`;
            } else {
                xpPct = 100;
                if (counterEl) counterEl.innerText = `${totalXP} XP (MAX)`;
            }

            if (fillBarEl) fillBarEl.style.width = `${xpPct}%`;

            if (nextRankEl) {
                if (nextRank) {
                    nextRankEl.innerText = `NEXT: ${nextRank.name}`;
                } else {
                    nextRankEl.innerText = `STATUS: MAXIMUM CLEARANCE`;
                }
            }

            updateDossierContent(totalXP, currentRank);
        }

        function updateDossierContent(totalXP, currentRank) {
            const currentRankTag = document.getElementById('dossier-current-rank');
            const totalXPTag = document.getElementById('dossier-total-xp');
            const listEl = document.getElementById('dossier-ranks-list');
            if (!listEl) return;

            if (currentRankTag && currentRank) {
                currentRankTag.innerText = `RANK ${currentRank.level}: ${currentRank.name}`;
            }
            if (totalXPTag) {
                totalXPTag.innerText = `${totalXP.toLocaleString()} XP`;
            }

            listEl.innerHTML = SHIELD_RANKS.map(r => {
                const isCleared = totalXP >= (r.maxXP || Infinity) || r.level < currentRank.level;
                const isCurrent = r.level === currentRank.level;

                let rowBg = "bg-white hover:bg-slate-50 border border-slate-200";
                let statusBadge = "";

                if (isCurrent) {
                    rowBg = "bg-[#FEF3C7] border-2 border-black shadow-[3px_3px_0px_#000]";
                    statusBadge = `<span class="hud-badge bg-black text-[#FACC15] text-[10px] py-0.5 px-2 flex items-center gap-1"><i data-lucide="zap" class="w-3 h-3 text-[#FACC15]"></i> CURRENT</span>`;
                } else if (isCleared) {
                    statusBadge = `<span class="hud-badge bg-emerald-500 text-black text-[10px] py-0.5 px-2 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> CLEARED</span>`;
                } else {
                    const needed = r.minXP - totalXP;
                    statusBadge = `<span class="hud-badge bg-slate-200 text-slate-700 text-[10px] py-0.5 px-2 flex items-center gap-1"><i data-lucide="lock" class="w-3 h-3"></i> +${needed.toLocaleString()} XP</span>`;
                }

                return `
                    <div class="p-3 rounded-lg flex items-center justify-between gap-3 ${rowBg} transition-all">
                        <div class="flex items-center gap-3 min-w-0">
                            <span class="font-mono font-black text-xs px-2 py-1 rounded border border-black ${isCurrent ? 'bg-black text-[#FACC15]' : (isCleared ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600')}">
                                ${r.level < 10 ? '0' + r.level : r.level}
                            </span>
                            <div class="truncate">
                                <div class="font-comic font-bold text-sm text-black leading-tight truncate flex items-center gap-2">
                                    <span>${r.name}</span>
                                    <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300 uppercase">${r.tier}</span>
                                </div>
                                <div class="text-[11px] font-mono text-slate-500 font-medium">
                                    ${r.minXP.toLocaleString()} XP ${r.maxXP ? `– ${r.maxXP.toLocaleString()} XP` : '+'} <span class="text-slate-400">(${r.hours})</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex-shrink-0">
                            ${statusBadge}
                        </div>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
        }

        function openShieldDossier() {
            const modal = document.getElementById('shield-dossier-modal');
            if (!modal) return;
            if (typeof AudioEngine !== 'undefined' && AudioEngine.repulsorZap) {
                AudioEngine.repulsorZap();
            }
            modal.classList.remove('hidden');
            const totalXP = window.latestTotalXP || 0;
            let currentRank = SHIELD_RANKS[0];
            for (let r of SHIELD_RANKS) {
                if (totalXP >= r.minXP) currentRank = r;
            }
            updateDossierContent(totalXP, currentRank);

            setTimeout(() => {
                const activeEl = modal.querySelector('.bg-\\[\\#FEF3C7\\]');
                if (activeEl) {
                    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 80);
        }

        function closeShieldDossier() {
            const modal = document.getElementById('shield-dossier-modal');
            if (!modal) return;
            modal.classList.add('hidden');
        }

        function initShieldDossierListeners() {
            const btnView = document.getElementById('btn-view-ranks');
            const clearanceCard = document.getElementById('clearance-card');
            const btnClose = document.getElementById('btn-close-dossier');
            const modal = document.getElementById('shield-dossier-modal');

            if (btnView) {
                btnView.onclick = (e) => {
                    e.stopPropagation();
                    openShieldDossier();
                };
            }
            if (clearanceCard) {
                clearanceCard.onclick = () => {
                    openShieldDossier();
                };
            }
            if (btnClose) {
                btnClose.onclick = (e) => {
                    e.stopPropagation();
                    closeShieldDossier();
                };
            }
            if (modal) {
                modal.onclick = (e) => {
                    if (e.target === modal) closeShieldDossier();
                };
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                    closeShieldDossier();
                }
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initShieldDossierListeners);
        } else {
            initShieldDossierListeners();
        }

        window.openShieldDossier = openShieldDossier;
        window.closeShieldDossier = closeShieldDossier;

        function renderMissionDebriefs(logs) {
            const list = document.getElementById('session-log-list');
            const countTag = document.getElementById('log-count-tag');
            if (!list) return;

            if (countTag) countTag.innerText = `${logs.length} RECORDED`;

            if (logs.length === 0) {
                list.innerHTML = `
                    <div class="text-center text-zinc-600 text-xs font-medium font-body flex flex-col items-center gap-1.5 py-3">
                        <i data-lucide="zap" class="w-5 h-5 text-[#FACC15]"></i>
                        <span>Push the physical button on your ESP32-S3 to complete your first session!</span>
                    </div>
                `;
                if (window.lucide) lucide.createIcons();
                return;
            }

            list.innerHTML = logs.map(session => {
                const isCustom = typeof isCustomPhase === 'function' && isCustomPhase(session.phase);
                const isWork = session.phase === 'WORK';
                const isLong = session.phase === 'LONG_BREAK';
                const timeStr = session.completed_at
                    ? new Date(session.completed_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })
                    : 'Recent';
                const dur = Number(session.duration_minutes) || (isWork || isCustom ? 25 : (isLong ? 15 : 5));

                let iconName = 'coffee';
                let badgeBg = 'bg-[#06B6D4] text-black';
                let xpGain = `+${dur * 5} XP`;
                let phaseLabel = session.phase === 'SHORT_BREAK' ? 'BREAK' : session.phase;

                if (isCustom) {
                    iconName = 'zap';
                    badgeBg = 'bg-[#7C3AED] text-white';
                    xpGain = `+${dur * 10} XP`;
                    phaseLabel = 'SPECIAL OPS';
                } else if (isWork) {
                    iconName = 'swords';
                    badgeBg = 'bg-[#E11D48] text-white';
                    xpGain = `+${dur * 10} XP`;
                    phaseLabel = 'COMBAT';
                } else if (isLong) {
                    iconName = 'award';
                    badgeBg = 'bg-[#FACC15] text-black';
                    xpGain = `+${dur * 5} XP`;
                    phaseLabel = 'LONG BREAK';
                }

                return `
                    <div class="flex items-center justify-between p-2.5 bg-white border-2 border-black rounded-xl shadow-none">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center ${badgeBg} shadow-none">
                                <i data-lucide="${iconName}" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5">
                                    <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-black ${badgeBg}">
                                        ${phaseLabel}
                                    </span>
                                    <span class="text-xs font-bold text-zinc-800 font-comic tracking-wide">
                                        ${dur} MINS
                                    </span>
                                </div>
                                <span class="text-[10px] font-mono text-zinc-500">${timeStr}</span>
                            </div>
                        </div>
                        <span class="font-mono text-xs font-bold ${isCustom ? 'text-purple-700 bg-purple-100' : isWork ? 'text-emerald-700 bg-emerald-100' : 'text-cyan-700 bg-cyan-100'} border border-black px-2 py-0.5 rounded shadow-none">
                            ${xpGain}
                        </span>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
        }

