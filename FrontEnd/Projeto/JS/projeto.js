document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------------------
  // AGUARDA O SCRIPT PRINCIPAL
  // -----------------------------------------------------------------
  document.addEventListener("globalScriptsLoaded", (e) => {
    const currentUser = window.currentUser;
    const ProjetosPage = {
      // --- ESTADO (Específico da Página) ---
      state: {
        allProjects: [],
        myProjects: [],
      },

      // --- ELEMENTOS (Específicos da Página) ---
      elements: {
        // Elementos da página
        grid: document.getElementById("projetos-grid"),
        searchInput: document.getElementById("project-search-input"),

        modalOverlay: document.getElementById("novo-projeto-modal"),
        openModalBtn: document.getElementById("btn-new-project"),
        closeModalBtn: document.querySelector(
          ".modal-content .close-modal-btn"
        ),
        form: document.getElementById("novo-projeto-form"),
        projTituloInput: document.getElementById("proj-titulo"),
        projDescricaoInput: document.getElementById("proj-descricao"),
        projImagemInput: document.getElementById("proj-imagem"),
        modalUserAvatar: document.getElementById("modal-user-avatar"),
        modalUserName: document.getElementById("modal-user-name"),
        connectionsCount: document.getElementById("connections-count"),
        projectsCount: document.getElementById("projects-count"),
      },

      // -----------------------------------------------------------------
      // INICIALIZAÇÃO (Específica da Página)
      // -----------------------------------------------------------------
      async init() {
        if (!currentUser) {
          console.error("Página de Projetos: Usuário não carregado.");
          return;
        }

        if (this.elements.connectionsCount) {
          this.elements.connectionsCount.textContent =
            window.userFriends?.length || "0";
        }
        await this.fetchProjetos();
        this.setupEventListeners();
        document.addEventListener("friendsListUpdated", () => {
          if (this.elements.connectionsCount) {
            this.elements.connectionsCount.textContent =
              window.userFriends?.length || "0";
          }
        });
      },

      // -----------------------------------------------------------------
      // FUNÇÕES DE BUSCA E RENDERIZAÇÃO (Específicas da Página)
      // -----------------------------------------------------------------
      async fetchProjetos() {
        if (!this.elements.grid) return;
        try {
          const response = await window.axios.get(
            `${window.backendUrl}/projetos`
          );
          this.state.allProjects = response.data;
          this.handlers.applyFilters.call(this);
        } catch (error) {
          console.error("Erro ao buscar projetos:", error);
          this.elements.grid.innerHTML = `<p>Não foi possível carregar os projetos.</p>`;
        }
      },

      /**
       * Renderiza os projetos filtrados no grid.
       */
      render() {
        const grid = this.elements.grid;
        if (!grid) return;
        grid.innerHTML = "";

        const projetosParaRenderizar = this.state.myProjects;

        if (this.elements.projectsCount) {
          this.elements.projectsCount.textContent =
            projetosParaRenderizar.length;
        }

        if (projetosParaRenderizar.length === 0) {
          grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Você ainda não participa de nenhum projeto.</p>`;
          return;
        }

        projetosParaRenderizar.forEach((proj) => {
          const card = document.createElement("div");
          card.className = "projeto-card";

          const imageUrl =
            proj.imagemUrl && proj.imagemUrl.startsWith("http")
              ? proj.imagemUrl
              : proj.imagemUrl
              ? `${window.backendUrl}${proj.imagemUrl}`
              : "https://placehold.co/600x400/161b22/ffffff?text=Projeto";

          const membrosHtml = (proj.membros || [])
            .map((membro) => {
              const avatarUrl =
                membro.usuarioFotoPerfil &&
                membro.usuarioFotoPerfil.startsWith("http")
                  ? membro.usuarioFotoPerfil
                  : `${window.backendUrl}${
                      membro.usuarioFotoPerfil || "/images/default-avatar.jpg"
                    }`;
              return `<img class="membro-avatar" src="${avatarUrl}" title="${membro.usuarioNome}">`;
            })
            .join("");

          card.innerHTML = `
                        <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                        <div class="projeto-conteudo">
                            <h3>${proj.titulo}</h3>
                            <p>${
                              proj.descricao ||
                              "Este projeto não possui uma descrição."
                            }</p>
                            <div class="projeto-membros">${membrosHtml}</div>
                        </div>`;
          grid.appendChild(card);
        });
      },

      // -----------------------------------------------------------------
      // HANDLERS E AÇÕES (Específicos da Página)
      // -----------------------------------------------------------------
      handlers: {
        openModal() {
          if (currentUser) {
            this.elements.modalUserName.textContent = currentUser.nome;
            const avatarUrl =
              currentUser.urlFotoPerfil &&
              currentUser.urlFotoPerfil.startsWith("http")
                ? currentUser.urlFotoPerfil
                : `${window.backendUrl}${
                    currentUser.urlFotoPerfil || "/images/default-avatar.jpg"
                  }`;
            this.elements.modalUserAvatar.src = avatarUrl;
          }
          this.elements.modalOverlay?.classList.add("visible");
        },

        closeModal() {
          this.elements.modalOverlay?.classList.remove("visible");
        },

        /**
         * Manipula o envio do formulário de novo projeto.
         */
        async handleFormSubmit(e) {
          e.preventDefault();
          const form = this.elements.form;
          const btn = form.querySelector(".btn-publish");
          btn.disabled = true;
          btn.textContent = "Publicando...";

          const formData = new FormData();
          formData.append("titulo", this.elements.projTituloInput.value);
          formData.append("descricao", this.elements.projDescricaoInput.value);
          formData.append("autorId", currentUser.id);
          formData.append("maxMembros", 50);
          formData.append("grupoPrivado", false);

          if (this.elements.projImagemInput.files[0]) {
            formData.append("foto", this.elements.projImagemInput.files[0]);
          }

          try {
            await window.axios.post(`${window.backendUrl}/projetos`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            form.reset();
            this.handlers.closeModal.call(this);
            await this.fetchProjetos();
          } catch (error) {
           let errorMessage = "Falha ao criar o projeto.";
            if (error.response && error.response.data && error.response.data.message) {
                // Pega a mensagem de "Conteúdo impróprio..."
                errorMessage = error.response.data.message;
              }
              window.showNotification(errorMessage, "error");
          } finally {
            btn.disabled = false;
            btn.textContent = "Publicar Projeto";
          }
        },

        /**
         * Filtra os projetos visíveis com base na busca e se o usuário é membro.
         */
        applyFilters() {
          const search = this.elements.searchInput.value.toLowerCase();
          if (!currentUser) return;
          this.state.myProjects = this.state.allProjects.filter((proj) => {
            const isMember = proj.membros.some(
              (membro) => membro.usuarioId === currentUser.id
            );
            const searchMatch = (proj.titulo || "")
              .toLowerCase()
              .includes(search);
            return isMember && searchMatch;
          });

          this.render();
        },
      },

      // -----------------------------------------------------------------
      // EVENT LISTENERS (Específicos da Página)
      // -----------------------------------------------------------------
      setupEventListeners() {
        const { openModalBtn, closeModalBtn, modalOverlay, form, searchInput } =
          this.elements;
        if (openModalBtn)
          openModalBtn.addEventListener(
            "click",
            this.handlers.openModal.bind(this)
          );
        if (closeModalBtn)
          closeModalBtn.addEventListener(
            "click",
            this.handlers.closeModal.bind(this)
          );
        if (form)
          form.addEventListener("submit", (e) =>
            this.handlers.handleFormSubmit.call(this, e)
          );
        if (searchInput)
          searchInput.addEventListener(
            "input",
            this.handlers.applyFilters.bind(this)
          );
        if (modalOverlay) {
          modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) this.handlers.closeModal.call(this);
          });
        }
      },
    };

    // --- INICIALIZAÇÃO DA PÁGINA ---
    ProjetosPage.init();
  });
});
