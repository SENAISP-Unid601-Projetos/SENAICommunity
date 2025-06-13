document.addEventListener('DOMContentLoaded', () => {

    const ProjetosPage = {
        
        state: {
            projetos: [
                {
                    id: 1,
                    titulo: "Projeto IoT",
                    // IMAGEM CORRIGIDA: Usando um placeholder confiável
                    imagem: "/img/unnamed.png",
                    descricao: "Esta solução inovadora, baseada na plataforma Arduino, utiliza sensores IoT de precisão para monitorar em tempo real variáveis críticas como temperatura e umidade, garantindo um controle de ambiente rigoroso e eficiente.",
                    membros: [{ nome: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }, { nome: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" }],
                    tecnologias: ["Arduino", "C++", "Node.js", "Servo Motor"],
                    categoria: "iot"
                },
                {
                    id: 2,
                    titulo: "Projeto: Torno CNC Modular PrecisionCraft",
                    // IMAGEM CORRIGIDA: Usando um placeholder confiável
                    imagem: "/img/cnc.png   ",
                    descricao: "Este projeto é um Torno CNC Modular moderno e robusto, feito para usinagem de alta precisão. Ele é versátil, podendo trabalhar com diversos materiais e formas complexas, e é ideal para oficinas, educação e pesquisa. Seu design fácil de manter e customizar permite que os usuários o adaptem às suas necessidades.",
                    membros: [{ nome: "Laura", avatar: "https://randomuser.me/api/portraits/women/55.jpg" }, { nome: " Carlos", avatar: "http://randomuser.me/api/portraits/men/51.jpg" }, { nome: "Julia", avatar: "https://randomuser.me/api/portraits/women/48.jpg" }],
                    tecnologias: ["Controle Numérico Computadorizado (CNC)", "Servomotores de Precisão", "Sistemas de Guias Lineares", "Fuso de Esferas Motor", "Software CAD/CAM", "Sensores de Feedback", "Estrutura Modular"],
                    categoria: "Engenharia Mecatrônica e Fabricação Digital"
                },
                
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