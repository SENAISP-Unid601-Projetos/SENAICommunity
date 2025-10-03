document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    let currentUser = null;

    // --- ELEMENTOS DO DOM ---
    const elements = {
        vagasListContainer: document.querySelector('.vagas-list'),
        // Elementos do Header/Sidebar
        sidebarUserImg: document.getElementById('sidebar-user-img'),
        sidebarUserName: document.getElementById('sidebar-user-name'),
        sidebarUserTitle: document.getElementById('sidebar-user-title'),
        topbarUserImg: document.getElementById('topbar-user-img'),
        topbarUserName: document.getElementById('topbar-user-name')
    };

    // --- DADOS MOCADOS (TEMPORÁRIO) ---
    const mockVagas = [
        {
            id: 1,
            titulo: "Desenvolvedor Front-End Pleno",
            empresa: "Tech Solutions Inc.",
            logo: "https://placehold.co/100x100/58a6ff/ffffff?text=TS",
            local: "Híbrido",
            cidade: "São Paulo, SP",
            nivel: "Pleno",
            tipo: "Tempo Integral",
            tags: ["React", "TypeScript", "Next.js"],
            descricao: "Estamos expandindo nosso time e buscamos um desenvolvedor Front-End com experiência para criar interfaces incríveis e responsivas para nossos clientes.",
            publicado: "há 1 dia"
        },
        {
            id: 2,
            titulo: "Estágio em Análise de Dados",
            empresa: "Inova Dev",
            logo: "https://placehold.co/100x100/f78166/ffffff?text=ID",
            local: "Remoto",
            cidade: "Brasil",
            nivel: "Júnior",
            tipo: "Estágio",
            tags: ["Python", "SQL", "Power BI"],
            descricao: "Oportunidade para estudantes que desejam iniciar a carreira em dados, aprendendo e aplicando técnicas de análise e visualização em projetos reais.",
            publicado: "há 3 dias"
        },
        {
            id: 3,
            titulo: "Engenheiro de Software Backend Sênior",
            empresa: "Code Masters",
            logo: "https://placehold.co/100x100/3fb950/ffffff?text=CM",
            local: "Presencial",
            cidade: "Campinas, SP",
            nivel: "Sênior",
            tipo: "Tempo Integral",
            tags: ["Java", "Spring Boot", "AWS"],
            descricao: "Procuramos um engenheiro experiente para liderar o desenvolvimento de microserviços escaláveis em nossa plataforma de nuvem.",
            publicado: "há 5 dias"
        }
    ];

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const render = {
        vagas(vagas) {
            const container = elements.vagasListContainer;
            if (!container) return;
            container.innerHTML = '';

            if (vagas.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Nenhuma vaga encontrada com os filtros selecionados.</p>';
                return;
            }

            vagas.forEach(vaga => {
                const vagaCard = document.createElement('div');
                vagaCard.className = 'vaga-card';
                vagaCard.innerHTML = `
                    <div class="vaga-card-header">
                      <div class="vaga-empresa-logo"><img src="${vaga.logo}" alt="Logo da ${vaga.empresa}"></div>
                      <div class="vaga-info-principal">
                        <h2 class="vaga-titulo">${vaga.titulo}</h2>
                        <p class="vaga-empresa">${vaga.empresa}</p>
                        <div class="vaga-localidade"><i class="fas fa-map-marker-alt"></i> ${vaga.cidade} (${vaga.local})</div>
                      </div>
                      <button class="save-vaga-btn"><i class="far fa-bookmark"></i></button>
                    </div>
                    <div class="vaga-tags">
                      <span class="tag">${vaga.nivel}</span>
                      <span class="tag">${vaga.tipo}</span>
                      ${vaga.tags.map(tag => `<span class="tag tag-tecnologia">${tag}</span>`).join('')}
                    </div>
                    <div class="vaga-descricao">${vaga.descricao}</div>
                    <div class="vaga-card-footer">
                      <span class="vaga-publicado">Publicado ${vaga.publicado}</span>
                      <button class="vaga-candidatar-btn">Ver Detalhes</button>
                    </div>`;
                container.appendChild(vagaCard);
            });
        },

        userInfo(user) {
            const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : 'https://via.placeholder.com/80';
            if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
            if (elements.sidebarUserName) elements.sidebarUserName.textContent = user.nome;
            if (elements.sidebarUserTitle) elements.sidebarUserTitle.textContent = user.titulo || 'Membro da Comunidade';
            if (elements.topbarUserImg) elements.topbarUserImg.src = userImage;
            if (elements.topbarUserName) elements.topbarUserName.textContent = user.nome;
        }
    };

    // --- LÓGICA DA APLICAÇÃO ---
    const app = {
        /*
        // QUANDO O BACKEND ESTIVER PRONTO, SUBSTITUA A FUNÇÃO ABAIXO
        async fetchVagas() {
            try {
                // Exemplo: const response = await axios.get(`${backendUrl}/vagas`);
                // render.vagas(response.data);
            } catch (error) {
                console.error("Erro ao buscar vagas:", error);
                elements.vagasListContainer.innerHTML = '<p style="color: red; text-align: center;">Não foi possível carregar as vagas.</p>';
            }
        },
        */
        
        applyFilters() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const tipo = document.getElementById('filter-tipo').value;
            const local = document.getElementById('filter-local').value;
            const nivel = document.getElementById('filter-nivel').value;

            const filteredVagas = mockVagas.filter(vaga => {
                const searchMatch = vaga.titulo.toLowerCase().includes(searchTerm) ||
                                  vaga.empresa.toLowerCase().includes(searchTerm) ||
                                  vaga.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                
                const tipoMatch = tipo === 'todos' || vaga.tipo === tipo;
                const localMatch = local === 'todos' || vaga.local === local;
                const nivelMatch = nivel === 'todos' || vaga.nivel === nivel;

                return searchMatch && tipoMatch && localMatch && nivelMatch;
            });

            render.vagas(filteredVagas);
        },

        setupEventListeners() {
            document.getElementById('search-input').addEventListener('input', this.applyFilters);
            document.getElementById('filter-tipo').addEventListener('change', this.applyFilters);
            document.getElementById('filter-local').addEventListener('change', this.applyFilters);
            document.getElementById('filter-nivel').addEventListener('change', this.applyFilters);
        },

        async init() {
            if (!jwtToken) {
                window.location.href = 'login.html';
                return;
            }
            axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

            try {
                const response = await axios.get(`${backendUrl}/usuarios/me`);
                currentUser = response.data;
                render.userInfo(currentUser);
                
                // Carrega as vagas (atualmente mocadas)
                render.vagas(mockVagas);
                
                this.setupEventListeners();

            } catch (error) {
                console.error("Erro de autenticação:", error);
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        }
    };

    app.init();
});
