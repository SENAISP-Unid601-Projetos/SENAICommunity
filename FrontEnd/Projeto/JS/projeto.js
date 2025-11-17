document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("globalScriptsLoaded", (e) => {
    const currentUser = window.currentUser;

    const ProjetosPage = {
      state: {
        allProjects: [],
        myProjects: [],
        publicProjects: [],
        currentTab: 'meus-projetos'
      },

      elements: {
        grid: document.getElementById("projetos-grid"),
        publicGrid: document.getElementById("projetos-publicos-grid"),
        searchInput: document.getElementById("project-search-input"),
        categoryFilter: document.getElementById("filter-category"),
        tabButtons: document.querySelectorAll(".tab-btn"),
        
        modalOverlay: document.getElementById("novo-projeto-modal"),
        openModalBtn: document.getElementById("btn-new-project"),
        closeModalBtn: document.querySelector(".modal-content .close-modal-btn"),
        form: document.getElementById("novo-projeto-form"),
        projTituloInput: document.getElementById("proj-titulo"),
        projDescricaoInput: document.getElementById("proj-descricao"),
        projImagemInput: document.getElementById("proj-imagem"),
        projCategoriaInput: document.getElementById("proj-categoria"),
        projTecnologiasInput: document.getElementById("proj-tecnologias"),
        projPrivacidadeInput: document.getElementById("proj-privacidade"),
        
        modalUserAvatar: document.getElementById("modal-user-avatar"),
        modalUserName: document.getElementById("modal-user-name"),
        
        connectionsCount: document.getElementById("connections-count"),
        projectsCount: document.getElementById("projects-count"),
        onlineFriendsList: document.getElementById("online-friends-list"),
      },

      async init() {
        if (!currentUser) {
          console.error("Página de Projetos: Usuário não carregado.");
          return;
        }

        if (this.elements.connectionsCount) {
          this.elements.connectionsCount.textContent =
            window.userFriends?.length || "0";
        }

        this.renderOnlineFriends();
        
        await this.fetchMeusProjetos();
        await this.fetchProjetosPublicos();
        
        this.setupEventListeners();
        this.setupTabs();
        
        document.addEventListener("friendsListUpdated", () => {
          if (this.elements.connectionsCount) {
            this.elements.connectionsCount.textContent =
              window.userFriends?.length || "0";
          }
          this.renderOnlineFriends();        
        });
      },

      setupTabs() {
        this.elements.tabButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            // Remove active class from all buttons
            this.elements.tabButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            this.state.currentTab = btn.dataset.tab;
            this.switchTab(this.state.currentTab);
          });
        });
      },

      switchTab(tabName) {
        if (tabName === 'meus-projetos') {
          this.elements.grid.style.display = 'grid';
          this.elements.publicGrid.style.display = 'none';
          this.applyFilters();
        } else if (tabName === 'projetos-publicos') {
          this.elements.grid.style.display = 'none';
          this.elements.publicGrid.style.display = 'grid';
          this.renderPublicProjects();
        }
      },

      async fetchMeusProjetos() {
        if (!this.elements.grid) return;
        try {
          const response = await window.axios.get(
            `${window.backendUrl}/projetos`
          );
          this.state.allProjects = response.data;
          this.applyFilters();
        } catch (error) {
          console.error("Erro ao buscar projetos:", error);
          this.elements.grid.innerHTML = `<p class="error-message">Não foi possível carregar os projetos.</p>`;
        }
      },

      async fetchProjetosPublicos() {
        if (!this.elements.publicGrid) return;
        try {
          const response = await window.axios.get(
            `${window.backendUrl}/projetos/publicos`
          );
          this.state.publicProjects = response.data;
          this.renderPublicProjects();
        } catch (error) {
          console.error("Erro ao buscar projetos públicos:", error);
          this.elements.publicGrid.innerHTML = `<p class="error-message">Não foi possível carregar os projetos públicos.</p>`;
        }
      },

      renderPublicProjects() {
        const grid = this.elements.publicGrid;
        if (!grid) return;
        
        grid.innerHTML = "";
        
        if (this.state.publicProjects.length === 0) {
          grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Nenhum projeto público disponível no momento.</p>`;
          return;
        }
        
        this.state.publicProjects.forEach((proj) => {
          const card = document.createElement("div");
          card.className = "projeto-card";
          
          const imageUrl = this.getProjectImageUrl(proj.imagemUrl);
          
          const membrosHtml = (proj.membros || [])
            .slice(0, 5) // Mostrar apenas os primeiros 5 membros
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
            .slice(0, 3) // Mostrar apenas as primeiras 3 tecnologias
            .map(tag => `<span class="tech-tag">${tag}</span>`)
            .join("");
          
          const moreTags = (proj.tecnologias || []).length > 3 
            ? `<span class="tech-tag more-tags">+${(proj.tecnologias || []).length - 3}</span>`
            : '';
          
          // Verificar se o usuário atual já é membro
          const isMember = proj.membros && proj.membros.some(membro => membro.usuarioId === currentUser.id);
          const isAuthor = proj.autorId === currentUser.id;
          
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
                    <a href="projeto-detalhe.html?id=${proj.id}" class="btn-ver-detalhes">Ver Detalhes</a>
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
        try {
          const response = await window.axios.post(`${window.backendUrl}/projetos/${projetoId}/entrar`, null, {
            params: {
              usuarioId: currentUser.id
            }
          });
          
          window.showNotification("Você entrou no projeto com sucesso!", "success");
          
          // Recarregar a lista de projetos públicos
          await this.fetchProjetosPublicos();
          this.renderPublicProjects();
          
          // Também recarregar meus projetos para refletir a nova adesão
          await this.fetchMeusProjetos();
          
        } catch (error) {
          let errorMessage = "Falha ao entrar no projeto.";
          if (error.response?.data) {
            errorMessage = typeof error.response.data === 'string' 
              ? error.response.data 
              : error.response.data.message || errorMessage;
          }
          window.showNotification(errorMessage, "error");
        }
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
            <div style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center; padding: 3rem;">
              <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
              <p>Nenhum projeto encontrado com esses filtros.</p>
              <p style="font-size: 0.9rem; margin-top: 0.5rem;">Experimente a aba "Projetos Públicos" para explorar mais projetos!</p>
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
          if (currentUser && this.elements.modalUserName && this.elements.modalUserAvatar) {
            this.elements.modalUserName.textContent = currentUser.nome;
            const avatarUrl = this.getMemberAvatarUrl(currentUser);
            this.elements.modalUserAvatar.src = avatarUrl;
          }
          this.elements.modalOverlay?.classList.add("visible");
        },
        
        closeModal() {
          this.elements.modalOverlay?.classList.remove("visible");
        },
        
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
            await window.axios.post(`${window.backendUrl}/projetos`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            
            form.reset();
            this.handlers.closeModal.call(this);
            
            // Recarregar ambas as listas
            await this.fetchMeusProjetos();
            await this.fetchProjetosPublicos();
            
            // Voltar para a aba de meus projetos
            this.state.currentTab = 'meus-projetos';
            this.elements.tabButtons.forEach(btn => {
              btn.classList.toggle('active', btn.dataset.tab === 'meus-projetos');
            });
            this.switchTab('meus-projetos');
            
            window.showNotification("Projeto criado com sucesso!", "success");
          } catch (error) {
            let errorMessage = "Falha ao criar o projeto.";
            if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.response?.data) {
              errorMessage = error.response.data;
            }
            window.showNotification(errorMessage, "error");
          } finally {
            btn.disabled = false;
            btn.textContent = "Publicar Projeto";
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
        const { openModalBtn, closeModalBtn, modalOverlay, form, searchInput, categoryFilter } =
          this.elements;
          
        if (openModalBtn) {
          openModalBtn.addEventListener("click", this.handlers.openModal.bind(this));
        }
        
        if (closeModalBtn) {
          closeModalBtn.addEventListener("click", this.handlers.closeModal.bind(this));
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
        
        // Adicionar listener para busca em projetos públicos
        if (searchInput) {
          searchInput.addEventListener('input', () => {
            if (this.state.currentTab === 'projetos-publicos') {
              this.filterPublicProjects();
            }
          });
        }
        
        if (categoryFilter) {
          categoryFilter.addEventListener('change', () => {
            if (this.state.currentTab === 'projetos-publicos') {
              this.filterPublicProjects();
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
      
      renderFilteredPublicProjects(filteredProjects) {
        const grid = this.elements.publicGrid;
        if (!grid) return;
        
        grid.innerHTML = "";
        
        if (filteredProjects.length === 0) {
          grid.innerHTML = `
            <div style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center; padding: 3rem;">
              <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
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
                    <a href="projeto-detalhe.html?id=${proj.id}" class="btn-ver-detalhes">Ver Detalhes</a>
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