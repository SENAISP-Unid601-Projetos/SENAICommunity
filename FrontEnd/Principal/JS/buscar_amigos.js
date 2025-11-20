document.addEventListener("DOMContentLoaded", () => {
  const initPage = () => {
    const elements = {
      userSearchInput: document.getElementById("user-search-input"),
      searchResultsContainer: document.getElementById("search-results-container"),
      userInfoLoading: document.getElementById("user-info-loading"),
      topbarUserLoading: document.getElementById("topbar-user-loading"),
      userInfo: document.querySelector('.user-info'),
      topbarUser: document.querySelector('.user-dropdown .user'),
      mobileMenuToggle: document.getElementById("mobile-menu-toggle"),
      sidebar: document.getElementById("sidebar"),
      mobileOverlay: document.getElementById("mobile-overlay"),
      sidebarClose: document.getElementById("sidebar-close"),
      // NOVO: Elemento do contador de projetos
      projectsCount: document.getElementById("projects-count")
    };

    // Função para mostrar/ocultar loading nos elementos do perfil
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

    // Função para mostrar loading nos botões
    function setButtonLoading(button, isLoading) {
      if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
      } else {
        button.disabled = false;
        button.classList.remove('loading');
      }
    }

    // Inicialmente mostrar loading nos perfis
    setProfileLoading(true);

    // NOVO: Busca a contagem de projetos do usuário
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

    // Configurar menu mobile
    function setupMobileMenu() {
      if (elements.mobileMenuToggle && elements.sidebar && elements.mobileOverlay && elements.sidebarClose) {
        elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        elements.sidebarClose.addEventListener('click', toggleMobileMenu);
        elements.mobileOverlay.addEventListener('click', toggleMobileMenu);
      }
    }

    function toggleMobileMenu() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('mobile-overlay');

      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');

      if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    // NOTA: Removi a função setupMobileNotifications antiga pois você removeu o HTML duplicado
    // O ícone principal de notificação já é tratado pelo principal.js

    async function buscarUsuarios(nome = "") {
      if (!elements.searchResultsContainer) return;
      
      // Mostrar loading circular
      elements.searchResultsContainer.innerHTML = `
        <div class="results-loading">
          <div class="loading-spinner"></div>
          <p>${nome ? 'Buscando usuários...' : 'Carregando comunidade...'}</p>
        </div>
      `;

      try {
        const response = await window.axios.get(
          `${window.backendUrl}/usuarios/buscar`,
          {
            params: { nome },
          }
        );
        renderizarResultados(response.data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        elements.searchResultsContainer.innerHTML =
          '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao buscar usuários.</p><p class="empty-state-subtitle">Tente recarregar a página</p></div>';
      }
    }

    function renderizarResultados(usuarios) {
      if (!elements.searchResultsContainer) return;
      elements.searchResultsContainer.innerHTML = "";

      if (usuarios.length === 0) {
        elements.searchResultsContainer.innerHTML = 
          '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum usuário encontrado</p><p class="empty-state-subtitle">Tente alterar os termos da busca</p></div>';
        return;
      }

      usuarios.forEach((usuario) => {
        const userCard = document.createElement("div");
        userCard.className = "user-card";
        
        const fotoUrl =
          usuario.fotoPerfil && usuario.fotoPerfil.startsWith("http")
            ? usuario.fotoPerfil
            : `${window.backendUrl}${usuario.fotoPerfil || "/images/default-avatar.jpg"}`;

        const statusClass = usuario.online ? "online" : "offline";

        let actionButtonHtml = "";
        let messageButtonHtml = "";
        
        switch (usuario.statusAmizade) {
          case "AMIGOS":
            actionButtonHtml =
              '<button class="btn btn-secondary" disabled><i class="fas fa-check"></i> Amigos</button>';
            messageButtonHtml = 
              `<button class="btn btn-message" onclick="window.iniciarConversa(${usuario.id}, '${usuario.nome.replace(/'/g, "\\'")}')">
                 <i class="fas fa-comment-dots"></i> Enviar Mensagem
               </button>`;
            break;
          case "SOLICITACAO_ENVIADA":
            actionButtonHtml =
              '<button class="btn btn-secondary" disabled><i class="fas fa-clock"></i> Pendente</button>';
            break;
          case "SOLICITACAO_RECEBIDA":
            actionButtonHtml =
              '<a href="amizades.html" class="btn btn-primary"><i class="fas fa-user-check"></i> Responder</a>';
            break;
          case "NENHUMA":
            actionButtonHtml = 
              `<button class="btn btn-primary" onclick="window.enviarSolicitacao(${usuario.id}, this)">
                 <i class="fas fa-user-plus"></i> Adicionar
               </button>`;
            break;
        }

        userCard.innerHTML = `
          <div class="card-header-info">
            <div class="user-card-avatar">
              <img src="${fotoUrl}" alt="Foto de ${usuario.nome}" loading="lazy">
              <div class="status ${statusClass}" data-user-email="${usuario.email}"></div>
            </div>
            <div class="user-card-info">
              <a href="perfil.html?id=${usuario.id}" class="user-card-link">
                <h4>${usuario.nome}</h4>
              </a>
              <p>${usuario.email}</p>
            </div>
          </div>
          <div class="user-card-actions">
            <div class="user-card-action">
              ${actionButtonHtml}
            </div>
            ${messageButtonHtml}
          </div>
        `;
        elements.searchResultsContainer.appendChild(userCard);
      });

      if (typeof window.atualizarStatusDeAmigosNaUI === "function") {
        window.atualizarStatusDeAmigosNaUI();
      }
    }

    function setupSearchListener() {
      if (elements.userSearchInput) {
        let searchTimeout;
        
        elements.userSearchInput.addEventListener("input", () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            const searchTerm = elements.userSearchInput.value.trim();
            buscarUsuarios(searchTerm);
          }, 300);
        });
      }
    }

    window.enviarSolicitacao = async (idSolicitado, buttonElement) => {
      setButtonLoading(buttonElement, true);
      
      try {
        await window.axios.post(
          `${window.backendUrl}/api/amizades/solicitar/${idSolicitado}`
        );
        buttonElement.innerHTML = '<i class="fas fa-check"></i> Pendente';
        buttonElement.classList.remove("btn-primary");
        buttonElement.classList.add("btn-secondary");
        buttonElement.disabled = true;
        
        if(window.showNotification) {
          window.showNotification("Solicitação de amizade enviada!", "success");
        }
      } catch (error) {
        console.error("Erro ao enviar solicitação:", error);
        if(window.showNotification) {
          window.showNotification("Erro ao enviar solicitação.", "error");
        }
        setButtonLoading(buttonElement, false);
        buttonElement.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar';
      }
    };

    window.iniciarConversa = async (userId, userName) => {
      const buttons = document.querySelectorAll(`.btn-message[onclick*="${userId}"]`);
      buttons.forEach(btn => setButtonLoading(btn, true));
      
      if(window.showNotification) {
        window.showNotification(`Iniciando conversa com ${userName}...`, "info");
      }
      
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        window.location.href = `mensagem.html?start_chat=${userId}`;
      } catch (error) {
        console.error("Erro ao iniciar conversa:", error);
        buttons.forEach(btn => setButtonLoading(btn, false));
      }
    };

    // Configurar ações mobile (Editar, Excluir, Sair)
    function setupMobileAccountActions() {
      const mobileEditBtn = document.getElementById('mobile-edit-btn');
      const mobileDeleteBtn = document.getElementById('mobile-delete-btn');
      const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

      if (mobileEditBtn) {
        mobileEditBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof window.openEditProfileModal === 'function') {
            window.openEditProfileModal();
            toggleMobileMenu();
          }
        });
      }

      if (mobileDeleteBtn) {
        mobileDeleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof window.openDeleteAccountModal === 'function') {
            window.openDeleteAccountModal();
            toggleMobileMenu();
          }
        });
      }

      if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.clear();
          window.location.href = "login.html";
        });
      }
    }

    // Simular carregamento do perfil
    setTimeout(() => {
      setProfileLoading(false);
    }, 1500);

    setupMobileMenu();
    setupSearchListener();
    setupMobileAccountActions();
    
    // Inicializar Dados
    buscarUsuarios(""); 
    fetchUserProjectsCount(); // Chama a contagem de projetos
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
      initPage(); 
  } else {
      document.addEventListener("globalScriptsLoaded", initPage);
      window.addEventListener("load", initPage);
  }
});