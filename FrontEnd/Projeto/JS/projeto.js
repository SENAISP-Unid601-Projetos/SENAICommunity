// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
    const ProjetosPage = {
        state: {
            projetos: [],
            filteredProjetos: []
        },
        elements: {
            grid: document.getElementById('projetos-grid'),
            modalOverlay: document.getElementById('novo-projeto-modal'),
            openModalBtn: document.getElementById('btn-new-project'),
            closeModalBtn: document.querySelector('.modal-content .close-modal-btn'),
            form: document.getElementById('novo-projeto-form'),
            searchInput: document.getElementById('project-search-input'),
            categoryFilter: document.getElementById('filter-category'),
        },
        api: {
            backendUrl: 'http://localhost:8080',
            jwtToken: localStorage.getItem('token'),
            currentUser: null,

            async fetchCurrentUser() {
                if (!this.jwtToken) return;
                try {
                    const response = await axios.get(`${this.backendUrl}/usuarios/me`, {
                        headers: { 'Authorization': `Bearer ${this.jwtToken}` }
                    });
                    this.currentUser = response.data;
                } catch (error) {
                    console.error("Erro ao buscar usuário logado:", error);
                }
            },

            async fetchProjetos() {
                if (!this.jwtToken) return;
                try {
                    const response = await axios.get(`${ProjetosPage.api.backendUrl}/projetos`, {
                        headers: { 'Authorization': `Bearer ${ProjetosPage.api.jwtToken}` }
                    });
                    ProjetosPage.state.projetos = response.data;
                    ProjetosPage.handlers.applyFilters();
                } catch (error) {
                    console.error("Erro ao carregar projetos:", error);
                    ProjetosPage.elements.grid.innerHTML = `<p>Não foi possível carregar os projetos.</p>`;
                }
            }
        },
        render() {
            const grid = this.elements.grid;
            if (!grid) return;

            grid.innerHTML = '';
            const projetosParaRenderizar = this.state.filteredProjetos;

            if (projetosParaRenderizar.length === 0) {
                grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Nenhum projeto encontrado.</p>`;
                return;
            }

            projetosParaRenderizar.forEach(proj => {
                const card = document.createElement('div');
                card.className = 'projeto-card';
                
                const imageUrl = proj.imagemUrl ? `${ProjetosPage.api.backendUrl}${proj.imagemUrl}` : 'https://placehold.co/600x400/161b22/ffffff?text=Projeto';

                card.innerHTML = `
                    <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                    <div class="projeto-conteudo">
                        <h3>${proj.titulo}</h3>
                        <p>${proj.descricao}</p>
                        <div class="projeto-membros">
                            ${(proj.membros || []).map(m => `<img class="membro-avatar" src="${m.avatar || './img/perfil.png'}" title="${m.usuarioNome}">`).join('')}
                        </div>
                        <div class="projeto-footer">
                            <span class="tech-tag">${proj.status || 'Não definido'}</span>
                        </div>
                    </div>`;
                grid.appendChild(card);
            });
        },
        handlers: {
            openModal() { ProjetosPage.elements.modalOverlay?.classList.add('visible'); },
            closeModal() { ProjetosPage.elements.modalOverlay?.classList.remove('visible'); },
            
            async handleFormSubmit(e) {
                e.preventDefault();
                const form = ProjetosPage.elements.form;
                const formData = new FormData();

                // Adiciona os campos do DTO
                formData.append('titulo', form.querySelector('#proj-titulo').value);
                formData.append('descricao', form.querySelector('#proj-descricao').value);
                formData.append('maxMembros', 50); // Valor fixo, pode ser um campo no modal
                formData.append('grupoPrivado', false); // Valor fixo
                formData.append('autorId', ProjetosPage.api.currentUser.id);

                // Adiciona a imagem, se houver
                const fotoInput = form.querySelector('#proj-imagem');
                if (fotoInput.files[0]) {
                    formData.append('foto', fotoInput.files[0]);
                }

                try {
                    await axios.post(`${ProjetosPage.api.backendUrl}/projetos`, formData, {
                        headers: {
                            'Authorization': `Bearer ${ProjetosPage.api.jwtToken}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    form.reset();
                    ProjetosPage.handlers.closeModal();
                    await ProjetosPage.api.fetchProjetos(); // Recarrega os projetos
                    
                    if (typeof showNotification === 'function') {
                        showNotification('Projeto publicado com sucesso!', 'success');
                    }
                } catch (error) {
                    console.error("Erro ao criar projeto:", error);
                    if (typeof showNotification === 'function') {
                        showNotification('Erro ao publicar o projeto.', 'error');
                    }
                }
            },

            applyFilters() {
                const search = ProjetosPage.elements.searchInput.value.toLowerCase();
                // A filtragem de categoria pode ser implementada no futuro
                // const category = ProjetosPage.elements.categoryFilter.value;

                ProjetosPage.state.filteredProjetos = ProjetosPage.state.projetos.filter(proj => {
                    return proj.titulo.toLowerCase().includes(search) || proj.descricao.toLowerCase().includes(search);
                });
                ProjetosPage.render();
            }
        },

        async init() {
            if (!this.api.jwtToken) {
                window.location.href = 'login.html';
                return;
            }

            await this.api.fetchCurrentUser();
            if (!this.api.currentUser) {
                window.location.href = 'login.html';
                return;
            }

            const { openModalBtn, closeModalBtn, modalOverlay, form, searchInput, categoryFilter } = this.elements;

            openModalBtn?.addEventListener('click', this.handlers.openModal);
            closeModalBtn?.addEventListener('click', this.handlers.closeModal);
            modalOverlay?.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.handlers.closeModal();
            });
            form?.addEventListener('submit', (e) => this.handlers.handleFormSubmit(e));
            searchInput?.addEventListener('input', () => this.handlers.applyFilters());
            // categoryFilter?.addEventListener('change', () => this.handlers.applyFilters());

            await this.api.fetchProjetos();
        }
    };

    ProjetosPage.init();
});