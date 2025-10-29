// Arquivo: FrontEnd/Projeto/JS/projeto.js
// Versão Final Corrigida - Carrega perfil, contadores e filtra os projetos do usuário no frontend.

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    let currentUser = null;
    let stompClient = null;
    const messageBadgeElement = document.getElementById('message-badge');
    const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;

    const ProjetosPage = {
        state: {
            allProjects: [], // Armazena todos os projetos buscados
            myProjects: []   // Armazena apenas os projetos do usuário
        },

        elements: {
            grid: document.getElementById('projetos-grid'),
            modalOverlay: document.getElementById('novo-projeto-modal'),
            openModalBtn: document.getElementById('btn-new-project'),
            closeModalBtn: document.querySelector('.modal-content .close-modal-btn'),
            form: document.getElementById('novo-projeto-form'),
            searchInput: document.getElementById('project-search-input'),
            projTituloInput: document.getElementById('proj-titulo'),
            projDescricaoInput: document.getElementById('proj-descricao'),
            projImagemInput: document.getElementById('proj-imagem'),
            modalUserAvatar: document.getElementById('modal-user-avatar'),
            modalUserName: document.getElementById('modal-user-name'),
            topbarUserName: document.getElementById("topbar-user-name"),
            sidebarUserName: document.getElementById("sidebar-user-name"),
            sidebarUserTitle: document.getElementById("sidebar-user-title"),
            topbarUserImg: document.getElementById("topbar-user-img"),
            sidebarUserImg: document.getElementById("sidebar-user-img"),
            connectionsCount: document.getElementById('connections-count'),
            projectsCount: document.getElementById('projects-count'),
        },

        
        
        async init() {
            if (!jwtToken) { window.location.href = '/login.html'; return; }
            axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

            try {
                const userResponse = await axios.get(`${backendUrl}/usuarios/me`);
                currentUser = userResponse.data;
                this.updateGlobalUI(currentUser);
                await this.fetchUserStats();
                this.connectWebSocket(); 
                await this.fetchProjetos();
                this.setupEventListeners();
            } catch (error) {
                console.error("Erro na inicialização da página de projetos:", error);
                if (this.elements.grid) this.elements.grid.innerHTML = `<p>Ocorreu um erro ao carregar a página.</p>`;
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login.html';
                }
            }
        },

        updateGlobalUI(user) {
            if (!user) return;
            const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : defaultAvatarUrl;
            if (this.elements.topbarUserName) this.elements.topbarUserName.textContent = user.nome;
            if (this.elements.sidebarUserName) this.elements.sidebarUserName.textContent = user.nome;
            if (this.elements.sidebarUserTitle) this.elements.sidebarUserTitle.textContent = "Membro da Comunidade";
            if (this.elements.topbarUserImg) this.elements.topbarUserImg.src = userImage;
            if (this.elements.sidebarUserImg) this.elements.sidebarUserImg.src = userImage;
        },

        async fetchUserStats() {
            try {
                const response = await axios.get(`${backendUrl}/api/amizades/`);
                if (this.elements.connectionsCount) this.elements.connectionsCount.textContent = response.data.length;
            } catch {
                if (this.elements.connectionsCount) this.elements.connectionsCount.textContent = '0';
            }
            // O contador de projetos será atualizado após a busca dos projetos
        },

        connectWebSocket() {
            if (!currentUser || stompClient) return;
            const socket = new SockJS(`${backendUrl}/ws`);
            stompClient = Stomp.over(socket);
            stompClient.debug = null;
            const headers = { Authorization: `Bearer ${jwtToken}` };
            stompClient.connect(headers, () => console.log("WebSocket CONECTADO (Projetos)"), () => setTimeout(() => this.connectWebSocket(), 5000));
        },

        async fetchProjetos() {
            try {
                const response = await axios.get(`${backendUrl}/projetos`);
                this.state.allProjects = response.data;
                this.handlers.applyFilters.call(this);
            } catch (error) {
                console.error("Erro ao buscar projetos:", error);
                if (this.elements.grid) this.elements.grid.innerHTML = `<p>Não foi possível carregar os projetos.</p>`;
            }
        },

        

        render() {
            const grid = this.elements.grid;
            if (!grid) return;
            grid.innerHTML = '';
            const projetosParaRenderizar = this.state.myProjects;

            // Atualiza o contador de projetos na sidebar
            if(this.elements.projectsCount) this.elements.projectsCount.textContent = projetosParaRenderizar.length;

            if (projetosParaRenderizar.length === 0) {
                grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Você ainda não participa de nenhum projeto.</p>`;
                return;
            }

            projetosParaRenderizar.forEach(proj => {
                const card = document.createElement('div');
                card.className = 'projeto-card';
                const imageUrl = proj.imagemUrl ? `${backendUrl}/projetos/imagens/${proj.imagemUrl}` : 'https://placehold.co/600x400/161b22/ffffff?text=Projeto';
                const membrosHtml = (proj.membros || []).map(membro => {
                    const avatarUrl = membro.usuarioFotoPerfil ? `${backendUrl}/api/arquivos/${membro.usuarioFotoPerfil}` : defaultAvatarUrl;
                    return `<img class="membro-avatar" src="${avatarUrl}" title="${membro.usuarioNome}">`;
                }).join('');
                card.innerHTML = `
                    <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                    <div class="projeto-conteudo">
                        <h3>${proj.titulo}</h3>
                        <p>${proj.descricao || 'Este projeto não possui uma descrição.'}</p>
                        <div class="projeto-membros">${membrosHtml}</div>
                    </div>`;
                grid.appendChild(card);
            });
        },

        handlers: {
            openModal() {
                if (currentUser) {
                    this.elements.modalUserName.textContent = currentUser.nome;
                    const avatarUrl = currentUser.urlFotoPerfil ? `${backendUrl}${currentUser.urlFotoPerfil}` : defaultAvatarUrl;
                    this.elements.modalUserAvatar.src = avatarUrl;
                }
                this.elements.modalOverlay?.classList.add('visible'); 
            },
            closeModal() { 
                this.elements.modalOverlay?.classList.remove('visible'); 
            },
            
            async handleFormSubmit(e) {
                e.preventDefault();
                const form = this.elements.form;
                const btn = form.querySelector('.btn-publish');
                btn.disabled = true;
                btn.textContent = 'Publicando...';
                const formData = new FormData();
                formData.append('titulo', this.elements.projTituloInput.value);
                formData.append('descricao', this.elements.projDescricaoInput.value);
                formData.append('autorId', currentUser.id);
                formData.append('maxMembros', 50);
                formData.append('grupoPrivado', false);
                if (this.elements.projImagemInput.files[0]) {
                    formData.append('foto', this.elements.projImagemInput.files[0]);
                }
                try {
                    await axios.post(`${backendUrl}/projetos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    form.reset();
                    this.handlers.closeModal.call(this);
                    await this.fetchProjetos();
                } catch (error) {
                    alert("Falha ao criar o projeto.");
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Publicar Projeto';
                }
            },

            // --- FUNÇÃO CORRIGIDA ---
            applyFilters() {
                const search = this.elements.searchInput.value.toLowerCase();
                if (!currentUser) return; // Garante que o usuário foi carregado

                // Filtra a lista de todos os projetos
                this.state.myProjects = this.state.allProjects.filter(proj => {
                    // Verifica se o usuário atual está na lista de membros do projeto
                    const isMember = proj.membros.some(membro => membro.usuarioId === currentUser.id);
                    // Verifica se o título do projeto corresponde à busca
                    const searchMatch = (proj.titulo || '').toLowerCase().includes(search);
                    return isMember && searchMatch;
                });
                
                this.render();
            }
        },

        setupEventListeners() {
            const { openModalBtn, closeModalBtn, modalOverlay, form, searchInput } = this.elements;
            if (openModalBtn) openModalBtn.addEventListener('click', this.handlers.openModal.bind(this));
            if (closeModalBtn) closeModalBtn.addEventListener('click', this.handlers.closeModal.bind(this));
            if (form) form.addEventListener('submit', (e) => this.handlers.handleFormSubmit.call(this, e));
            if (searchInput) searchInput.addEventListener('input', this.handlers.applyFilters.bind(this));
            if (modalOverlay) {
                modalOverlay.addEventListener('click', (e) => {
                    if (e.target === modalOverlay) this.handlers.closeModal.call(this);
                });
            }
        }
    };

    async function fetchAndUpdateUnreadCount() {
        if (!messageBadgeElement) return; // Só executa se o badge existir na página
        try {
            const response = await axios.get(`${backendUrl}/api/chat/privado/nao-lidas/contagem`);
            const count = response.data;
            updateMessageBadge(count);
        } catch (error) {
            console.error("Erro ao buscar contagem de mensagens não lidas:", error);
        }
    }

    function updateMessageBadge(count) {
        if (messageBadgeElement) {
            messageBadgeElement.textContent = count;
            messageBadgeElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    ProjetosPage.init();
});