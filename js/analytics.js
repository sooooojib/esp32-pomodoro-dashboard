        // =========================================================================
        // 7B. TACTICAL STATS & ARCHIVES DATA ENGINE
        // =========================================================================
        const MARVEL_ICONS = {
            arcReactor: `<svg class="w-3.5 h-3.5 inline-block align-middle shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10.5" fill="#E62429" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="12" r="7.5" fill="#FFD700" stroke="#000" stroke-width="1"/><circle cx="12" cy="12" r="4.8" fill="#00F0FF" stroke="#000" stroke-width="1"/><polygon points="12,8 15.5,14 8.5,14" fill="#FFFFFF" stroke="#000" stroke-width="0.7"/><circle cx="12" cy="12" r="1.5" fill="#00F0FF"/></svg>`,
            shield: `<svg class="w-3.5 h-3.5 inline-block align-middle shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10.5" fill="#E62429" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="12" r="8" fill="#FFFFFF" stroke="#000" stroke-width="1"/><circle cx="12" cy="12" r="5.5" fill="#E62429" stroke="#000" stroke-width="1"/><circle cx="12" cy="12" r="3.2" fill="#0D47A1" stroke="#000" stroke-width="0.8"/><polygon points="12,9.2 12.8,11 14.8,11 13.2,12.2 13.8,14 12,12.8 10.2,14 10.8,12.2 9.2,11 11.2,11" fill="#FFFFFF" stroke="#000" stroke-width="0.5"/></svg>`,
            mjolnir: `<svg class="w-3.5 h-3.5 inline-block align-middle shrink-0" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="8" rx="2" fill="#94A3B8" stroke="#000" stroke-width="1.5"/><rect x="7" y="7" width="10" height="4" fill="#CBD5E1"/><line x1="12" y1="13" x2="12" y2="21" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/><line x1="9" y1="21" x2="15" y2="21" stroke="#000" stroke-width="2" stroke-linecap="round"/><polygon points="19,3 15.5,7.5 18.5,8 14.5,13" fill="#00F0FF" stroke="#000" stroke-width="0.8"/></svg>`,
            spidey: `<svg class="w-3.5 h-3.5 inline-block align-middle shrink-0" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="9.5" ry="10.5" fill="#EF4444" stroke="#000" stroke-width="1.5"/><line x1="12" y1="1.5" x2="12" y2="22.5" stroke="#000" stroke-width="1"/><line x1="2.5" y1="12" x2="21.5" y2="12" stroke="#000" stroke-width="1"/><ellipse cx="12" cy="12" rx="5.5" ry="6.5" fill="none" stroke="#000" stroke-width="1"/><path d="M5.5 8.5 Q10 8 11 11.5 Q8 12 5.5 8.5 Z" fill="#FFFFFF" stroke="#000" stroke-width="1.2"/><path d="M18.5 8.5 Q14 8 13 11.5 Q16 12 18.5 8.5 Z" fill="#FFFFFF" stroke="#000" stroke-width="1.2"/></svg>`,
            avengersA: `<svg class="w-3.5 h-3.5 inline-block align-middle shrink-0 text-black" viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="44" fill="none" stroke="#000" stroke-width="8"/><path d="M50 16 L28 84 L42 84 L48 65 L68 65 L68 53 L49 53 L50 38 L65 84 L79 84 L65 38 L82 38 L82 26 L63 26 Z" fill="currentColor"/><polygon points="60,49 76,49 84,42 76,35 60,35" fill="currentColor"/></svg>`,
            flame: `<svg class="w-3.5 h-3.5 inline-block align-middle shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 2C9 7 7 9 7 13a5 5 0 0010 0c0-4-3-6-5-11z" fill="#E11D48" stroke="#000" stroke-width="1.5"/><path d="M12 8c-1.5 2.5-2.5 3.5-2.5 5.5a2.5 2.5 0 005 0c0-2-1.5-3-2.5-5.5z" fill="#FACC15" stroke="#000" stroke-width="0.8"/></svg>`
        };

        const tacticalArchiveData = {
            allLogs: [],
            workLogs: [],
            volumeRangeDays: 7,
            currentFilter: 'ALL',
            currentPage: 1,
            pageSize: 10
        };

        // Realistic 60-day historical logs generator (showcase / initial state fallback)
        function generateShowcaseHistoricalLogs() {
            const logs = [];
            const now = Date.now();

            for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
                const dayDate = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
                const dayOfWeek = dayDate.getDay();

                let workSessionsCount;
                if (dayOffset <= 7) {
                    // Active current streak: 2 to 5 sessions every day in the last 7 days
                    workSessionsCount = ((dayOffset * 3) % 4) + 2;
                } else if (dayOfWeek === 0) {
                    workSessionsCount = (dayOffset % 3 === 0) ? 1 : 0;
                } else if (dayOffset % 5 === 0) {
                    workSessionsCount = 0;
                } else {
                    workSessionsCount = (dayOffset % 4) + 1;
                }

                for (let s = 0; s < workSessionsCount; s++) {
                    const hour = 9 + ((s * 3 + dayOffset) % 12);
                    const minute = (s * 17) % 60;
                    const sessionTime = new Date(dayDate);
                    sessionTime.setHours(hour, minute, 0, 0);

                    logs.push({
                        id: `log-${dayOffset}-${s}-w`,
                        phase: 'WORK',
                        duration_minutes: 25,
                        completed_at: sessionTime.toISOString()
                    });

                    const breakTime = new Date(sessionTime.getTime() + 25 * 60 * 1000);
                    logs.push({
                        id: `log-${dayOffset}-${s}-b`,
                        phase: (s === 3) ? 'LONG_BREAK' : 'SHORT_BREAK',
                        duration_minutes: (s === 3) ? 15 : 5,
                        completed_at: breakTime.toISOString()
                    });
                }
            }

            logs.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
            return logs;
        }

        async function loadTacticalStats() {
            let allLogs = [];
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('session_logs')
                        .select('*')
                        .order('completed_at', { ascending: false });
                    if (!error && data && data.length > 0) {
                        allLogs = data;
                    }
                } catch (err) {
                    console.warn("Supabase fetch allLogs error:", err);
                }
            }

            if (!allLogs || allLogs.length === 0) {
                allLogs = generateShowcaseHistoricalLogs();
            }

            tacticalArchiveData.allLogs = allLogs;
            tacticalArchiveData.workLogs = allLogs.filter(l => l.phase === 'WORK');

            renderTacticalKPIs(tacticalArchiveData.allLogs, tacticalArchiveData.workLogs);
            renderHeatmap(tacticalArchiveData.workLogs);
            renderVolumeChart();
            renderPeakHours();
            renderArchiveTable();

            if (window.lucide) lucide.createIcons();
        }

        function renderTacticalKPIs(allLogs, workLogs) {
            // 1. Total Combat Output
            const totalWorkMinutes = workLogs.reduce((acc, l) => acc + (l.duration_minutes || 25), 0);
            const totalHours = (totalWorkMinutes / 60).toFixed(1);
            const elHours = document.getElementById('stat-alltime-hours');
            const elSessions = document.getElementById('stat-alltime-sessions-count');
            if (elHours) elHours.innerText = totalHours;
            if (elSessions) elSessions.innerText = `${workLogs.length} OPS`;

            // 2. Protocols Mastered
            const protocolsMastered = Math.floor(workLogs.length / 4);
            const waveProgress = workLogs.length % 4;
            const elProtocols = document.getElementById('stat-protocols-mastered');
            const elGauge = document.getElementById('stat-protocols-gauge');
            if (elProtocols) elProtocols.innerText = protocolsMastered;
            if (elGauge) elGauge.innerText = `${waveProgress}/4 IN WAVE`;

            // 3. Operational Streak & Daily Average
            const activeDateSet = new Set();
            workLogs.forEach(l => {
                if (l.completed_at) {
                    const dateKey = new Date(l.completed_at).toLocaleDateString('en-CA');
                    activeDateSet.add(dateKey);
                }
            });

            const sortedDates = Array.from(activeDateSet).sort();
            const activeDaysCount = sortedDates.length;
            const dailyAvg = activeDaysCount > 0 ? Math.round(totalWorkMinutes / activeDaysCount) : 0;
            const elDailyAvg = document.getElementById('stat-daily-avg');
            const elActiveDays = document.getElementById('stat-active-days-total');
            if (elDailyAvg) elDailyAvg.innerText = dailyAvg;
            if (elActiveDays) elActiveDays.innerText = `${activeDaysCount} DAYS`;

            // Consecutive streaks calculation
            let currentStreak = 0;
            let maxStreak = 0;
            let tempStreak = 0;
            if (sortedDates.length > 0) {
                tempStreak = 1;
                maxStreak = 1;
                for (let i = 1; i < sortedDates.length; i++) {
                    const prev = new Date(sortedDates[i - 1]);
                    const curr = new Date(sortedDates[i]);
                    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        tempStreak++;
                    } else if (diffDays > 1) {
                        tempStreak = 1;
                    }
                    if (tempStreak > maxStreak) maxStreak = tempStreak;
                }

                const todayStr = new Date().toLocaleDateString('en-CA');
                const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
                if (activeDateSet.has(todayStr) || activeDateSet.has(yesterdayStr)) {
                    currentStreak = 0;
                    let checkDate = activeDateSet.has(todayStr) ? new Date() : new Date(Date.now() - 86400000);
                    while (true) {
                        const k = checkDate.toLocaleDateString('en-CA');
                        if (activeDateSet.has(k)) {
                            currentStreak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                }
            }
            if (currentStreak > maxStreak) maxStreak = currentStreak;

            const elStreak = document.getElementById('stat-current-streak');
            const elStreakDetail = document.getElementById('stat-streak-detail');
            const elHeatmapStreak = document.getElementById('heatmap-streak-badge-text');
            if (elStreak) elStreak.innerText = currentStreak;
            if (elStreakDetail) {
                elStreakDetail.innerHTML = `
                    <svg class="w-3.5 h-3.5 inline-block shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 2C9 7 7 9 7 13a5 5 0 0010 0c0-4-3-6-5-11z" fill="#E11D48" stroke="#000" stroke-width="1.5"/><path d="M12 8c-1.5 2.5-2.5 3.5-2.5 5.5a2.5 2.5 0 005 0c0-2-1.5-3-2.5-5.5z" fill="#FACC15" stroke="#000" stroke-width="0.8"/></svg>
                    <span>${currentStreak} DAYS ACTIVE | RECORD: ${maxStreak} DAYS</span>
                `;
            }
            if (elHeatmapStreak) elHeatmapStreak.innerText = `${currentStreak}-DAY STREAK`;
        }

        function renderHeatmap(workLogs) {
            const grid = document.getElementById('heatmap-grid');
            if (!grid) return;

            const dateMap = {};
            workLogs.forEach(l => {
                if (l.completed_at) {
                    const key = new Date(l.completed_at).toLocaleDateString('en-CA');
                    if (!dateMap[key]) dateMap[key] = { count: 0, mins: 0 };
                    dateMap[key].count++;
                    dateMap[key].mins += (l.duration_minutes || 25);
                }
            });

            const dayList = [];
            const today = new Date();
            for (let i = 59; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dayList.push(d);
            }

            let activeDaysCount = 0;

            const columns = [];
            let col = [];
            const startDayOfWeek = dayList[0].getDay();
            for (let p = 0; p < startDayOfWeek; p++) {
                col.push(null);
            }
            dayList.forEach(d => {
                col.push(d);
                if (col.length === 7) {
                    columns.push(col);
                    col = [];
                }
            });
            if (col.length > 0) {
                while (col.length < 7) col.push(null);
                columns.push(col);
            }

            grid.innerHTML = columns.map(weekCol => {
                const cellsHtml = weekCol.map(d => {
                    if (!d) {
                        return `<div class="w-6 h-6 sm:w-7 sm:h-7 opacity-0"></div>`;
                    }
                    const key = d.toLocaleDateString('en-CA');
                    const entry = dateMap[key] || { count: 0, mins: 0 };
                    const c = entry.count;
                    if (c > 0) activeDaysCount++;

                    let bgClass = "bg-white border-2 border-black/30 hover:border-black hover:bg-amber-50/60 shadow-none";
                    let innerContent = '<span class="text-zinc-400 group-hover:text-black font-mono font-bold text-[9px] select-none">·</span>';

                    if (c === 1) {
                        bgClass = "bg-[#FEF08A] border-2 border-black text-black shadow-[2px_2px_0px_#000]";
                        innerContent = '';
                    } else if (c === 2) {
                        bgClass = "bg-[#FACC15] border-2 border-black text-black shadow-[2px_2px_0px_#000]";
                        innerContent = '';
                    } else if (c === 3) {
                        bgClass = "bg-[#FB923C] border-2 border-black text-black shadow-[2px_2px_0px_#000]";
                        innerContent = '';
                    } else if (c >= 4) {
                        bgClass = "bg-[#E11D48] text-white border-2 border-black shadow-[2px_2px_0px_#000] ring-1 ring-black";
                        innerContent = `<svg class="w-3 h-3 drop-shadow flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#FFD700" stroke="#000" stroke-width="1.8"/><circle cx="12" cy="12" r="5" fill="#00F0FF" stroke="#000" stroke-width="1"/><polygon points="12,7 16,14 8,14" fill="#FFFFFF" stroke="#000" stroke-width="0.8"/></svg>`;
                    }

                    const dateTitle = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return `
                        <div class="heatmap-tile w-6 h-6 sm:w-7 sm:h-7 rounded-md transition-all hover:scale-125 hover:z-20 cursor-pointer flex items-center justify-center select-none group relative ${bgClass}"
                             data-date="${key}" data-count="${c}" data-mins="${entry.mins}"
                             onmouseenter="inspectHeatmapTile(this)" onclick="inspectHeatmapTile(this)"
                             title="${dateTitle} • ${c} sessions (${entry.mins} mins)">
                            ${innerContent}
                        </div>
                    `;
                }).join('');

                return `<div class="flex flex-col gap-1.5 sm:gap-2">${cellsHtml}</div>`;
            }).join('');

            const rateText = document.getElementById('heatmap-rate-text');
            if (rateText) {
                const pct = Math.round((activeDaysCount / 60) * 100);
                rateText.innerText = `CONSISTENCY: ${pct}% ACTIVE (${activeDaysCount}/60 DAYS)`;
            }

            const reconCoverage = document.getElementById('recon-coverage-text');
            if (reconCoverage) {
                const pct = Math.round((activeDaysCount / 60) * 100);
                reconCoverage.innerText = `${pct}% ACTIVE`;
            }

            const reconStrike = document.getElementById('recon-strike-record');
            if (reconStrike) {
                reconStrike.innerText = `${activeDaysCount} DAYS HIT`;
            }

            // Auto-inspect latest active tile (or today) so Recon panel has immediate live telemetry
            setTimeout(() => {
                const activeTiles = grid.querySelectorAll('.heatmap-tile[data-count]:not([data-count="0"])');
                const lastTile = activeTiles.length > 0 ? activeTiles[activeTiles.length - 1] : grid.querySelector('.heatmap-tile:last-child');
                if (lastTile) {
                    inspectHeatmapTile(lastTile);
                }
            }, 50);
        }

        function inspectHeatmapTile(tile) {
            if (!tile) return;
            const dateStr = tile.getAttribute('data-date');
            const count = parseInt(tile.getAttribute('data-count') || '0', 10);
            const mins = parseInt(tile.getAttribute('data-mins') || '0', 10);

            const d = new Date(dateStr + 'T12:00:00');
            const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

            // 1. Bottom inspect bar (Clean operational readout, no redundant badge)
            const inspectText = document.getElementById('heatmap-inspect-text');
            if (inspectText) {
                if (count === 0) {
                    inspectText.innerHTML = `
                        <i data-lucide="crosshair" class="w-4 h-4 text-zinc-500"></i>
                        <span class="text-zinc-700">${formattedDate} • 0 SESSIONS (0 MINS)</span>
                    `;
                } else {
                    const protocols = Math.floor(count / 4);
                    const protocolNote = protocols > 0 ? ` • ${protocols} PROTOCOL${protocols > 1 ? 'S' : ''} FINISHED` : '';
                    inspectText.innerHTML = `
                        <i data-lucide="crosshair" class="w-4 h-4 text-[#E11D48]"></i>
                        <span class="text-black font-mono font-bold">${formattedDate} • ${count} SESSIONS FINISHED (${mins} MINS)${protocolNote}</span>
                    `;
                }
            }

            // 2. Right Recon Telemetry Panel (Fourth Image: Protocols & Sessions Finished)
            const reconDayTag = document.getElementById('recon-day-tag');
            const reconDateTitle = document.getElementById('recon-date-title');
            const reconOutputDesc = document.getElementById('recon-output-desc');
            const reconProtocols = document.getElementById('recon-protocols-count');
            const reconSessions = document.getElementById('recon-sessions-count');

            if (reconDayTag) reconDayTag.innerText = `${dayName} // RECON`;
            if (reconDateTitle) reconDateTitle.innerText = formattedDate;
            if (reconOutputDesc) {
                reconOutputDesc.innerText = count === 0
                    ? '0 SESSIONS COMPLETED • 0 MINS LOGGED'
                    : `${mins} FOCUS MINUTES LOGGED`;
            }

            const protocolsFinished = Math.floor(count / 4);
            const sessionsFinished = count;
            if (reconProtocols) reconProtocols.innerText = protocolsFinished;
            if (reconSessions) reconSessions.innerText = sessionsFinished;

            if (window.lucide) lucide.createIcons();
        }

        function setVolumeRange(days) {
            tacticalArchiveData.volumeRangeDays = days;
            const btn7 = document.getElementById('btn-vol-7d');
            const btn30 = document.getElementById('btn-vol-30d');
            if (days === 7) {
                if (btn7) {
                    btn7.className = "px-3 py-1 text-xs font-mono font-bold rounded border border-black bg-[#FACC15] text-black shadow-[1px_1px_0px_#000] cursor-pointer";
                }
                if (btn30) {
                    btn30.className = "px-3 py-1 text-xs font-mono font-bold rounded border border-transparent bg-transparent text-zinc-600 hover:text-black cursor-pointer";
                }
            } else {
                if (btn7) {
                    btn7.className = "px-3 py-1 text-xs font-mono font-bold rounded border border-transparent bg-transparent text-zinc-600 hover:text-black cursor-pointer";
                }
                if (btn30) {
                    btn30.className = "px-3 py-1 text-xs font-mono font-bold rounded border border-black bg-[#FACC15] text-black shadow-[1px_1px_0px_#000] cursor-pointer";
                }
            }
            renderVolumeChart();
            renderPeakHours();
        }

        function inspectVolumeBar(dateKey, mins, count) {
            const calloutText = document.getElementById('volume-inspect-text');
            const calloutBadge = document.getElementById('volume-inspect-badge');
            if (!calloutText) return;

            const d = new Date(dateKey + 'T12:00:00');
            const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

            if (mins === 0) {
                calloutText.innerText = `${formatted} • 0 MINS LOGGED (0 SESSIONS)`;
                if (calloutBadge) {
                    calloutBadge.className = "text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold";
                    calloutBadge.innerText = "NO SESSIONS";
                }
            } else {
                const protocols = Math.floor(count / 4);
                const protocolText = protocols > 0 ? ` • ${protocols} PROTOCOL${protocols > 1 ? 'S' : ''} FINISHED` : '';
                calloutText.innerText = `${formatted} • ${mins} MINS (${count} SESSIONS COMPLETED)${protocolText}`;
                if (calloutBadge) {
                    if (mins >= 100) {
                        calloutBadge.className = "text-[10px] bg-[#E11D48] text-white px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold shadow-[1px_1px_0px_#000]";
                        calloutBadge.innerText = "HIGH FOCUS";
                    } else if (mins >= 50) {
                        calloutBadge.className = "text-[10px] bg-[#FACC15] text-black px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold shadow-[1px_1px_0px_#000]";
                        calloutBadge.innerText = "COMBAT ACTIVE";
                    } else {
                        calloutBadge.className = "text-[10px] bg-[#FEF08A] text-black px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold";
                        calloutBadge.innerText = "SPRINT MET";
                    }
                }
            }
        }

        function resetVolumeInspect() {
            const calloutText = document.getElementById('volume-inspect-text');
            const calloutBadge = document.getElementById('volume-inspect-badge');
            if (calloutText) calloutText.innerText = 'HOVER BARS TO INSPECT COMBAT SESSION BREAKDOWN';
            if (calloutBadge) {
                calloutBadge.className = "text-[10px] bg-black text-[#FACC15] px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold";
                calloutBadge.innerText = "CADENCE";
            }
        }

        function renderVolumeChart() {
            const container = document.getElementById('volume-chart-container');
            const rangeLabel = document.getElementById('volume-range-label');
            const peakLabel = document.getElementById('volume-peak-label');
            const periodTotal = document.getElementById('volume-period-total');
            const dailyAvgSub = document.getElementById('volume-daily-avg-sub');
            const timelineAxis = document.getElementById('volume-timeline-axis');
            const activeCadenceEl = document.getElementById('volume-active-cadence');
            if (!container) return;

            const days = tacticalArchiveData.volumeRangeDays || 7;
            const is30 = (days === 30);
            if (rangeLabel) rangeLabel.innerText = `PAST ${days} DAYS COMBAT MINUTES`;

            const dateMap = {};
            tacticalArchiveData.workLogs.forEach(l => {
                if (l.completed_at) {
                    const key = new Date(l.completed_at).toLocaleDateString('en-CA');
                    if (!dateMap[key]) dateMap[key] = { count: 0, mins: 0 };
                    dateMap[key].count++;
                    dateMap[key].mins += (l.duration_minutes || 25);
                }
            });

            const dayItems = [];
            const today = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const key = d.toLocaleDateString('en-CA');
                const stats = dateMap[key] || { count: 0, mins: 0 };
                dayItems.push({
                    date: d,
                    key,
                    mins: stats.mins,
                    count: stats.count
                });
            }

            const maxVal = Math.max(...dayItems.map(d => d.mins), 0);
            // Precision Y-axis ceiling rounded to clean multiples of 25m
            const yMax = Math.max(100, Math.ceil(Math.max(maxVal, 100) / 25) * 25);
            const yMid = Math.round(yMax / 2);

            const yTopEl = document.getElementById('volume-y-top');
            const yMidEl = document.getElementById('volume-y-mid');
            const yBaseEl = document.getElementById('volume-y-base');
            if (yTopEl) yTopEl.innerText = `${yMax}m`;
            if (yMidEl) yMidEl.innerText = `${yMid}m`;
            if (yBaseEl) yBaseEl.innerText = `0m`;

            let totalMins = 0;
            let activeDaysCount = 0;
            dayItems.forEach(d => {
                totalMins += d.mins;
                if (d.mins > 0) activeDaysCount++;
            });

            if (peakLabel) peakLabel.innerText = `PEAK: ${maxVal} MINS`;
            if (periodTotal) periodTotal.innerText = `PERIOD TOTAL: ${(totalMins / 60).toFixed(1)} HOURS`;
            if (dailyAvgSub) dailyAvgSub.innerText = `AVG: ${Math.round(totalMins / days)} MINS/DAY`;
            if (activeCadenceEl) activeCadenceEl.innerText = `${activeDaysCount}/${days} DAYS ACTIVE`;

            const gapClass = is30 ? 'gap-[2px] sm:gap-[3px]' : 'gap-2 sm:gap-3';
            const barMaxW = is30 ? 'max-w-[12px]' : 'max-w-[40px]';
            container.className = `h-36 sm:h-40 flex items-end justify-between ${gapClass} pt-4 px-1 min-w-0 w-full overflow-hidden`;

            container.innerHTML = dayItems.map((d, idx) => {
                const hasMins = d.mins > 0;
                // Mathematically exact height relative to yMax
                const heightPct = hasMins ? Math.max(10, Math.min(100, Math.round((d.mins / yMax) * 100))) : 4;
                const fullTitle = `${d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.mins}m (${d.count}x)`;
                const barColor = d.mins >= 100 ? 'bg-[#E11D48]' : d.mins > 0 ? 'bg-[#FACC15]' : 'bg-zinc-200/90 border-black/30 hover:border-black hover:bg-zinc-300';
                const shadowClass = hasMins ? 'shadow-[2px_2px_0px_#000]' : '';

                const dayLabelHtml = !is30 ? `
                    <span class="font-mono text-[9px] sm:text-[10px] font-bold text-black mt-1.5 truncate max-w-full text-center select-none block h-3 leading-none">
                        ${d.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </span>
                ` : '';

                return `
                    <div class="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative cursor-pointer" 
                         title="${fullTitle}"
                         onmouseenter="inspectVolumeBar('${d.key}', ${d.mins}, ${d.count})"
                         onmouseleave="resetVolumeInspect()"
                         onclick="inspectVolumeBar('${d.key}', ${d.mins}, ${d.count})">
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-black text-[#FACC15] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-black pointer-events-none whitespace-nowrap z-30 shadow-[1px_1px_0px_#000]">
                            ${d.mins}m
                        </div>
                        <div class="w-full ${barMaxW} rounded-t border-2 border-black ${barColor} ${shadowClass} group-hover:bg-[#10B981] group-hover:scale-y-105 origin-bottom transition-all" style="height: ${heightPct}%;"></div>
                        ${dayLabelHtml}
                    </div>
                `;
            }).join('');

            // Render Timeline Axis (Only needed in 30-day mode, hidden in 7-day mode)
            if (timelineAxis) {
                if (is30) {
                    timelineAxis.classList.remove('hidden');
                    timelineAxis.classList.add('flex');
                    const milestones = [
                        { idx: 0, label: dayItems[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 7, label: dayItems[7].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 15, label: dayItems[15].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 22, label: dayItems[22].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 29, label: `TODAY (${dayItems[29].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()})`, isToday: true }
                    ];

                    timelineAxis.innerHTML = milestones.map(m => `
                        <div class="flex items-center gap-1 ${m.isToday ? 'text-[#E11D48] font-black' : 'text-zinc-600'}">
                            <span class="w-1.5 h-1.5 rounded-full ${m.isToday ? 'bg-[#E11D48] animate-pulse' : 'bg-zinc-400'}"></span>
                            <span>${m.label}</span>
                        </div>
                    `).join('');
                } else {
                    timelineAxis.classList.add('hidden');
                    timelineAxis.classList.remove('flex');
                    timelineAxis.innerHTML = '';
                }
            }
        }

        let activePeakHourState = {
            peakRangeStr: 'NO SESSIONS RECORDED YET',
            peakOps: 0,
            peakHours: new Set()
        };

        function inspectHourlyBar(h, count, isPeak) {
            const peakText = document.getElementById('peak-hour-text');
            const peakOpsCount = document.getElementById('peak-hour-ops-count');
            const peakCallout = document.getElementById('peak-hour-callout');
            const iconWrap = document.getElementById('peak-hour-icon-wrap');
            if (!peakText) return;

            function formatH12(hour) {
                const period = hour >= 12 ? 'PM' : 'AM';
                let h12 = hour % 12;
                if (h12 === 0) h12 = 12;
                return `${h12}:00 ${period}`;
            }

            const nextH = (h + 1) % 24;
            const rangeStr = `${formatH12(h)} - ${formatH12(nextH)}`;

            if (isPeak && count > 0) {
                peakText.innerText = `PEAK WINDOW: ${rangeStr} (PRIME PROTOCOL)`;
                if (peakCallout) {
                    peakCallout.className = "p-3 bg-amber-100 border-2 border-black rounded-xl font-mono text-xs font-bold text-amber-950 flex items-center justify-between mb-3 shadow-[2px_2px_0px_#000] transition-all";
                }
                if (iconWrap) iconWrap.innerHTML = `<i data-lucide="flame" class="w-4 h-4 text-[#E11D48]"></i>`;
                if (peakOpsCount) {
                    peakOpsCount.className = "text-[10px] bg-[#E11D48] text-white px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold shadow-[1px_1px_0px_#000]";
                    peakOpsCount.innerText = `${count} COMBAT OP${count > 1 ? 'S' : ''}`;
                }
            } else if (count > 0) {
                peakText.innerText = `WINDOW: ${rangeStr} (ACTIVE COMBAT)`;
                if (peakCallout) {
                    peakCallout.className = "p-3 bg-cyan-50 border-2 border-black rounded-xl font-mono text-xs font-bold text-cyan-950 flex items-center justify-between mb-3 shadow-[2px_2px_0px_#000] transition-all";
                }
                if (iconWrap) iconWrap.innerHTML = `<i data-lucide="crosshair" class="w-4 h-4 text-[#06B6D4]"></i>`;
                if (peakOpsCount) {
                    peakOpsCount.className = "text-[10px] bg-[#FACC15] text-black px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold shadow-[1px_1px_0px_#000]";
                    peakOpsCount.innerText = `${count} COMBAT OP${count > 1 ? 'S' : ''}`;
                }
            } else {
                peakText.innerText = `WINDOW: ${rangeStr} (0 SESSIONS)`;
                if (peakCallout) {
                    peakCallout.className = "p-3 bg-zinc-100 border-2 border-black rounded-xl font-mono text-xs font-bold text-zinc-600 flex items-center justify-between mb-3 shadow-none transition-all";
                }
                if (iconWrap) iconWrap.innerHTML = `<i data-lucide="shield" class="w-4 h-4 text-zinc-400"></i>`;
                if (peakOpsCount) {
                    peakOpsCount.className = "text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold";
                    peakOpsCount.innerText = `0 SESSIONS`;
                }
            }
            if (window.lucide) lucide.createIcons();
        }

        function resetHourlyInspect() {
            const peakText = document.getElementById('peak-hour-text');
            const peakOpsCount = document.getElementById('peak-hour-ops-count');
            const peakCallout = document.getElementById('peak-hour-callout');
            const iconWrap = document.getElementById('peak-hour-icon-wrap');
            if (peakCallout) {
                peakCallout.className = "p-3 bg-amber-50 border-2 border-black rounded-xl font-mono text-xs font-bold text-amber-950 flex items-center justify-between mb-3 shadow-none transition-all";
            }
            if (iconWrap) iconWrap.innerHTML = `<i data-lucide="flame" class="w-4 h-4 text-[#E11D48]"></i>`;
            if (peakText) {
                if (!activePeakHourState || activePeakHourState.peakOps === 0) {
                    peakText.innerText = `PEAK WINDOW: NO SESSIONS RECORDED YET`;
                } else {
                    peakText.innerText = `PEAK WINDOW: ${activePeakHourState.peakRangeStr} (PRIME PROTOCOL)`;
                }
            }
            if (peakOpsCount) {
                peakOpsCount.className = "text-[10px] bg-black text-[#FACC15] px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold";
                const count = activePeakHourState ? activePeakHourState.peakOps : 0;
                peakOpsCount.innerText = `${count} COMBAT OP${count === 1 ? '' : 'S'}`;
            }
            if (window.lucide) lucide.createIcons();
        }

        function renderPeakHours(customLogs) {
            const container = document.getElementById('hourly-bars-container');
            const peakText = document.getElementById('peak-hour-text');
            const peakOpsCount = document.getElementById('peak-hour-ops-count');
            if (!container) return;

            container.onmouseleave = resetHourlyInspect;

            const days = tacticalArchiveData.volumeRangeDays || 7;
            const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

            // Filter by the active period (7 or 30 days) to accurately reflect Focus Volume Drill
            const logsToUse = customLogs || (tacticalArchiveData.workLogs || []).filter(l => {
                if (!l.completed_at) return false;
                return new Date(l.completed_at).getTime() >= cutoff;
            });

            const badgeTag = document.getElementById('peak-badge-tag');
            const footerLabel = document.getElementById('peak-spectrum-footer-label');
            if (badgeTag) badgeTag.innerText = `${days}D SPECTRUM`;
            if (footerLabel) footerLabel.innerText = `PAST ${days} DAYS`;

            const hourlyCounts = new Array(24).fill(0);
            logsToUse.forEach(l => {
                if (l.completed_at) {
                    const h = new Date(l.completed_at).getHours();
                    if (h >= 0 && h < 24) hourlyCounts[h]++;
                }
            });

            const maxHourly = Math.max(...hourlyCounts, 1);
            const yMaxHourly = Math.max(4, Math.ceil(maxHourly / 2) * 2);
            const yMidHourly = Math.round(yMaxHourly / 2);

            const hourlyYTop = document.getElementById('hourly-y-top');
            const hourlyYMid = document.getElementById('hourly-y-mid');
            const hourlyYBase = document.getElementById('hourly-y-base');
            if (hourlyYTop) hourlyYTop.innerText = yMaxHourly;
            if (hourlyYMid) hourlyYMid.innerText = yMidHourly;
            if (hourlyYBase) hourlyYBase.innerText = '0';

            function formatHour12(h) {
                const period = h >= 12 ? 'PM' : 'AM';
                let h12 = h % 12;
                if (h12 === 0) h12 = 12;
                return `${h12}:00 ${period}`;
            }

            const totalSessions = hourlyCounts.reduce((a, b) => a + b, 0);
            const peakHours = new Set();
            let peakRangeStr = 'NO SESSIONS RECORDED YET';
            let peakOps = 0;

            if (totalSessions > 0) {
                let bestStart = -1;
                let maxScore = -1;

                // Detect optimal peak focus window using 2-hour rolling density
                // Break ties by daytime waking hours (08:00 - 22:00) so middle-of-the-night edge cases are not falsely declared as prime protocol
                for (let h = 0; h < 24; h++) {
                    const nextH = (h + 1) % 24;
                    const prevH = (h - 1 + 24) % 24;
                    const count2h = hourlyCounts[h] + hourlyCounts[nextH];
                    const density = hourlyCounts[prevH] + count2h + hourlyCounts[(h + 2) % 24];
                    const isDaytime = (h >= 8 && h <= 21);

                    const score = (count2h * 100) + (density * 10) + (isDaytime ? 5 : 0) + (hourlyCounts[h] > 0 ? 1 : 0);
                    if (score > maxScore && count2h > 0) {
                        maxScore = score;
                        bestStart = h;
                    }
                }

                if (bestStart === -1) {
                    for (let h = 0; h < 24; h++) {
                        if (hourlyCounts[h] > 0) {
                            const isDaytime = (h >= 8 && h <= 21);
                            const score = hourlyCounts[h] * 10 + (isDaytime ? 2 : 0);
                            if (score > maxScore) {
                                maxScore = score;
                                bestStart = h;
                            }
                        }
                    }
                }

                if (bestStart !== -1) {
                    const nextH = (bestStart + 1) % 24;
                    if (hourlyCounts[nextH] > 0) {
                        // Multi-hour cluster (e.g. 3:00 PM - 5:00 PM)
                        peakHours.add(bestStart);
                        peakHours.add(nextH);
                        const endH = (bestStart + 2) % 24;
                        peakRangeStr = `${formatHour12(bestStart)} - ${formatHour12(endH)}`;
                        peakOps = hourlyCounts[bestStart] + hourlyCounts[nextH];
                    } else {
                        // Single dominant hour
                        peakHours.add(bestStart);
                        peakRangeStr = `${formatHour12(bestStart)} - ${formatHour12(nextH)}`;
                        peakOps = hourlyCounts[bestStart];
                    }
                }
            }

            activePeakHourState.peakRangeStr = peakRangeStr;
            activePeakHourState.peakOps = peakOps;
            activePeakHourState.peakHours = peakHours;
            resetHourlyInspect();

            container.innerHTML = hourlyCounts.map((count, h) => {
                const isPeak = peakHours.has(h);
                const heightPct = count > 0 ? Math.max(12, Math.min(100, Math.round((count / yMaxHourly) * 100))) : 4;
                const barColor = isPeak ? 'bg-[#FACC15] ring-2 ring-black z-10' : count > 0 ? 'bg-[#06B6D4]' : 'bg-zinc-200 border-black/30';
                const hourFormatted = formatHour12(h);

                return `
                    <div class="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative cursor-pointer" 
                         title="${hourFormatted}: ${count} session${count === 1 ? '' : 's'}${isPeak ? ' (Peak Window)' : ''}"
                         onmouseenter="inspectHourlyBar(${h}, ${count}, ${isPeak})"
                         onmouseleave="resetHourlyInspect()"
                         onclick="inspectHourlyBar(${h}, ${count}, ${isPeak})">
                        <div class="w-full max-w-[28px] rounded-t border border-black ${barColor} transition-all group-hover:bg-[#E11D48] group-hover:scale-y-110 origin-bottom" style="height: ${heightPct}%;"></div>
                    </div>
                `;
            }).join('');
        }

        function setArchiveFilter(filter) {
            tacticalArchiveData.currentFilter = filter;
            tacticalArchiveData.currentPage = 1;

            document.querySelectorAll('.archive-filter-btn').forEach(btn => {
                if (btn.getAttribute('data-filter') === filter) {
                    btn.className = "archive-filter-btn px-3 py-1 text-xs font-mono font-bold rounded border-2 border-black bg-[#FACC15] text-black shadow-[2px_2px_0px_#000] cursor-pointer";
                } else {
                    btn.className = "archive-filter-btn px-3 py-1 text-xs font-mono font-bold rounded border-2 border-black bg-white text-zinc-700 hover:bg-zinc-100 shadow-none cursor-pointer";
                }
            });

            renderArchiveTable();
        }

        function changeArchivePage(delta) {
            tacticalArchiveData.currentPage += delta;
            renderArchiveTable();
        }

        function renderArchiveTable() {
            const tbody = document.getElementById('archive-table-body');
            const pageInfo = document.getElementById('archive-page-info');
            const pageNumber = document.getElementById('archive-page-number');
            const btnPrev = document.getElementById('btn-archive-prev');
            const btnNext = document.getElementById('btn-archive-next');
            if (!tbody) return;

            const filter = tacticalArchiveData.currentFilter || 'ALL';
            let filtered = tacticalArchiveData.allLogs || [];
            if (filter === 'WORK') {
                filtered = filtered.filter(l => l.phase === 'WORK');
            } else if (filter === 'BREAK') {
                filtered = filtered.filter(l => l.phase !== 'WORK');
            }

            const pageSize = tacticalArchiveData.pageSize || 10;
            const totalRecords = filtered.length;
            const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
            tacticalArchiveData.currentPage = Math.max(1, Math.min(tacticalArchiveData.currentPage, totalPages));
            const page = tacticalArchiveData.currentPage;

            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, totalRecords);
            const pageItems = filtered.slice(startIndex, endIndex);

            if (pageInfo) {
                pageInfo.innerText = totalRecords === 0
                    ? "NO SESSIONS RECORDED FOR THIS FILTER"
                    : `SHOWING ${startIndex + 1}-${endIndex} OF ${totalRecords} RECORDS`;
            }
            if (pageNumber) pageNumber.innerText = `${page} / ${totalPages}`;
            if (btnPrev) btnPrev.disabled = (page <= 1);
            if (btnNext) btnNext.disabled = (page >= totalPages);

            if (pageItems.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-6 text-center text-zinc-500 font-mono text-xs">
                            NO SESSIONS RECORDED YET. ENGAGE THE HUD TO RECORD MISSIONS!
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = pageItems.map(item => {
                const isWork = item.phase === 'WORK';
                const isLongBreak = item.phase === 'LONG_BREAK';
                const dateObj = item.completed_at ? new Date(item.completed_at) : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let badgeHtml = '';
                let statusHtml = '';
                let xpHtml = '';
                if (isWork) {
                    badgeHtml = `<span class="bg-[#E11D48] text-white font-mono font-bold text-xs px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-none"><i data-lucide="swords" class="w-3 h-3"></i> COMBAT</span>`;
                    statusHtml = `<span class="text-emerald-700 font-mono font-bold text-xs inline-flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> CONQUERED</span>`;
                    xpHtml = `<span class="text-amber-600 font-mono font-black text-xs">+${(item.duration_minutes || 25) * 10} XP</span>`;
                } else if (isLongBreak) {
                    badgeHtml = `<span class="bg-[#FACC15] text-black font-mono font-bold text-xs px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-none"><i data-lucide="award" class="w-3 h-3"></i> SHAWARMA</span>`;
                    statusHtml = `<span class="text-amber-700 font-mono font-bold text-xs inline-flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> REPLENISHED</span>`;
                    xpHtml = `<span class="text-cyan-600 font-mono font-black text-xs">+100 XP</span>`;
                } else {
                    badgeHtml = `<span class="bg-[#06B6D4] text-black font-mono font-bold text-xs px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-none"><i data-lucide="coffee" class="w-3 h-3"></i> RECHARGE</span>`;
                    statusHtml = `<span class="text-cyan-700 font-mono font-bold text-xs inline-flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> REPLENISHED</span>`;
                    xpHtml = `<span class="text-cyan-600 font-mono font-black text-xs">+50 XP</span>`;
                }

                return `
                    <tr class="hover:bg-amber-50/60 transition-colors">
                        <td class="py-2.5 px-3.5 border-r border-black/10 font-bold text-black whitespace-nowrap">
                            ${dateStr} <span class="text-zinc-500 font-normal">at</span> ${timeStr}
                        </td>
                        <td class="py-2.5 px-3.5 border-r border-black/10 whitespace-nowrap">
                            ${badgeHtml}
                        </td>
                        <td class="py-2.5 px-3.5 border-r border-black/10 font-bold text-black whitespace-nowrap">
                            ${item.duration_minutes || (isWork ? 25 : 5)} MINS
                        </td>
                        <td class="py-2.5 px-3.5 border-r border-black/10 whitespace-nowrap">
                            ${statusHtml}
                        </td>
                        <td class="py-2.5 px-3.5 whitespace-nowrap font-bold">
                            ${xpHtml}
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
        }

