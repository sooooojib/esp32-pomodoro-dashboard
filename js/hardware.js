        // =========================================================================
        // 6. SUPABASE REALTIME SUBSCRIPTION
        // =========================================================================
        // Dual Connection State Tracking: Both ESP32 hardware and Supabase must be online, otherwise indicator stays red
        let isSupabaseConnected = false;
        let isEspConnected = false;
        let lastEspHeartbeat = 0;
        const ESP_HEARTBEAT_TIMEOUT_MS = 60000; // 60 seconds tolerance for hardware updates

        function evaluateConnectionStatus() {
            const connSub = document.getElementById("conn-sub");
            if (isSupabaseConnected && isEspConnected) {
                // Both ESP32 hardware and Supabase cloud are connected -> GREEN
                connDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-ping";
                connLabel.innerText = "ESP32 BEAMED IN";
                connLabel.className = "font-mono text-[10px] font-bold text-emerald-700 uppercase tracking-wider leading-none";
                if (connSub) {
                    connSub.innerText = "PORT: 443 / SUPABASE ONLINE";
                    connSub.className = "text-[9px] font-mono text-emerald-600 font-bold leading-tight";
                }
                connPill.className = "flex items-center gap-2 bg-emerald-50 border-2 border-black px-3 py-1.5 rounded-lg shadow-none";
            } else {
                // Otherwise -> STAYS RED
                connDot.className = "w-2.5 h-2.5 rounded-full bg-red-500 border border-black animate-pulse";
                connPill.className = "flex items-center gap-2 bg-red-50 border-2 border-black px-3 py-1.5 rounded-lg shadow-none";

                if (!isSupabaseConnected) {
                    connLabel.innerText = "LINK DROPPED";
                    if (connSub) {
                        connSub.innerText = "SUPABASE OFFLINE";
                        connSub.className = "text-[9px] font-mono text-red-500 font-bold leading-tight";
                    }
                } else {
                    connLabel.innerText = "ESP32 OFFLINE";
                    if (connSub) {
                        connSub.innerText = "WAITING FOR HARDWARE";
                        connSub.className = "text-[9px] font-mono text-red-500 font-bold leading-tight";
                    }
                }
                connLabel.className = "font-mono text-[10px] font-bold text-red-700 uppercase tracking-wider leading-none";
            }
        }

        // Hardware Watchdog: checks every 3 seconds if ESP32 timed out
        setInterval(() => {
            if (isEspConnected && lastEspHeartbeat && (Date.now() - lastEspHeartbeat > ESP_HEARTBEAT_TIMEOUT_MS)) {
                console.warn("ESP32 heartbeat timed out (> 60s without events)");
                isEspConnected = false;
                evaluateConnectionStatus();
            }
        }, 3000);

        async function fetchInitialState() {
            try {
                const { data, error } = await supabaseClient
                    .from('device_state')
                    .select('*')
                    .eq('id', 1)
                    .single();

                if (error) {
                    console.warn("Supabase fetch error:", error);
                    isSupabaseConnected = false;
                    isEspConnected = false;
                    evaluateConnectionStatus();
                    return;
                }

                isSupabaseConnected = true;

                if (data) {
                    applyState(data);

                    // Check if ESP32 hardware state has recent activity (within 60 seconds)
                    if (data.updated_at) {
                        const updatedEpoch = new Date(data.updated_at).getTime();
                        const diffSec = (Date.now() - updatedEpoch) / 1000;
                        if (diffSec >= 0 && diffSec <= (ESP_HEARTBEAT_TIMEOUT_MS / 1000)) {
                            lastEspHeartbeat = updatedEpoch;
                            isEspConnected = true;
                        } else {
                            isEspConnected = false;
                        }
                    } else {
                        isEspConnected = false;
                    }
                }
                evaluateConnectionStatus();
            } catch (err) {
                console.error("Supabase fetch error:", err);
                isSupabaseConnected = false;
                isEspConnected = false;
                evaluateConnectionStatus();
            }
        }

        function subscribeToRealtime() {
            if (!supabaseClient) return;
            // Live Hardware Device State Listener (id = 1)
            supabaseClient
                .channel('device_state_feed')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'device_state', filter: 'id=eq.1' },
                    (payload) => {
                        console.log("ESP32 Hardware Event:", payload.new);
                        lastEspHeartbeat = Date.now();
                        isEspConnected = true;
                        isSupabaseConnected = true;
                        applyState(payload.new);
                        evaluateConnectionStatus();
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        isSupabaseConnected = true;
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        isSupabaseConnected = false;
                        isEspConnected = false;
                    }
                    evaluateConnectionStatus();
                });

            // Live Session Logs Auto-Refresh Listener (ESP32 Background HTTP POST Hook)
            supabaseClient
                .channel('shield_logs_channel')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'session_logs' },
                    async (payload) => {
                        console.log("ESP32 Finished Work Session - Hardware Event:", payload.new);
                        lastEspHeartbeat = Date.now();
                        isEspConnected = true;
                        isSupabaseConnected = true;
                        evaluateConnectionStatus();

                        if (typeof updateTacticalDebrief === 'function') {
                            await updateTacticalDebrief();
                        }
                        if (typeof loadAnalytics === 'function') {
                            await loadAnalytics();
                        }
                        if (typeof loadTacticalStats === 'function') {
                            await loadTacticalStats();
                        }
                        
                        // Automatic Audio Chime & Fanfare
                        if (typeof AudioEngine !== 'undefined') {
                            AudioEngine.fanfare();
                            setTimeout(() => {
                                if (AudioEngine.repulsorZap) AudioEngine.repulsorZap();
                            }, 350);
                        }

                        // Automatic Hero Superpower Animation
                        if (typeof triggerSuperpower === 'function') {
                            triggerSuperpower(currentHeroKey);
                        }

                        showToast("MISSION COMPLETE: S.H.I.E.L.D. DEBRIEF UPDATED!", "done");
                    }
                )
                .subscribe();
        }

        function setConnectionStatus(status) {
            if (status === 'ONLINE') {
                isSupabaseConnected = true;
            } else if (status === 'ERROR' || status === 'OFFLINE') {
                isSupabaseConnected = false;
                isEspConnected = false;
            }
            evaluateConnectionStatus();
        }

        async function manualSync() {
            const spinner = document.getElementById('sync-spinner');
            if (spinner) spinner.classList.add('rotate-180');
            AudioEngine.repulsorZap();
            await fetchInitialState();
            await loadAnalytics();
            if (typeof updateTacticalDebrief === 'function') {
                await updateTacticalDebrief();
            }
            if (typeof loadTacticalStats === 'function') {
                await loadTacticalStats();
            }
            setTimeout(() => {
                if (spinner) spinner.classList.remove('rotate-180');
                if (isSupabaseConnected && isEspConnected) {
                    showToast("ESP32 & SUPABASE SYNCED!", "sync");
                } else if (isSupabaseConnected) {
                    showToast("CLOUD ONLINE • ESP32 OFFLINE", "pause");
                } else {
                    showToast("CONNECTION FAILED: CHECK NETWORK", "pause");
                }
            }, 300);
        }

