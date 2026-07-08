class DetailedStatsPage {
    constructor() {
        this.currentUser = null;
        this.userStats = {};
        this.userProfile = null;
        this.bindUI();
        this.init();
    }

    bindUI() {
        const sortSelect = document.getElementById('detail-sort');
        const refreshBtn = document.getElementById('refresh-detail-btn');
        const closeBtn = document.getElementById('close-detail-btn');

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.renderFlags());
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => window.close());
        }
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

            this.renderSummary();
            this.renderFlags();
        } catch (error) {
            console.error('Error loading detailed stats:', error);
            this.renderEmpty('Unable to load detailed statistics right now.');
        }
    }

    getSortedFlags() {
        const sortSelect = document.getElementById('detail-sort');
        const sortBy = sortSelect ? sortSelect.value : 'percentage-asc';
        const flags = Object.entries(this.userStats || {}).map(([flagCode, stats]) => ({ flagCode, ...stats }));

        switch (sortBy) {
            case 'percentage-desc':
                flags.sort((a, b) => (b.percentage - a.percentage) || (b.total - a.total));
                break;
            case 'percentage-asc':
                flags.sort((a, b) => (a.percentage - b.percentage) || (b.total - a.total));
                break;
            case 'attempts-desc':
                flags.sort((a, b) => (b.total - a.total) || (b.percentage - a.percentage));
                break;
            case 'attempts-asc':
                flags.sort((a, b) => (a.total - b.total) || (a.percentage - b.percentage));
                break;
            case 'alphabetical':
                flags.sort((a, b) => String(a.countryName || '').localeCompare(String(b.countryName || '')));
                break;
        }

        return flags;
    }

    getPerformanceColor(percentage) {
        const pct = Math.max(0, Math.min(100, Number(percentage) || 0));
        if (pct < 30) return { accent: '#dc3545', background: '#fff1f2', border: '#f3b3bc', label: 'Needs improvement' };
        if (pct < 55) return { accent: '#f0ad4e', background: '#fff8e8', border: '#f3ddb2', label: 'Needs practice' };
        if (pct < 80) return { accent: '#28a745', background: '#eefaf1', border: '#bfe6c9', label: 'Strong' };
        return { accent: '#1f7a3a', background: '#eaf8ed', border: '#a7d7b1', label: 'Excellent' };
    }

    renderSummary() {
        const flags = Object.values(this.userStats || {});
        const totalFlags = flags.length;
        const totalAttempts = flags.reduce((sum, flag) => sum + (flag.total || 0), 0);
        const totalCorrect = flags.reduce((sum, flag) => sum + (flag.correct || 0), 0);
        const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

        const summaryFlags = document.getElementById('summary-flags');
        const summaryAttempts = document.getElementById('summary-attempts');
        const summaryCorrect = document.getElementById('summary-correct');
        const summaryAccuracy = document.getElementById('summary-accuracy');

        if (summaryFlags) summaryFlags.textContent = totalFlags;
        if (summaryAttempts) summaryAttempts.textContent = totalAttempts;
        if (summaryCorrect) summaryCorrect.textContent = totalCorrect;
        if (summaryAccuracy) summaryAccuracy.textContent = `${accuracy}%`;
    }

    renderFlags() {
        const content = document.getElementById('detail-content');
        if (!content) return;

        const flags = this.getSortedFlags();

        if (!flags.length) {
            content.innerHTML = '<div class="detail-empty">No flag attempts yet. Play a few games to populate this page.</div>';
            return;
        }

        content.innerHTML = flags.map(flag => {
            const color = this.getPerformanceColor(flag.percentage || 0);
            return `
            <div class="detail-flag-row" style="--detail-accent:${color.accent}; --detail-bg:${color.background}; --detail-border:${color.border};">
                <div class="detail-flag-info">
                    <img src="https://flagcdn.com/w80/${flag.flagCode}.png" alt="${flag.countryName} flag" onerror="this.src=\'https://via.placeholder.com/40x28?text=🏁\'">
                    <div>
                        <div class="detail-flag-name">${flag.countryName}</div>
                        <div class="detail-flag-attempts">${flag.correct || 0} correct / ${flag.total || 0} attempts</div>
                    </div>
                </div>
                <div class="detail-flag-meta">
                    <div class="detail-flag-percentage">${flag.percentage || 0}%</div>
                    <div class="detail-flag-attempts">${color.label}</div>
                </div>
            </div>
        `;
        }).join('');
    }

    renderEmpty(message) {
        const content = document.getElementById('detail-content');
        if (content) {
            content.innerHTML = `<div class="detail-empty">${message}</div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.detailedStatsPage = new DetailedStatsPage();
});
