document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    let currentUser = null;
    
    // --- ELEMENTOS DO DOM ---
    const elements = {
        grid: document.getElementById('projetos-grid'),
        modalOverlay: document.getElementById('novo-projeto-modal'),
        openModalBtn: document.getElementById('btn-new-project'),
        closeModalBtn: document.querySelector('.modal-content .close-modal-btn'),
        form: document.getElementById('novo-projeto-form'),
        // Campos do Modal
        projTitulo: document.getElementById('proj-titulo'),
        projDescricao: document.getElementById('proj-descricao'),
        projImagem: document.getElementById('proj-imagem-input'),
        projMaxMembros: document.getElementById('proj-max-membros'),
        projGrupoPrivado: document.getElementById('proj-grupo-privado'),
        projAlunos: document.getElementById('proj-alunos'),
        projProfessores: document.getElementById('proj-professores'),
        // Elementos do Header/Sidebar para preenchimento
        sidebarUserImg: document.getElementById('sidebar-user-img'),
        sidebarUserName: document.getElementById('sidebar-user-name'),
        sidebarUserTitle: document.getElementById('sidebar-user-title'),
        topbarUserImg: document.getElementById('topbar-user-img'),
        topbarUserName: document.getElementById('topbar-user-name')
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const render = {
        projetos(projetos) {
            const grid = elements.grid;
            if (!grid) return;

            grid.innerHTML = '';
            if (!projetos || projetos.length === 0) {
                grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Nenhum projeto encontrado.</p>`;
                return;
            }

            projetos.forEach(proj => {
                const card = document.createElement('div');
                card.className = 'projeto-card';
                
                const imageUrl = proj.imagemUrl 
                    ? `${backendUrl}/projetos/imagens/${proj.imagemUrl}` 
                    : 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80';

                const mainMember = proj.membros && proj.membros.length > 0 ? proj.membros[0] : null;
                const otherMembersCount = proj.totalMembros > 1 ? `+${proj.totalMembros - 1}` : '';

                card.innerHTML = `
                    <div class="projeto-imagem" style="background-image: url('${imageUrl}')"></div>
                    <div class="projeto-conteudo">
                        <h3>${proj.titulo}</h3>
                        <p>${proj.descricao || 'Sem descrição.'}</p>
                        <div class="projeto-membros">
                            ${mainMember ? `<img class="membro-avatar" src="https://i.pravatar.cc/40?u=${mainMember.usuarioEmail}" title="${mainMember.usuarioNome}">` : ''}
                            ${otherMembersCount ? `<span class="membro-avatar-count">${otherMembersCount}</span>` : ''}
                        </div>
                        <div class="projeto-footer">
                             <span class="tech-tag">${proj.status || 'Não definido'}</span>
                        </div>
                    </div>`;
                grid.appendChild(card);
            });
        },

        userSelectionOptions(selectElement, users, placeholder) {
            if (!selectElement) return;
            selectElement.innerHTML = ''; 
            if (users.length === 0) {
                 selectElement.innerHTML = `<option value="" disabled>${placeholder} (nenhum encontrado)</option>`;
                 return;
            }
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.nome;
                selectElement.appendChild(option);
            });
        },
        
        userInfo(user) {
            const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : 'https://via.placeholder.com/80';
            // Sidebar
            if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
            if (elements.sidebarUserName) elements.sidebarUserName.textContent = user.nome;
            if (elements.sidebarUserTitle) elements.sidebarUserTitle.textContent = user.titulo || 'Membro da Comunidade';
            // Topbar
            if (elements.topbarUserImg) elements.topbarUserImg.src = userImage;
            if (elements.topbarUserName) elements.topbarUserName.textContent = user.nome;
        }
    };

    // --- LÓGICA DA APLICAÇÃO ---
    const app = {
        async fetchProjetos() {
            try {
                const response = await axios.get(`${backendUrl}/projetos`);
                render.projetos(response.data);
            } catch (error) {
                console.error("Erro ao buscar projetos:", error);
                if (elements.grid) elements.grid.innerHTML = `<p style="color: red; grid-column: 1 / -1; text-align: center;">Não foi possível carregar os projetos. Tente recarregar a página.</p>`;
            }
        },

        async fetchAllUsersForModal() {
            try {
                const [alunosRes, professoresRes] = await Promise.all([
                    axios.get(`${backendUrl}/alunos`),
                    axios.get(`${backendUrl}/professores`)
                ]);
                
                render.userSelectionOptions(elements.projAlunos, alunosRes.data, 'Selecione alunos');
                render.userSelectionOptions(elements.projProfessores, professoresRes.data, 'Selecione professores');
            } catch (error) {
                console.error("Erro ao buscar usuários para o modal:", error);
                alert('Não foi possível carregar a lista de usuários para convite.');
            }
        },

        async handleFormSubmit(e) {
            e.preventDefault();
            if (!currentUser) {
                alert("Erro: Usuário não identificado. Faça login novamente.");
                return;
            }

            const formData = new FormData();
            formData.append('titulo', elements.projTitulo.value);
            formData.append('descricao', elements.projDescricao.value);
            formData.append('maxMembros', elements.projMaxMembros.value);
            formData.append('grupoPrivado', elements.projGrupoPrivado.checked);
            formData.append('autorId', currentUser.id);

            const alunoIds = Array.from(elements.projAlunos.selectedOptions).map(opt => opt.value);
            const professorIds = Array.from(elements.projProfessores.selectedOptions).map(opt => opt.value);

            // ✨ --- INÍCIO DA CORREÇÃO --- ✨
            // Garante que os campos sejam enviados mesmo que vazios
            if (alunoIds.length > 0) {
                alunoIds.forEach(id => formData.append('alunoIds', id));
            } else {
                formData.append('alunoIds', ''); // Envia o campo vazio para o backend
            }

            if (professorIds.length > 0) {
                professorIds.forEach(id => formData.append('professorIds', id));
            } else {
                formData.append('professorIds', ''); // Envia o campo vazio para o backend
            }
            // ✨ --- FIM DA CORREÇÃO --- ✨
            
            if (elements.projImagem.files[0]) {
                formData.append('foto', elements.projImagem.files[0]);
            }
            
            try {
                await axios.post(`${backendUrl}/projetos`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                app.closeModal();
                elements.form.reset();
                app.fetchProjetos();
                alert('Projeto criado com sucesso!');

            } catch (error) {
                console.error("Erro ao criar projeto:", error.response?.data || error.message);
                alert(`Falha ao criar o projeto: ${error.response?.data || 'Verifique os dados e tente novamente.'}`);
            }
        },
        
        openModal() {
            app.fetchAllUsersForModal();
            elements.modalOverlay?.classList.add('visible');
        },

        closeModal() {
            elements.modalOverlay?.classList.remove('visible');
        },

        setupEventListeners() {
            elements.openModalBtn?.addEventListener('click', this.openModal);
            elements.closeModalBtn?.addEventListener('click', this.closeModal);
            elements.modalOverlay?.addEventListener('click', (e) => {
                if (e.target === elements.modalOverlay) this.closeModal();
            });
            elements.form?.addEventListener('submit', this.handleFormSubmit);
        },

        async init() {
            if (!jwtToken) {
                window.location.href = 'login.html';
                return;
            }
            axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

            try {
                const response = await axios.get(`${backendUrl}/usuarios/me`);
                currentUser = response.data;
                render.userInfo(currentUser);

                this.setupEventListeners();
                this.fetchProjetos();

            } catch (error) {
                console.error("Erro de autenticação, redirecionando para o login:", error);
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        }
    };

    app.init();
});
