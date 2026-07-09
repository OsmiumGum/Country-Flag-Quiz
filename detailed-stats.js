class DetailedStatsPage {
    constructor() {
        this.currentUser = null;
        this.userStats = {};
        this.userProfile = null;
        this.activeFilter = 'all';
        this.searchTerm = '';
        this.bindUI();
        this.init();
    }

    bindUI() {
        const sortSelect = document.getElementById('detail-sort');
        const refreshBtn = document.getElementById('refresh-detail-btn');
        const closeBtn = document.getElementById('close-detail-btn');
        const searchInput = document.getElementById('detail-search');
        const filterPills = document.querySelectorAll('.filter-pill');

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.renderFlags());
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('spinning');
                this.loadData().finally(() => {
                    setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
                });
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => window.close());
        }
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchTerm = searchInput.value.trim().toLowerCase();
                this.renderFlags();
            });
        }
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => this.setFilter(pill.getAttribute('data-filter'), pill));
        });
    }

    setFilter(filter, pillEl) {
        this.activeFilter = filter;
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.toggle('active', pill === pillEl || pill.getAttribute('data-filter') === filter);
        });
        this.renderFlags();
    }

    init() {
        if (!window.isFirebaseConfigured) {
            this.renderEmpty('Firebase is not configured, so detailed statistics are unavailable.');
            return;
        }

        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                this.renderEmpty('Please sign in from the main game page to view your detailed statistics.');
                return;
            }

            this.currentUser = user;
            await this.loadData();
        });
    }

    async loadData() {
        if (!this.currentUser) return;

        try {
            const userRef = db.collection('users').doc(this.currentUser.uid);
            const userDoc = await userRef.get();
            this.userProfile = userDoc.exists ? userDoc.data() : null;

            const snapshot = await userRef.collection('flagStats').get();
            this.userStats = {};
            snapshot.forEach(doc => {
                this.userStats[doc.id] = doc.data();
            });

            this.setControlsVisible(true);
            this.renderSummary();
            this.renderFilterCounts();
            this.renderFocusPanel();
            this.renderFlags();
        } catch (error) {
            console.error('Error loading detailed stats:', error);
            this.renderEmpty('Unable to load detailed statistics right now.');
        }
    }

    setControlsVisible(visible) {
        const focusPanel = document.getElementById('focus-panel');
        const controls = document.querySelector('.detail-controls');
        if (focusPanel) focusPanel.classList.toggle('hidden', !visible);
        if (controls) controls.classList.toggle('hidden', !visible);
    }

    getAllFlags() {
        return Object.entries(this.userStats || {}).map(([flagCode, stats]) => ({ flagCode, ...stats }));
    }

    // Buckets flags into practice categories. Tuned so "strong" really means
    // strong — anything below 70% still counts as needing more reps.
    getCategory(percentage) {
        const pct = Math.max(0, Math.min(100, Number(percentage) || 0));
        if (pct < 40) return 'needs-work';
        if (pct < 70) return 'practicing';
        if (pct < 90) return 'strong';
        return 'excellent';
    }

    getPerformanceStyle(percentage) {
        const styles = {
            'needs-work': { accent: '#dc3545', label: 'Needs work' },
            'practicing': { accent: '#f0ad4e', label: 'Practicing' },
            'strong': { accent: '#28a745', label: 'Strong' },
            'excellent': { accent: '#1f7a3a', label: 'Excellent' }
        };
        const category = this.getCategory(percentage);
        return { category, ...styles[category] };
    }

    getSortedFlags(flags) {
        const sortSelect = document.getElementById('detail-sort');
        const sortBy = sortSelect ? sortSelect.value : 'percentage-asc';
        const sorted = flags.slice();

        switch (sortBy) {
            case 'percentage-desc':
                sorted.sort((a, b) => (b.percentage - a.percentage) || (b.total - a.total));
                break;
            case 'percentage-asc':
                sorted.sort((a, b) => (a.percentage - b.percentage) || (b.total - a.total));
                break;
            case 'attempts-desc':
                sorted.sort((a, b) => (b.total - a.total) || (b.percentage - a.percentage));
                break;
            case 'attempts-asc':
                sorted.sort((a, b) => (a.total - b.total) || (a.percentage - b.percentage));
                break;
            case 'alphabetical':
                sorted.sort((a, b) => String(a.countryName || '').localeCompare(String(b.countryName || '')));
                break;
        }

        return sorted;
    }

    getVisibleFlags() {
        let flags = this.getAllFlags();

        if (this.activeFilter !== 'all') {
            flags = flags.filter(flag => this.getCategory(flag.percentage || 0) === this.activeFilter);
        }
        if (this.searchTerm) {
            flags = flags.filter(flag => String(flag.countryName || '').toLowerCase().includes(this.searchTerm));
        }

        return this.getSortedFlags(flags);
    }

    renderSummary() {
        const flags = this.getAllFlags();
        const totalFlags = flags.length;
        const totalAttempts = flags.reduce((sum, flag) => sum + (flag.total || 0), 0);
        const totalCorrect = flags.reduce((sum, flag) => sum + (flag.correct || 0), 0);
        const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('summary-flags', totalFlags);
        setText('summary-attempts', totalAttempts);
        setText('summary-correct', totalCorrect);
        setText('summary-accuracy', `${accuracy}%`);
    }

    renderFilterCounts() {
        const flags = this.getAllFlags();
        const counts = { all: flags.length, 'needs-work': 0, practicing: 0, strong: 0, excellent: 0 };
        flags.forEach(flag => {
            counts[this.getCategory(flag.percentage || 0)]++;
        });

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('count-all', counts.all);
        setText('count-needs-work', counts['needs-work']);
        setText('count-practicing', counts.practicing);
        setText('count-strong', counts.strong);
        setText('count-excellent', counts.excellent);
    }

    // The whole point of this page: surface what to practice without any digging.
    renderFocusPanel() {
        const panel = document.getElementById('focus-panel');
        const scroller = document.getElementById('focus-scroller');
        const sub = document.getElementById('focus-panel-sub');
        if (!panel || !scroller) return;

        const weakest = this.getAllFlags()
            .filter(flag => (flag.total || 0) >= 2 && (flag.percentage || 0) < 70)
            .sort((a, b) => (a.percentage - b.percentage) || (b.total - a.total))
            .slice(0, 10);

        if (!weakest.length) {
            panel.classList.add('all-clear');
            if (sub) sub.textContent = 'Nice work — nothing urgent right now.';
            scroller.innerHTML = '<div class="focus-empty">🎉 No weak spots yet. Keep playing to surface flags that need work.</div>';
            return;
        }

        panel.classList.remove('all-clear');
        if (sub) sub.textContent = `${weakest.length} flag${weakest.length === 1 ? '' : 's'} worth another look, worst first.`;

        scroller.innerHTML = weakest.map(flag => {
            const style = this.getPerformanceStyle(flag.percentage || 0);
            const safeName = this.escapeHtml(flag.countryName || '');
            return `
                <button class="focus-chip" data-flag-search="${safeName}" title="${safeName}">
                    <img src="https://flagcdn.com/w80/${flag.flagCode}.png" alt="${safeName} flag" onerror="this.src='https://via.placeholder.com/40x28?text=🏁'">
                    <span class="focus-chip-name">${safeName}</span>
                    <span class="focus-chip-pct" style="color:${style.accent}">${flag.percentage || 0}%</span>
                </button>
            `;
        }).join('');

        scroller.querySelectorAll('.focus-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const name = chip.getAttribute('data-flag-search') || '';
                const searchInput = document.getElementById('detail-search');
                if (searchInput) {
                    searchInput.value = name;
                }
                this.searchTerm = name.trim().toLowerCase();
                this.setFilter('all', document.querySelector('.filter-pill[data-filter="all"]'));
            });
        });
    }

    renderFlags() {
        const content = document.getElementById('detail-content');
        if (!content) return;

        const flags = this.getVisibleFlags();

        if (!flags.length) {
            const hasAnyData = this.getAllFlags().length > 0;
            content.innerHTML = `<div class="detail-empty">${hasAnyData ? 'No flags match your filters.' : 'No flag attempts yet. Play a few games to populate this page.'}</div>`;
            return;
        }

        content.innerHTML = flags.map(flag => {
            const pct = Math.max(0, Math.min(100, Number(flag.percentage) || 0));
            const style = this.getPerformanceStyle(pct);
            const safeName = this.escapeHtml(flag.countryName || '');
            return `
            <div class="detail-flag-row" style="--detail-accent:${style.accent};">
                <div class="detail-flag-top">
                    <img src="https://flagcdn.com/w80/${flag.flagCode}.png" alt="${safeName} flag" onerror="this.src='https://via.placeholder.com/40x28?text=🏁'">
                    <div class="detail-flag-name">${safeName}</div>
                    <div class="detail-flag-percentage">${pct}%</div>
                </div>
                <div class="detail-bar"><span class="detail-bar-fill" style="width:${pct}%"></span></div>
                <div class="detail-flag-bottom">
                    <div class="detail-flag-attempts">${flag.correct || 0}/${flag.total || 0} correct</div>
                    <div class="detail-flag-tag">${style.label}</div>
                </div>
            </div>
        `;
        }).join('');
    }

    escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    renderEmpty(message) {
        const content = document.getElementById('detail-content');
        if (content) {
            content.innerHTML = `<div class="detail-empty">${message}</div>`;
        }
        this.setControlsVisible(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.detailedStatsPage = new DetailedStatsPage();
});
