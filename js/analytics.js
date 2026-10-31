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
            volumeViewMode: 'BARS', // 'BARS', 'WAVE', 'COMPARE'
            peakSpectrumMode: 'ALL', // 'ALL', 'WEEKDAYS', 'WEEKENDS'
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

                    // Add occasional realistic custom standalone sessions with varying durations (5-60m)
                    const isCustom = (dayOffset % 5 === 1 && s === 0) || (dayOffset === 1 && s === 1);
                    const customDur = (s === 1) ? 40 : 15;
                    const showcaseHeroKeys = ['ironman', 'ironman', 'cap', 'thor', 'spidey', 'hulk'];
                    const sessionHero = showcaseHeroKeys[(s + dayOffset) % showcaseHeroKeys.length];

                    logs.push({
                        id: `log-${dayOffset}-${s}-w`,
                        phase: isCustom ? 'SPECIAL' : 'WORK',
                        duration_minutes: isCustom ? customDur : 25,
                        completed_at: sessionTime.toISOString(),
                        hero: sessionHero
                    });

                    // Break durations dynamically vary between 5 and 45 mins
                    const breakDuration = (s === 3) ? 20 : ((dayOffset % 2 === 0) ? 10 : 5);
                    const breakTime = new Date(sessionTime.getTime() + (isCustom ? customDur : 25) * 60 * 1000);
                    logs.push({
                        id: `log-${dayOffset}-${s}-b`,
                        phase: (s === 3) ? 'LONG_BREAK' : 'SHORT_BREAK',
                        duration_minutes: breakDuration,
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
            tacticalArchiveData.workLogs = allLogs.filter(l => l.phase === 'WORK' || (typeof isCustomPhase === 'function' && isCustomPhase(l.phase)));

            renderTacticalKPIs(tacticalArchiveData.allLogs, tacticalArchiveData.workLogs);
            renderHeatmap(tacticalArchiveData.workLogs);
            renderVolumeChart();
            renderPeakHours();
            renderArchiveTable();

            if (window.lucide) lucide.createIcons();
        }

        function renderTacticalKPIs(allLogs, workLogs) {
            // 1. Total Combat Output: Sum actual duration_minutes directly from each row (combined standard work & special ops)
            const totalWorkMinutes = workLogs.reduce((acc, l) => acc + (Number(l.duration_minutes) || 25), 0);
            const totalHours = (totalWorkMinutes / 60).toFixed(1);
            const elHours = document.getElementById('stat-alltime-hours');
            const elSessions = document.getElementById('stat-alltime-sessions-count');
            if (elHours) elHours.innerText = totalHours;
            if (elSessions) elSessions.innerText = `${workLogs.length} OPS`;

            // 2. Protocols Mastered (4/4 cycles strictly tied to standard regular Pomodoros)
            const standardWorkLogs = workLogs.filter(l => l.phase === 'WORK');
            const protocolsMastered = Math.floor(standardWorkLogs.length / 4);
            const waveProgress = standardWorkLogs.length % 4;
            const elProtocols = document.getElementById('stat-protocols-mastered');
            const elGauge = document.getElementById('stat-protocols-gauge');
            if (elProtocols) elProtocols.innerText = protocolsMastered;
            if (elGauge) elGauge.innerText = `${waveProgress}/4 IN WAVE`;

            // 3. Operational Streak & Daily Average: Group strictly by completed_at converted to Asia/Dhaka (UTC+6)
            const activeDateSet = new Set();
            workLogs.forEach(l => {
                if (l.completed_at) {
                    const dateKey = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(l.completed_at) : new Date(l.completed_at).toLocaleDateString('en-CA');
                    if (dateKey) activeDateSet.add(dateKey);
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
                    const prev = new Date(sortedDates[i - 1] + 'T00:00:00Z');
                    const curr = new Date(sortedDates[i] + 'T00:00:00Z');
                    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        tempStreak++;
                    } else if (diffDays > 1) {
                        tempStreak = 1;
                    }
                    if (tempStreak > maxStreak) maxStreak = tempStreak;
                }

                const todayStr = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(new Date()) : new Date().toLocaleDateString('en-CA');
                const yesterdayStr = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(new Date(Date.now() - 86400000)) : new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
                if (activeDateSet.has(todayStr) || activeDateSet.has(yesterdayStr)) {
                    currentStreak = 0;
                    let checkTime = activeDateSet.has(todayStr) ? Date.now() : (Date.now() - 86400000);
                    while (true) {
                        const k = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(new Date(checkTime)) : new Date(checkTime).toLocaleDateString('en-CA');
                        if (activeDateSet.has(k)) {
                            currentStreak++;
                            checkTime -= 86400000;
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
                    const key = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(l.completed_at) : new Date(l.completed_at).toLocaleDateString('en-CA');
                    if (!key) return;
                    if (!dateMap[key]) {
                        dateMap[key] = { count: 0, mins: 0, workCount: 0, specialCount: 0, specialMins: 0, workMins: 0 };
                    }
                    const isSpecial = typeof isCustomPhase === 'function' && isCustomPhase(l.phase);
                    const dur = Number(l.duration_minutes) || 25;
                    dateMap[key].count++;
                    dateMap[key].mins += dur;
                    if (isSpecial) {
                        dateMap[key].specialCount++;
                        dateMap[key].specialMins += dur;
                    } else {
                        dateMap[key].workCount++;
                        dateMap[key].workMins += dur;
                    }
                }
            });

            const dayList = [];
            const now = Date.now();
            for (let i = 59; i >= 0; i--) {
                const d = new Date(now - i * 24 * 60 * 60 * 1000);
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
                    const key = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(d) : d.toLocaleDateString('en-CA');
                    const entry = dateMap[key] || { count: 0, mins: 0, workCount: 0, specialCount: 0, specialMins: 0, workMins: 0 };
                    const c = entry.count;
                    if (c > 0) activeDaysCount++;

                    let bgClass = "bg-white border-2 border-black/30 hover:border-black hover:bg-amber-50/60 shadow-none";
                    let innerContent = '<span class="text-zinc-400 group-hover:text-black font-mono font-bold text-[9px] select-none">·</span>';

                    // Distinct visual badges for days featuring SPECIAL sessions
                    if (c === 1) {
                        bgClass = (entry.specialCount > 0 && entry.workCount === 0)
                            ? "bg-[#DDD6FE] border-2 border-black text-purple-950 shadow-[2px_2px_0px_#000]"
                            : "bg-[#FEF08A] border-2 border-black text-black shadow-[2px_2px_0px_#000]";
                        innerContent = entry.specialCount > 0 ? '<svg class="w-2.5 h-2.5 text-[#7C3AED] fill-[#7C3AED]" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' : '';
                    } else if (c === 2) {
                        bgClass = (entry.specialCount > 0 && entry.workCount === 0)
                            ? "bg-[#A78BFA] border-2 border-black text-white shadow-[2px_2px_0px_#000]"
                            : "bg-[#FACC15] border-2 border-black text-black shadow-[2px_2px_0px_#000]";
                        innerContent = entry.specialCount > 0 ? '<svg class="w-2.5 h-2.5 text-[#7C3AED] fill-[#7C3AED]" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' : '';
                    } else if (c === 3) {
                        bgClass = (entry.specialCount > 0 && entry.workCount === 0)
                            ? "bg-[#7C3AED] border-2 border-black text-white shadow-[2px_2px_0px_#000]"
                            : "bg-[#FB923C] border-2 border-black text-black shadow-[2px_2px_0px_#000]";
                        innerContent = entry.specialCount > 0 ? '<svg class="w-2.5 h-2.5 text-[#FACC15] fill-[#FACC15]" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' : '';
                    } else if (c >= 4) {
                        bgClass = (entry.specialCount > 0 && entry.workCount === 0)
                            ? "bg-[#6D28D9] text-white border-2 border-black shadow-[2px_2px_0px_#000] ring-1 ring-black"
                            : "bg-[#E11D48] text-white border-2 border-black shadow-[2px_2px_0px_#000] ring-1 ring-black";
                        innerContent = `<svg class="w-3 h-3 drop-shadow flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#FFD700" stroke="#000" stroke-width="1.8"/><circle cx="12" cy="12" r="5" fill="#00F0FF" stroke="#000" stroke-width="1"/><polygon points="12,7 16,14 8,14" fill="#FFFFFF" stroke="#000" stroke-width="0.8"/></svg>`;
                    }

                    const dateTitle = d.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric', year: 'numeric' });
                    let hoverTitle = `${dateTitle} • ${c} sessions (${entry.mins} mins)`;
                    if (entry.specialCount > 0) {
                        hoverTitle = `${dateTitle} • ${entry.workCount} combat + ${entry.specialCount} special (${entry.specialMins}m) • ${entry.mins} mins total`;
                    }
                    return `
                        <div class="heatmap-tile w-6 h-6 sm:w-7 sm:h-7 rounded-md transition-all hover:scale-125 hover:z-20 cursor-pointer flex items-center justify-center select-none group relative ${bgClass}"
                             data-date="${key}" 
                             data-count="${c}" 
                             data-mins="${entry.mins}"
                             data-work-count="${entry.workCount}"
                             data-special-count="${entry.specialCount}"
                             data-special-mins="${entry.specialMins}"
                             onmouseenter="inspectHeatmapTile(this)" onclick="inspectHeatmapTile(this)"
                             title="${hoverTitle}">
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
            const workCount = parseInt(tile.getAttribute('data-work-count') || '0', 10);
            const specialCount = parseInt(tile.getAttribute('data-special-count') || '0', 10);
            const specialMins = parseInt(tile.getAttribute('data-special-mins') || '0', 10);

            const d = new Date(dateStr + 'T12:00:00Z');
            const formattedDate = d.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
            const dayName = d.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long' }).toUpperCase();

            // Protocols are strictly 4/4 cycles from regular Pomodoro blocks
            const protocolsFinished = Math.floor(workCount / 4);

            // 1. Bottom inspect bar (Clean operational readout, no redundant badge)
            const inspectText = document.getElementById('heatmap-inspect-text');
            if (inspectText) {
                if (count === 0) {
                    inspectText.innerHTML = `
                        <i data-lucide="crosshair" class="w-4 h-4 text-zinc-500"></i>
                        <span class="text-zinc-700">${formattedDate} • 0 SESSIONS (0 MINS)</span>
                    `;
                } else {
                    const protocolNote = protocolsFinished > 0 ? ` • ${protocolsFinished} PROTOCOL${protocolsFinished > 1 ? 'S' : ''} FINISHED` : '';
                    let sessionDetail = `${count} SESSIONS FINISHED (${mins} MINS)`;
                    if (specialCount > 0) {
                        sessionDetail = `${count} SESSIONS FINISHED (${mins} MINS: ${workCount} COMBAT + <span class="text-[#7C3AED] font-bold">${specialCount} SPECIAL OPS [${specialMins}M]</span>)`;
                    }
                    inspectText.innerHTML = `
                        <i data-lucide="crosshair" class="w-4 h-4 text-[#E11D48]"></i>
                        <span class="text-black font-mono font-bold">${formattedDate} • ${sessionDetail}${protocolNote}</span>
                    `;
                }
            }

            // 2. Right Recon Telemetry Panel (Protocols & Sessions Finished)
            const reconDayTag = document.getElementById('recon-day-tag');
            const reconDateTitle = document.getElementById('recon-date-title');
            const reconOutputDesc = document.getElementById('recon-output-desc');
            const reconProtocols = document.getElementById('recon-protocols-count');
            const reconSessions = document.getElementById('recon-sessions-count');
            const reconSessionsSubtag = document.getElementById('recon-sessions-subtag');
            const reconProtocolsSubtag = document.getElementById('recon-protocols-subtag');

            if (reconDayTag) reconDayTag.innerText = `${dayName} // RECON`;
            if (reconDateTitle) reconDateTitle.innerText = formattedDate;

            if (reconOutputDesc) {
                if (count === 0) {
                    reconOutputDesc.innerHTML = `<span class="text-zinc-500">0 SESSIONS COMPLETED • 0 MINS LOGGED</span>`;
                } else if (specialCount > 0) {
                    reconOutputDesc.innerHTML = `
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-zinc-800">${mins} FOCUS MINUTES LOGGED</span>
                            <span class="bg-[#7C3AED] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] inline-flex items-center gap-1">
                                <i data-lucide="zap" class="w-2.5 h-2.5 text-[#FACC15]"></i>
                                ${specialCount === 1 ? `1 SPECIAL OPS (${specialMins}M)` : `${specialCount} SPECIAL OPS (${specialMins}M)`}
                            </span>
                        </div>
                    `;
                } else {
                    reconOutputDesc.innerText = `${mins} FOCUS MINUTES LOGGED`;
                }
            }

            if (reconProtocols) reconProtocols.innerText = protocolsFinished;
            if (reconSessions) reconSessions.innerText = count;

            if (reconProtocolsSubtag) {
                if (count === 0) {
                    reconProtocolsSubtag.innerText = "4 COMBAT / CYCLE";
                } else {
                    const inProgressSlots = workCount % 4;
                    reconProtocolsSubtag.innerText = inProgressSlots > 0 ? `${inProgressSlots}/4 CYCLE IN PROGRESS` : "4x25M CYCLE LOCKED";
                }
            }

            if (reconSessionsSubtag) {
                if (count === 0) {
                    reconSessionsSubtag.innerText = "";
                } else if (specialCount > 0) {
                    reconSessionsSubtag.innerHTML = `${workCount} COMBAT • <span class="text-[#7C3AED] font-bold">${specialCount} SPECIAL (${specialMins}M)</span>`;
                } else {
                    reconSessionsSubtag.innerText = `${count} COMBAT PROTOCOLS`;
                }
            }

            if (window.lucide) lucide.createIcons();
        }

        function generateSmoothSvgPath(points) {
            if (!points || points.length === 0) return "";
            if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

            let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i === 0 ? i : i - 1];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
            }
            return path;
        }

        function setVolumeViewMode(mode) {
            tacticalArchiveData.volumeViewMode = mode;
            const btnBars = document.getElementById('btn-mode-bars');
            const btnWave = document.getElementById('btn-mode-wave');
            const btnCompare = document.getElementById('btn-mode-compare');
            const subToggle = document.getElementById('volume-sub-range-toggle');

            const activeClass = "px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded border border-black bg-[#FACC15] text-black shadow-[1px_1px_0px_#000] cursor-pointer";
            const inactiveClass = "px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded border border-transparent bg-transparent text-zinc-600 hover:text-black cursor-pointer";

            if (btnBars) btnBars.className = (mode === 'BARS') ? activeClass : inactiveClass;
            if (btnWave) btnWave.className = (mode === 'WAVE') ? activeClass : inactiveClass;
            if (btnCompare) btnCompare.className = (mode === 'COMPARE') ? activeClass : inactiveClass;

            if (subToggle) {
                if (mode === 'BARS') {
                    subToggle.classList.remove('hidden');
                    subToggle.classList.add('inline-flex');
                } else {
                    subToggle.classList.add('hidden');
                    subToggle.classList.remove('inline-flex');
                }
            }

            renderVolumeChart();
        }

        function setPeakSpectrumMode(mode) {
            tacticalArchiveData.peakSpectrumMode = mode;
            const btnAll = document.getElementById('btn-spectrum-all');
            const btnWeekdays = document.getElementById('btn-spectrum-weekdays');
            const btnWeekends = document.getElementById('btn-spectrum-weekends');

            const activeClass = "px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded border border-black bg-[#FACC15] text-black shadow-[1px_1px_0px_#000] cursor-pointer";
            const inactiveClass = "px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold rounded border border-transparent bg-transparent text-zinc-600 hover:text-black cursor-pointer";

            if (btnAll) btnAll.className = (mode === 'ALL') ? activeClass : inactiveClass;
            if (btnWeekdays) btnWeekdays.className = (mode === 'WEEKDAYS') ? activeClass : inactiveClass;
            if (btnWeekends) btnWeekends.className = (mode === 'WEEKENDS') ? activeClass : inactiveClass;

            renderPeakHours();
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

        function inspectVolumeBar(dateKey, mins, count, workCount = count, specialCount = 0, specialMins = 0) {
            const calloutText = document.getElementById('volume-inspect-text');
            const calloutBadge = document.getElementById('volume-inspect-badge');
            if (!calloutText) return;

            const d = new Date(dateKey + 'T12:00:00Z');
            const formatted = d.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

            if (mins === 0) {
                calloutText.innerText = `${formatted} • 0 MINS LOGGED (0 SESSIONS)`;
                if (calloutBadge) {
                    calloutBadge.className = "text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold";
                    calloutBadge.innerText = "NO SESSIONS";
                }
            } else {
                const protocols = Math.floor(workCount / 4);
                const protocolText = protocols > 0 ? ` • ${protocols} PROTOCOL${protocols > 1 ? 'S' : ''} FINISHED` : '';
                let sessionBreakdown = `${count} SESSIONS COMPLETED`;
                if (specialCount > 0) {
                    sessionBreakdown = `${count} SESSIONS: ${workCount} COMBAT + ${specialCount} SPECIAL [${specialMins}M]`;
                }
                calloutText.innerHTML = `${formatted} • ${mins} MINS (${sessionBreakdown})${protocolText}`;
                if (calloutBadge) {
                    if (specialCount > 0) {
                        calloutBadge.className = "text-[10px] bg-[#7C3AED] text-white px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold shadow-[1px_1px_0px_#000]";
                        calloutBadge.innerText = `${specialCount} SPECIAL OPS`;
                    } else if (mins >= 100) {
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

        let activeVolumeCalloutState = {
            text: 'HOVER BARS TO INSPECT COMBAT SESSION BREAKDOWN',
            badgeText: 'CADENCE',
            badgeClass: 'text-[10px] bg-black text-[#FACC15] px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold'
        };

        function resetVolumeInspect() {
            const calloutText = document.getElementById('volume-inspect-text');
            const calloutBadge = document.getElementById('volume-inspect-badge');
            if (calloutText) calloutText.innerHTML = activeVolumeCalloutState.text;
            if (calloutBadge) {
                calloutBadge.className = activeVolumeCalloutState.badgeClass;
                calloutBadge.innerText = activeVolumeCalloutState.badgeText;
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

            const mode = tacticalArchiveData.volumeViewMode || 'BARS';
            const days = tacticalArchiveData.volumeRangeDays || 7;
            const is30 = (days === 30);

            // Build complete date map for calculations in Asia/Dhaka
            const dateMap = {};
            tacticalArchiveData.workLogs.forEach(l => {
                if (l.completed_at) {
                    const key = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(l.completed_at) : new Date(l.completed_at).toLocaleDateString('en-CA');
                    if (!key) return;
                    if (!dateMap[key]) {
                        dateMap[key] = { count: 0, mins: 0, workCount: 0, specialCount: 0, specialMins: 0, workMins: 0 };
                    }
                    const isSpecial = typeof isCustomPhase === 'function' && isCustomPhase(l.phase);
                    const dur = Number(l.duration_minutes) || 25;
                    dateMap[key].count++;
                    dateMap[key].mins += dur;
                    if (isSpecial) {
                        dateMap[key].specialCount++;
                        dateMap[key].specialMins += dur;
                    } else {
                        dateMap[key].workCount++;
                        dateMap[key].workMins += dur;
                    }
                }
            });

            // ==============================================================
            // MODE 1: 7-DAY ROLLING MOMENTUM WAVE (Smooth Trend Spline)
            // ==============================================================
            if (mode === 'WAVE') {
                if (timelineAxis) {
                    timelineAxis.classList.add('hidden');
                    timelineAxis.classList.remove('flex');
                    timelineAxis.innerHTML = '';
                }

                const waveDays = 14;
                const todayKey = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(new Date()) : new Date().toLocaleDateString('en-CA');
                const [ty, tm, td] = todayKey.split('-').map(Number);
                const todayNoon = new Date(Date.UTC(ty, tm - 1, td, 12, 0, 0));
                const dayItems = [];

                for (let i = waveDays - 1; i >= 0; i--) {
                    const d = new Date(todayNoon.getTime() - i * 86400000);
                    const key = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(d) : d.toLocaleDateString('en-CA');
                    const stats = dateMap[key] || { count: 0, mins: 0, workCount: 0, specialCount: 0, specialMins: 0, workMins: 0 };

                    // Calculate 7-day rolling moving average up to day d (7 days ending on day d)
                    let rollingSum = 0;
                    for (let k = 0; k < 7; k++) {
                        const pastD = new Date(d.getTime() - k * 86400000);
                        const pastKey = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(pastD) : pastD.toLocaleDateString('en-CA');
                        if (dateMap[pastKey]) {
                            rollingSum += dateMap[pastKey].mins;
                        }
                    }
                    const sma7 = Math.round(rollingSum / 7);

                    dayItems.push({
                        date: d,
                        key,
                        mins: stats.mins,
                        sma7: sma7,
                        count: stats.count,
                        workCount: stats.workCount,
                        specialCount: stats.specialCount,
                        specialMins: stats.specialMins
                    });
                }

                // Momentum surge calculation: compare today's 7D SMA with 7 days ago's 7D SMA
                const currentSMA = dayItems[dayItems.length - 1].sma7;
                const priorSMA = dayItems[Math.max(0, dayItems.length - 8)].sma7;
                const deltaSMA = currentSMA - priorSMA;
                const pctChange = priorSMA > 0 ? Math.round((deltaSMA / priorSMA) * 100) : (currentSMA > 0 ? 100 : 0);
                const isSurge = pctChange >= 0;

                const momentumTag = isSurge ? `▲ +${Math.abs(pctChange)}% MOMENTUM SURGE` : `▼ -${Math.abs(pctChange)}% CADENCE DIP`;
                const momentumClass = isSurge 
                    ? "bg-[#10B981] text-black font-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]"
                    : "bg-[#FB923C] text-black font-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]";

                if (rangeLabel) rangeLabel.innerText = "7-DAY ROLLING MOMENTUM WAVE";
                if (peakLabel) peakLabel.innerText = `7D ROLLING AVG: ${currentSMA} MINS/DAY`;

                activeVolumeCalloutState = {
                    text: `7-DAY ROLLING MOMENTUM: ${currentSMA} MINS/DAY • 7D SMA TRAJECTORY`,
                    badgeText: momentumTag,
                    badgeClass: `text-[10px] ${momentumClass} shrink-0 font-mono font-bold whitespace-nowrap`
                };
                resetVolumeInspect();

                const maxVal = Math.max(...dayItems.map(d => Math.max(d.mins, d.sma7)), 60);
                const yMax = Math.max(100, Math.ceil(maxVal / 25) * 25);
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

                if (periodTotal) periodTotal.innerText = `14D TOTAL: ${(totalMins / 60).toFixed(1)} HOURS`;
                if (dailyAvgSub) dailyAvgSub.innerText = `14D AVG: ${Math.round(totalMins / waveDays)} MINS/DAY`;
                if (activeCadenceEl) activeCadenceEl.innerText = `${activeDaysCount}/${waveDays} DAYS ACTIVE`;

                // SVG Drawing dimensions aligned with HTML Y-axis scale
                const svgW = 500;
                const svgH = 144;
                const padBottom = 24; // aligns with pb-6 (24px)
                const padTop = 8;
                const usableH = (svgH - padBottom) - padTop;
                const yBase = svgH - padBottom;
                const yMidGuide = yBase - usableH * 0.5;
                const stepX = (svgW - 40) / (waveDays - 1);

                // Map points for spline
                const points = dayItems.map((item, idx) => {
                    const x = 20 + idx * stepX;
                    const y = yBase - (item.sma7 / yMax) * usableH;
                    return { x, y, item, idx };
                });

                const splinePath = generateSmoothSvgPath(points);
                const areaPath = points.length > 0
                    ? `${splinePath} L ${points[points.length - 1].x.toFixed(1)} ${yBase} L ${points[0].x.toFixed(1)} ${yBase} Z`
                    : "";

                // Background translucent bars
                const barsSvg = dayItems.map((item, idx) => {
                    const x = 20 + idx * stepX;
                    const barH = item.mins > 0 ? Math.max(6, (item.mins / yMax) * usableH) : 3;
                    const y = yBase - barH;
                    return `<rect x="${(x - 9).toFixed(1)}" y="${y.toFixed(1)}" width="18" height="${barH.toFixed(1)}" rx="2" fill="#FACC15" opacity="0.32" stroke="#000" stroke-width="1.2" stroke-opacity="0.35"/>`;
                }).join('');

                // Node dots & hitboxes
                const nodesSvg = points.map(pt => {
                    const dayLabel = pt.item.date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'narrow' });
                    const isToday = (pt.idx === waveDays - 1);
                    const hoverAction = `
                        const calloutText = document.getElementById('volume-inspect-text');
                        const calloutBadge = document.getElementById('volume-inspect-badge');
                        if (calloutText) {
                            calloutText.innerHTML = '${pt.item.date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short', month: 'short', day: 'numeric' })} • <b>${pt.item.mins}m</b> LOGGED • 7D SMA: <b>${pt.item.sma7}m/day</b>';
                        }
                        if (calloutBadge) {
                            calloutBadge.className = 'text-[10px] bg-[#10B981] text-black font-bold px-2 py-0.5 rounded border border-black shrink-0 font-mono';
                            calloutBadge.innerText = '7D SMA: ${pt.item.sma7}m';
                        }
                    `;
                    return `
                        <g class="cursor-pointer group" 
                           onmouseenter="${hoverAction}"
                           onmouseleave="resetVolumeInspect()"
                           onclick="${hoverAction}">
                            <rect x="${(pt.x - 14).toFixed(1)}" y="0" width="28" height="${svgH}" fill="transparent"/>
                            <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="5.5" fill="#000"/>
                            <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isToday ? '4' : '3.2'}" fill="${isToday ? '#FACC15' : '#10B981'}"/>
                            <text x="${pt.x.toFixed(1)}" y="${svgH - 6}" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="${isToday ? '#E11D48' : '#64748B'}">${dayLabel}</text>
                        </g>
                    `;
                }).join('');

                container.className = "h-36 sm:h-40 flex items-center justify-center p-0 min-w-0 w-full overflow-hidden relative";
                container.innerHTML = `
                    <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full h-full select-none" preserveAspectRatio="none">
                        <!-- Subtle Mid-level Guide Line -->
                        <line x1="10" y1="${yMidGuide.toFixed(1)}" x2="${svgW - 10}" y2="${yMidGuide.toFixed(1)}" stroke="#E2E8F0" stroke-dasharray="3 3" stroke-width="1"/>
                        <!-- Horizontal Base Guide -->
                        <line x1="10" y1="${yBase}" x2="${svgW - 10}" y2="${yBase}" stroke="#CBD5E1" stroke-width="1.5"/>
                        <!-- Translucent Daily Output Bars -->
                        ${barsSvg}
                        <!-- Neon Emerald Translucent Area Fill -->
                        <path d="${areaPath}" fill="rgba(16, 185, 129, 0.22)"/>
                        <!-- Bold High-Contrast Spline (Black Outline + Neon Emerald Core) -->
                        <path d="${splinePath}" fill="none" stroke="#000" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="${splinePath}" fill="none" stroke="#10B981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <!-- Interactive Data Nodes -->
                        ${nodesSvg}
                    </svg>
                `;
                return;
            }

            // ==============================================================
            // MODE 2: THIS WEEK VS LAST WEEK GHOST COMPARATIVE LINE
            // X-Axis: Monday through Sunday (Standard Weekly Battle)
            // ==============================================================
            if (mode === 'COMPARE') {
                if (timelineAxis) {
                    timelineAxis.classList.add('hidden');
                    timelineAxis.classList.remove('flex');
                    timelineAxis.innerHTML = '';
                }

                const todayKey = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(new Date()) : new Date().toLocaleDateString('en-CA');
                const [ty, tm, td] = todayKey.split('-').map(Number);
                const todayNoon = new Date(Date.UTC(ty, tm - 1, td, 12, 0, 0));
                const utcDay = todayNoon.getUTCDay();
                // Monday-based index: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
                const todayIndex = (utcDay + 6) % 7;

                // Monday of This Week
                const thisMonday = new Date(todayNoon.getTime() - todayIndex * 86400000);
                // Monday of Last Week
                const lastMonday = new Date(thisMonday.getTime() - 7 * 86400000);

                const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                const thisWeekData = [];
                const lastWeekData = [];

                let thisCumulativeThroughToday = 0;
                let lastCumulativeThroughToday = 0;
                let thisTotalMins = 0;
                let lastTotalMins = 0;

                for (let i = 0; i < 7; i++) {
                    const twDate = new Date(thisMonday.getTime() + i * 86400000);
                    const lwDate = new Date(lastMonday.getTime() + i * 86400000);

                    const twKey = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(twDate) : twDate.toLocaleDateString('en-CA');
                    const lwKey = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(lwDate) : lwDate.toLocaleDateString('en-CA');

                    const twStats = dateMap[twKey] || { mins: 0, count: 0 };
                    const lwStats = dateMap[lwKey] || { mins: 0, count: 0 };

                    thisWeekData.push({ dow: i, name: dayNames[i], date: twDate, key: twKey, mins: twStats.mins, count: twStats.count });
                    lastWeekData.push({ dow: i, name: dayNames[i], date: lwDate, key: lwKey, mins: lwStats.mins, count: lwStats.count });

                    thisTotalMins += twStats.mins;
                    lastTotalMins += lwStats.mins;

                    if (i <= todayIndex) {
                        thisCumulativeThroughToday += twStats.mins;
                        lastCumulativeThroughToday += lwStats.mins;
                    }
                }

                const deltaThroughToday = thisCumulativeThroughToday - lastCumulativeThroughToday;
                const isAhead = deltaThroughToday > 0;
                const isTied = deltaThroughToday === 0;
                const currentDayName = dayNames[todayIndex];

                const deltaText = `${deltaThroughToday > 0 ? '+' : ''}${deltaThroughToday} MINS`;
                let statusCallout = '';
                let statusBadgeClass = '';
                let statusBadgeText = '';

                if (isTied) {
                    statusCallout = `${currentDayName} STATUS: ON PACE WITH LAST WEEK'S CADENCE`;
                    statusBadgeClass = "bg-[#FACC15] text-black font-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]";
                    statusBadgeText = "ON PACE (0m)";
                } else if (isAhead) {
                    statusCallout = `${currentDayName} STATUS: ${deltaText} AHEAD OF LAST WEEK'S CADENCE`;
                    statusBadgeClass = "bg-[#10B981] text-black font-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]";
                    statusBadgeText = `▲ ${deltaText} AHEAD`;
                } else {
                    statusCallout = `${currentDayName} STATUS: ${deltaText} BEHIND LAST WEEK'S CADENCE`;
                    statusBadgeClass = "bg-[#FB923C] text-black font-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]";
                    statusBadgeText = `▼ ${Math.abs(deltaThroughToday)}m BEHIND`;
                }

                if (rangeLabel) rangeLabel.innerText = "THIS WEEK VS LAST WEEK GHOST COMPARISON";
                if (peakLabel) peakLabel.innerText = `PACE DELTA: ${isTied ? '0 MINS' : deltaText}`;

                activeVolumeCalloutState = {
                    text: statusCallout,
                    badgeText: statusBadgeText,
                    badgeClass: `text-[10px] ${statusBadgeClass} shrink-0 font-mono font-bold whitespace-nowrap`
                };
                resetVolumeInspect();

                const maxVal = Math.max(...thisWeekData.map(d => d.mins), ...lastWeekData.map(d => d.mins), 60);
                const yMax = Math.max(100, Math.ceil(maxVal / 25) * 25);
                const yMid = Math.round(yMax / 2);

                const yTopEl = document.getElementById('volume-y-top');
                const yMidEl = document.getElementById('volume-y-mid');
                const yBaseEl = document.getElementById('volume-y-base');
                if (yTopEl) yTopEl.innerText = `${yMax}m`;
                if (yMidEl) yMidEl.innerText = `${yMid}m`;
                if (yBaseEl) yBaseEl.innerText = `0m`;

                if (periodTotal) periodTotal.innerText = `THIS WEEK: ${(thisTotalMins / 60).toFixed(1)}H • LAST WEEK: ${(lastTotalMins / 60).toFixed(1)}H`;
                if (dailyAvgSub) dailyAvgSub.innerText = `PACE DELTA: ${isTied ? '0 MINS' : deltaText}`;
                if (activeCadenceEl) activeCadenceEl.innerText = `${thisWeekData.filter(d => d.mins > 0).length}/${todayIndex + 1} DAYS ACTIVE`;

                const svgW = 500;
                const svgH = 144;
                const padBottom = 24;
                const padTop = 8;
                const usableH = (svgH - padBottom) - padTop;
                const yBase = svgH - padBottom;
                const yMidGuide = yBase - usableH * 0.5;
                const stepX = (svgW - 50) / 6;

                // Points for Last Week (full 7 days)
                const lastPoints = lastWeekData.map((d, i) => {
                    const x = 25 + i * stepX;
                    const y = yBase - (d.mins / yMax) * usableH;
                    return { x, y, d };
                });

                // Points for This Week (only up to todayIndex)
                const thisPoints = thisWeekData.filter(d => d.dow <= todayIndex).map(d => {
                    const x = 25 + d.dow * stepX;
                    const y = yBase - (d.mins / yMax) * usableH;
                    return { x, y, d };
                });

                const lastPath = generateSmoothSvgPath(lastPoints);
                const thisPath = generateSmoothSvgPath(thisPoints);

                // Nodes & hitboxes
                const hitboxesSvg = dayNames.map((name, i) => {
                    const x = 25 + i * stepX;
                    const tw = thisWeekData[i];
                    const lw = lastWeekData[i];
                    const isToday = (i === todayIndex);
                    const isFuture = (i > todayIndex);
                    const dayDelta = tw.mins - lw.mins;

                    const hoverAction = `
                        const calloutText = document.getElementById('volume-inspect-text');
                        const calloutBadge = document.getElementById('volume-inspect-badge');
                        if (calloutText) {
                            calloutText.innerHTML = '${name} • THIS WEEK: <b>${isFuture ? 'UPCOMING' : tw.mins + 'm'}</b> vs LAST WEEK: <b>${lw.mins}m</b>${!isFuture ? ' (' + (dayDelta >= 0 ? '+' : '') + dayDelta + 'm DELTA)' : ''}';
                        }
                        if (calloutBadge) {
                            calloutBadge.className = 'text-[10px] ${!isFuture ? (dayDelta >= 0 ? 'bg-[#10B981]' : 'bg-[#FB923C]') : 'bg-zinc-200'} text-black px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold';
                            calloutBadge.innerText = '${!isFuture ? (dayDelta >= 0 ? '+' : '') + dayDelta + 'm' : 'PENDING'}';
                        }
                    `;

                    return `
                        <g class="cursor-pointer group" onmouseenter="${hoverAction}" onmouseleave="resetVolumeInspect()" onclick="${hoverAction}">
                            <rect x="${(x - 20).toFixed(1)}" y="0" width="40" height="${svgH}" fill="transparent"/>
                            <!-- Day Label text -->
                            <text x="${x.toFixed(1)}" y="${svgH - 6}" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="${isToday ? '#E11D48' : '#334155'}">${name}</text>
                        </g>
                    `;
                }).join('');

                const lastDotsSvg = lastPoints.map(p => `
                    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#94A3B8"/>
                `).join('');

                const thisDotsSvg = thisPoints.map((p, idx) => {
                    const isToday = (idx === thisPoints.length - 1);
                    return `
                        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isToday ? '6' : '5'}" fill="#000"/>
                        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isToday ? '4.5' : '3.5'}" fill="${isToday ? '#E11D48' : '#FACC15'}"/>
                    `;
                }).join('');

                const thisPathSvg = thisPoints.length > 1 ? `
                    <path d="${thisPath}" fill="none" stroke="#000" stroke-width="5.5" stroke-linecap="round"/>
                    <path d="${thisPath}" fill="none" stroke="#FACC15" stroke-width="3.5" stroke-linecap="round"/>
                ` : '';

                container.className = "h-36 sm:h-40 flex items-center justify-center p-0 min-w-0 w-full overflow-hidden relative";
                container.innerHTML = `
                    <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full h-full select-none" preserveAspectRatio="none">
                        <!-- Subtle Mid-level Guide Line -->
                        <line x1="15" y1="${yMidGuide.toFixed(1)}" x2="${svgW - 15}" y2="${yMidGuide.toFixed(1)}" stroke="#E2E8F0" stroke-dasharray="3 3" stroke-width="1"/>
                        <!-- Horizontal Base Guide -->
                        <line x1="15" y1="${yBase}" x2="${svgW - 15}" y2="${yBase}" stroke="#CBD5E1" stroke-width="1.5"/>

                        <!-- Ghost Benchmark Line: Last Week (Dashed Slate) -->
                        <path d="${lastPath}" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"/>
                        ${lastDotsSvg}

                        <!-- Active Combat Line: This Week (Bold Stark Yellow + Black Outline) -->
                        ${thisPathSvg}
                        ${thisDotsSvg}

                        <!-- Transparent Hover Hitboxes & Day Labels -->
                        ${hitboxesSvg}
                    </svg>
                `;
                return;
            }

            // ==============================================================
            // MODE 3: STANDARD BARS (7D OR 30D MODE)
            // ==============================================================
            activeVolumeCalloutState = {
                text: 'HOVER BARS TO INSPECT COMBAT SESSION BREAKDOWN',
                badgeText: 'CADENCE',
                badgeClass: 'text-[10px] bg-black text-[#FACC15] px-2 py-0.5 rounded border border-black shrink-0 font-mono font-bold'
            };
            resetVolumeInspect();

            if (rangeLabel) rangeLabel.innerText = `PAST ${days} DAYS COMBAT MINUTES`;

            const dayItems = [];
            const now = Date.now();
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now - i * 24 * 60 * 60 * 1000);
                const key = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(d) : d.toLocaleDateString('en-CA');
                const stats = dateMap[key] || { count: 0, mins: 0, workCount: 0, specialCount: 0, specialMins: 0, workMins: 0 };
                dayItems.push({
                    date: d,
                    key,
                    mins: stats.mins,
                    count: stats.count,
                    workCount: stats.workCount,
                    specialCount: stats.specialCount,
                    specialMins: stats.specialMins
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
                let fullTitle = `${d.date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short', month: 'short', day: 'numeric' })}: ${d.mins}m (${d.count}x)`;
                if (d.specialCount > 0) {
                    fullTitle = `${d.date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short', month: 'short', day: 'numeric' })}: ${d.mins}m (${d.workCount} combat + ${d.specialCount} special [${d.specialMins}m])`;
                }
                const barColor = (d.specialCount > 0 && d.workCount === 0)
                    ? 'bg-[#7C3AED]'
                    : (d.specialCount > 0 && d.workCount > 0)
                        ? 'bg-[#8B5CF6] ring-1 ring-black'
                        : (d.mins >= 100 ? 'bg-[#E11D48]' : d.mins > 0 ? 'bg-[#FACC15]' : 'bg-zinc-200/90 border-black/30 hover:border-black hover:bg-zinc-300');
                const shadowClass = hasMins ? 'shadow-[2px_2px_0px_#000]' : '';

                const dayLabelHtml = !is30 ? `
                    <span class="font-mono text-[9px] sm:text-[10px] font-bold text-black mt-1.5 truncate max-w-full text-center select-none block h-3 leading-none">
                        ${d.date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short' }).toUpperCase()}
                    </span>
                ` : '';

                return `
                    <div class="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative cursor-pointer" 
                         title="${fullTitle}"
                         onmouseenter="inspectVolumeBar('${d.key}', ${d.mins}, ${d.count}, ${d.workCount}, ${d.specialCount}, ${d.specialMins})"
                         onmouseleave="resetVolumeInspect()"
                         onclick="inspectVolumeBar('${d.key}', ${d.mins}, ${d.count}, ${d.workCount}, ${d.specialCount}, ${d.specialMins})">
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
                        { idx: 0, label: dayItems[0].date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 7, label: dayItems[7].date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 15, label: dayItems[15].date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 22, label: dayItems[22].date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric' }).toUpperCase() },
                        { idx: 29, label: `TODAY (${dayItems[29].date.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric' }).toUpperCase()})`, isToday: true }
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
            const spectrumMode = tacticalArchiveData.peakSpectrumMode || 'ALL';

            // 1. Filter by the active period (7 or 30 days) to accurately reflect Focus Volume Drill
            let logsToUse = customLogs || (tacticalArchiveData.workLogs || []).filter(l => {
                if (!l.completed_at) return false;
                return new Date(l.completed_at).getTime() >= cutoff;
            });

            // 2. Filter by Spectrum Mode: Weekend (Fri & Sat) vs Weekday (Sun - Thu) in Asia/Dhaka
            if (spectrumMode === 'WEEKDAYS') {
                logsToUse = logsToUse.filter(l => {
                    const dow = typeof getDhakaDayOfWeek === 'function' ? getDhakaDayOfWeek(l.completed_at) : new Date(l.completed_at).getDay();
                    return dow >= 0 && dow <= 4; // Sunday through Thursday
                });
            } else if (spectrumMode === 'WEEKENDS') {
                logsToUse = logsToUse.filter(l => {
                    const dow = typeof getDhakaDayOfWeek === 'function' ? getDhakaDayOfWeek(l.completed_at) : new Date(l.completed_at).getDay();
                    return dow === 5 || dow === 6; // Friday and Saturday
                });
            }

            const badgeTag = document.getElementById('peak-badge-tag');
            const footerLabel = document.getElementById('peak-spectrum-footer-label');
            const spectrumTitle = document.getElementById('peak-spectrum-title');

            if (badgeTag) badgeTag.innerText = `${days}D ${spectrumMode === 'ALL' ? 'SPECTRUM' : spectrumMode}`;
            if (footerLabel) footerLabel.innerText = `PAST ${days} DAYS`;
            if (spectrumTitle) {
                spectrumTitle.innerText = spectrumMode === 'WEEKDAYS' 
                    ? 'WEEKDAY RHYTHM (SUN-THU)' 
                    : spectrumMode === 'WEEKENDS' 
                        ? 'WEEKEND RHYTHM (FRI-SAT)' 
                        : '24-HOUR COMBAT SPECTRUM';
            }

            const hourlyCounts = new Array(24).fill(0);
            logsToUse.forEach(l => {
                if (l.completed_at) {
                    const h = typeof getDhakaHour === 'function' ? getDhakaHour(l.completed_at) : new Date(l.completed_at).getHours();
                    if (h >= 0 && h < 24) hourlyCounts[h]++;
                }
            });

            const maxHourly = Math.max(...hourlyCounts, 0);
            const yMaxHourly = Math.max(4, Math.ceil(Math.max(maxHourly, 4) / 2) * 2);
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
            const modeDesc = spectrumMode === 'WEEKENDS' ? 'WEEKEND' : spectrumMode === 'WEEKDAYS' ? 'WEEKDAY' : '';
            let peakRangeStr = `NO ${modeDesc ? modeDesc + ' ' : ''}SESSIONS RECORDED YET`;
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
            } else if (filter === 'SPECIAL' || filter === 'CUSTOM') {
                filtered = filtered.filter(l => typeof isCustomPhase === 'function' && isCustomPhase(l.phase));
            } else if (filter === 'BREAK') {
                filtered = filtered.filter(l => l.phase === 'SHORT_BREAK' || l.phase === 'LONG_BREAK');
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
                const isCustom = typeof isCustomPhase === 'function' && isCustomPhase(item.phase);
                const isWork = item.phase === 'WORK';
                const isLongBreak = item.phase === 'LONG_BREAK';
                const dateObj = item.completed_at ? new Date(item.completed_at) : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
                const dur = Number(item.duration_minutes) || (isWork || isCustom ? 25 : (isLongBreak ? 15 : 5));

                let badgeHtml = '';
                let statusHtml = '';
                let xpHtml = '';
                if (isCustom) {
                    badgeHtml = `<span class="bg-[#7C3AED] text-white font-mono font-bold text-xs px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-none"><i data-lucide="zap" class="w-3 h-3 text-[#FACC15]"></i> SPECIAL OPS</span>`;
                    statusHtml = `<span class="text-purple-700 font-mono font-bold text-xs inline-flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> CONQUERED</span>`;
                    xpHtml = `<span class="text-amber-600 font-mono font-black text-xs">+${dur * 10} XP</span>`;
                } else if (isWork) {
                    badgeHtml = `<span class="bg-[#E11D48] text-white font-mono font-bold text-xs px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-none"><i data-lucide="swords" class="w-3 h-3"></i> COMBAT</span>`;
                    statusHtml = `<span class="text-emerald-700 font-mono font-bold text-xs inline-flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> CONQUERED</span>`;
                    xpHtml = `<span class="text-amber-600 font-mono font-black text-xs">+${dur * 10} XP</span>`;
                } else if (isLongBreak) {
                    badgeHtml = `<span class="bg-[#FACC15] text-black font-mono font-bold text-xs px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-none"><i data-lucide="award" class="w-3 h-3"></i> SHAWARMA</span>`;
                    statusHtml = `<span class="text-amber-700 font-mono font-bold text-xs inline-flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> REPLENISHED</span>`;
                    xpHtml = `<span class="text-cyan-600 font-mono font-black text-xs">+${dur * 5} XP</span>`;
                } else {
                    badgeHtml = `<span class="bg-[#06B6D4] text-black font-mono font-bold text-xs px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-none"><i data-lucide="coffee" class="w-3 h-3"></i> RECHARGE</span>`;
                    statusHtml = `<span class="text-cyan-700 font-mono font-bold text-xs inline-flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> REPLENISHED</span>`;
                    xpHtml = `<span class="text-cyan-600 font-mono font-black text-xs">+${dur * 5} XP</span>`;
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
                            ${dur} MINS
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

        // =========================================================================
        // 7C. S.H.I.E.L.D. WEEKLY TACTICAL DEBRIEF CONTROLLER
        // =========================================================================
        let activeWeeklyDebriefData = null;

        function openWeeklyDebriefModal() {
            const modal = document.getElementById('weekly-debrief-modal');
            if (!modal) return;

            if (typeof AudioEngine !== 'undefined' && AudioEngine.repulsorZap) {
                AudioEngine.repulsorZap();
            }

            // Calculate this week's metrics (past 7 days in Asia/Dhaka)
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            // Format date range (e.g. OCT 25 — NOV 01)
            const startStr = sevenDaysAgo.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric' }).toUpperCase();
            const endStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric' }).toUpperCase();
            const rangeText = `${startStr} — ${endStr}`;

            const weekLogs = (tacticalArchiveData.workLogs || []).filter(l => {
                if (!l.completed_at) return false;
                return new Date(l.completed_at).getTime() >= sevenDaysAgo.getTime();
            });

            // 1. Total Combat Output this week
            const totalWeekMinutes = weekLogs.reduce((acc, l) => acc + (Number(l.duration_minutes) || 25), 0);
            const totalWeekHours = (totalWeekMinutes / 60).toFixed(1);
            const totalOps = weekLogs.length;

            // 2. Most Productive Day
            const dayMinsMap = {};
            const dayOpsMap = {};
            weekLogs.forEach(l => {
                const key = typeof getDhakaDateKey === 'function' ? getDhakaDateKey(l.completed_at) : new Date(l.completed_at).toLocaleDateString('en-CA');
                if (!key) return;
                const dur = Number(l.duration_minutes) || 25;
                dayMinsMap[key] = (dayMinsMap[key] || 0) + dur;
                dayOpsMap[key] = (dayOpsMap[key] || 0) + 1;
            });

            let topDayKey = null;
            let topDayMins = 0;
            Object.keys(dayMinsMap).forEach(key => {
                if (dayMinsMap[key] > topDayMins) {
                    topDayMins = dayMinsMap[key];
                    topDayKey = key;
                }
            });

            let topDayName = "STANDBY";
            let topDayDetail = "0 MINS PEAK";
            if (topDayKey) {
                const topDate = new Date(topDayKey + 'T12:00:00Z');
                topDayName = topDate.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long' }).toUpperCase();
                topDayDetail = `${topDayMins} MINS (${dayOpsMap[topDayKey] || 0} OPS)`;
            }

            // 3. Longest Active Streak during this week
            const activeDates = Object.keys(dayMinsMap).sort();
            const streakDays = activeDates.length;

            // 4. Total XP Earned & Rank status
            const totalXP = totalWeekMinutes * 10;
            let currentRankName = "RANK 1 AGENT";
            if (typeof window.SHIELD_RANKS !== 'undefined' && window.SHIELD_RANKS) {
                const globalXP = window.latestTotalXP || totalXP;
                let foundRank = window.SHIELD_RANKS[0];
                for (let r of window.SHIELD_RANKS) {
                    if (globalXP >= r.minXP) foundRank = r;
                }
                currentRankName = `RANK ${foundRank.level} ${foundRank.name}`;
            }

            // 5. Hero MVP
            const heroCounts = {};
            weekLogs.forEach(l => {
                const h = l.hero || (typeof currentHeroKey !== 'undefined' ? currentHeroKey : 'ironman');
                heroCounts[h] = (heroCounts[h] || 0) + 1;
            });

            let mvpHeroKey = (typeof currentHeroKey !== 'undefined' ? currentHeroKey : 'ironman');
            let maxHeroOps = 0;
            Object.keys(heroCounts).forEach(h => {
                if (heroCounts[h] > maxHeroOps) {
                    maxHeroOps = heroCounts[h];
                    mvpHeroKey = h;
                }
            });

            const heroProfile = (typeof HERO_PROFILES !== 'undefined' && HERO_PROFILES[mvpHeroKey]) 
                ? HERO_PROFILES[mvpHeroKey] 
                : { name: "IRON MAN (TONY STARK)", themeColor: "#E62429", emblemIcon: MARVEL_ICONS.arcReactor, quotes: { WORK: ["Suit power at 100%. Lock in!"] } };

            const heroSharePct = totalOps > 0 ? Math.round((maxHeroOps / totalOps) * 100) : 100;
            const heroWorkQuotes = heroProfile.quotes?.WORK || ["Suit systems operational."];
            const heroQuote = heroWorkQuotes[Math.floor(Math.random() * heroWorkQuotes.length)];

            // Tactical AI Assessment
            let aiAssessment = "";
            if (totalWeekHours >= 15) {
                aiAssessment = `Exceptional combat momentum! Your 7-day focus throughput (${totalWeekHours}h) surpassed standard S.H.I.E.L.D. flight requirements. High wave completion with ${heroProfile.name.split(' ')[0]} as tactical MVP.`;
            } else if (totalWeekHours >= 5) {
                aiAssessment = `Solid operational cadence. You logged ${totalWeekHours}h of combat across ${streakDays} active days. Peak output achieved on ${topDayName}. Recommended protocol: Maintain 5-minute recharge intervals to push for clearance promotion.`;
            } else {
                aiAssessment = `Reconnaissance phase detected. Logged ${totalWeekHours}h across ${totalOps} sessions. Recommendation: Engage early morning combat slots with ${heroProfile.name.split(' ')[0]} to accelerate weekly rank ascension.`;
            }

            // Populate DOM
            const elDateRange = document.getElementById('debrief-date-range');
            const elTotalHours = document.getElementById('debrief-total-hours');
            const elTotalOps = document.getElementById('debrief-total-ops');
            const elTopDay = document.getElementById('debrief-top-day');
            const elTopDayDetail = document.getElementById('debrief-top-day-detail');
            const elStreakDays = document.getElementById('debrief-streak-days');
            const elStreakSub = document.getElementById('debrief-streak-sub');
            const elXPEarned = document.getElementById('debrief-xp-earned');
            const elRankStatus = document.getElementById('debrief-rank-status');
            const elHeroAvatar = document.getElementById('debrief-hero-avatar-wrap');
            const elHeroShare = document.getElementById('debrief-hero-share');
            const elHeroName = document.getElementById('debrief-hero-name');
            const elHeroQuote = document.getElementById('debrief-hero-quote');
            const elAssessment = document.getElementById('debrief-ai-assessment');

            if (elDateRange) elDateRange.innerText = rangeText;
            if (elTotalHours) elTotalHours.innerText = `${totalWeekHours}h`;
            if (elTotalOps) elTotalOps.innerText = `${totalOps} SESSIONS COMPLETED`;
            if (elTopDay) elTopDay.innerText = topDayName;
            if (elTopDayDetail) elTopDayDetail.innerText = topDayDetail;
            if (elStreakDays) elStreakDays.innerText = streakDays;
            if (elStreakSub) elStreakSub.innerText = `${streakDays}/7 DAYS ACTIVE`;
            if (elXPEarned) elXPEarned.innerText = `+${totalXP.toLocaleString()} XP`;
            if (elRankStatus) elRankStatus.innerText = currentRankName;

            if (elHeroAvatar) {
                elHeroAvatar.style.backgroundColor = heroProfile.themeColor || '#000';
                elHeroAvatar.innerHTML = heroProfile.emblemIcon || MARVEL_ICONS.arcReactor;
            }
            if (elHeroShare) elHeroShare.innerText = `${heroSharePct}% OF SESSIONS`;
            if (elHeroName) elHeroName.innerText = heroProfile.name;
            if (elHeroQuote) elHeroQuote.innerText = `"${heroQuote}"`;
            if (elAssessment) elAssessment.innerText = aiAssessment;

            activeWeeklyDebriefData = {
                rangeText,
                totalWeekHours,
                totalOps,
                topDayName,
                topDayDetail,
                streakDays,
                totalXP,
                currentRankName,
                heroName: heroProfile.name,
                heroSharePct,
                heroQuote,
                aiAssessment
            };

            modal.classList.remove('hidden');
            if (window.lucide) lucide.createIcons();
        }

        function closeWeeklyDebriefModal() {
            const modal = document.getElementById('weekly-debrief-modal');
            if (modal) modal.classList.add('hidden');
        }

        function copyWeeklyDebriefToClipboard() {
            if (!activeWeeklyDebriefData) return;
            const d = activeWeeklyDebriefData;

            const text = [
                `🛡️ S.H.I.E.L.D. WEEKLY TACTICAL DEBRIEF 🛡️`,
                `Cycle: ${d.rangeText}`,
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                `⏱️ Total Combat Output: ${d.totalWeekHours}h (${d.totalOps} sessions)`,
                `🔥 Most Productive Day: ${d.topDayName} (${d.topDayDetail})`,
                `⚡ Active Cadence: ${d.streakDays}/7 Days Active`,
                `⭐ Combat XP Earned: +${d.totalXP.toLocaleString()} XP`,
                `🎖️ Clearance Rank: ${d.currentRankName}`,
                `🦸 Hero MVP: ${d.heroName} (${d.heroSharePct}% of missions)`,
                `💬 "${d.heroQuote}"`,
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                `Tactical Assessment:`,
                `${d.aiAssessment}`,
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                `Generated by S.H.I.E.L.D. Chrono-HUD`
            ].join('\n');

            navigator.clipboard.writeText(text).then(() => {
                if (typeof showToast === 'function') {
                    showToast("WEEKLY DEBRIEF COPIED TO CLIPBOARD!", "success");
                }
                if (typeof AudioEngine !== 'undefined' && AudioEngine.uiTick) {
                    AudioEngine.uiTick();
                }
            }).catch(err => {
                console.warn("Clipboard copy failed:", err);
            });
        }

        window.openWeeklyDebriefModal = openWeeklyDebriefModal;
        window.closeWeeklyDebriefModal = closeWeeklyDebriefModal;
        window.copyWeeklyDebriefToClipboard = copyWeeklyDebriefToClipboard;
        window.setVolumeViewMode = setVolumeViewMode;
        window.setPeakSpectrumMode = setPeakSpectrumMode;
        window.setVolumeRange = setVolumeRange;
        window.inspectVolumeBar = inspectVolumeBar;
        window.resetVolumeInspect = resetVolumeInspect;
        window.inspectHourlyBar = inspectHourlyBar;
        window.resetHourlyInspect = resetHourlyInspect;
        window.setArchiveFilter = setArchiveFilter;
        window.changeArchivePage = changeArchivePage;
        window.inspectHeatmapTile = inspectHeatmapTile;
        window.loadTacticalStats = loadTacticalStats;

