        // =========================================================================
        // 9. BOOTSTRAP
        // =========================================================================
        AudioEngine.updateUI();
        document.body.setAttribute('data-hero', currentHeroKey);

        // Set initial hero tab and emblem
        const initialHero = HERO_PROFILES[currentHeroKey] || HERO_PROFILES.ironman;
        document.getElementById('hero-name-label').innerText = initialHero.name;
        document.getElementById('hero-emblem-icon').innerHTML = initialHero.emblemIcon;
        document.getElementById('hero-action-sticker').innerText = initialHero.sticker;

        document.querySelectorAll('.hero-tab').forEach(btn => {
            btn.classList.remove('active-hero');
            if (btn.getAttribute('data-hero-key') === currentHeroKey) {
                btn.classList.add('active-hero');
                btn.classList.remove('bg-white', 'text-black');
            } else {
                btn.classList.add('bg-white', 'text-black');
            }
        });

        renderHero('WORK', false);
        renderTacticalMissions();
        fetchInitialState();
        subscribeToRealtime();
        updateTacticalDebrief();
        loadAnalytics();
        loadTacticalStats();

        if (window.lucide) lucide.createIcons();
