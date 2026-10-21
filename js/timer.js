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

            localSeconds = Number.isInteger(data.remaining_seconds) ? data.remaining_seconds : 1500;
            totalSeconds = (Number.isInteger(data.total_phase_seconds) && data.total_phase_seconds > 0)
                ? data.total_phase_seconds
                : ((typeof isCustomPhase === 'function' && isCustomPhase(data.phase)) && Number.isInteger(data.remaining_seconds) && data.remaining_seconds > 0 ? data.remaining_seconds : 1500);
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

            if (isCustom) {
                if (phaseTitle) phaseTitle.innerText = "SPECIAL OPS PROTOCOL";
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#7C3AED] text-white border-2 border-black flex items-center justify-center shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="zap" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#7C3AED] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-[#7C3AED] font-mono font-bold";
                const sprintMins = Math.round(totalSeconds / 60) || Math.round(localSeconds / 60) || 25;
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-purple-500 animate-ping inline-block"></span> <span>CUSTOM FOCUS SPRINT (${sprintMins} MINS)</span>`;
                hardwareInstructionText.innerText = "SPECIAL OPS IN PROGRESS! PRESS DESK BUTTON OR PAUSE ON HUD.";
            } else if (currentPhase === "WORK") {
                if (phaseTitle) phaseTitle.innerText = "COMBAT PROTOCOL";
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#EF4444] border-2 border-black flex items-center justify-center text-white shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="swords" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#E11D48] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-[#E11D48] font-mono font-bold";
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span> <span>COMBAT FOCUS SPRINT</span>`;
                hardwareInstructionText.innerText = isRunning ? "FOCUS IN PROGRESS! CLICK PAUSE OR SWITCH OPERATOR." : "CLICK START OR ASSEMBLE TO SIMULATE COMBAT PROTOCOL!";
            } else if (currentPhase === "SHORT_BREAK") {
                if (phaseTitle) phaseTitle.innerText = "TACTICAL RECHARGE";
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#06B6D4] border-2 border-black flex items-center justify-center text-black shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="battery-charging" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#06B6D4] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-[#06B6D4] font-mono font-bold";
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block"></span> <span>5 MIN SERUM RECOVERY</span>`;
                hardwareInstructionText.innerText = "TAKE A BREATHER! DRINK WATER OR STRETCH. 5 MIN RECOVERY.";
            } else {
                if (phaseTitle) phaseTitle.innerText = "SHAWARMA LONG BREAK";
                if (phaseIconBox) {
                    phaseIconBox.className = "w-[36px] h-[36px] min-w-[36px] min-h-[36px] rounded-lg bg-[#FACC15] border-2 border-black flex items-center justify-center text-black shadow-none";
                    phaseIconBox.innerHTML = `<i data-lucide="award" class="w-5 h-5"></i>`;
                }
                progressBar.className = "h-full bg-[#FACC15] rounded-full transition-all duration-500 ease-out";
                progressPercent.className = "text-black font-mono font-bold";
                hudModeText.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-400 animate-ping inline-block"></span> <span>SHAWARMA PARTY (EXTENDED REST)</span>`;
                hardwareInstructionText.innerText = "INFINITY CYCLE ACHIEVED! ENJOY EXTENDED REST BEFORE ASSEMBLING AGAIN.";
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
            }
            if (typeof renderTacticalMissions === 'function') {
                renderTacticalMissions();
            }
            startLocalTicker();

            if (window.lucide) lucide.createIcons();
        }

        function updateProgress() {
            const safeTotal = (totalSeconds && totalSeconds > 0) ? totalSeconds : (localSeconds > 0 ? localSeconds : 1500);
            const elapsed = Math.max(0, safeTotal - localSeconds);
            const pct = Math.min(100, Math.round((elapsed / safeTotal) * 100)) || 0;
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
                        AudioEngine.fanfare();
                        triggerSuperpower(currentHeroKey);
                        if (typeof isCustomPhase === 'function' && isCustomPhase(currentPhase)) {
                            const earnedXp = Math.round((totalSeconds || 1500) / 60) * 10;
                            showToast(`SPECIAL OPS COMPLETE: +${earnedXp} XP!`, "done");
                        } else {
                            showToast("MISSION COMPLETE!", "done");
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

