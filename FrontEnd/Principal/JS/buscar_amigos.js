document.addEventListener("DOMContentLoaded", () => {
  // Aguarda scripts globais se necessário, ou executa direto
  const initPage = () => {
    // --- SELEÇÃO DE ELEMENTOS ---
    const elements = {
      userSearchInput: document.getElementById("user-search-input"),
      searchResultsContainer: document.getElementById("search-results-container"),
    };

    // -----------------------------------------------------------------
    // FUNÇÕES DE BUSCA E RENDERIZAÇÃO
    // -----------------------------------------------------------------

    /**
     * Busca usuários no backend.
     * Se 'nome' for vazio, o backend configurado retornará todos (ou sugestões).
     */
    async function buscarUsuarios(nome = "") {
      if (!elements.searchResultsContainer) return;
      
      // Mostra um loading visual (opcional, mas recomendado)
      if(!nome) { 
         // Se for a carga inicial, talvez não queira limpar tudo imediatamente para não piscar, 
         // mas aqui garante que o usuário saiba que está carregando.
         elements.searchResultsContainer.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Carregando comunidade...</p>';
      }

      try {
        // Faz a requisição. O backend agora aceita 'nome' vazio.
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
          '<p class="empty-state">Erro ao buscar usuários. Tente recarregar a página.</p>';
      }
    }

    /**
     * Renderiza os resultados da busca no container.
     */
    function renderizarResultados(usuarios) {
      if (!elements.searchResultsContainer) return;
      elements.searchResultsContainer.innerHTML = "";

      if (usuarios.length === 0) {
        elements.searchResultsContainer.innerHTML =
          '<p class="empty-state">Nenhum usuário encontrado.</p>';
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
        switch (usuario.statusAmizade) {
          case "AMIGOS":
            actionButtonHtml =
              '<button class="btn btn-secondary" disabled><i class="fas fa-check"></i> Amigos</button>';
            break;
          case "SOLICITACAO_ENVIADA":
            actionButtonHtml =
              '<button class="btn btn-secondary" disabled>Pendente</button>';
            break;
          case "SOLICITACAO_RECEBIDA":
            actionButtonHtml =
              '<a href="amizades.html" class="btn btn-primary">Responder</a>';
            break;
          case "NENHUMA":
            actionButtonHtml = `<button class="btn btn-primary" onclick="window.enviarSolicitacao(${usuario.id}, this)"><i class="fas fa-user-plus"></i> Adicionar</button>`;
            break;
        }

        // Adicionei o link no nome do usuário para visitar o perfil
        userCard.innerHTML = `
            <div class="user-card-avatar">
                <img src="${fotoUrl}" alt="Foto de ${usuario.nome}">
                <div class="status ${statusClass}" data-user-email="${usuario.email}"></div>
            </div>
            <div class="user-card-info">
                <a href="perfil_usuario.html?id=${usuario.id}" class="user-card-link">
                    <h4>${usuario.nome}</h4>
                </a>
                <p>${usuario.email}</p>
            </div>
            <div class="user-card-action">
                ${actionButtonHtml}
            </div>
        `;
        elements.searchResultsContainer.appendChild(userCard);
      });

      // Atualiza status visual se houver função global para isso
      if (typeof window.atualizarStatusDeAmigosNaUI === "function") {
        window.atualizarStatusDeAmigosNaUI();
      }
    }

    // -----------------------------------------------------------------
    // EVENT LISTENERS
    // -----------------------------------------------------------------

    function setupSearchListener() {
      if (elements.userSearchInput) {
        let searchTimeout;
        
        elements.userSearchInput.addEventListener("input", () => {
          clearTimeout(searchTimeout);
          // Delay de 300ms para não fazer requisição a cada letra
          searchTimeout = setTimeout(() => {
            const searchTerm = elements.userSearchInput.value.trim();
            // Removemos a restrição de 'searchTerm.length > 2'
            // Agora buscamos qualquer coisa, inclusive vazio (retorna ao estado inicial)
            buscarUsuarios(searchTerm);
          }, 300);
        });
      }
    }

    // --- AÇÃO GLOBAL (Para o botão funcionar) ---
    window.enviarSolicitacao = async (idSolicitado, buttonElement) => {
      buttonElement.disabled = true;
      buttonElement.textContent = "Enviando...";
      try {
        await window.axios.post(
          `${window.backendUrl}/api/amizades/solicitar/${idSolicitado}`
        );
        buttonElement.textContent = "Pendente";
        buttonElement.classList.remove("btn-primary");
        buttonElement.classList.add("btn-secondary");
      } catch (error) {
        console.error("Erro ao enviar solicitação:", error);
        // Se tiver sistema de notificação global
        if(window.showNotification) {
            window.showNotification("Erro ao enviar solicitação.", "error");
        } else {
            alert("Erro ao enviar solicitação.");
        }
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar';
      }
    };

    // --- INICIALIZAÇÃO ---
    setupSearchListener();
    
    // CHAMADA IMEDIATA: Busca todos os usuários ao carregar a página
    buscarUsuarios(""); 
  };

  // Verifica se os scripts globais já carregaram ou se roda direto
  if (document.readyState === "complete" || document.readyState === "interactive") {
      // Se já carregou, roda
      initPage(); 
  } else {
      // Se usa um evento customizado 'globalScriptsLoaded', mantém o listener
      document.addEventListener("globalScriptsLoaded", initPage);
      // Fallback: caso o evento custom não dispare, roda no load padrão
      window.addEventListener("load", initPage);
  }
});