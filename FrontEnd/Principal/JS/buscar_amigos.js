document.addEventListener("DOMContentLoaded", () => {
  const initPage = () => {
    const elements = {
      userSearchInput: document.getElementById("user-search-input"),
      searchResultsContainer: document.getElementById("search-results-container"),
    };

    async function buscarUsuarios(nome = "") {
      if (!elements.searchResultsContainer) return;
      
      if(!nome) { 
         elements.searchResultsContainer.innerHTML = `
           <div class="results-loading">
             <i class="fas fa-spinner fa-spin"></i>
             <p>Carregando comunidade...</p>
           </div>
         `;
      }

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
          <div class="user-card-avatar">
            <img src="${fotoUrl}" alt="Foto de ${usuario.nome}">
            <div class="status ${statusClass}" data-user-email="${usuario.email}"></div>
          </div>
          <div class="user-card-info">
            <a href="perfil.html?id=${usuario.id}" class="user-card-link">
              <h4>${usuario.nome}</h4>
            </a>
            <p>${usuario.email}</p>
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
      buttonElement.disabled = true;
      buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
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
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar';
      }
    };

    window.iniciarConversa = (userId, userName) => {
      if(window.showNotification) {
        window.showNotification(`Iniciando conversa com ${userName}...`, "info");
      }
      
      setTimeout(() => {
        window.location.href = `mensagem.html?start_chat=${userId}`;
      }, 500);
    };

    setupSearchListener();
    buscarUsuarios(""); 
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
      initPage(); 
  } else {
      document.addEventListener("globalScriptsLoaded", initPage);
      window.addEventListener("load", initPage);
  }
});