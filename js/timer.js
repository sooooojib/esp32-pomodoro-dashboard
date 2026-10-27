        // =========================================================================
        // 4. INFINITY GAUNTLET 4-CYCLE ENGINE WITH VECTOR GEMS
        // =========================================================================
        const INFINITY_STONES = [
            { name: "POWER STONE", color: "#A855F7", glow: "rgba(168,85,247,0.8)" },
            { name: "SPACE STONE", color: "#3B82F6", glow: "rgba(59,130,246,0.8)" },
            { name: "REALITY STONE", color: "#EF4444", glow: "rgba(239,68,68,0.8)" },
            { name: "SOUL STONE", color: "#F97316", glow: "rgba(249,115,22,0.8)" }
        ];

        function renderInfinityGauntlet(count, phase) {
            const container = document.getElementById('infinity-slots');
            let html = "";
            for (let i = 0; i < 4; i++) {
                const stone = INFINITY_STONES[i];
                if (i < count) {
                    html += `
                        <div class="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-white shadow-none" style="background-color: ${stone.color};" title="${stone.name} Activated!">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 22 8.5 18 22 6 22 2 8.5"/>
                            </svg>
                        </div>
                    `;
                } else if (i === count && phase === 'WORK') {
                    html += `
                        <div class="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center animate-pulse" style="background-color: ${stone.color}40;" title="Acquiring ${stone.name}...">
                            <svg class="w-3 h-3 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polygon points="12 2 22 8.5 18 22 6 22 2 8.5"/>
                            </svg>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="w-5 h-5 rounded-full border border-black bg-zinc-300" title="Locked Stone"></div>
                    `;
                }
            }
            container.innerHTML = html;
        }

        // =========================================================================
        // 5. CORE REALTIME STATE & TIMER TICKER
        // =========================================================================
        let localSeconds = 1500;
        let totalSeconds = 1500;
        let currentPhase = 'WORK';
        let isRunning = false;
        let pomodoroCount = 0;
        let localTimerInterval = null;
        let isFirstLoad = true;

        const timerDisplay = document.getElementById("timer-display");
        const phaseTitle = document.getElementById("phase-title");
        const phaseIconBox = document.getElementById("phase-icon-box");
        const statusBadge = document.getElementById("status-badge");
        const progressBar = document.getElementById("progress-bar");
        const progressPercent = document.getElementById("progress-percent");
        const connDot = document.getElementById("conn-dot");
        const connLabel = document.getElementById("conn-label");
        const connPill = document.getElementById("conn-pill");
        const hudModeText = document.getElementById("hud-mode-text");
        const hardwareInstructionText = document.getElementById("hardware-instruction-text");

        function formatTime(secs) {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }

        function applyState(data) {
            const prevRunning = isRunning;
            const prevPhase = currentPhase;

            // 1. Remove Hardcoded Durations: Always use device_state.total_phase_seconds as the source of truth
            totalSeconds = (Number.isInteger(data.total_phase_seconds) && data.total_phase_seconds > 0)
                ? data.total_phase_seconds
                : (Number.isInteger(data.remaining_seconds) && data.remaining_seconds > 0 ? data.remaining_seconds : 1500);

            localSeconds = Number.isInteger(data.remaining_seconds) ? data.remaining_seconds : totalSeconds;
            currentPhase = data.phase || 'WORK';
            isRunning = !!data.is_running;
            pomodoroCount = data.pomodoro_count || 0;

            if (!isFirstLoad) {
                if (!prevRunning && isRunning) {
                    AudioEngine.repulsorZap();
                    showToast("HARDWARE TRIGGER: MISSION STARTED!", "start");
                } else if (prevRunning && !isRunning) {
                    AudioEngine.shieldClang();
                    showToast("HARDWARE TRIGGER: PAUSED", "pause");
                }

                if (prevPhase !== currentPhase) {
                    AudioEngine.fanfare();
                    triggerSuperpower(currentHeroKey);
                    showToast(`PHASE SHIFTED TO ${currentPhase}!`, "phase");
                    loadAnalytics();
                    loadTacticalStats();
                }
            }
            isFirstLoad = false;

            timerDisplay.innerText = formatTime(localSeconds);

            const isCustom = typeof isCustomPhase === 'function' && isCustomPhase(currentPhase);
            // Dynamic Phase Labels: Live configured duration in minutes matching OLED screen (Math.round(total_phase_seconds / 60))
            const phaseMins = Math.round(totalSeconds / 60) || Math.round(localSeconds / 60) || (currentPhase === 'SHORT_BREAK' ? 5 : currentPhase === 'LONG_BREAK' ? 15 : 25);

            if (isCustom) {
                if (phaseTitle) phaseTitle.innerText = `SPECIAL ${phaseMins}M`;
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#7C3AED] text-white border-2 border-black flex items-center justify-center shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="zap" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#7C3AED] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-[#7C3AED] font-mono font-bold";
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-purple-500 animate-ping inline-block"></span> <span>SPECIAL ${phaseMins}M • FOCUS SPRINT</span>`;
                hardwareInstructionText.innerText = "SPECIAL OPS IN PROGRESS! PRESS DESK BUTTON OR PAUSE ON HUD.";
            } else if (currentPhase === "WORK") {
                if (phaseTitle) phaseTitle.innerText = "COMBAT PROTOCOL";
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#EF4444] border-2 border-black flex items-center justify-center text-white shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="swords" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#E11D48] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-[#E11D48] font-mono font-bold";
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span> <span>COMBAT FOCUS SPRINT (${phaseMins} MINS)</span>`;
                hardwareInstructionText.innerText = isRunning ? "FOCUS IN PROGRESS! CLICK PAUSE OR SWITCH OPERATOR." : "CLICK START OR ASSEMBLE TO SIMULATE COMBAT PROTOCOL!";
            } else if (currentPhase === "SHORT_BREAK") {
                // OLED matching: "BREAK 10M", "BREAK 5M", etc.
                if (phaseTitle) phaseTitle.innerText = `BREAK ${phaseMins}M`;
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#06B6D4] border-2 border-black flex items-center justify-center text-black shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="battery-charging" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#06B6D4] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-[#06B6D4] font-mono font-bold";
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block"></span> <span>BREAK ${phaseMins}M • SERUM RECOVERY</span>`;
                hardwareInstructionText.innerText = `TAKE A BREATHER! ${phaseMins} MIN RECOVERY (±5M VIA HARDWARE RESET).`;
            } else {
                // OLED matching: "LONG BREAK 20M", "LONG BREAK 15M", etc.
                if (phaseTitle) phaseTitle.innerText = `LONG BREAK ${phaseMins}M`;
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#FACC15] border-2 border-black flex items-center justify-center text-black shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="award" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#FACC15] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-black font-mono font-bold";
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-400 animate-ping inline-block"></span> <span>LONG BREAK ${phaseMins}M • SHAWARMA PARTY</span>`;
                hardwareInstructionText.innerText = `INFINITY CYCLE ACHIEVED! ${phaseMins} MIN REST (±5M VIA HARDWARE RESET).`;
            }

            if (isRunning) {
                statusBadge.innerText = "MISSION ACTIVE";
                statusBadge.className = "hud-badge bg-emerald-400 text-black";
            } else {
                statusBadge.innerText = "STANDBY PAUSED";
                statusBadge.className = "hud-badge bg-[#FACC15] text-black";
            }

            renderInfinityGauntlet(pomodoroCount, currentPhase);
            updateProgress();
            renderHero(currentPhase, isRunning);

            if (typeof hardwareState !== 'undefined') {
                hardwareState.is_running = isRunning;
                hardwareState.phase = currentPhase;
                hardwareState.pomodoro_count = pomodoroCount;
                hardwareState.total_phase_seconds = totalSeconds;
                hardwareState.remaining_seconds = localSeconds;
            }

            if (typeof renderTacticalMissions === 'function') {
                renderTacticalMissions();
            }

            // 2. Smooth Live Resync on +5M / -5M Jumps:
            // When an update arrives while is_running is true, sync local remaining_seconds and total_phase_seconds
            // without resetting or pausing the local 1-second countdown interval.
            if (isRunning) {
                if (!localTimerInterval) {
                    startLocalTicker();
                }
            } else {
                if (localTimerInterval) {
                    clearInterval(localTimerInterval);
                    localTimerInterval = null;
                }
            }

            if (window.lucide) lucide.createIcons();
        }

        // 3. Guard Progress Math: Calculate progress strictly as:
        // Math.min(1, Math.max(0, (total_phase_seconds - remaining_seconds) / total_phase_seconds))
        function updateProgress() {
            const safeTotal = (Number.isInteger(totalSeconds) && totalSeconds > 0) ? totalSeconds : 1500;
            const progressRatio = Math.min(1, Math.max(0, (safeTotal - localSeconds) / safeTotal));
            const pct = Math.round(progressRatio * 100);
            progressBar.style.width = `${pct}%`;
            progressPercent.innerText = `${pct}%`;
        }

        function startLocalTicker() {
            if (localTimerInterval) clearInterval(localTimerInterval);

            if (isRunning) {
                localTimerInterval = setInterval(() => {
                    if (localSeconds > 0) {
                        localSeconds--;
                        timerDisplay.innerText = formatTime(localSeconds);
                        updateProgress();

                        if (localSeconds <= 5 && localSeconds > 0) {
                            if (AudioEngine.countdownTick) {
                                AudioEngine.countdownTick(localSeconds === 1);
                            }
                        }
                    } else {
                        clearInterval(localTimerInterval);
                        localTimerInterval = null;
                        AudioEngine.fanfare();
                        triggerSuperpower(currentHeroKey);
                        const finishedMins = Math.round(totalSeconds / 60);
                        if (typeof isCustomPhase === 'function' && isCustomPhase(currentPhase)) {
                            const earnedXp = finishedMins * 10;
                            showToast(`SPECIAL OPS COMPLETE: +${earnedXp} XP! (${finishedMins}M)`, "done");
                        } else if (currentPhase === 'WORK') {
                            const earnedXp = finishedMins * 10;
                            showToast(`MISSION COMPLETE: +${earnedXp} XP!`, "done");
                        } else {
                            showToast(`RECHARGE COMPLETE: ${finishedMins}M REST LOGGED!`, "done");
                        }
                        loadAnalytics();
                        loadTacticalStats();
                        if (typeof updateTacticalDebrief === 'function') {
                            updateTacticalDebrief();
                        }
                    }
                }, 1000);
            }
        }

