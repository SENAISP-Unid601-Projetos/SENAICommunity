document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------------------
    // AGUARDA O SCRIPT PRINCIPAL
    // -----------------------------------------------------------------
    document.addEventListener("globalScriptsLoaded", (e) => {
        // --- SELEÇÃO DE ELEMENTOS (Específicos da Página) ---
        const elements = {
            receivedRequestsList: document.getElementById("received-requests-list"),
            sentRequestsList: document.getElementById("sent-requests-list"),
            friendsList: document.getElementById("friends-list"),
            userInfoLoading: document.getElementById("user-info-loading"),
            topbarUserLoading: document.getElementById("topbar-user-loading"),
            userInfo: document.querySelector('.user-info'),
            topbarUser: document.querySelector('.user-dropdown .user'),
            // Seletores Mobile
            mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
            sidebar: document.getElementById('sidebar'),
            sidebarClose: document.getElementById('sidebar-close'),
            mobileOverlay: document.getElementById('mobile-overlay'),
            projectsCount: document.getElementById("projects-count")
        };

        // -----------------------------------------------------------------
        // CORREÇÃO: FUNÇÕES DE RESPONSIVIDADE
        // -----------------------------------------------------------------

        function initResponsiveFeatures() {
            // 1. Botão de Abrir Menu (Clonagem para limpar eventos do principal.js)
            if (elements.mobileMenuToggle) {
                const newBtn = elements.mobileMenuToggle.cloneNode(true);
                elements.mobileMenuToggle.parentNode.replaceChild(newBtn, elements.mobileMenuToggle);
                elements.mobileMenuToggle = newBtn;
                
                elements.mobileMenuToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleMobileMenu();
                });
            }

            // 2. CORREÇÃO AQUI: Botão de Fechar Menu (Clonagem também necessária)
            if (elements.sidebarClose) {
                const newCloseBtn = elements.sidebarClose.cloneNode(true);
                elements.sidebarClose.parentNode.replaceChild(newCloseBtn, elements.sidebarClose);
                elements.sidebarClose = newCloseBtn; // Atualiza a referência

                elements.sidebarClose.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMobileMenu();
                });
            }
            
            // 3. Overlay (Clicar fora para fechar)
            if (elements.mobileOverlay) {
                // Remove listener antigo se existir (embora cloneNode não se aplique aqui facilmente, removemos e adicionamos)
                elements.mobileOverlay.removeEventListener('click', toggleMobileMenu); 
                elements.mobileOverlay.addEventListener('click', toggleMobileMenu);
            }

            // 4. Fechar ao clicar em links do menu
            const menuLinks = document.querySelectorAll('.menu-item');
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) { 
                        toggleMobileMenu();
                    }
                });
            });

            window.addEventListener('resize', handleResize);
        }

        function toggleMobileMenu() {
            // Verifica se está aberto
            const isOpen = elements.sidebar.classList.contains('mobile-open');
            
            if (isOpen) {
                // FECHAR
                elements.sidebar.classList.remove('mobile-open');
                elements.mobileOverlay.classList.remove('active');
                document.body.style.overflow = ''; // Libera o scroll
            } else {
                // ABRIR
                elements.sidebar.classList.add('mobile-open');
                elements.mobileOverlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // Trava o scroll
            }
        }

        function handleResize() {
            if (window.innerWidth > 1024) {
                elements.sidebar.classList.remove('mobile-open');
                elements.mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO
        // -----------------------------------------------------------------

        function setProfileLoading(isLoading) {
            if (elements.userInfo && elements.topbarUser) {
                if (isLoading) {
                    elements.userInfo.classList.remove('loaded');
                    elements.topbarUser.classList.remove('loaded');
                } else {
                    elements.userInfo.classList.add('loaded');
                    elements.topbarUser.classList.add('loaded');
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

        setProfileLoading(true);

        // -----------------------------------------------------------------
        // FUNÇÕES DE BUSCA DE DADOS
        // -----------------------------------------------------------------

        async function fetchUserProjectsCount() {
            if (!elements.projectsCount) return;
            try {
                const response = await window.axios.get(`${window.backendUrl}/projetos`);
                const projects = response.data;
                elements.projectsCount.textContent = projects.length;
            } catch (error) {
                console.error("Erro ao buscar contagem de projetos:", error);
                elements.projectsCount.textContent = "0";
            }
        }

        async function fetchReceivedRequests() {
            if (!elements.receivedRequestsList) return;
            elements.receivedRequestsList.innerHTML = `
                <div class="results-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando pedidos recebidos...</p>
                </div>
            `;
            try {
                const response = await window.axios.get(`${window.backendUrl}/api/amizades/pendentes`);
                renderRequests(response.data, elements.receivedRequestsList, "received");
            } catch (error) {
                console.error("Erro ao buscar pedidos recebidos:", error);
                elements.receivedRequestsList.innerHTML = `<div class="empty-state">Não foi possível carregar os pedidos.</div>`;
            }
        }

        async function fetchSentRequests() {
            if (!elements.sentRequestsList) return;
            elements.sentRequestsList.innerHTML = `
                <div class="results-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando pedidos enviados...</p>
                </div>
            `;
            try {
                const response = await window.axios.get(`${window.backendUrl}/api/amizades/enviadas`);
                renderRequests(response.data, elements.sentRequestsList, "sent");
            } catch (error) {
                console.error("Erro ao buscar pedidos enviados:", error);
                elements.sentRequestsList.innerHTML = `<div class="empty-state">Não foi possível carregar os pedidos.</div>`;
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DE RENDERIZAÇÃO
        // -----------------------------------------------------------------

        function renderRequests(requests, container, type) {
            if (!container) return;
            container.innerHTML = "";
            if (requests.length === 0) {
                container.innerHTML = `<div class="empty-state">Nenhum pedido ${type === 'received' ? 'recebido' : 'enviado'}.</div>`;
                return;
            }

            requests.forEach((req) => {
                const card = document.createElement("div");
                card.className = "request-card";
                card.id = `${type}-card-${req.idAmizade}`;

                const data = new Date(req.dataSolicitacao).toLocaleDateString("pt-BR");
                const nome = type === "received" ? req.nomeSolicitante : req.nomeSolicitado;
                const fotoPath = type === "received" ? req.fotoPerfilSolicitante : req.fotoPerfilSolicitado;
                const fotoUrl = window.getAvatarUrl(fotoPath);

                let actionsHtml = "";
                if (type === "received") {
                    actionsHtml = `
                        <button class="btn btn-primary" onclick="window.aceitar(${req.idAmizade}, this)">Aceitar</button>
                        <button class="btn btn-secondary" onclick="window.recusar(${req.idAmizade}, this)">Recusar</button>
                    `;
                } else {
                    actionsHtml = `<button class="btn btn-danger" onclick="window.cancelar(${req.idAmizade}, this)">Cancelar Pedido</button>`;
                }

                card.innerHTML = `
                    <div class="request-card-header">
                        <div class="request-avatar">
                            <img src="${fotoUrl}" alt="Foto de ${nome}" loading="lazy">
                        </div>
                        <div class="request-info">
                            <h4>${nome}</h4>
                            <p>Pedido: ${data}</p>
                        </div>
                    </div>
                    <div class="request-actions">
                        ${actionsHtml}
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function renderFriends() {
            const container = elements.friendsList;
            if (!container) return;
            container.innerHTML = "";

            const friends = window.userFriends || [];

            if (friends.length === 0) {
                container.innerHTML = `
                <div class="empty-friends-state">
                    <i class="fas fa-user-friends"></i>
                    <h3>Nenhuma conexão ainda</h3>
                    <p>Encontre pessoas para se conectar e expandir sua rede</p>
                    <a href="buscar_amigos.html" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i> Encontrar Pessoas
                    </a>
                </div>
                `;
                return;
            }

            friends.forEach((friend, index) => {
                const card = document.createElement("div");
                card.className = "friend-card";
                card.id = `friend-card-${friend.idAmizade}`;

                const fotoUrl = window.getAvatarUrl(friend.fotoPerfil);
                const isOnline = window.latestOnlineEmails?.includes(friend.email);
                const statusClass = isOnline ? 'online' : 'offline';

                card.innerHTML = `
                <a href="perfil.html?id=${friend.idUsuario}" class="friend-card-header">
                    <div class="friend-avatar">
                    <img src="${fotoUrl}" alt="Foto de ${friend.nome}" loading="lazy">
                    <div class="friend-status ${statusClass}"></div>
                    </div>
                    <div class="friend-info">
                    <h3 class="friend-name">${friend.nome}</h3>
                    <p class="friend-email">${friend.email}</p>
                    </div>
                </a>
                
                <div class="friend-actions">
                    <a href="mensagem.html?start_chat=${friend.idUsuario}" class="friend-action-btn primary">
                    <i class="fas fa-comment-dots"></i> Mensagem
                    </a>
                    <button class="friend-action-btn danger" onclick="window.removerAmizade(${friend.idAmizade}, this)">
                    <i class="fas fa-user-minus"></i> Remover
                    </button>
                </div>
                `;

                card.style.animationDelay = `${index * 0.1}s`;
                container.appendChild(card);
            });
            
            if (typeof window.atualizarStatusDeAmigosNaUI === "function") {
                window.atualizarStatusDeAmigosNaUI();
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DE AÇÃO GLOBAL
        // -----------------------------------------------------------------
        window.aceitar = async (amizadeId, buttonElement) => {
            setButtonLoading(buttonElement, true);
            try {
                await window.axios.post(`${window.backendUrl}/api/amizades/aceitar/${amizadeId}`);
                window.showNotification("Amizade aceita!", "success");
                fetchReceivedRequests();
                carregarDadosDaPagina();
            } catch (err) {
                console.error(err);
                window.showNotification("Erro ao aceitar amizade.", "error");
                setButtonLoading(buttonElement, false);
            }
        };

        window.recusar = async (amizadeId, buttonElement) => {
            setButtonLoading(buttonElement, true);
            try {
                await window.axios.delete(`${window.backendUrl}/api/amizades/recusar/${amizadeId}`);
                window.showNotification("Pedido recusado.", "info");
                fetchReceivedRequests();
            } catch (err) {
                console.error(err);
                window.showNotification("Erro ao recusar.", "error");
                setButtonLoading(buttonElement, false);
            }
        };

        window.cancelar = async (amizadeId, buttonElement) => {
            setButtonLoading(buttonElement, true);
            try {
                await window.axios.delete(`${window.backendUrl}/api/amizades/recusar/${amizadeId}`);
                window.showNotification("Pedido cancelado.", "info");
                fetchSentRequests();
            } catch (err) {
                console.error(err);
                window.showNotification("Erro ao cancelar pedido.", "error");
                setButtonLoading(buttonElement, false);
            }
        };

        window.removerAmizade = async (amizadeId, buttonElement) => {
            if (confirm("Tem certeza que deseja remover esta amizade?")) {
                setButtonLoading(buttonElement, true);
                try {
                    await window.axios.delete(`${window.backendUrl}/api/amizades/recusar/${amizadeId}`);
                    window.showNotification("Amizade removida.", "info");
                    carregarDadosDaPagina();
                } catch (err) {
                    console.error("Erro ao remover amizade:", err);
                    window.showNotification("Erro ao remover amizade.", "error");
                    setButtonLoading(buttonElement, false);
                }
            }
        };

        function carregarDadosDaPagina() {
            if (elements.friendsList) {
                // Não substitui o conteúdo se já houver cards, para evitar flash
                if(elements.friendsList.children.length === 0) {
                     elements.friendsList.innerHTML = `<div class="friends-loading"><div class="loading-spinner"></div></div>`; 
                }
            }
            
            fetchReceivedRequests();
            fetchSentRequests();
            fetchUserProjectsCount();
            
            setTimeout(() => { setProfileLoading(false); }, 1000);
            setTimeout(() => { renderFriends(); }, 500);
        }

        initResponsiveFeatures();
        carregarDadosDaPagina();
        handleResize();

        document.addEventListener("friendsListUpdated", () => {
            carregarDadosDaPagina();
        });

        document.addEventListener("onlineStatusUpdated", () => {
            renderFriends();
        });
    });
});