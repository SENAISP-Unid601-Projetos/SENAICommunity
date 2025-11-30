document.addEventListener("DOMContentLoaded", () => {
    
    // Elementos da página
    const elements = {
        userSearchInput: document.getElementById("user-search-input"),
        searchResultsContainer: document.getElementById("search-results-container"),
        userInfo: document.querySelector('.user-info'),
        topbarUser: document.querySelector('.user-dropdown .user'),
        // Sidebar e toggle são gerenciados pelo principal.js, não duplicamos aqui
        projectsCount: document.getElementById("projects-count"),
        connectionsCount: document.getElementById("connections-count")
    };

    // --- 1. LÓGICA DE LOADING (CORRIGIDO: Sem delay artificial) ---
    function setProfileLoading(isLoading) {
        if (elements.userInfo) {
            if (isLoading) elements.userInfo.classList.remove('loaded');
            else elements.userInfo.classList.add('loaded');
        }
        if (elements.topbarUser) {
            if (isLoading) elements.topbarUser.classList.remove('loaded');
            else elements.topbarUser.classList.add('loaded');
        }
    }

    // --- 2. CONTADOR DE PROJETOS (CORRIGIDO: Usa dados globais) ---
    function updateSidebarStats() {
        // Verifica se o usuário global já foi carregado pelo principal.js
        if (window.currentUser) {
            if (elements.projectsCount) {
                // Usa o dado direto do usuário logado (muito mais rápido)
                elements.projectsCount.textContent = window.currentUser.totalProjetos || 0;
            }
            if (elements.connectionsCount && window.userFriends) {
                elements.connectionsCount.textContent = window.userFriends.length || 0;
            }
            // Remove o loading imediatamente
            setProfileLoading(false);
        }
    }

    // --- 3. BUSCA DE USUÁRIOS ---
    async function buscarUsuarios(nome = "") {
        if (!elements.searchResultsContainer) return;

        // Loading da área de busca
        elements.searchResultsContainer.innerHTML = `
        <div class="results-loading">
          <div class="loading-spinner"></div>
          <p>${nome ? 'Buscando usuários...' : 'Carregando comunidade...'}</p>
        </div>
      `;

        try {
            const response = await window.axios.get(
                `${window.backendUrl}/usuarios/buscar`, {
                    params: {
                        nome
                    },
                }
            );
            renderizarResultados(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            elements.searchResultsContainer.innerHTML =
                '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao buscar usuários.</p></div>';
        }
    }

function renderizarResultados(usuarios) {
        if (!elements.searchResultsContainer) return;
        elements.searchResultsContainer.innerHTML = "";

        if (usuarios.length === 0) {
            elements.searchResultsContainer.innerHTML =
                '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum usuário encontrado</p></div>';
            return;
        }

        usuarios.forEach((usuario) => {
            const userCard = document.createElement("div");
            userCard.className = "user-card";

            // Tenta pegar a URL da foto ou usa a padrão se for null/vazio
            const fotoUrl = window.getAvatarUrl(usuario.fotoPerfil);
            const statusClass = usuario.online ? "online" : "offline";

            let actionButtonHtml = "";

            switch (usuario.statusAmizade) {
                case "AMIGOS":
                    actionButtonHtml = '<button class="btn btn-secondary" disabled><i class="fas fa-check"></i> Amigos</button>';
                    break;
                case "SOLICITACAO_ENVIADA":
                    actionButtonHtml = '<button class="btn btn-secondary" disabled><i class="fas fa-clock"></i> Pendente</button>';
                    break;
                case "SOLICITACAO_RECEBIDA":
                    actionButtonHtml = '<a href="amizades.html" class="btn btn-primary"><i class="fas fa-user-check"></i> Responder</a>';
                    break;
                case "NENHUMA":
                    actionButtonHtml =
                        `<button class="btn btn-primary" onclick="window.enviarSolicitacao(${usuario.id}, this)">
                 <i class="fas fa-user-plus"></i> Adicionar
               </button>`;
                    break;
            }

            const messageButtonHtml =
                `<button class="btn btn-message" onclick="window.iniciarConversa(${usuario.id}, '${usuario.nome.replace(/'/g, "\\'")}')">
             <i class="fas fa-comment-dots"></i> Enviar Mensagem
           </button>`;

            // --- CORREÇÃO AQUI: Usa window.defaultAvatarUrl no erro ---
            userCard.innerHTML = `
          <div class="card-header-info">
            <div class="user-card-avatar">
              <img 
                src="${fotoUrl}" 
                alt="Foto de ${usuario.nome}" 
                loading="lazy"
                onerror="this.onerror=null; this.src='${window.defaultAvatarUrl}';"
              >
              <div class="status ${statusClass}"></div>
            </div>
            <div class="user-card-info">
              <a href="perfil.html?id=${usuario.id}" class="user-card-link">
                <h4>${usuario.nome}</h4>
              </a>
              <p>${usuario.email}</p>
            </div>
          </div>
          <div class="user-card-actions">
            <div class="user-card-action">${actionButtonHtml}</div>
            ${messageButtonHtml}
          </div>
        `;
            elements.searchResultsContainer.appendChild(userCard);
        });
    }
    function setupSearchListener() {
        if (elements.userSearchInput) {
            let searchTimeout;
            elements.userSearchInput.addEventListener("input", () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    buscarUsuarios(elements.userSearchInput.value.trim());
                }, 300);
            });
        }
    }

    // --- FUNÇÕES GLOBAIS DE AÇÃO ---
    window.enviarSolicitacao = async (idSolicitado, buttonElement) => {
        buttonElement.classList.add('loading');
        buttonElement.disabled = true;

        try {
            await window.axios.post(`${window.backendUrl}/api/amizades/solicitar/${idSolicitado}`);
            buttonElement.innerHTML = '<i class="fas fa-check"></i> Pendente';
            buttonElement.className = "btn btn-secondary";
            window.showNotification("Solicitação enviada!", "success");
        } catch (error) {
            console.error("Erro:", error);
            window.showNotification("Erro ao enviar solicitação.", "error");
            buttonElement.classList.remove('loading');
            buttonElement.disabled = false;
        }
    };

    window.iniciarConversa = async (userId) => {
        window.location.href = `mensagem.html?start_chat=${userId}`;
    };

    // --- INICIALIZAÇÃO ---
    function initPage() {
        // Configura busca
        setupSearchListener();
        buscarUsuarios("");

        // Tenta atualizar stats imediatamente se o principal.js já carregou
        updateSidebarStats();

        // Se o principal.js terminar de carregar depois, atualiza novamente
        document.addEventListener("globalScriptsLoaded", () => {
            updateSidebarStats();
        });
        
        // Listener extra caso a lista de amizades atualize via WebSocket
        document.addEventListener("friendsListUpdated", () => {
            updateSidebarStats();
        });
    }

    initPage();
});