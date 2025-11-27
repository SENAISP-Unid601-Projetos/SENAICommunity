document.addEventListener("DOMContentLoaded", () => {

    // Função utilitária para mostrar/ocultar modais
    function toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (show) {
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('visible'), 10);
            } else {
                modal.classList.remove('visible');
                setTimeout(() => modal.style.display = 'none', 300);
            }
        }
    }

    // --- GERENCIADOR DE PERFIL ---
    const ProfileManager = {
        elements: {
            editBtn: document.getElementById('edit-profile-btn'),
            deleteBtn: document.getElementById('delete-account-btn'),
            logoutBtn: document.getElementById('logout-btn'),

            editModal: document.getElementById('edit-profile-modal'),
            deleteModal: document.getElementById('delete-account-modal'),

            editForm: document.getElementById('edit-profile-form'),
            deleteForm: document.getElementById('delete-account-form'),

            // Campos de Edição
            editName: document.getElementById('edit-profile-name'),
            editBio: document.getElementById('edit-profile-bio'),
            editDob: document.getElementById('edit-profile-dob'),
            editPicInput: document.getElementById('edit-profile-pic-input'),
            editPicPreview: document.getElementById('edit-profile-pic-preview'),

            cancelEditBtn: document.getElementById('cancel-edit-profile-btn'),
            cancelDeleteBtn: document.getElementById('cancel-delete-account-btn')

        },

        init() {
            this.setupEventListeners();
        },

        setupEventListeners() {
    // 1. Preview da Imagem no Modal (Ao selecionar arquivo)
    if (this.elements.projImagemInput && this.elements.projImagePreview) {
        this.elements.projImagemInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.elements.projImagePreview.src = ev.target.result;
                }
                reader.readAsDataURL(file);
            } else {
                // Se o usuário cancelar a seleção, volta para a imagem padrão
                this.elements.projImagePreview.src = DEFAULT_COVER_IMAGE;
            }
        });
    }

    // 2. Botão "Publicar Projeto" (Abrir Modal)
    if (this.elements.openModalBtn) {
        this.elements.openModalBtn.addEventListener("click", () => this.handlers.openModal.call(this));
    }

    // 3. Botão "X" do Modal (Fechar)
    if (this.elements.closeModalBtn) {
        this.elements.closeModalBtn.addEventListener("click", () => this.handlers.closeModal.call(this));
    }

    // 4. Botão "Cancelar" do Modal (Fechar)
    if (this.elements.closeModalBtnAction) {
        this.elements.closeModalBtnAction.addEventListener("click", () => this.handlers.closeModal.call(this));
    }

    // 5. Submit do Formulário (Criar Projeto)
    if (this.elements.form) {
        this.elements.form.addEventListener("submit", (e) => this.handlers.handleFormSubmit.call(this, e));
    }

    // 6. Fechar ao clicar no fundo escuro (Overlay)
    if (this.elements.modalOverlay) {
        this.elements.modalOverlay.addEventListener("click", (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.handlers.closeModal.call(this);
            }
        });
    }

    // 7. Filtros de Busca e Categoria (Funciona para todas as abas)
    const runFilters = () => {
        // Verifica qual aba está ativa e roda o filtro correspondente
        if (this.state.currentTab === 'meus-projetos') {
            this.applyFilters();
        } else if (this.state.currentTab === 'projetos-publicos') {
            this.filterPublicProjects();
        } else if (this.state.currentTab === 'projetos-privados') {
            this.filterPrivateProjects();
        }
    };

    if (this.elements.searchInput) {
        this.elements.searchInput.addEventListener("input", runFilters);
    }

    if (this.elements.categoryFilter) {
        this.elements.categoryFilter.addEventListener("change", runFilters);
    }


            // Fechar ao clicar fora
            window.addEventListener('click', (e) => {
                if (e.target === this.elements.editModal || e.target === this.elements.deleteModal) {
                    this.closeModals();
                }
            });
        },

        openEditModal() {
            if (!window.currentUser) return;

            // Preencher campos com dados atuais
            this.elements.editName.value = window.currentUser.nome || '';
            this.elements.editBio.value = window.currentUser.bio || '';

            // Formatar data para input date (yyyy-MM-dd)
            if (window.currentUser.dataNascimento) {
                const date = new Date(window.currentUser.dataNascimento);
                const formatted = date.toISOString().split('T')[0];
                this.elements.editDob.value = formatted;
            }

            // Foto
            const fotoUrl = window.currentUser.fotoPerfil
                ? (window.currentUser.fotoPerfil.startsWith('http') ? window.currentUser.fotoPerfil : `${window.backendUrl}/api/arquivos/${window.currentUser.fotoPerfil}`)
                : 'https://via.placeholder.com/150';
            this.elements.editPicPreview.src = fotoUrl;

            this.elements.editModal.classList.add('visible');
            this.elements.editModal.style.display = 'flex';
        },

        closeModals() {
            if (this.elements.editModal) {
                this.elements.editModal.classList.remove('visible');
                this.elements.editModal.style.display = 'none';
            }
            if (this.elements.deleteModal) {
                this.elements.deleteModal.classList.remove('visible');
                this.elements.deleteModal.style.display = 'none';
            }
        },

        async handleEditSubmit(e) {
            e.preventDefault();
            const btn = this.elements.editForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            setButtonLoading(btn, true);

            const formData = new FormData();
            formData.append('nome', this.elements.editName.value);
            formData.append('bio', this.elements.editBio.value);
            formData.append('dataNascimento', this.elements.editDob.value);

            // Senha (apenas se preenchida)
            const password = document.getElementById('edit-profile-password').value;
            const confirmPassword = document.getElementById('edit-profile-password-confirm').value;

            if (password) {
                if (password !== confirmPassword) {
                    window.showNotification("As senhas não coincidem.", "error");
                    setButtonLoading(btn, false);
                    btn.textContent = originalText;
                    return;
                }
                formData.append('senha', password);
            }

            // Foto
            if (this.elements.editPicInput.files[0]) {
                formData.append('foto', this.elements.editPicInput.files[0]);
            }

            try {
                const response = await window.axios.put(`${window.backendUrl}/usuarios/${window.currentUser.id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                // Atualizar currentUser no localStorage e na memória
                const updatedUser = { ...window.currentUser, ...response.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                window.currentUser = updatedUser;

                window.showNotification("Perfil atualizado com sucesso!", "success");
                this.closeModals();

                // Recarregar a página para atualizar fotos e nomes em tudo
                setTimeout(() => window.location.reload(), 1000);

            } catch (error) {
                console.error(error);
                window.showNotification("Erro ao atualizar perfil.", "error");
            } finally {
                setButtonLoading(btn, false);
                btn.textContent = originalText;
            }
        },

        async handleDeleteSubmit(e) {
            e.preventDefault();
            const password = document.getElementById('delete-confirm-password').value;
            const btn = this.elements.deleteForm.querySelector('button[type="submit"]');

            if (!password) {
                window.showNotification("Digite sua senha para confirmar.", "error");
                return;
            }

            setButtonLoading(btn, true);

            try {
                await window.axios.delete(`${window.backendUrl}/usuarios/${window.currentUser.id}`, {
                    data: { senha: password }
                });

                window.showNotification("Conta excluída. Até logo!", "success");
                localStorage.clear();
                setTimeout(() => window.location.href = 'login.html', 1500);

            } catch (error) {
                console.error(error);
                window.showNotification("Erro ao excluir conta. Verifique sua senha.", "error");
                setButtonLoading(btn, false);
                btn.textContent = "Excluir Permanentemente";
            }
        }
    };

    // Inicializa o Gerenciador de Perfil
    ProfileManager.init();

    // --- FUNÇÕES DE CARREGAMENTO (PADRÃO BUSCAR_AMIGOS) ---
    function setProfileLoading(isLoading) {
        const userInfo = document.querySelector('.user-info');
        const topbarUser = document.querySelector('.user-dropdown .user');

        if (userInfo && topbarUser) {
            if (isLoading) {
                userInfo.classList.remove('loaded');
                topbarUser.classList.remove('loaded');
            } else {
                userInfo.classList.add('loaded');
                topbarUser.classList.add('loaded');
            }
        }
    }

    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    function setGridLoading(gridId, isLoading) {
        const container = document.getElementById(gridId);
        if (!container) return;

        const loadingElement = container.querySelector('.results-loading');
        const gridElement = container.querySelector('.projetos-grid');

        if (loadingElement && gridElement) {
            if (isLoading) {
                loadingElement.style.display = 'flex';
                gridElement.style.display = 'none';
            } else {
                loadingElement.style.display = 'none';
                gridElement.style.display = 'grid';
            }
        }
    }

    function updateSidebarUserInfo() {
    // Seleciona o container que possui o spinner
    const userInfoContainer = document.querySelector('.user-info');

    if (window.currentUser) {
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarTitle = document.getElementById('sidebar-user-title');
        const sidebarImg = document.getElementById('sidebar-user-img');
        
        if(sidebarName) sidebarName.textContent = window.currentUser.nome;
        if(sidebarTitle) sidebarTitle.textContent = window.currentUser.cargo || 'Membro'; 
        
        if(sidebarImg && window.currentUser.fotoPerfil) {
             if(typeof window.getAvatarUrl === 'function') {
                 sidebarImg.src = window.getAvatarUrl(window.currentUser.fotoPerfil);
             } else {
                 sidebarImg.src = window.currentUser.fotoPerfil;
             }
        }

        // IMPORTANTE: Remove a classe de loading para mostrar o perfil
        if (userInfoContainer) {
            userInfoContainer.classList.add('loaded');
        }
    }
}

    // Inicialmente mostrar loading nos perfis
    setProfileLoading(true);

    // --- CORREÇÃO MENU MOBILE ---
    function setupMobileMenu() {
        const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
        const sidebar = document.getElementById("sidebar");
        const mobileOverlay = document.getElementById("mobile-overlay");
        const sidebarClose = document.getElementById("sidebar-close");

        function toggleMenu() {
            sidebar.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        }

        if (mobileMenuToggle) mobileMenuToggle.onclick = toggleMenu;
        if (sidebarClose) sidebarClose.onclick = toggleMenu;
        if (mobileOverlay) mobileOverlay.onclick = toggleMenu;
    }

    // Chama assim que o HTML estiver pronto
    setupMobileMenu();

    // --- RESTANTE DA LÓGICA DA PÁGINA ---
    document.addEventListener("globalScriptsLoaded", (e) => {
        const currentUser = window.currentUser;

        const ProjetosPage = {
            state: {
                allProjects: [],
                myProjects: [],
                publicProjects: [],
                privateProjects: [],
                currentTab: 'meus-projetos'
            },

            elements: {
                grid: document.getElementById("projetos-grid"),
                publicGrid: document.getElementById("projetos-publicos-grid"),
                privateGrid: document.getElementById("projetos-privados-grid"),
                searchInput: document.getElementById("project-search-input"),
                categoryFilter: document.getElementById("filter-category"),
                tabButtons: document.querySelectorAll(".tab-btn"),

                modalOverlay: document.getElementById("novo-projeto-modal"),
                openModalBtn: document.getElementById("btn-new-project"),
                closeModalBtn: document.querySelector("#novo-projeto-modal .close-modal-btn"),
                form: document.getElementById("novo-projeto-form"),
                projTituloInput: document.getElementById("proj-titulo"),
                projDescricaoInput: document.getElementById("proj-descricao"),
                projImagemInput: document.getElementById("proj-imagem"),
                projCategoriaInput: document.getElementById("proj-categoria"),
                projTecnologiasInput: document.getElementById("proj-tecnologias"),
                projPrivacidadeInput: document.getElementById("proj-privacidade"),

                connectionsCount: document.getElementById("connections-count"),
                projectsCount: document.getElementById("projects-count"),
                onlineFriendsList: document.getElementById("online-friends-list"),
            },

            async init() {
                if (!currentUser) {
                    console.error("Página de Projetos: Usuário não carregado.");
                    return;
                }

                // Inicializar menu mobile
                setupMobileMenu();
                updateSidebarUserInfo();

                if (this.elements.connectionsCount) {
                    this.elements.connectionsCount.textContent =
                        window.userFriends?.length || "0";
                }

                this.renderOnlineFriends();

                // Mostrar loading inicial em todas as abas
                setGridLoading('meus-projetos-container', true);
                setGridLoading('projetos-publicos-container', true);
                setGridLoading('projetos-privados-container', true);

                await this.fetchMeusProjetos();
                await this.fetchProjetosPublicos();
                await this.fetchProjetosPrivados();

                this.setupEventListeners();
                this.setupTabs();

                document.addEventListener("friendsListUpdated", () => {
                    if (this.elements.connectionsCount) {
                        this.elements.connectionsCount.textContent =
                            window.userFriends?.length || "0";
                    }
                    this.renderOnlineFriends();
                });

                // Finalizar loading do perfil
                setProfileLoading(false);
            },

            setupTabs() {
                this.elements.tabButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.elements.tabButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');

                        this.state.currentTab = btn.dataset.tab;
                        this.switchTab(this.state.currentTab);
                    });
                });
            },

            switchTab(tabName) {
                // Esconder todos os containers primeiro
                document.getElementById('meus-projetos-container').style.display = 'none';
                document.getElementById('projetos-publicos-container').style.display = 'none';
                document.getElementById('projetos-privados-container').style.display = 'none';

                if (tabName === 'meus-projetos') {
                    document.getElementById('meus-projetos-container').style.display = 'block';
                    this.applyFilters();
                } else if (tabName === 'projetos-publicos') {
                    document.getElementById('projetos-publicos-container').style.display = 'block';
                    this.renderPublicProjects();
                } else if (tabName === 'projetos-privados') {
                    document.getElementById('projetos-privados-container').style.display = 'block';
                    this.renderPrivateProjects();
                }
            },

            async fetchMeusProjetos() {
                try {
                    const response = await window.axios.get(
                        `${window.backendUrl}/projetos`
                    );
                    this.state.allProjects = response.data;
                    this.applyFilters();
                } catch (error) {
                    console.error("Erro ao buscar projetos:", error);
                    this.showErrorState('meus-projetos-container', "Não foi possível carregar os projetos.");
                } finally {
                    setGridLoading('meus-projetos-container', false);
                }
            },

            async fetchProjetosPublicos() {
                try {
                    const response = await window.axios.get(
                        `${window.backendUrl}/projetos/publicos`
                    );
                    this.state.publicProjects = response.data;
                    this.renderPublicProjects();
                } catch (error) {
                    console.error("Erro ao buscar projetos públicos:", error);
                    this.showErrorState('projetos-publicos-container', "Não foi possível carregar os projetos públicos.");
                } finally {
                    setGridLoading('projetos-publicos-container', false);
                }
            },

            async fetchProjetosPrivados() {
                try {
                    const response = await window.axios.get(
                        `${window.backendUrl}/projetos/privados`
                    );
                    this.state.privateProjects = response.data;
                    this.renderPrivateProjects();
                } catch (error) {
                    console.error("Erro ao buscar projetos privados:", error);
                    this.showErrorState('projetos-privados-container', "Não foi possível carregar os projetos privados.");
                } finally {
                    setGridLoading('projetos-privados-container', false);
                }
            },

            showErrorState(containerId, message) {
                const container = document.getElementById(containerId);
                if (!container) return;

                const grid = container.querySelector('.projetos-grid');
                const loading = container.querySelector('.results-loading');

                if (loading) loading.style.display = 'none';
                if (grid) {
                    grid.style.display = 'block';
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>${message}</p>
                            <p class="empty-state-subtitle">Tente recarregar a página</p>
                        </div>`;
                }
            },

            renderPublicProjects() {
                const grid = this.elements.publicGrid;
                if (!grid) return;

                grid.innerHTML = "";

                if (this.state.publicProjects.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-globe-americas"></i>
                            <p>Nenhum projeto público disponível no momento.</p>
                        </div>`;
                    return;
                }

                this.state.publicProjects.forEach((proj) => {
                    const card = document.createElement("div");
                    card.className = "projeto-card";

                    const imageUrl = this.getProjectImageUrl(proj.imagemUrl);

                    const membrosHtml = (proj.membros || [])
                        .slice(0, 5)
                        .map((membro) => {
                            const avatarUrl = this.getMemberAvatarUrl(membro);
                            return `<img class="membro-avatar" src="${avatarUrl}" title="${membro.usuarioNome}" onerror="this.src='${window.defaultAvatarUrl}'">`;
                        })
                        .join("");

                    const remainingMembers = (proj.membros || []).length - 5;
                    const moreMembersHtml = remainingMembers > 0
                        ? `<div class="membro-avatar more-members">+${remainingMembers}</div>`
                        : '';

                    const tagsHtml = (proj.tecnologias || [])
                        .slice(0, 3)
                        .map(tag => `<span class="tech-tag">${tag}</span>`)
                        .join("");

                    const moreTags = (proj.tecnologias || []).length > 3
                        ? `<span class="tech-tag more-tags">+${(proj.tecnologias || []).length - 3}</span>`
                        : '';

                    // Verificar se o usuário atual já é membro
                    const isMember = proj.membros && proj.membros.some(membro => membro.usuarioId === currentUser.id);
                    const isAuthor = proj.autorId === currentUser.id;

                    let detailsButton = '';
                    if (isMember || isAuthor) {
                        detailsButton = `<a href="projeto-detalhe.html?id=${proj.id}" class="btn-ver-detalhes">Acessar Área do Projeto</a>`;
                    } else {
                        detailsButton = `<button class="btn-ver-detalhes" onclick="ProjetosPage.showProjectPreview(${JSON.stringify(proj).replace(/"/g, '&quot;')})">Ver Detalhes</button>`;
                    }

                    card.innerHTML = `
                        <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                        <div class="projeto-conteudo">
                            <div class="projeto-header">
                                <h3>${proj.titulo}</h3>
                                <span class="projeto-status ${proj.status?.toLowerCase() || 'planejamento'}">${proj.status || 'Em planejamento'}</span>
                            </div>
                            <p class="projeto-descricao">${proj.descricao || "Este projeto não possui uma descrição."}</p>
                            
                            <div class="projeto-meta">
                                <div class="projeto-membros">
                                    ${membrosHtml}${moreMembersHtml}
                                    <span class="membros-count">${proj.totalMembros || proj.membros?.length || 0} membros</span>
                                </div>
                                <div class="projeto-categoria">${proj.categoria || 'Sem categoria'}</div>
                            </div>
                            
                            <div class="projeto-footer">
                                    <div class="projeto-tags">
                                        ${tagsHtml}${moreTags}
                                    </div>
                                    <div class="projeto-actions">
                                        ${isAuthor
                            ? '<button class="btn-entrar disabled" disabled>Criador</button>'
                            : isMember
                                ? '<button class="btn-entrar disabled" disabled>Já é membro</button>'
                                : `<button class="btn-entrar" onclick="ProjetosPage.entrarNoProjeto(${proj.id})">Entrar no Projeto</button>`
                        }
                                        ${detailsButton}
                                    </div>
                            </div>
                        </div>`;
                    grid.appendChild(card);
                });
            },

            renderPrivateProjects() {
                const grid = this.elements.privateGrid;
                if (!grid) return;

                grid.innerHTML = "";

                if (this.state.privateProjects.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-lock"></i>
                            <p>Nenhum projeto privado disponível no momento.</p>
                            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Projetos privados exigem convite para participação.</p>
                        </div>`;
                    return;
                }

                this.state.privateProjects.forEach((proj) => {
                    const card = document.createElement("div");
                    card.className = "projeto-card";

                    const imageUrl = this.getProjectImageUrl(proj.imagemUrl);

                    const membrosHtml = (proj.membros || [])
                        .slice(0, 5)
                        .map((membro) => {
                            const avatarUrl = this.getMemberAvatarUrl(membro);
                            return `<img class="membro-avatar" src="${avatarUrl}" title="${membro.usuarioNome}" onerror="this.src='${window.defaultAvatarUrl}'">`;
                        })
                        .join("");

                    const remainingMembers = (proj.membros || []).length - 5;
                    const moreMembersHtml = remainingMembers > 0
                        ? `<div class="membro-avatar more-members">+${remainingMembers}</div>`
                        : '';

                    const tagsHtml = (proj.tecnologias || [])
                        .slice(0, 3)
                        .map(tag => `<span class="tech-tag">${tag}</span>`)
                        .join("");

                    const moreTags = (proj.tecnologias || []).length > 3
                        ? `<span class="tech-tag more-tags">+${(proj.tecnologias || []).length - 3}</span>`
                        : '';

                    // Verificar se o usuário atual já é membro
                    const isMember = proj.membros && proj.membros.some(membro => membro.usuarioId === currentUser.id);
                    const isAuthor = proj.autorId === currentUser.id;

                    let actionButton = '';
                    if (isAuthor) {
                        actionButton = '<button class="btn-entrar disabled" disabled>Criador</button>';
                    } else if (isMember) {
                        actionButton = '<button class="btn-entrar disabled" disabled>Já é membro</button>';
                    } else {
                        actionButton = `<button class="btn-solicitar-entrada" onclick="ProjetosPage.solicitarEntradaProjeto(${proj.id})">Solicitar Entrada</button>`;
                    }

                    card.innerHTML = `
                        <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                        <div class="projeto-conteudo">
                            <div class="projeto-header">
                                <h3>${proj.titulo}</h3>
                                <span class="projeto-status ${proj.status?.toLowerCase() || 'planejamento'}">${proj.status || 'Em planejamento'}</span>
                            </div>
                            <p class="projeto-descricao">${proj.descricao || "Este projeto não possui uma descrição."}</p>
                            
                            <div class="projeto-meta">
                                <div class="projeto-membros">
                                    ${membrosHtml}${moreMembersHtml}
                                    <span class="membros-count">${proj.totalMembros || proj.membros?.length || 0} membros</span>
                                </div>
                                <div class="projeto-categoria">${proj.categoria || 'Sem categoria'}</div>
                            </div>
                            
                            <div class="projeto-footer">
                                    <div class="projeto-tags">
                                        ${tagsHtml}${moreTags}
                                    </div>
                                    <div class="projeto-actions">
                                        ${actionButton}
                                        <button class="btn-ver-detalhes" onclick="ProjetosPage.showProjectPreview(${JSON.stringify(proj).replace(/"/g, '&quot;')})">Ver Detalhes</button>
                                    </div>
                            </div>
                        </div>`;
                    grid.appendChild(card);
                });
            },

            getProjectImageUrl(imagemUrl) {
                if (!imagemUrl) {
                    return "https://placehold.co/600x400/161b22/ffffff?text=Projeto";
                }

                if (imagemUrl.startsWith("http")) {
                    return imagemUrl;
                }

                if (imagemUrl.startsWith("/")) {
                    return `${window.backendUrl}${imagemUrl}`;
                }

                return `${window.backendUrl}/api/arquivos/${imagemUrl}`;
            },

            getMemberAvatarUrl(member) {
                if (!member) return window.defaultAvatarUrl;

                const fotoUrl = member.usuarioFotoPerfil || member.fotoPerfil;

                if (!fotoUrl) {
                    return window.defaultAvatarUrl;
                }

                if (fotoUrl.startsWith('http')) {
                    return fotoUrl;
                }

                if (fotoUrl.startsWith('/')) {
                    return `${window.backendUrl}${fotoUrl}`;
                }

                return `${window.backendUrl}/api/arquivos/${fotoUrl}`;
            },

            async entrarNoProjeto(projetoId) {
                const buttons = document.querySelectorAll(`[onclick="ProjetosPage.entrarNoProjeto(${projetoId})"]`);
                buttons.forEach(btn => setButtonLoading(btn, true));

                try {
                    const response = await window.axios.post(`${window.backendUrl}/projetos/${projetoId}/entrar`, null, {
                        params: {
                            usuarioId: currentUser.id
                        }
                    });

                    window.showNotification("Você entrou no projeto com sucesso!", "success");

                    // Recarregar ambas as listas
                    await this.fetchProjetosPublicos();
                    await this.fetchMeusProjetos();

                    // Se estiver na aba de projetos públicos, renderizar novamente
                    if (this.state.currentTab === 'projetos-publicos') {
                        this.renderPublicProjects();
                    }

                } catch (error) {
                    let errorMessage = "Falha ao entrar no projeto.";
                    if (error.response?.data) {
                        errorMessage = typeof error.response.data === 'string'
                            ? error.response.data
                            : error.response.data.message || errorMessage;
                    }
                    window.showNotification(errorMessage, "error");
                } finally {
                    buttons.forEach(btn => setButtonLoading(btn, false));
                }
            },

            async solicitarEntradaProjeto(projetoId) {
                const buttons = document.querySelectorAll(`[onclick="ProjetosPage.solicitarEntradaProjeto(${projetoId})"]`);
                buttons.forEach(btn => setButtonLoading(btn, true));

                try {
                    const response = await window.axios.post(`${window.backendUrl}/projetos/${projetoId}/solicitar-entrada`, null, {
                        params: {
                            usuarioId: currentUser.id
                        }
                    });

                    window.showNotification("Solicitação de entrada enviada com sucesso!", "success");

                    // Atualizar o botão
                    buttons.forEach(btn => {
                        btn.textContent = "Solicitação Enviada";
                        btn.disabled = true;
                        btn.classList.remove('btn-solicitar-entrada');
                        btn.classList.add('btn-entrar', 'disabled');
                    });

                } catch (error) {
                    let errorMessage = "Falha ao enviar solicitação de entrada.";
                    if (error.response?.data) {
                        errorMessage = typeof error.response.data === 'string'
                            ? error.response.data
                            : error.response.data.message || errorMessage;
                    }
                    window.showNotification(errorMessage, "error");
                    buttons.forEach(btn => setButtonLoading(btn, false));
                }
            },

            showProjectPreview(projeto) {
                // Remove modal anterior se existir
                const existingModal = document.getElementById('dynamic-project-modal');
                if (existingModal) existingModal.remove();

                // 1. Preparar Dados
                const imageUrl = this.getProjectImageUrl(projeto.imagemUrl);
                const statusClass = (projeto.status || '').toLowerCase().replace(/\s+/g, '');

                // Mapear Tecnologias
                const techsHtml = (projeto.tecnologias || [])
                    .map(tech => `<span class="pm-tag">${tech}</span>`)
                    .join('') || '<span class="pm-tag" style="font-style:italic; opacity:0.7">Nenhuma tecnologia listada</span>';

                // Mapear Membros
                const membrosHtml = (projeto.membros || [])
                    .map(membro => {
                        const avatarUrl = this.getMemberAvatarUrl(membro);
                        return `
                            <div class="pm-member">
                                <img src="${avatarUrl}" onerror="this.src='${window.defaultAvatarUrl}'">
                                <span>${membro.usuarioNome || membro.nome || 'Usuário'}</span>
                            </div>
                        `;
                    }).join('') || '<span style="color:var(--text-secondary)">Sem membros visíveis</span>';

                // Lógica dos Botões de Ação (Entrar, Já é membro, etc)
                const isMember = projeto.membros && projeto.membros.some(m => m.usuarioId === window.currentUser.id);
                const isAuthor = projeto.autorId === window.currentUser.id;

                let actionButtonHtml = '';

                if (isAuthor) {
                    actionButtonHtml = `<button class="pm-btn pm-btn-secondary" disabled>Você é o Criador</button>`;
                } else if (isMember) {
                    actionButtonHtml = `<button class="pm-btn pm-btn-secondary" disabled>Já é membro</button>`;
                } else if (!projeto.grupoPrivado) {
                    actionButtonHtml = `<button class="pm-btn" onclick="ProjetosPage.entrarNoProjeto(${projeto.id}); document.getElementById('dynamic-project-modal').remove()">Entrar no Projeto</button>`;
                } else {
                    actionButtonHtml = `<button class="pm-btn pm-btn-secondary" disabled><i class="fas fa-lock"></i> Projeto Privado</button>`;
                }

                // 2. Construir HTML Moderno
                const modalHtml = `
                    <div class="project-modal-overlay" id="dynamic-project-modal">
                        <div class="project-modal-card">
                            
                            <div class="pm-hero" style="background-image: url('${imageUrl}');">
                                <button class="pm-close-btn" onclick="document.getElementById('dynamic-project-modal').remove()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>

                            <div class="pm-content">
                                <div class="pm-header">
                                    <span class="pm-status ${statusClass}">${projeto.status || 'Em Planejamento'}</span>
                                    <h2 class="pm-title">${projeto.titulo}</h2>
                                </div>

                                <div class="pm-description">
                                    ${projeto.descricao || "Este projeto não possui uma descrição detalhada."}
                                </div>

                                <div class="pm-grid">
                                    <div class="pm-info-item">
                                        <h4>Categoria</h4>
                                        <span>${projeto.categoria || 'Geral'}</span>
                                    </div>
                                    <div class="pm-info-item">
                                        <h4>Privacidade</h4>
                                        <span>${projeto.grupoPrivado ? '<i class="fas fa-lock"></i> Privado' : '<i class="fas fa-globe"></i> Público'}</span>
                                    </div>
                                    <div class="pm-info-item">
                                        <h4>Equipe</h4>
                                        <span>${projeto.totalMembros || (projeto.membros?.length || 0)} Membros</span>
                                    </div>
                                </div>

                                <div class="pm-section-title">Tecnologias Utilizadas</div>
                                <div class="pm-tags">${techsHtml}</div>

                                <div class="pm-section-title">Equipe do Projeto</div>
                                <div class="pm-members">${membrosHtml}</div>
                            </div>

                            <div class="pm-footer">
                                ${actionButtonHtml}
                                <a href="projeto-detalhe.html?id=${projeto.id}" class="pm-btn pm-btn-secondary">
                                    Ver Detalhes Completos <i class="fas fa-arrow-right"></i>
                                </a>
                            </div>

                        </div>
                    </div>
                `;

                // 3. Inserir no DOM
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                // 4. Fechar ao clicar fora
                setTimeout(() => {
                    const modalOverlay = document.getElementById('dynamic-project-modal');
                    if (modalOverlay) {
                        modalOverlay.addEventListener('click', (e) => {
                            if (e.target === modalOverlay) {
                                modalOverlay.remove();
                            }
                        });
                    }
                }, 100);
            },

            renderOnlineFriends() {
                if (!this.elements.onlineFriendsList) return;

                const onlineFriends = (window.userFriends || []).filter(friend =>
                    (window.latestOnlineEmails || []).includes(friend.email)
                );
                this.elements.onlineFriendsList.innerHTML = "";

                if (onlineFriends.length === 0) {
                    this.elements.onlineFriendsList.innerHTML =
                        '<p class="empty-state">Nenhum amigo online</p>';
                    return;
                }

                onlineFriends.forEach(friend => {
                    const friendElement = this.createFriendElement(friend);
                    this.elements.onlineFriendsList.appendChild(friendElement);
                });
            },

            createFriendElement(friend) {
                const friendElement = document.createElement("div");
                friendElement.className = "friend-item";
                const friendId = friend.idUsuario;
                const friendAvatar = friend.fotoPerfil
                    ? (friend.fotoPerfil.startsWith('http')
                        ? friend.fotoPerfil
                        : `${window.backendUrl}/api/arquivos/${friend.fotoPerfil}`)
                    : window.defaultAvatarUrl;
                friendElement.innerHTML = `
                    <a href="perfil.html?id=${friendId}" class="friend-item-link">
                        <div class="avatar"><img src="${friendAvatar}" alt="Avatar de ${friend.nome}" onerror="this.src='${window.defaultAvatarUrl}';"></div>
                        <span class="friend-name">${friend.nome}</span>
                    </a>
                    <div class="status online"></div>
                `;
                return friendElement;
            },

            render() {
                const grid = this.elements.grid;
                if (!grid) return;
                grid.innerHTML = "";
                const projetosParaRenderizar = this.state.myProjects;

                if (this.elements.projectsCount) {
                    this.elements.projectsCount.textContent = projetosParaRenderizar.length;
                }

                if (projetosParaRenderizar.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>Nenhum projeto encontrado com esses filtros.</p>
                            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Experimente as outras abas para explorar mais projetos!</p>
                        </div>`;
                    return;
                }

                projetosParaRenderizar.forEach((proj) => {
                    const card = document.createElement("a");
                    card.className = "projeto-card";
                    card.href = `projeto-detalhe.html?id=${proj.id}`;

                    const imageUrl = this.getProjectImageUrl(proj.imagemUrl);

                    const membrosHtml = (proj.membros || [])
                        .slice(0, 5)
                        .map((membro) => {
                            const avatarUrl = this.getMemberAvatarUrl(membro);
                            return `<img class="membro-avatar" src="${avatarUrl}" title="${membro.usuarioNome}" onerror="this.src='${window.defaultAvatarUrl}'">`;
                        })
                        .join("");

                    const remainingMembers = (proj.membros || []).length - 5;
                    const moreMembersHtml = remainingMembers > 0
                        ? `<div class="membro-avatar more-members">+${remainingMembers}</div>`
                        : '';

                    const tagsHtml = (proj.tecnologias || [])
                        .slice(0, 3)
                        .map(tag => `<span class="tech-tag">${tag}</span>`)
                        .join("");

                    const moreTags = (proj.tecnologias || []).length > 3
                        ? `<span class="tech-tag more-tags">+${(proj.tecnologias || []).length - 3}</span>`
                        : '';

                    card.innerHTML = `
                        <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                        <div class="projeto-conteudo">
                            <div class="projeto-header">
                                <h3>${proj.titulo}</h3>
                                <span class="projeto-status ${proj.status?.toLowerCase() || 'planejamento'}">${proj.status || 'Em planejamento'}</span>
                            </div>
                            <p class="projeto-descricao">${proj.descricao || "Este projeto não possui uma descrição."}</p>
                            
                            <div class="projeto-meta">
                                <div class="projeto-membros">
                                    ${membrosHtml}${moreMembersHtml}
                                    <span class="membros-count">${proj.totalMembros || proj.membros?.length || 0} membros</span>
                                </div>
                                <div class="projeto-categoria">${proj.categoria || 'Sem categoria'}</div>
                            </div>
                            
                            <div class="projeto-footer">
                                <div class="projeto-tags">
                                    ${tagsHtml}${moreTags}
                                </div>
                                <div class="projeto-privacy ${proj.grupoPrivado ? 'private' : 'public'}">
                                    <i class="fas ${proj.grupoPrivado ? 'fa-lock' : 'fa-globe'}"></i>
                                    ${proj.grupoPrivado ? 'Privado' : 'Público'}
                                </div>
                            </div>
                        </div>`;
                    grid.appendChild(card);
                });
            },

            handlers: {
               openModal() {
    const preview = document.getElementById('proj-image-preview');
    
    // Se não tiver src, ou se for o placeholder antigo, ou se a imagem quebrou (src vazio)
    if (preview) {
        // Define a imagem padrão do backend
        if (!preview.src || preview.src.includes('placehold.co') || preview.src === window.location.href) {
            preview.src = DEFAULT_COVER_IMAGE;
        }
        
        // Garante que, se der erro ao carregar (ex: 404), volte para o padrão
        preview.onerror = function() {
            this.src = DEFAULT_COVER_IMAGE;
        };
    }
    toggleModal('novo-projeto-modal', true);
},

// Atualize o método handlers.closeModal
closeModal() {
    toggleModal('novo-projeto-modal', false);
    
    const form = document.getElementById('novo-projeto-form');
    const preview = document.getElementById('proj-image-preview');
    
    if (form) form.reset();
    
    // Reseta para a imagem padrão do backend ao fechar
    if (preview) {
        preview.src = DEFAULT_COVER_IMAGE;
    }
},
                async handleFormSubmit(e) {
    e.preventDefault();
    const form = this.elements.form;
    const btn = form.querySelector(".btn-publish");
    setButtonLoading(btn, true);

    const formData = new FormData();
    formData.append("titulo", this.elements.projTituloInput.value);
    formData.append("descricao", this.elements.projDescricaoInput.value);
    formData.append("autorId", currentUser.id);
    formData.append("maxMembros", 50);
    // Converte string 'true'/'false' para booleano real
    formData.append("grupoPrivado", this.elements.projPrivacidadeInput.value === 'true');

    const categoria = this.elements.projCategoriaInput.value;
    if (categoria) {
        formData.append("categoria", categoria);
    }

    const techsString = this.elements.projTecnologiasInput.value;
    if (techsString) {
        const tecnologias = techsString.split(',')
            .map(tech => tech.trim())
            .filter(tech => tech.length > 0);
        tecnologias.forEach(tech => {
            formData.append("tecnologias", tech);
        });
    }

    if (this.elements.projImagemInput.files[0]) {
        formData.append("foto", this.elements.projImagemInput.files[0]);
    }

    try {
        // 1. Tenta criar o projeto
        const response = await window.axios.post(`${window.backendUrl}/projetos`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const novoProjeto = response.data;

        // 2. Limpa o formulário e fecha o modal IMEDIATAMENTE
        form.reset();
        this.handlers.closeModal.call(this); // Fecha o modal
        window.showNotification("Projeto criado com sucesso!", "success");

        // 3. UI OTIMISTA: Adiciona o novo projeto na lista local manualmente
        // Garante que a estrutura de membros exista para não quebrar o card
        if (!novoProjeto.membros) {
            novoProjeto.membros = [{
                usuarioId: currentUser.id,
                usuarioNome: currentUser.nome,
                usuarioFotoPerfil: currentUser.urlFotoPerfil || currentUser.fotoPerfil
            }];
            novoProjeto.totalMembros = 1;
        }
        
        // Adiciona ao início das listas de estado
        this.state.allProjects.unshift(novoProjeto);
        
        // Se for público, adiciona na lista de públicos também
        if (!novoProjeto.grupoPrivado) {
            this.state.publicProjects.unshift(novoProjeto);
        } else {
            this.state.privateProjects.unshift(novoProjeto);
        }

        // 4. Força a troca para a aba "Meus Projetos" e renderiza
        this.state.currentTab = 'meus-projetos';
        this.elements.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === 'meus-projetos');
        });
        
        // Esconde os outros containers e mostra o "Meus Projetos"
        document.getElementById('projetos-publicos-container').style.display = 'none';
        document.getElementById('projetos-privados-container').style.display = 'none';
        document.getElementById('meus-projetos-container').style.display = 'block';

        // Aplica os filtros (que vai chamar o render e mostrar o novo projeto)
        this.applyFilters();

        // 5. Atualização silenciosa em segundo plano (não bloqueia o sucesso)
        // Isso garante que se houver algum dado extra do backend, ele apareça depois
        setTimeout(async () => {
            try {
                await this.fetchMeusProjetos();
                await this.fetchProjetosPublicos();
                await this.fetchProjetosPrivados();
            } catch (bgError) {
                console.warn("Erro na atualização de fundo (ignorado para UX):", bgError);
            }
        }, 1000);

    } catch (error) {
        console.error("Erro ao criar projeto:", error);
        let errorMessage = "Falha ao criar o projeto.";
        
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data && typeof error.response.data === 'string') {
            errorMessage = error.response.data;
        }
        
        window.showNotification(errorMessage, "error");
    } finally {
        setButtonLoading(btn, false);
    }
}
            },

            applyFilters() {
                const search = this.elements.searchInput.value.toLowerCase();
                const category = this.elements.categoryFilter.value;
                if (!currentUser) return;

                this.state.myProjects = this.state.allProjects.filter((proj) => {
                    const isMember = proj.membros && proj.membros.some(
                        (membro) => membro.usuarioId === currentUser.id
                    );
                    const searchMatch = (proj.titulo || "")
                        .toLowerCase()
                        .includes(search) ||
                        (proj.descricao || "").toLowerCase().includes(search) ||
                        (proj.tecnologias || []).some(tech => tech.toLowerCase().includes(search));

                    const categoryMatch = (category === "todos") ||
                        (proj.categoria && proj.categoria.toLowerCase() === category);

                    return isMember && searchMatch && categoryMatch;
                });
                this.render();
            },

            setupEventListeners() {

                

                const projImageInput = document.getElementById('proj-imagem');
                const projImagePreview = document.getElementById('proj-image-preview');
                const defaultCover = window.defaultProjectUrl || `${window.backendUrl}/images/default-project.jpg`;
                if (projImageInput && projImagePreview) {
                    projImageInput.addEventListener('change', function (e) {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                projImagePreview.src = e.target.result;
                            }
                            reader.readAsDataURL(file);
                        } else {
                            projImagePreview.src = defaultCover;
                        }
                    });
                }

                // 2. Adicionar lógica de Cancelar botão secundário
                const closeBtnAction = document.querySelector('.close-modal-btn-action');
                if (closeBtnAction) {
                    closeBtnAction.addEventListener('click', () => this.handlers.closeModal.call(this));
                }

                const { openModalBtn, closeModalBtn, modalOverlay, form, searchInput, categoryFilter } =
                    this.elements;

                // CORREÇÃO: Configurar o evento de clique para abrir o modal
                if (openModalBtn) {
                    openModalBtn.addEventListener("click", () => this.handlers.openModal());
                }

                if (closeModalBtn) {
                    closeModalBtn.addEventListener("click", () => this.handlers.closeModal());
                }

                if (form) {
                    form.addEventListener("submit", (e) => this.handlers.handleFormSubmit.call(this, e));
                }

                if (searchInput) {
                    searchInput.addEventListener("input", this.applyFilters.bind(this));
                }

                if (categoryFilter) {
                    categoryFilter.addEventListener("change", this.applyFilters.bind(this));
                }

                if (modalOverlay) {
                    modalOverlay.addEventListener("click", (e) => {
                        if (e.target === modalOverlay) this.handlers.closeModal.call(this);
                    });
                }

                // Adicionar listener para busca em todas as abas
                if (searchInput) {
                    searchInput.addEventListener('input', () => {
                        if (this.state.currentTab === 'projetos-publicos') {
                            this.filterPublicProjects();
                        } else if (this.state.currentTab === 'projetos-privados') {
                            this.filterPrivateProjects();
                        }
                    });
                }

                if (categoryFilter) {
                    categoryFilter.addEventListener('change', () => {
                        if (this.state.currentTab === 'projetos-publicos') {
                            this.filterPublicProjects();
                        } else if (this.state.currentTab === 'projetos-privados') {
                            this.filterPrivateProjects();
                        }
                    });
                }
            },

            filterPublicProjects() {
                const search = this.elements.searchInput.value.toLowerCase();
                const category = this.elements.categoryFilter.value;

                const filteredProjects = this.state.publicProjects.filter((proj) => {
                    const searchMatch = (proj.titulo || "")
                        .toLowerCase()
                        .includes(search) ||
                        (proj.descricao || "").toLowerCase().includes(search) ||
                        (proj.tecnologias || []).some(tech => tech.toLowerCase().includes(search));

                    const categoryMatch = (category === "todos") ||
                        (proj.categoria && proj.categoria.toLowerCase() === category);

                    return searchMatch && categoryMatch;
                });

                this.renderFilteredPublicProjects(filteredProjects);
            },

            filterPrivateProjects() {
                const search = this.elements.searchInput.value.toLowerCase();
                const category = this.elements.categoryFilter.value;

                const filteredProjects = this.state.privateProjects.filter((proj) => {
                    const searchMatch = (proj.titulo || "")
                        .toLowerCase()
                        .includes(search) ||
                        (proj.descricao || "").toLowerCase().includes(search) ||
                        (proj.tecnologias || []).some(tech => tech.toLowerCase().includes(search));

                    const categoryMatch = (category === "todos") ||
                        (proj.categoria && proj.categoria.toLowerCase() === category);

                    return searchMatch && categoryMatch;
                });

                this.renderFilteredPrivateProjects(filteredProjects);
            },

            renderFilteredPublicProjects(filteredProjects) {
                const grid = this.elements.publicGrid;
                if (!grid) return;

                grid.innerHTML = "";

                if (filteredProjects.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>Nenhum projeto público encontrado com esses filtros.</p>
                        </div>`;
                    return;
                }

                filteredProjects.forEach((proj) => {
                    const card = document.createElement("div");
                    card.className = "projeto-card";

                    const imageUrl = this.getProjectImageUrl(proj.imagemUrl);

                    const membrosHtml = (proj.membros || [])
                        .slice(0, 5)
                        .map((membro) => {
                            const avatarUrl = this.getMemberAvatarUrl(membro);
                            return `<img class="membro-avatar" src="${avatarUrl}" title="${membro.usuarioNome}" onerror="this.src='${window.defaultAvatarUrl}'">`;
                        })
                        .join("");

                    const remainingMembers = (proj.membros || []).length - 5;
                    const moreMembersHtml = remainingMembers > 0
                        ? `<div class="membro-avatar more-members">+${remainingMembers}</div>`
                        : '';

                    const tagsHtml = (proj.tecnologias || [])
                        .slice(0, 3)
                        .map(tag => `<span class="tech-tag">${tag}</span>`)
                        .join("");

                    const moreTags = (proj.tecnologias || []).length > 3
                        ? `<span class="tech-tag more-tags">+${(proj.tecnologias || []).length - 3}</span>`
                        : '';

                    // Verificar se o usuário atual já é membro
                    const isMember = proj.membros && proj.membros.some(membro => membro.usuarioId === currentUser.id);
                    const isAuthor = proj.autorId === currentUser.id;

                    let detailsButton = '';
                    if (isAuthor || isMember) {
                        detailsButton = `<a href="projeto-detalhe.html?id=${proj.id}" class="btn-ver-detalhes">Acessar Área do Projeto</a>`;
                    } else {
                        detailsButton = `<button class="btn-ver-detalhes" onclick="ProjetosPage.showProjectPreview(${JSON.stringify(proj).replace(/"/g, '&quot;')})">Ver Detalhes</button>`;
                    }

                    card.innerHTML = `
                        <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                        <div class="projeto-conteudo">
                            <div class="projeto-header">
                                <h3>${proj.titulo}</h3>
                                <span class="projeto-status ${proj.status?.toLowerCase() || 'planejamento'}">${proj.status || 'Em planejamento'}</span>
                            </div>
                            <p class="projeto-descricao">${proj.descricao || "Este projeto não possui uma descrição."}</p>
                            
                            <div class="projeto-meta">
                                <div class="projeto-membros">
                                    ${membrosHtml}${moreMembersHtml}
                                    <span class="membros-count">${proj.totalMembros || proj.membros?.length || 0} membros</span>
                                </div>
                                <div class="projeto-categoria">${proj.categoria || 'Sem categoria'}</div>
                            </div>
                            
                            <div class="projeto-footer">
                                    <div class="projeto-tags">
                                        ${tagsHtml}${moreTags}
                                    </div>
                                    <div class="projeto-actions">
                                        ${isAuthor
                            ? '<button class="btn-entrar disabled" disabled>Criador</button>'
                            : isMember
                                ? '<button class="btn-entrar disabled" disabled>Já é membro</button>'
                                : `<button class="btn-entrar" onclick="ProjetosPage.entrarNoProjeto(${proj.id})">Entrar no Projeto</button>`
                        }
                                        ${detailsButton}
                                    </div>
                            </div>
                        </div>`;
                    grid.appendChild(card);
                });
            },

            renderFilteredPrivateProjects(filteredProjects) {
                const grid = this.elements.privateGrid;
                if (!grid) return;

                grid.innerHTML = "";

                if (filteredProjects.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>Nenhum projeto privado encontrado com esses filtros.</p>
                        </div>`;
                    return;
                }

                filteredProjects.forEach((proj) => {
                    const card = document.createElement("div");
                    card.className = "projeto-card";

                    const imageUrl = this.getProjectImageUrl(proj.imagemUrl);

                    const membrosHtml = (proj.membros || [])
                        .slice(0, 5)
                        .map((membro) => {
                            const avatarUrl = this.getMemberAvatarUrl(membro);
                            return `<img class="membro-avatar" src="${avatarUrl}" title="${membro.usuarioNome}" onerror="this.src='${window.defaultAvatarUrl}'">`;
                        })
                        .join("");

                    const remainingMembers = (proj.membros || []).length - 5;
                    const moreMembersHtml = remainingMembers > 0
                        ? `<div class="membro-avatar more-members">+${remainingMembers}</div>`
                        : '';

                    const tagsHtml = (proj.tecnologias || [])
                        .slice(0, 3)
                        .map(tag => `<span class="tech-tag">${tag}</span>`)
                        .join("");

                    const moreTags = (proj.tecnologias || []).length > 3
                        ? `<span class="tech-tag more-tags">+${(proj.tecnologias || []).length - 3}</span>`
                        : '';

                    // Verificar se o usuário atual já é membro
                    const isMember = proj.membros && proj.membros.some(membro => membro.usuarioId === currentUser.id);
                    const isAuthor = proj.autorId === currentUser.id;

                    let actionButton = '';
                    if (isAuthor) {
                        actionButton = '<button class="btn-entrar disabled" disabled>Criador</button>';
                    } else if (isMember) {
                        actionButton = '<button class="btn-entrar disabled" disabled>Já é membro</button>';
                    } else {
                        actionButton = `<button class="btn-solicitar-entrada" onclick="ProjetosPage.solicitarEntradaProjeto(${proj.id})">Solicitar Entrada</button>`;
                    }

                    card.innerHTML = `
                        <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                        <div class="projeto-conteudo">
                            <div class="projeto-header">
                                <h3>${proj.titulo}</h3>
                                <span class="projeto-status ${proj.status?.toLowerCase() || 'planejamento'}">${proj.status || 'Em planejamento'}</span>
                            </div>
                            <p class="projeto-descricao">${proj.descricao || "Este projeto não possui uma descrição."}</p>
                            
                            <div class="projeto-meta">
                                <div class="projeto-membros">
                                    ${membrosHtml}${moreMembersHtml}
                                    <span class="membros-count">${proj.totalMembros || proj.membros?.length || 0} membros</span>
                                </div>
                                <div class="projeto-categoria">${proj.categoria || 'Sem categoria'}</div>
                            </div>
                            
                            <div class="projeto-footer">
                                    <div class="projeto-tags">
                                        ${tagsHtml}${moreTags}
                                    </div>
                                    <div class="projeto-actions">
                                        ${actionButton}
                                        <button class="btn-ver-detalhes" onclick="ProjetosPage.showProjectPreview(${JSON.stringify(proj).replace(/"/g, '&quot;')})">Ver Detalhes</button>
                                    </div>
                            </div>
                        </div>`;
                    grid.appendChild(card);
                });
            }
        };

        ProjetosPage.init();
        window.ProjetosPage = ProjetosPage;
    });
});