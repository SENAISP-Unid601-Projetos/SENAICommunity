document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------------------
    // AGUARDA O SCRIPT PRINCIPAL (CARREGAMENTO DO USUÁRIO)
    // -----------------------------------------------------------------
    document.addEventListener("globalScriptsLoaded", (e) => {
        const { currentUser } = e.detail; // Pega o usuário já carregado

        // --- VARIÁVEIS GLOBAIS ---
        let listaCompletaRecebidos = [];
        let listaCompletaEnviados = [];
        let listaCompletaAmigos = [];
        const LIMITE_EXIBICAO = 6;

        // --- SELEÇÃO DE ELEMENTOS ---
        const elements = {
            receivedRequestsList: document.getElementById("received-requests-list"),
            sentRequestsList: document.getElementById("sent-requests-list"),
            friendsList: document.getElementById("friends-list"),
            userInfoLoading: document.getElementById("user-info-loading"),
            
            // Seletores Mobile
            mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
            sidebar: document.getElementById('sidebar'),
            sidebarClose: document.getElementById('sidebar-close'),
            mobileOverlay: document.getElementById('mobile-overlay'),
            
            // Stats
            projectsCount: document.getElementById("projects-count"),
            connectionsCount: document.getElementById("connections-count"), // Adicionado
            
            // Modal "Ver Mais"
            modalLista: document.getElementById("modal-lista-usuarios"),
            modalListaContainer: document.getElementById("modal-lista-container"),
            modalListaTitulo: document.getElementById("modal-lista-titulo"),
            btnFecharLista: document.getElementById("btn-fechar-lista")
        };

        // -----------------------------------------------------------------
        // 1. CORREÇÃO: MENU MOBILE
        // -----------------------------------------------------------------
        function initResponsiveFeatures() {
            // Função para abrir/fechar
            const toggleMenu = (e) => {
                if(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                // Toggle da classe no CSS
                elements.sidebar.classList.toggle('mobile-open');
                
                // Toggle do Overlay
                if (elements.sidebar.classList.contains('mobile-open')) {
                    elements.mobileOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Trava scroll
                } else {
                    elements.mobileOverlay.classList.remove('active');
                    document.body.style.overflow = ''; // Libera scroll
                }
            };

            // Remove listeners antigos do principal.js clonando os botões
            if (elements.mobileMenuToggle) {
                const newBtn = elements.mobileMenuToggle.cloneNode(true);
                elements.mobileMenuToggle.parentNode.replaceChild(newBtn, elements.mobileMenuToggle);
                elements.mobileMenuToggle = newBtn;
                elements.mobileMenuToggle.addEventListener('click', toggleMenu);
            }

            if (elements.sidebarClose) {
                const newCloseBtn = elements.sidebarClose.cloneNode(true);
                elements.sidebarClose.parentNode.replaceChild(newCloseBtn, elements.sidebarClose);
                elements.sidebarClose = newCloseBtn;
                elements.sidebarClose.addEventListener('click', toggleMenu);
            }
            
            // Overlay fecha o menu
            if (elements.mobileOverlay) {
                const newOverlay = elements.mobileOverlay.cloneNode(true);
                elements.mobileOverlay.parentNode.replaceChild(newOverlay, elements.mobileOverlay);
                elements.mobileOverlay = newOverlay;
                elements.mobileOverlay.addEventListener('click', toggleMenu);
            }

            // Fechar ao clicar em links do menu (Melhor UX no mobile)
            const menuLinks = document.querySelectorAll('.sidebar .menu-item');
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 1024 && elements.sidebar.classList.contains('mobile-open')) { 
                        toggleMenu();
                    }
                });
            });
            
            // Resetar ao redimensionar a tela
            window.addEventListener('resize', () => {
                if (window.innerWidth > 1024) {
                    elements.sidebar.classList.remove('mobile-open');
                    elements.mobileOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        // -----------------------------------------------------------------
        // 2. CORREÇÃO: CONTADOR DE PROJETOS E CONEXÕES
        // -----------------------------------------------------------------
        function updateUserStats() {
            // Usa os dados do currentUser que veio do GlobalScriptsLoaded (principal.js)
            // Isso evita uma requisição extra desnecessária e garante o número correto.
            
            if (currentUser) {
                // Atualiza Projetos
                if (elements.projectsCount) {
                    elements.projectsCount.textContent = currentUser.totalProjetos || "0";
                }
                
                // Atualiza Conexões (temporariamente com o que tem no user, depois atualiza com a lista)
                /* O fetchFriends() lá embaixo vai atualizar isso com precisão, 
                   mas podemos por um placeholder aqui se o currentUser tiver esse campo */
            }
        }

        // -----------------------------------------------------------------
        // ORDENAÇÃO E FILTROS
        // -----------------------------------------------------------------
        function ordenarAmigosPorOnline(lista) {
            const onlineEmails = window.latestOnlineEmails || [];
            return lista.sort((a, b) => {
                const aOnline = onlineEmails.includes(a.email);
                const bOnline = onlineEmails.includes(b.email);
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;
                return 0;
            });
        }

        // -----------------------------------------------------------------
        // LÓGICA DO MODAL "VER MAIS"
        // -----------------------------------------------------------------
        function abrirModalLista(tipo) {
            if (!elements.modalLista) return;
            elements.modalListaContainer.innerHTML = ''; 
            elements.modalLista.style.display = 'flex'; 
            
            let listaAlvo = [];
            let titulo = "";

            if (tipo === 'received') {
                listaAlvo = listaCompletaRecebidos;
                titulo = "Pedidos de Amizade Recebidos";
                renderRequests(listaAlvo, elements.modalListaContainer, 'received');
            } else if (tipo === 'sent') {
                listaAlvo = listaCompletaEnviados;
                titulo = "Pedidos de Amizade Enviados";
                renderRequests(listaAlvo, elements.modalListaContainer, 'sent');
            } else if (tipo === 'friends') {
                listaAlvo = ordenarAmigosPorOnline([...listaCompletaAmigos]); 
                titulo = "Todas as Conexões";
                renderFriends(listaAlvo, elements.modalListaContainer);
            }
            elements.modalListaTitulo.innerText = `${titulo} (${listaAlvo.length})`;
        }

        function fecharModalLista() {
            if (elements.modalLista) elements.modalLista.style.display = 'none';
        }

        if (elements.btnFecharLista) elements.btnFecharLista.onclick = fecharModalLista;
        window.addEventListener('click', (e) => {
            if (e.target === elements.modalLista) fecharModalLista();
        });

        // -----------------------------------------------------------------
        // RENDERIZAÇÃO
        // -----------------------------------------------------------------
        function renderizarSecaoLimitada(listaCompleta, container, tipo) {
            if (!container) return;
            container.innerHTML = '';

            if (!listaCompleta || listaCompleta.length === 0) {
                if (tipo === 'friends') {
                    container.innerHTML = `
                        <div class="empty-friends-state">
                            <i class="fas fa-user-friends"></i>
                            <h3>Nenhuma conexão ainda</h3>
                            <a href="buscar_amigos.html" class="btn btn-primary">Encontrar Pessoas</a>
                        </div>`;
                } else {
                    container.innerHTML = `<div class="empty-state">Nenhum item encontrado.</div>`;
                }
                return;
            }

            let listaProcessada = [...listaCompleta];
            if (tipo === 'friends') {
                listaProcessada = ordenarAmigosPorOnline(listaProcessada);
            }

            const itensParaMostrar = listaProcessada.slice(0, LIMITE_EXIBICAO);

            if (tipo === 'friends') {
                renderFriends(itensParaMostrar, container);
            } else {
                renderRequests(itensParaMostrar, container, tipo);
            }

            if (listaCompleta.length > LIMITE_EXIBICAO) {
                const qtdRestante = listaCompleta.length - LIMITE_EXIBICAO;
                const btnVerMais = document.createElement('button');
                btnVerMais.className = 'btn-ver-mais';
                btnVerMais.innerText = `Ver mais (${qtdRestante})`;
                btnVerMais.onclick = () => abrirModalLista(tipo);
                container.appendChild(btnVerMais);
            }
        }

        function setProfileLoading(isLoading) {
            if (elements.userInfoLoading) {
                 // Controlado via CSS class no pai geralmente, ou display direto
                 elements.userInfoLoading.style.display = isLoading ? 'flex' : 'none';
            }
        }

        function setButtonLoading(button, isLoading) {
            if (!button) return;
            if (isLoading) {
                button.disabled = true;
                button.classList.add('loading');
                button.dataset.originalText = button.innerText;
                button.innerText = "Processando...";
            } else {
                button.disabled = false;
                button.classList.remove('loading');
                if(button.dataset.originalText) button.innerText = button.dataset.originalText;
            }
        }

        // --- BUSCA DE DADOS ---
        async function fetchReceivedRequests() {
            if (!elements.receivedRequestsList) return;
            elements.receivedRequestsList.innerHTML = `<div class="results-loading"><div class="loading-spinner"></div></div>`;
            try {
                const response = await window.axios.get(`${window.backendUrl}/api/amizades/pendentes`);
                listaCompletaRecebidos = response.data;
                renderizarSecaoLimitada(listaCompletaRecebidos, elements.receivedRequestsList, 'received');
            } catch (error) {
                elements.receivedRequestsList.innerHTML = `<div class="empty-state">Erro ao carregar.</div>`;
            }
        }

        async function fetchSentRequests() {
            if (!elements.sentRequestsList) return;
            elements.sentRequestsList.innerHTML = `<div class="results-loading"><div class="loading-spinner"></div></div>`;
            try {
                const response = await window.axios.get(`${window.backendUrl}/api/amizades/enviadas`);
                listaCompletaEnviados = response.data;
                renderizarSecaoLimitada(listaCompletaEnviados, elements.sentRequestsList, 'sent');
            } catch (error) {
                elements.sentRequestsList.innerHTML = `<div class="empty-state">Erro ao carregar.</div>`;
            }
        }

        // --- RENDERIZADORES DE CARD ---
        function renderRequests(requests, container, type) {
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

        function renderFriends(friendsData, container) {
            friendsData.forEach((friend, index) => {
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
                card.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;
                card.style.opacity = '0';
                container.appendChild(card);
            });
            
            if (!document.getElementById('fade-style')) {
                const style = document.createElement('style');
                style.id = 'fade-style';
                style.innerHTML = `@keyframes fadeIn { to { opacity: 1; transform: translateY(0); } } .friend-card { transform: translateY(10px); }`;
                document.head.appendChild(style);
            }
        }

        // --- AÇÕES GLOBAIS ---
        window.aceitar = async (amizadeId, buttonElement) => {
            setButtonLoading(buttonElement, true);
            try {
                await window.axios.post(`${window.backendUrl}/api/amizades/aceitar/${amizadeId}`);
                window.showNotification("Amizade aceita!", "success");
                carregarDadosDaPagina();
            } catch (err) {
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
                    
                    listaCompletaAmigos = listaCompletaAmigos.filter(f => f.idAmizade !== amizadeId);
                    
                    // Atualiza contadores
                    if(elements.connectionsCount) elements.connectionsCount.innerText = listaCompletaAmigos.length;

                    if(elements.modalLista.style.display === 'flex') {
                        abrirModalLista('friends');
                        renderizarSecaoLimitada(listaCompletaAmigos, elements.friendsList, 'friends');
                    } else {
                         renderizarSecaoLimitada(listaCompletaAmigos, elements.friendsList, 'friends');
                    }
                } catch (err) {
                    window.showNotification("Erro ao remover amizade.", "error");
                    setButtonLoading(buttonElement, false);
                }
            }
        };

        // --- INICIALIZAÇÃO DA PÁGINA ---
        function carregarDadosDaPagina() {
            setProfileLoading(true);
            updateUserStats(); // Usa o currentUser do evento global

            if (elements.friendsList && elements.friendsList.children.length === 0) {
                 elements.friendsList.innerHTML = `<div class="friends-loading"><div class="loading-spinner"></div></div>`; 
            }

            fetchReceivedRequests();
            fetchSentRequests();
            
            // Pequeno delay para garantir que window.userFriends esteja populado pelo principal.js
            setTimeout(() => {
                listaCompletaAmigos = window.userFriends || [];
                renderizarSecaoLimitada(listaCompletaAmigos, elements.friendsList, 'friends');
                if(elements.connectionsCount) elements.connectionsCount.innerText = listaCompletaAmigos.length;
                setProfileLoading(false);
            }, 500);
        }

        initResponsiveFeatures();
        carregarDadosDaPagina();
        
        // Listeners de atualização automática (WebSocket do principal.js)
        document.addEventListener("friendsListUpdated", () => {
             listaCompletaAmigos = window.userFriends || [];
             if(elements.connectionsCount) elements.connectionsCount.innerText = listaCompletaAmigos.length;
             renderizarSecaoLimitada(listaCompletaAmigos, elements.friendsList, 'friends');
             if (elements.modalLista && elements.modalLista.style.display === 'flex' && elements.modalListaTitulo.innerText.includes('Conexões')) {
                abrirModalLista('friends');
            }
        });

        document.addEventListener("onlineStatusUpdated", () => {
            renderizarSecaoLimitada(listaCompletaAmigos, elements.friendsList, 'friends');
            if (elements.modalLista && elements.modalLista.style.display === 'flex' && elements.modalListaTitulo.innerText.includes('Conexões')) {
                abrirModalLista('friends');
            }
        });
    });
});