document.addEventListener('DOMContentLoaded', () => {
    // Mock Data
    const clans = [
        {
            id: 1,
            name: "Team Liquid",
            logo: "https://upload.wikimedia.org/wikipedia/en/b/ba/Team_Liquid_logo.svg",
            points: {
                scrims: 150,
                torneos: 450,
                "6v6": 300,
                "4v4": 120,
                "2v2": 80
            }
        },
        {
            id: 2,
            name: "Cloud9",
            logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Cloud9_logo.svg",
            points: {
                scrims: 200,
                torneos: 300,
                "6v6": 250,
                "4v4": 150,
                "2v2": 100
            }
        },
        {
            id: 3,
            name: "FaZe Clan",
            logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Faze_Clan.svg",
            points: {
                scrims: 100,
                torneos: 500,
                "6v6": 150,
                "4v4": 300,
                "2v2": 50
            }
        },
        {
            id: 4,
            name: "Natus Vincere",
            logo: "https://upload.wikimedia.org/wikipedia/en/a/ac/Natus_Vincere_logo.svg",
            points: {
                scrims: 250,
                torneos: 200,
                "6v6": 200,
                "4v4": 100,
                "2v2": 150
            }
        }
    ];

    const tournaments = [
        { id: 1, name: "Copa CTR Primavera", date: "2026-04-15", prize: "$500", status: "Inscripciones Abiertas" },
        { id: 2, name: "Torneo 4v4 Express", date: "2026-03-30", prize: "$100", status: "En Curso" },
        { id: 3, name: "Scrim Masters S3", date: "2026-05-01", prize: "$200", status: "Buscando Staff" },
        { id: 4, name: "Duelo de Clanes 6v6", date: "2026-04-05", prize: "$300", status: "Próximamente" }
    ];

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
                { key: 'scrims', icon: 'fa-crosshairs', bg: 'rgba(88, 101, 242, 0.1)' },
                { key: 'torneos', icon: 'fa-trophy', bg: 'rgba(255, 215, 0, 0.1)' },
                { key: '6v6', icon: 'fa-users', bg: 'rgba(46, 204, 113, 0.1)' },
                { key: '4v4', icon: 'fa-user-group', bg: 'rgba(231, 76, 60, 0.1)' },
                { key: '2v2', icon: 'fa-user', bg: 'rgba(155, 89, 182, 0.1)' }
            ];

            const modalitiesHtml = modalities.map(m => `
                <div class="modality-item" style="border-color: ${currentFilter === m.key ? 'var(--primary)' : 'var(--glass-border)'}">
                    <i class="fas ${m.icon}"></i>
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
