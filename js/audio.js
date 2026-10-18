        // =========================================================================
        // 2. STUDIO-GRADE WEB AUDIO API SYNTHESIZER (Superhero SFX Engine)
        // =========================================================================
        const AudioEngine = {
            ctx: null,
            masterGain: null,
            noiseBuffer: null,
            muted: localStorage.getItem('avengers_muted') === 'true',

            init() {
                if (!this.ctx) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) {
                        this.ctx = new AudioContext();

                        // Master Output Gain with full, punchy, uncompressed arcade volume (1.6x boost)
                        this.masterGain = this.ctx.createGain();
                        this.masterGain.gain.setValueAtTime(1.6, this.ctx.currentTime);
                        this.masterGain.connect(this.ctx.destination);
                    }
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume().catch(() => {});
                }
            },

            ensureActive() {
                if (this.muted) return false;
                this.init();
                if (!this.ctx) return false;
                if (this.ctx.state === 'suspended') {
                    this.ctx.resume().catch(() => {});
                }
                return true;
            },

            getDest() {
                return this.masterGain || (this.ctx ? this.ctx.destination : null);
            },

            // Cached reusable white noise buffer (0ms generation latency)
            getNoiseBuffer() {
                if (!this.ctx) return null;
                if (!this.noiseBuffer) {
                    const bufferSize = Math.floor(this.ctx.sampleRate * 2.0);
                    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    const output = this.noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
                }
                return this.noiseBuffer;
            },

            playTone(freq, type = 'sine', duration = 0.1, startTime = 0, volume = 0.5) {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime + startTime;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(Math.max(0.0001, volume), t);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

                    osc.connect(gain);
                    gain.connect(this.getDest());

                    osc.start(t);
                    osc.stop(t + duration + 0.02);
                } catch (e) {
                    console.warn('Audio tone error:', e);
                }
            },

            // 1. IRON MAN: Arc Repulsor Cannon Blast (Loud resonant laser chirp + sustained plasma beam hum + sub blast)
            repulsorZap() {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();

                    // Plasma laser chirp through resonant lowpass filter
                    const osc = this.ctx.createOscillator();
                    const filter = this.ctx.createBiquadFilter();
                    const gain = this.ctx.createGain();

                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(2400, t);
                    osc.frequency.exponentialRampToValueAtTime(380, t + 0.16);

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(4500, t);
                    filter.frequency.exponentialRampToValueAtTime(800, t + 0.16);
                    filter.Q.setValueAtTime(4.8, t);

                    gain.gain.setValueAtTime(0.95, t);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(dest);
                    osc.start(t);
                    osc.stop(t + 0.17);

                    // Sustained Arc Plasma Beam Hum (lasting for the visual beam duration ~0.45s)
                    const beamOsc = this.ctx.createOscillator();
                    const beamFilter = this.ctx.createBiquadFilter();
                    const beamGain = this.ctx.createGain();
                    beamOsc.type = 'triangle';
                    beamOsc.frequency.setValueAtTime(175, t);
                    beamFilter.type = 'bandpass';
                    beamFilter.frequency.setValueAtTime(1200, t);
                    beamFilter.Q.setValueAtTime(2.5, t);
                    beamGain.gain.setValueAtTime(0.001, t);
                    beamGain.gain.linearRampToValueAtTime(0.7, t + 0.05);
                    beamGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
                    beamOsc.connect(beamFilter);
                    beamFilter.connect(beamGain);
                    beamGain.connect(dest);
                    beamOsc.start(t);
                    beamOsc.stop(t + 0.46);

                    // Sub-charge body weight
                    const subOsc = this.ctx.createOscillator();
                    const subGain = this.ctx.createGain();
                    subOsc.type = 'sine';
                    subOsc.frequency.setValueAtTime(320, t);
                    subOsc.frequency.exponentialRampToValueAtTime(70, t + 0.28);

                    subGain.gain.setValueAtTime(0.85, t);
                    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

                    subOsc.connect(subGain);
                    subGain.connect(dest);
                    subOsc.start(t);
                    subOsc.stop(t + 0.29);
                } catch (e) {
                    console.warn('repulsorZap error:', e);
                }
            },

            // 2. CAPTAIN AMERICA: Vibranium Shield Strike Clang + Secondary Ricochet Ping
            shieldClang() {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();

                    // Sharp metal impact transient
                    const oscHit = this.ctx.createOscillator();
                    const gainHit = this.ctx.createGain();
                    oscHit.type = 'triangle';
                    oscHit.frequency.setValueAtTime(2800, t);
                    oscHit.frequency.exponentialRampToValueAtTime(750, t + 0.05);
                    gainHit.gain.setValueAtTime(1.0, t);
                    gainHit.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
                    oscHit.connect(gainHit);
                    gainHit.connect(dest);
                    oscHit.start(t);
                    oscHit.stop(t + 0.055);

                    // Vibranium harmonic ring 1 (1046.5Hz - C6)
                    const oscRing1 = this.ctx.createOscillator();
                    const gainRing1 = this.ctx.createGain();
                    oscRing1.type = 'sine';
                    oscRing1.frequency.setValueAtTime(1046.5, t);
                    gainRing1.gain.setValueAtTime(0.9, t);
                    gainRing1.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
                    oscRing1.connect(gainRing1);
                    gainRing1.connect(dest);
                    oscRing1.start(t);
                    oscRing1.stop(t + 0.59);

                    // Vibranium high overtone chime (2093Hz - C7)
                    const oscRing2 = this.ctx.createOscillator();
                    const gainRing2 = this.ctx.createGain();
                    oscRing2.type = 'triangle';
                    oscRing2.frequency.setValueAtTime(2093, t);
                    gainRing2.gain.setValueAtTime(0.7, t);
                    gainRing2.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
                    oscRing2.connect(gainRing2);
                    gainRing2.connect(dest);
                    oscRing2.start(t);
                    oscRing2.stop(t + 0.46);

                    // Secondary Ricochet Ping at t + 0.22s (matches screen bounce)
                    const oscRic = this.ctx.createOscillator();
                    const gainRic = this.ctx.createGain();
                    oscRic.type = 'sine';
                    oscRic.frequency.setValueAtTime(1396.9, t + 0.22);
                    gainRic.gain.setValueAtTime(0.001, t);
                    gainRic.gain.setValueAtTime(0.65, t + 0.22);
                    gainRic.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
                    oscRic.connect(gainRic);
                    gainRic.connect(dest);
                    oscRic.start(t + 0.22);
                    oscRic.stop(t + 0.49);
                } catch (e) {
                    console.warn('shieldClang error:', e);
                }
            },

            // 3. THOR: Mjolnir Thunder Strike (Blinding electric crack + Cataclysmic detonation + Rolling thunder tremor)
            thunderStrike() {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();
                    const noise = this.getNoiseBuffer();

                    // A. Initial Sharp Lightning Crack Noise Burst (Instant at t)
                    if (noise) {
                        const crackSource = this.ctx.createBufferSource();
                        crackSource.buffer = noise;

                        const crackFilter = this.ctx.createBiquadFilter();
                        crackFilter.type = 'bandpass';
                        crackFilter.frequency.setValueAtTime(2600, t);
                        crackFilter.frequency.exponentialRampToValueAtTime(450, t + 0.14);
                        crackFilter.Q.setValueAtTime(2.5, t);

                        const crackGain = this.ctx.createGain();
                        crackGain.gain.setValueAtTime(1.0, t);
                        crackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

                        crackSource.connect(crackFilter);
                        crackFilter.connect(crackGain);
                        crackGain.connect(dest);
                        crackSource.start(t);
                        crackSource.stop(t + 0.16);
                    }

                    // B. High-Voltage Electric Arc Zap (Instant electric snap)
                    const zapOsc = this.ctx.createOscillator();
                    const zapGain = this.ctx.createGain();
                    zapOsc.type = 'sawtooth';
                    zapOsc.frequency.setValueAtTime(1400, t);
                    zapOsc.frequency.exponentialRampToValueAtTime(95, t + 0.18);
                    zapGain.gain.setValueAtTime(0.95, t);
                    zapGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
                    zapOsc.connect(zapGain);
                    zapGain.connect(dest);
                    zapOsc.start(t);
                    zapOsc.stop(t + 0.19);

                    // C. Secondary Cataclysmic Detonation Boom (Heavy thunder strike at t + 0.13s)
                    if (noise) {
                        const boomSource = this.ctx.createBufferSource();
                        boomSource.buffer = noise;

                        const boomFilter = this.ctx.createBiquadFilter();
                        boomFilter.type = 'lowpass';
                        boomFilter.frequency.setValueAtTime(750, t + 0.13);
                        boomFilter.frequency.exponentialRampToValueAtTime(85, t + 0.45);

                        const boomGain = this.ctx.createGain();
                        boomGain.gain.setValueAtTime(0.001, t);
                        boomGain.gain.setValueAtTime(1.0, t + 0.13);
                        boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

                        boomSource.connect(boomFilter);
                        boomFilter.connect(boomGain);
                        boomGain.connect(dest);
                        boomSource.start(t + 0.13);
                        boomSource.stop(t + 0.47);
                    }

                    // D. Resonant Thunder Drop Sweep (Heavy pitch fall at t + 0.13s)
                    const dropOsc = this.ctx.createOscillator();
                    const dropGain = this.ctx.createGain();
                    dropOsc.type = 'sawtooth';
                    dropOsc.frequency.setValueAtTime(320, t + 0.13);
                    dropOsc.frequency.exponentialRampToValueAtTime(42, t + 0.55);
                    dropGain.gain.setValueAtTime(0.001, t);
                    dropGain.gain.setValueAtTime(1.0, t + 0.13);
                    dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
                    dropOsc.connect(dropGain);
                    dropGain.connect(dest);
                    dropOsc.start(t + 0.13);
                    dropOsc.stop(t + 0.56);

                    // E. Deep Rolling Asgardian Sub-Bass Thunder Tremor (0.04s to 0.95s)
                    const rumbleOsc = this.ctx.createOscillator();
                    const rumbleGain = this.ctx.createGain();
                    rumbleOsc.type = 'triangle';
                    rumbleOsc.frequency.setValueAtTime(115, t + 0.04);
                    rumbleOsc.frequency.exponentialRampToValueAtTime(26, t + 0.95);
                    rumbleGain.gain.setValueAtTime(0.001, t);
                    rumbleGain.gain.linearRampToValueAtTime(1.0, t + 0.16);
                    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
                    rumbleOsc.connect(rumbleGain);
                    rumbleGain.connect(dest);
                    rumbleOsc.start(t + 0.04);
                    rumbleOsc.stop(t + 0.96);

                    // F. Sub-Bass Floor Shaker (Sine wave 60Hz down to 22Hz)
                    const subOsc = this.ctx.createOscillator();
                    const subGain = this.ctx.createGain();
                    subOsc.type = 'sine';
                    subOsc.frequency.setValueAtTime(65, t + 0.1);
                    subOsc.frequency.exponentialRampToValueAtTime(22, t + 0.85);
                    subGain.gain.setValueAtTime(0.001, t);
                    subGain.gain.setValueAtTime(0.9, t + 0.14);
                    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
                    subOsc.connect(subGain);
                    subGain.connect(dest);
                    subOsc.start(t + 0.1);
                    subOsc.stop(t + 0.86);
                } catch (e) {
                    console.warn('thunderStrike error:', e);
                }
            },

            // 4. SPIDER-MAN: Web Shoot & Net Burst (Loud authentic pneumatic *THWIP!* + pluck + zing)
            webShot() {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();
                    const noise = this.getNoiseBuffer();

                    // Compressed air fluid hiss (cached buffer, 120ms)
                    if (noise) {
                        const noiseSource = this.ctx.createBufferSource();
                        noiseSource.buffer = noise;

                        const noiseFilter = this.ctx.createBiquadFilter();
                        noiseFilter.type = 'bandpass';
                        noiseFilter.frequency.setValueAtTime(3800, t);
                        noiseFilter.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
                        noiseFilter.Q.setValueAtTime(3.5, t);

                        const noiseGain = this.ctx.createGain();
                        noiseGain.gain.setValueAtTime(0.95, t);
                        noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

                        noiseSource.connect(noiseFilter);
                        noiseFilter.connect(noiseGain);
                        noiseGain.connect(dest);
                        noiseSource.start(t);
                        noiseSource.stop(t + 0.13);
                    }

                    // Elastic web strand tension pluck (2200Hz -> 420Hz)
                    const pluckOsc = this.ctx.createOscillator();
                    const pluckGain = this.ctx.createGain();
                    pluckOsc.type = 'sine';
                    pluckOsc.frequency.setValueAtTime(2200, t);
                    pluckOsc.frequency.exponentialRampToValueAtTime(420, t + 0.14);
                    pluckGain.gain.setValueAtTime(0.9, t);
                    pluckGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
                    pluckOsc.connect(pluckGain);
                    pluckGain.connect(dest);
                    pluckOsc.start(t);
                    pluckOsc.stop(t + 0.15);

                    // Web Line Tension Vibration Ring (matches web rays expanding across screen)
                    const zingOsc = this.ctx.createOscillator();
                    const zingGain = this.ctx.createGain();
                    zingOsc.type = 'triangle';
                    zingOsc.frequency.setValueAtTime(880, t + 0.05);
                    zingOsc.frequency.exponentialRampToValueAtTime(440, t + 0.35);
                    zingGain.gain.setValueAtTime(0.001, t);
                    zingGain.gain.linearRampToValueAtTime(0.65, t + 0.08);
                    zingGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
                    zingOsc.connect(zingGain);
                    zingGain.connect(dest);
                    zingOsc.start(t + 0.05);
                    zingOsc.stop(t + 0.36);
                } catch (e) {
                    console.warn('webShot error:', e);
                }
            },

            // 5. HULK: Seismic Ground Smash (Air Whoosh + Concrete Shatter Crunch + Sub-bass Earthquake Tremor)
            hulkSmash(delay = 0) {
                if (!this.ensureActive()) return;
                try {
                    const baseT = this.ctx.currentTime;
                    const dest = this.getDest();
                    const noise = this.getNoiseBuffer();
                    const impactTime = baseT + Math.max(0, delay);

                    // A. Dual-Fist Incoming Air Whoosh (sweeps from 0 to impactTime if delay >= 0.08)
                    if (delay >= 0.08 && noise) {
                        const whooshSource = this.ctx.createBufferSource();
                        whooshSource.buffer = noise;

                        const whooshFilter = this.ctx.createBiquadFilter();
                        whooshFilter.type = 'bandpass';
                        whooshFilter.frequency.setValueAtTime(220, baseT);
                        whooshFilter.frequency.exponentialRampToValueAtTime(1400, impactTime);
                        whooshFilter.Q.setValueAtTime(1.5, baseT);

                        const whooshGain = this.ctx.createGain();
                        whooshGain.gain.setValueAtTime(0.01, baseT);
                        whooshGain.gain.linearRampToValueAtTime(0.7, impactTime - 0.02);
                        whooshGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.03);

                        whooshSource.connect(whooshFilter);
                        whooshFilter.connect(whooshGain);
                        whooshGain.connect(dest);
                        whooshSource.start(baseT);
                        whooshSource.stop(impactTime + 0.05);
                    }

                    // B. Massive Concrete Impact Crunch (Noise blast at impactTime)
                    if (noise) {
                        const noiseSource = this.ctx.createBufferSource();
                        noiseSource.buffer = noise;

                        const noiseFilter = this.ctx.createBiquadFilter();
                        noiseFilter.type = 'lowpass';
                        noiseFilter.frequency.setValueAtTime(1200, impactTime);
                        noiseFilter.frequency.exponentialRampToValueAtTime(160, impactTime + 0.22);

                        const noiseGain = this.ctx.createGain();
                        noiseGain.gain.setValueAtTime(1.0, impactTime);
                        noiseGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.22);

                        noiseSource.connect(noiseFilter);
                        noiseFilter.connect(noiseGain);
                        noiseGain.connect(dest);
                        noiseSource.start(impactTime);
                        noiseSource.stop(impactTime + 0.25);
                    }

                    // C. Heavy Seismic Downward Pitch Strike (Sawtooth crunch)
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(360, impactTime);
                    osc.frequency.exponentialRampToValueAtTime(45, impactTime + 0.42);
                    gain.gain.setValueAtTime(1.0, impactTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.42);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(impactTime);
                    osc.stop(impactTime + 0.43);

                    // D. Sub-Bass Earth-Shaking Shockwave Tremor (Sine boom)
                    const subOsc = this.ctx.createOscillator();
                    const subGain = this.ctx.createGain();
                    subOsc.type = 'sine';
                    subOsc.frequency.setValueAtTime(80, impactTime);
                    subOsc.frequency.exponentialRampToValueAtTime(26, impactTime + 0.65);
                    subGain.gain.setValueAtTime(1.0, impactTime);
                    subGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.65);
                    subOsc.connect(subGain);
                    subGain.connect(dest);
                    subOsc.start(impactTime);
                    subOsc.stop(impactTime + 0.66);
                } catch(e) {
                    console.warn('hulkSmash error:', e);
                }
            },

            // 6. THANOS: Cosmic Infinity Gauntlet Snap
            infinitySnap() {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();
                    const noise = this.getNoiseBuffer();

                    if (noise) {
                        const whiteNoise = this.ctx.createBufferSource();
                        whiteNoise.buffer = noise;

                        const filter = this.ctx.createBiquadFilter();
                        filter.type = 'bandpass';
                        filter.frequency.setValueAtTime(850, t);
                        filter.frequency.exponentialRampToValueAtTime(120, t + 1.1);
                        filter.Q.value = 2.4;

                        const gain = this.ctx.createGain();
                        gain.gain.setValueAtTime(0.001, t);
                        gain.gain.linearRampToValueAtTime(0.9, t + 0.12);
                        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

                        whiteNoise.connect(filter);
                        filter.connect(gain);
                        gain.connect(dest);
                        whiteNoise.start(t);
                    }

                    const subOsc = this.ctx.createOscillator();
                    const subGain = this.ctx.createGain();
                    subOsc.type = 'sine';
                    subOsc.frequency.setValueAtTime(110, t);
                    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.8);
                    subGain.gain.setValueAtTime(0.85, t);
                    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
                    subOsc.connect(subGain);
                    subGain.connect(dest);
                    subOsc.start(t);
                    subOsc.stop(t + 0.8);
                } catch(e) {
                    console.warn('infinitySnap error:', e);
                }
            },

            // 7. VICTORY FANFARE: Heroic Brass Orchestral Chord Progression
            fanfare() {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();

                    const sequence = [
                        { f: 392.00, start: 0, dur: 0.15, vol: 0.85 },     // G4
                        { f: 523.25, start: 0.13, dur: 0.15, vol: 0.9 },   // C5
                        { f: 659.25, start: 0.26, dur: 0.18, vol: 0.95 },  // E5
                        // Triumphant Chord Finale:
                        { f: 523.25, start: 0.40, dur: 0.85, vol: 0.85 },  // C5
                        { f: 659.25, start: 0.40, dur: 0.85, vol: 0.85 },  // E5
                        { f: 783.99, start: 0.40, dur: 0.95, vol: 1.0 },   // G5
                        { f: 1046.50, start: 0.44, dur: 0.90, vol: 0.8 }   // C6 shimmer
                    ];

                    sequence.forEach(n => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();

                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(n.f, t + n.start);

                        gain.gain.setValueAtTime(0.001, t + n.start);
                        gain.gain.linearRampToValueAtTime(n.vol, t + n.start + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.start + n.dur);

                        osc.connect(gain);
                        gain.connect(dest);

                        osc.start(t + n.start);
                        osc.stop(t + n.start + n.dur + 0.02);
                    });
                } catch(e) {
                    console.warn('fanfare error:', e);
                }
            },

            // 8. TACTICAL HUD UI CLICK (Crisp mechanical feedback)
            uiTick() {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();

                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(1400, t);
                    osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);

                    gain.gain.setValueAtTime(0.55, t);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(t);
                    osc.stop(t + 0.045);
                } catch(e) {}
            },

            // 9. COUNTDOWN TICK (Last 5 seconds tactical HUD blip)
            countdownTick(isFinal = false) {
                if (!this.ensureActive()) return;
                try {
                    const t = this.ctx.currentTime;
                    const dest = this.getDest();

                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';

                    if (isFinal) {
                        osc.frequency.setValueAtTime(1760, t);
                        gain.gain.setValueAtTime(0.9, t);
                        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
                        osc.connect(gain);
                        gain.connect(dest);
                        osc.start(t);
                        osc.stop(t + 0.21);
                    } else {
                        osc.frequency.setValueAtTime(880, t);
                        gain.gain.setValueAtTime(0.7, t);
                        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
                        osc.connect(gain);
                        gain.connect(dest);
                        osc.start(t);
                        osc.stop(t + 0.09);
                    }
                } catch(e) {}
            },

            toggleMute() {
                this.muted = !this.muted;
                localStorage.setItem('avengers_muted', this.muted);
                this.updateUI();
                if (!this.muted) {
                    this.playTone(880, 'triangle', 0.1, 0, 0.5);
                    showToast("SFX ONLINE!", "sound");
                } else {
                    showToast("SFX MUTED", "mute");
                }
            },

            updateUI() {
                const iconContainer = document.getElementById('sfx-icon-container');
                const text = document.getElementById('sfx-text');
                if (iconContainer) {
                    iconContainer.innerHTML = this.muted ? '<i data-lucide="volume-x" class="w-4 h-4"></i>' : '<i data-lucide="volume-2" class="w-4 h-4"></i>';
                }
                if (text) {
                    text.innerText = this.muted ? 'MUTED' : 'SFX ON';
                }
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        };

        // Continual wake listener to resume AudioContext automatically on any interaction
        ['click', 'pointerdown', 'touchstart', 'keydown'].forEach(evt => {
            window.addEventListener(evt, () => {
                AudioEngine.init();
                if (AudioEngine.ctx && AudioEngine.ctx.state === 'suspended') {
                    AudioEngine.ctx.resume().catch(() => {});
                }
            }, { passive: true });
        });

