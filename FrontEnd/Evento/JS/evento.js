document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    let currentUser = null;
    let allEvents = [];
    let confirmedEvents = new Set();

    // --- ELEMENTOS DO DOM ---
    const elements = {
        eventosGrid: document.querySelector('.eventos-grid'),
        meusEventosLista: document.getElementById('meus-eventos-lista'),
        searchInput: document.getElementById('search-input'),
        filterPeriodo: document.getElementById('filter-periodo'),
        filterFormato: document.getElementById('filter-formato'),
        filterCategoria: document.getElementById('filter-categoria'),
        sidebarUserImg: document.getElementById('sidebar-user-img'),
        sidebarUserName: document.getElementById('sidebar-user-name'),
        sidebarUserTitle: document.getElementById('sidebar-user-title'),
        topbarUserImg: document.getElementById('topbar-user-img'),
        topbarUserName: document.getElementById('topbar-user-name')
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const render = {
        eventosGrid(eventos) {
            const grid = elements.eventosGrid;
            if (!grid) return;
            grid.innerHTML = '';
            
            if (eventos.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Nenhum evento encontrado para os filtros selecionados.</p>';
                return;
            }

            eventos.forEach(evento => {
                const data = new Date(evento.data);
                const dia = data.getUTCDate();
                const mes = data.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
                const isConfirmed = confirmedEvents.has(evento.id);
                
                // CORREÇÃO: Usa a URL completa que vem do backend, que já inclui o http://localhost:8080
                const imageUrl = evento.imagemCapaUrl 
                    ? evento.imagemCapaUrl
                    : 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80';

                const card = document.createElement('div');
                card.className = 'evento-card';
                card.dataset.id = evento.id;
                card.innerHTML = `
                    <div class="evento-imagem" style="background-image: url('${imageUrl}')">
                      <div class="evento-data"><span>${dia}</span><span>${mes}</span></div>
                    </div>
                    <div class="evento-conteudo">
                      <span class="evento-categoria">${evento.categoria}</span>
                      <h2 class="evento-titulo">${evento.nome}</h2>
                      <div class="evento-detalhe"><i class="fas fa-clock"></i> Horário a definir</div>
                      <div class="evento-detalhe"><i class="fas fa-map-marker-alt"></i> ${evento.local} (${evento.formato})</div>
                      <button class="rsvp-btn ${isConfirmed ? 'confirmed' : ''}">
                        <i class="fas ${isConfirmed ? 'fa-check' : 'fa-calendar-plus'}"></i> 
                        ${isConfirmed ? 'Presença Confirmada' : 'Confirmar Presença'}
                      </button>
                    </div>`;
                grid.appendChild(card);
            });
        },
        meusEventos() {
            const lista = elements.meusEventosLista;
            const eventosConfirmados = allEvents.filter(e => confirmedEvents.has(e.id));
            lista.innerHTML = '';
            if (eventosConfirmados.length === 0) {
                lista.innerHTML = '<p class="empty-message">Você não confirmou presença em nenhum evento.</p>';
                return;
            }
            eventosConfirmados.forEach(evento => {
                const data = new Date(evento.data);
                lista.innerHTML += `
                    <div class="evento-confirmado-item">
                        <div class="evento-data" style="background-color: var(--bg-tertiary); padding: 0.3rem; border-radius: 4px;">
                            <span>${data.getUTCDate()}</span>
                            <span>${data.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')}</span>
                        </div>
                        <span>${evento.nome}</span>
                    </div>`;
            });
        },
        userInfo(user) {
            const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : 'https://via.placeholder.com/80';
            elements.sidebarUserImg.src = userImage;
            elements.sidebarUserName.textContent = user.nome;
            elements.sidebarUserTitle.textContent = user.titulo || 'Membro da Comunidade';
            elements.topbarUserImg.src = userImage;
            elements.topbarUserName.textContent = user.nome;
        }
    };

    const app = {
        async fetchAndRenderEventos() {
            try {
                const response = await axios.get(`${backendUrl}/api/eventos`);
                allEvents = response.data;
                this.applyFilters();
            } catch (error) {
                console.error("Erro ao buscar eventos:", error);
                elements.eventosGrid.innerHTML = '<p style="color: red; text-align: center;">Não foi possível carregar os eventos.</p>';
            }
        },
        applyFilters() {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const { value: periodo } = elements.filterPeriodo;
            const { value: formato } = elements.filterFormato;
            const { value: categoria } = elements.filterCategoria;
            const searchTerm = elements.searchInput.value.toLowerCase();
            
            let filtered = allEvents.filter(evento => {
                const eventoData = new Date(evento.data);
                return (periodo === 'proximos' ? eventoData >= hoje : eventoData < hoje) &&
                       (formato === 'todos' || evento.formato === formato) &&
                       (categoria === 'todos' || evento.categoria === categoria) &&
                       evento.nome.toLowerCase().includes(searchTerm);
            });
            filtered.sort((a, b) => periodo === 'proximos' ? new Date(a.data) - new Date(b.data) : new Date(b.data) - new Date(a.data));
            render.eventosGrid(filtered);
        },
        toggleRsvp(eventoId) {
            confirmedEvents.has(eventoId) ? confirmedEvents.delete(eventoId) : confirmedEvents.add(eventoId);
            this.applyFilters();
            render.meusEventos();
        },
        setupEventListeners() {
            [elements.searchInput, elements.filterPeriodo, elements.filterFormato, elements.filterCategoria].forEach(el => {
                el.addEventListener('input', () => this.applyFilters());
            });
            elements.eventosGrid.addEventListener('click', e => {
                const btn = e.target.closest('.rsvp-btn');
                if (btn) this.toggleRsvp(parseInt(btn.closest('.evento-card').dataset.id, 10));
            });
        },
        async init() {
            if (!jwtToken) { window.location.href = 'login.html'; return; }
            axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
            try {
                const response = await axios.get(`${backendUrl}/usuarios/me`);
                currentUser = response.data;
                render.userInfo(currentUser);
                this.setupEventListeners();
                await this.fetchAndRenderEventos();
                render.meusEventos();
            } catch (error) {
                console.error("Erro de autenticação:", error);
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        }
    };
    app.init();
});
