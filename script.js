document.addEventListener('DOMContentLoaded', () => {
    // Mock Data (Empty as requested)
    const clans = [];
    const tournaments = [];

    const navLinks = document.querySelectorAll('.nav-links a');
    const views = document.querySelectorAll('.view');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const rankingsTableBody = document.getElementById('rankings-body');
    const tournamentsGrid = document.getElementById('tournaments-grid');

    let currentFilter = 'overall';

    // View Routing
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-link');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            views.forEach(v => {
                v.classList.remove('active');
                if (v.id === target) {
                    v.style.display = 'block';
                    setTimeout(() => v.classList.add('active'), 50);
                } else {
                    v.style.display = 'none';
                }
            });
        });
    });

    // Filtering Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderRankings();
        });
    });

    // Render Functions
    function calculateTotal(clan) {
        return Object.values(clan.points).reduce((a, b) => a + b, 0);
    }

    function renderRankings() {
        rankingsTableBody.innerHTML = '';
        
        if (clans.length === 0) {
            rankingsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 3rem; color: var(--text-muted);">No hay clanes registrados en el ranking todavía.</td></tr>';
            return;
        }

        let sortedClans = [...clans];
        if (currentFilter === 'overall') {
            sortedClans.sort((a, b) => calculateTotal(b) - calculateTotal(a));
        } else {
            sortedClans.sort((a, b) => (b.points[currentFilter] || 0) - (a.points[currentFilter] || 0));
        }

        sortedClans.forEach((clan, index) => {
            const row = document.createElement('tr');
            row.className = 'animated';
            row.style.animationDelay = `${index * 0.1}s`;

            const modalities = [
                { key: 'torneos', icon: 'fa-trophy', label: 'Copa' },
                { key: 'scrims', icon: 'fa-map-marked-alt', label: 'Mapa' },
                { key: '6v6', label: '6v6' },
                { key: '4v4', label: '4v4' },
                { key: '2v2', label: '2v2' }
            ];

            const modalitiesHtml = modalities.map(m => `
                <div class="modality-item" style="border-color: ${currentFilter === m.key ? 'var(--primary)' : 'var(--glass-border)'}">
                    ${m.icon ? `<i class="fas ${m.icon}"></i>` : `<span class="mode-badge">${m.label}</span>`}
                    <span class="modality-pts">${clan.points[m.key] || 0}</span>
                </div>
            `).join('');

            row.innerHTML = `
                <td class="rank-col"><span class="rank-badge">${index + 1}</span></td>
                <td class="clan-col">
                    <div class="clan-info">
                        <div class="clan-logo"><img src="${clan.logo}" alt="${clan.name}"></div>
                        <span class="clan-name">${clan.name}</span>
                    </div>
                </td>
                <td class="modalities-col">
                    <div class="modality-tags">${modalitiesHtml}</div>
                </td>
                <td class="total-col">
                    <span class="total-pts">${currentFilter === 'overall' ? calculateTotal(clan) : (clan.points[currentFilter] || 0)}</span>
                </td>
            `;
            rankingsTableBody.appendChild(row);
        });
    }

    function renderTournaments() {
        tournamentsGrid.innerHTML = '';
        
        if (tournaments.length === 0) {
            tournamentsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted); width: 100%;">Próximamente se anunciarán nuevos torneos.</div>';
            return;
        }

        tournaments.forEach((t, index) => {
            const card = document.createElement('div');
            card.className = 'tournament-card glass-card animated';
            card.style.animationDelay = `${index * 0.15}s`;
            
            card.innerHTML = `
                <div class="card-banner">
                    <i class="fas fa-gamepad"></i>
                </div>
                <div class="card-content">
                    <span class="card-label">${t.status}</span>
                    <h3>${t.name}</h3>
                    <div class="modality-item" style="margin-bottom: 5px;">
                        <i class="fas fa-calendar"></i>
                        <span>${t.date}</span>
                    </div>
                    <div class="modality-item">
                        <i class="fas fa-coins text-gold"></i>
                        <span>Premio: ${t.prize}</span>
                    </div>
                </div>
            `;
            tournamentsGrid.appendChild(card);
        });
    }

    // Initial Load
    renderRankings();
    renderTournaments();
});
