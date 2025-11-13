document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("globalScriptsLoaded", (e) => {
    // --- SELEÇÃO DE ELEMENTOS (Específicos da Página) ---
    const elements = {
      userSearchInput: document.getElementById("user-search-input"),
      searchResultsContainer: document.getElementById(
        "search-results-container"
      ),
    };

    // -----------------------------------------------------------------
    // FUNÇÕES DE BUSCA E RENDERIZAÇÃO (Específicas da Página)
    // -----------------------------------------------------------------

    /**
     * Busca usuários no backend com base no termo de pesquisa.
     */
    async function buscarUsuarios(nome) {
      if (!elements.searchResultsContainer) return;
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
          '<p class="empty-state">Erro ao buscar usuários. Tente novamente.</p>';
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
            : `${window.backendUrl}${
                usuario.fotoPerfil || "/images/default-avatar.jpg"
              }`;

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

        userCard.innerHTML = `
                    <div class="user-card-avatar">
                        <img src="${fotoUrl}" alt="Foto de ${usuario.nome}">
                        <div class="status ${statusClass}" data-user-email="${usuario.email}"></div>
                    </div>
                    <div class="user-card-info">
                        <h4>${usuario.nome}</h4>
                        <p>${usuario.email}</p>
                    </div>
                    <div class="user-card-action">
                        ${actionButtonHtml}
                    </div>
                `;
        elements.searchResultsContainer.appendChild(userCard);
      });

      if (typeof window.atualizarStatusDeAmigosNaUI === "function") {
        window.atualizarStatusDeAmigosNaUI();
      }
    }

    // -----------------------------------------------------------------
    // FUNÇÕES DE AÇÃO (Expostas para o HTML)
    // -----------------------------------------------------------------

    /**
     * Envia uma solicitação de amizade.
     * Esta função é específica desta página (chamada pelos resultados da busca).
     */
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
        window.showNotification(
          "Não foi possível enviar a solicitação.",
          "error"
        );
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar';
      }
    };

    // -----------------------------------------------------------------
    // EVENT LISTENERS (Específicos da Página)
    // -----------------------------------------------------------------

    /**
     * Configura o listener do input de busca.
     */
    function setupSearchListener() {
      if (elements.userSearchInput) {
        let searchTimeout;
        elements.userSearchInput.addEventListener("input", () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            const searchTerm = elements.userSearchInput.value.trim();
            if (searchTerm.length > 2) {
              buscarUsuarios(searchTerm);
            } else if (searchTerm.length === 0) {
              elements.searchResultsContainer.innerHTML =
                '<p class="empty-state">Comece a digitar para encontrar pessoas.</p>';
            } else {
              elements.searchResultsContainer.innerHTML =
                '<p class="empty-state">Digite pelo menos 3 caracteres.</p>';
            }
          }, 300);
        });
      }
    }
    // --- INICIALIZAÇÃO DA PÁGINA ---
    setupSearchListener();
  });
});
