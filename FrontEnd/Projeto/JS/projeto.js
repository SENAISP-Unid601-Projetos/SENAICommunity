document.addEventListener('DOMContentLoaded', () => {

    const ProjetosPage = {
        
        state: {
            projetos: [
                {
                    id: 1,
                    titulo: "Braço Robótico com Arduino",
                    // IMAGEM CORRIGIDA: Usando um placeholder confiável
                    imagem: "https://placehold.co/600x400/161b22/58a6ff?text=Robótica",
                    descricao: "Um braço robótico de 4 eixos controlado via interface web, capaz de manipular pequenos objetos.",
                    membros: [{ nome: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }, { nome: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" }],
                    tecnologias: ["Arduino", "C++", "Node.js", "Servo Motor"],
                    categoria: "iot"
                },
                {
                    id: 2,
                    titulo: "Plataforma de Cursos Online",
                    // IMAGEM CORRIGIDA
                    imagem: "https://placehold.co/600x400/161b22/f78166?text=EAD",
                    descricao: "Uma plataforma EAD completa com upload de vídeos, quizzes e emissão de certificados.",
                    membros: [{ nome: "Vinicius G.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }],
                    tecnologias: ["React", "TypeScript", "Firebase", "Stripe"],
                    categoria: "web"
                },
                {
                    id: 3,
                    titulo: "Reconhecimento Facial para Acesso",
                    // IMAGEM CORRIGIDA
                    imagem: "https://placehold.co/600x400/161b22/3fb950?text=IA",
                    descricao: "Sistema de segurança que utiliza IA para reconhecer faces e liberar acesso a ambientes restritos.",
                    membros: [{ nome: "Yuri Bragança", avatar: "https://randomuser.me/api/portraits/men/67.jpg" }],
                    tecnologias: ["Python", "OpenCV", "TensorFlow"],
                    categoria: "ia"
                },
                {
                    id: 4,
                    titulo: "App Mobile de Gestão de Tarefas",
                    // IMAGEM CORRIGIDA
                    imagem: "https://placehold.co/600x400/161b22/d2a8ff?text=Mobile",
                    descricao: "Aplicativo para Android e iOS que ajuda na organização de tarefas diárias com sistema de gamificação.",
                    membros: [{ nome: "Juliana Costa", avatar: "https://randomuser.me/api/portraits/women/44.jpg" }, { nome: "Ricardo Lima", avatar: "https://randomuser.me/api/portraits/men/50.jpg" }],
                    tecnologias: ["Flutter", "Dart", "Firebase"],
                    categoria: "mobile"
                }
            ],
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

        render() {
            const grid = this.elements.grid;
            if (!grid) {
                console.error("Elemento #projetos-grid não foi encontrado no HTML.");
                return;
            }

            grid.innerHTML = '';
            const projetosParaRenderizar = this.state.filteredProjetos;

            if (projetosParaRenderizar.length === 0) {
                grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Nenhum projeto encontrado com os filtros selecionados.</p>`;
                return;
            }

            projetosParaRenderizar.forEach(proj => {
                const card = document.createElement('div');
                card.className = 'projeto-card';
                card.innerHTML = `
                    <div class="projeto-imagem" style="background-image: url('${proj.imagem}')"></div>
                    <div class="projeto-conteudo">
                        <h3>${proj.titulo}</h3>
                        <p>${proj.descricao}</p>
                        <div class="projeto-membros">
                            ${proj.membros.map(m => `<img class="membro-avatar" src="${m.avatar}" title="${m.nome}">`).join('')}
                        </div>
                        <div class="projeto-footer">
                            ${proj.tecnologias.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                        </div>
                    </div>`;
                grid.appendChild(card);
            });
        },

        handlers: {
            openModal() { ProjetosPage.elements.modalOverlay?.classList.add('visible'); },
            closeModal() { ProjetosPage.elements.modalOverlay?.classList.remove('visible'); },
            
            handleFormSubmit(e) {
                e.preventDefault();
                const form = ProjetosPage.elements.form;
                const novoProjeto = {
                    id: Date.now(),
                    titulo: form.querySelector('#proj-titulo').value,
                    descricao: form.querySelector('#proj-descricao').value,
                    imagem: form.querySelector('#proj-imagem').value || 'https://placehold.co/600x400/161b22/ffffff?text=Novo+Projeto',
                    membros: [{ nome: "Vinicius G.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }],
                    tecnologias: form.querySelector('#proj-techs').value.split(',').map(t => t.trim()),
                    categoria: 'web'
                };
                
                ProjetosPage.state.projetos.unshift(novoProjeto);
                ProjetosPage.handlers.applyFilters();
                
                form.reset();
                ProjetosPage.handlers.closeModal();
            },

            applyFilters() {
                const search = ProjetosPage.elements.searchInput.value.toLowerCase();
                const category = ProjetosPage.elements.categoryFilter.value;

                ProjetosPage.state.filteredProjetos = ProjetosPage.state.projetos.filter(proj => {
                    const searchMatch = proj.titulo.toLowerCase().includes(search) || proj.tecnologias.join(' ').toLowerCase().includes(search);
                    const categoryMatch = category === 'todos' || proj.categoria === category;
                    return searchMatch && categoryMatch;
                });

                ProjetosPage.render();
            }
        },

        init() {
            const { openModalBtn, closeModalBtn, modalOverlay, form, searchInput, categoryFilter } = this.elements;

            openModalBtn?.addEventListener('click', this.handlers.openModal);
            closeModalBtn?.addEventListener('click', this.handlers.closeModal);
            modalOverlay?.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.handlers.closeModal();
            });
            form?.addEventListener('submit', (e) => this.handlers.handleFormSubmit(e));
            searchInput?.addEventListener('input', () => this.handlers.applyFilters());
            categoryFilter?.addEventListener('change', () => this.handlers.applyFilters());

            this.handlers.applyFilters();
        }
    };

    ProjetosPage.init();
});