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

        // Utility: Check if a given ISO timestamp occurred on the current local calendar date
        function isLocalToday(timestamp) {
            if (!timestamp) return false;
            const d = new Date(timestamp);
            if (isNaN(d.getTime())) return false;
            const now = new Date();
            return d.getFullYear() === now.getFullYear() &&
                   d.getMonth() === now.getMonth() &&
                   d.getDate() === now.getDate();
        }

        // S.H.I.E.L.D. Mission status: Synchronized directly with live ESP32 pomodoro_count & database
        function renderTacticalMissions() {
            // 1. Derive active module index directly from ESP32 hardware state
            const espModuleIndex = (typeof hardwareState !== 'undefined' && Number.isInteger(hardwareState.pomodoro_count)) 
                ? hardwareState.pomodoro_count 
                : 0;

            // Effective progress inside the active 4-module wave
            const effectiveWaveProgress = (typeof isEspConnected !== 'undefined' && isEspConnected)
                ? espModuleIndex
                : Math.max(tacticalDebriefState.currentWaveProgress || 0, espModuleIndex);

            // 2. Synchronize Deployment Wave Number (4/4 completed wave remains on current wave until next starts)
            const waveNumber = (effectiveWaveProgress === 4 && tacticalDebriefState.fullOperations > 0)
                ? tacticalDebriefState.fullOperations
                : (tacticalDebriefState.fullOperations + 1);
            tacticalDebriefState.currentWave = waveNumber;

            // 3. Update Header Badge (Strictly today's completed sessions from Supabase)
            const todayText = document.getElementById('today-sessions-text');
            if (todayText) todayText.innerText = `TODAY: ${tacticalDebriefState.totalSingleSessions} SESSIONS`;

            // 4. Update Inner Deployment Container Header
            const waveTitle = document.getElementById('deployment-wave-title');
            const waveObj = document.getElementById('wave-objective-counter');
            if (waveTitle) waveTitle.innerText = `DEPLOYMENT WAVE #${waveNumber} (4 SESSIONS)`;
            if (waveObj) waveObj.innerText = `OBJECTIVE: ${effectiveWaveProgress} / 4 DONE`;

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
            // Slot ID is 1-based: pomodoro_count 0 -> Slot 1 (Alpha), pomodoro_count 1 -> Slot 2 (Beta)
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
                            tacticalArchiveData.workLogs = data.filter(l => l.phase === 'WORK');
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
                    const allWorkLogs = allLogs.filter(l => l.phase === 'WORK');
                    
                    // 1. All-time wave calculations (independent of calendar day)
                    const fullOperations = Math.floor(allWorkLogs.length / 4);
                    const currentWaveProgress = allWorkLogs.length % 4;

                    // 2. Local Calendar Day calculations (Strictly sessions completed today in user's local timezone)
                    const todayWorkLogs = allWorkLogs.filter(l => isLocalToday(l.completed_at || l.created_at || l.timestamp));
                    const totalSingleSessions = todayWorkLogs.length;
                    const totalFocusMinutes = todayWorkLogs.reduce((acc, l) => acc + (l.duration_minutes || 25), 0);

                    tacticalDebriefState.totalSingleSessions = totalSingleSessions;
                    tacticalDebriefState.totalFocusMinutes = totalFocusMinutes;
                    tacticalDebriefState.fullOperations = fullOperations;
                    tacticalDebriefState.currentWaveProgress = currentWaveProgress;

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
                    const isWork = session.phase === 'WORK';
                    const dur = Number(session.duration_minutes) || (isWork ? 25 : 5);
                    const ts = session.completed_at || session.created_at || session.timestamp;
                    const isToday = isLocalToday(ts);

                    if (isWork) {
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

        function updateShieldClearance(totalMinutes) {
            const totalXP = totalMinutes * 10;
            const ranks = [
                { name: "LEVEL 1 RECRUIT", level: 1, minXP: 0, maxXP: 250 },
                { name: "RESERVE AVENGER", level: 2, minXP: 250, maxXP: 750 },
                { name: "SUPER SOLDIER", level: 3, minXP: 750, maxXP: 1500 },
                { name: "GOD OF THUNDER", level: 4, minXP: 1500, maxXP: 3000 },
                { name: "STARK MASTERMIND", level: 5, minXP: 3000, maxXP: 6000 }
            ];

            let currentRank = ranks[0];
            for (let r of ranks) {
                if (totalXP >= r.minXP) currentRank = r;
            }

            document.getElementById('xp-rank-title').innerText = currentRank.name;
            document.getElementById('xp-level-badge').innerText = `RANK ${currentRank.level}`;

            const xpInLevel = totalXP - currentRank.minXP;
            const xpSpan = currentRank.maxXP - currentRank.minXP;
            const xpPct = Math.min(100, Math.max(5, Math.round((xpInLevel / xpSpan) * 100)));

            document.getElementById('xp-fill-bar').style.width = `${xpPct}%`;
            document.getElementById('xp-counter-text').innerText = `${totalXP} / ${currentRank.maxXP} XP`;
        }

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
                const isWork = session.phase === 'WORK';
                const timeStr = session.completed_at ? new Date(session.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
                const iconName = isWork ? 'target' : 'coffee';
                const badgeBg = isWork ? 'bg-[#E11D48] text-white' : 'bg-[#06B6D4] text-black';
                const xpGain = isWork ? `+${(session.duration_minutes || 25) * 10} XP` : '+25 XP';

                return `
                    <div class="flex items-center justify-between p-2.5 bg-white border-2 border-black rounded-xl shadow-none">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center ${badgeBg} shadow-none">
                                <i data-lucide="${iconName}" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5">
                                    <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-black ${badgeBg}">
                                        ${session.phase}
                                    </span>
                                    <span class="text-xs font-bold text-zinc-800 font-comic tracking-wide">
                                        ${session.duration_minutes || 25} MINS
                                    </span>
                                </div>
                                <span class="text-[10px] font-mono text-zinc-500">${timeStr}</span>
                            </div>
                        </div>
                        <span class="font-mono text-xs font-bold text-emerald-600 bg-emerald-100 border border-black px-2 py-0.5 rounded shadow-none">
                            ${xpGain}
                        </span>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
        }

