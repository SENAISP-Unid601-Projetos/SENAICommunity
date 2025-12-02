document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------------------
    // AGUARDA O SCRIPT PRINCIPAL (principal.js)
    // -----------------------------------------------------------------
    document.addEventListener('globalScriptsLoaded', (e) => {

        // Variáveis globais vindas do principal.js
        const currentUser = window.currentUser;
        const backendUrl = window.backendUrl;
        const showNotification = window.showNotification;

        // --- DEFINIÇÃO DA IMAGEM DEFAULT  ---
        const defaultJobUrl = `${backendUrl}/images/default-job.png`;

        // Função auxiliar para tratar URL
        function getJobImageUrl(url) {
            if (!url || url.trim() === '') return defaultJobUrl;
            return url.startsWith('http') ? url : `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
        }

        // --- SELEÇÃO DE ELEMENTOS (Atualizada para incluir Mobile) ---
        const elements = {
            vagasListContainer: document.querySelector('.vagas-list'),
            createVagaBtn: document.getElementById('btn-publicar-vaga'),
            searchInput: document.getElementById("search-input"), // Input do Header (se houver lógica específica)
            searchInputVagas: document.getElementById("search-input-vagas"), // Input da página de vagas
            filterTipo: document.getElementById("filter-tipo"),
            filterLocal: document.getElementById("filter-local"),
            filterNivel: document.getElementById("filter-nivel"),

            // Elementos Mobile (Igual ao amizades.js)
            mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
            sidebar: document.getElementById('sidebar'),
            mobileOverlay: document.getElementById('mobile-overlay'),
            sidebarClose: document.getElementById('sidebar-close'),

            // Botão da sidebar direita para abrir alerta
            createAlertBtn: document.querySelector('.create-alert-btn'),

            // --- NOVOS ELEMENTOS MOBILE ALERTS ---
            mobileAlertsBtn: document.getElementById('mobile-toggle-alerts-btn'),
            rightSidebar: document.querySelector('.right-sidebar'),
            mobileAlertsOverlay: document.getElementById('mobile-alerts-overlay'),
            closeMobileAlertsBtn: document.getElementById('close-mobile-alerts')
        };

        // --- SELEÇÃO DE ELEMENTOS (Modais) ---
        const createVagaModal = document.getElementById('create-vaga-modal');
        const createVagaForm = document.getElementById('create-vaga-form');
        const cancelCreateVagaBtn = document.getElementById('cancel-create-vaga-btn');

        // --- ELEMENTOS DO MODAL DE DETALHES ---
        const vagaDetailsModal = document.getElementById('vaga-details-modal');
        const closeVagaDetailsBtn = document.getElementById('close-vaga-details-btn');
        const saveVagaDetailsBtn = document.getElementById('save-vaga-details-btn');
        const contactVagaBtn = document.getElementById('contact-vaga-btn');

        // --- NOVOS MODAIS ---
        const editVagaModal = document.getElementById('edit-vaga-modal');
        const editVagaForm = document.getElementById('edit-vaga-form');
        const cancelEditVagaBtn = document.getElementById('cancel-edit-vaga-btn');

        const alertModal = document.getElementById('create-alert-modal');
        const alertForm = document.getElementById('create-alert-form');
        const cancelAlertBtn = document.getElementById('cancel-alert-btn');

        // --- NOVOS SELETORES DE IMAGEM ---
        const createVagaImgInput = document.getElementById('vaga-imagem');
        const createVagaPreview = document.getElementById('create-vaga-preview');
        const createPreviewContainer = document.getElementById('create-preview-container');

        const editVagaImgInput = document.getElementById('edit-vaga-imagem');
        const editVagaPreview = document.getElementById('edit-vaga-preview');
        const editPreviewContainer = document.getElementById('edit-preview-container');

        // -----------------------------------------------------------------
        // FUNÇÕES DE SALVAMENTO LOCAL (LocalStorage) - ADICIONE ISTO AQUI
        // -----------------------------------------------------------------
        function getSavedVagasIds() {
            try {
                const saved = localStorage.getItem('savedVagas');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }

        // Função auxiliar para formatar moeda (R$) enquanto digita
        function formatarMoedaInput(evento) {
            const input = evento.target;

            // 1. Remove tudo que não for dígito
            let valor = input.value.replace(/\D/g, '');

            // 2. Se estiver vazio, limpa o campo
            if (valor === '') {
                input.value = '';
                return;
            }

            // 3. Converte para número (dividindo por 100 para considerar os centavos)
            const numero = parseFloat(valor) / 100;

            // 4. Formata usando a API nativa do navegador para BRL
            input.value = numero.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }

        function isVagaSaved(id) {
            if (!id) return false;
            const savedIds = getSavedVagasIds();
            return savedIds.includes(id.toString());
        }

        function toggleSaveVagaId(id) {
            if (!id) return false;
            let savedIds = getSavedVagasIds();
            const strId = id.toString();

            if (savedIds.includes(strId)) {
                savedIds = savedIds.filter(savedId => savedId !== strId);
            } else {
                savedIds.push(strId);
            }

            localStorage.setItem('savedVagas', JSON.stringify(savedIds));
            return savedIds.includes(strId);
        }

        // Cache local para todas as vagas
        let allVagas = [];
        let currentVagaDetails = null;

        // --- Variáveis para Alertas ---
        const alertsListContainer = document.getElementById('user-alerts-list');
        const openAlertModalBtn = document.getElementById('open-create-alert-modal-btn'); // ID atualizado no HTML

        // Variável para saber se estamos editando (null = criando)
        let editingAlertId = null;

        // Mapeamentos para filtros
        const tipoContratacaoMap = { 'TODOS': '', 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };
        const localizacaoMap = { 'TODOS': '', 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
        const nivelMap = { 'TODOS': '', 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };

        // -----------------------------------------------------------------
        // FUNÇÕES DE RESPONSIVIDADE (Copiado de amizades.js)
        // -----------------------------------------------------------------

        function toggleMobileMenu() {
            if (elements.sidebar) elements.sidebar.classList.toggle('active');
            if (elements.mobileOverlay) elements.mobileOverlay.classList.toggle('active');

            // Evita scroll no body quando menu está aberto
            if (elements.sidebar && elements.sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        function handleResize() {
            // Se a tela for grande, garante que o menu lateral volte ao normal e o overlay suma
            if (window.innerWidth > 1024) {
                if (elements.sidebar) elements.sidebar.classList.remove('active');
                if (elements.mobileOverlay) elements.mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';

                // Fechar também a sidebar direita (alertas) se estiver aberta
                if (elements.rightSidebar && elements.rightSidebar.classList.contains('active')) {
                    toggleMobileAlerts();
                }
            }
        }

        // -----------------------------------------------------------------
        // CONTROLE DOS ALERTAS MOBILE (BOTTOM SHEET) - CORRIGIDO
        // -----------------------------------------------------------------

        // 2. FUNÇÃO TOGGLE (Corrigida)
        function toggleMobileAlerts() {
            // Verifica se os elementos existem para evitar erros
            if (!elements.rightSidebar) return;

            const isActive = elements.rightSidebar.classList.contains('active');

            if (isActive) {
                // FECHAR
                elements.rightSidebar.classList.remove('active');
                if (elements.mobileAlertsOverlay) {
                    elements.mobileAlertsOverlay.classList.remove('active');
                    setTimeout(() => {
                        elements.mobileAlertsOverlay.style.display = 'none';
                    }, 300);
                }
                document.body.style.overflow = ''; // Destrava o scroll
            } else {
                // ABRIR
                if (elements.mobileAlertsOverlay) elements.mobileAlertsOverlay.style.display = 'block';

                setTimeout(() => {
                    elements.rightSidebar.classList.add('active');
                    if (elements.mobileAlertsOverlay) elements.mobileAlertsOverlay.classList.add('active');
                }, 10);

                document.body.style.overflow = 'hidden'; // Trava o scroll
            }
        }

        // -----------------------------------------------------------------
        // PREVIEW DE IMAGEM (Criar)
        // -----------------------------------------------------------------
        if (createVagaImgInput) {
            createVagaImgInput.addEventListener('change', function () {
                const file = this.files[0];
                if (file) {
                    createVagaPreview.src = URL.createObjectURL(file);
                    createPreviewContainer.style.display = 'block';
                } else {
                    createVagaPreview.src = '';
                    createPreviewContainer.style.display = 'none';
                }
            });
        }

        // -----------------------------------------------------------------
        // PREVIEW DE IMAGEM (Editar)
        // -----------------------------------------------------------------
        if (editVagaImgInput) {
            editVagaImgInput.addEventListener('change', function () {
                const file = this.files[0];
                if (file) {
                    editVagaPreview.src = URL.createObjectURL(file);
                }
            });
        }

        // 3. EVENT LISTENERS

        // Botão "Gerenciar Alertas" (Topo)
        if (elements.mobileAlertsBtn) {
            elements.mobileAlertsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMobileAlerts();
            });
        }

        // Botão "X" (Fechar)
        if (elements.closeMobileAlertsBtn) {
            elements.closeMobileAlertsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (elements.rightSidebar && elements.rightSidebar.classList.contains('active')) {
                    toggleMobileAlerts();
                }
            });
        }

        // Clicar no fundo escuro para fechar
        if (elements.mobileAlertsOverlay) {
            elements.mobileAlertsOverlay.addEventListener('click', toggleMobileAlerts);
        }

        // -----------------------------------------------------------------
        // FUNÇÃO: Atualizar Sidebar do Usuário (Corrigida)
        // -----------------------------------------------------------------
        function updateSidebarUserInfo() {
            const userInfoContainer = document.querySelector('.user-info');

            if (window.currentUser) {
                const sidebarName = document.getElementById('sidebar-user-name');
                const sidebarTitle = document.getElementById('sidebar-user-title');
                const sidebarImg = document.getElementById('sidebar-user-img');

                // 1. Define imagem padrão
                const defaultImage = window.defaultAvatarUrl ||
                    (window.backendUrl ? `${window.backendUrl}/images/default-avatar.jpg` : '') ||
                    'https://via.placeholder.com/80?text=User';

                if (sidebarName) {
                    sidebarName.textContent = window.currentUser.nome || "Usuário";
                }

                // 2. CORREÇÃO: Lógica robusta para o Cargo/Título
                if (sidebarTitle) {
                    const role = window.currentUser.cargo ||
                        window.currentUser.titulo ||
                        window.currentUser.tipoUsuario ||
                        'Membro da Comunidade';
                    sidebarTitle.textContent = role;
                }

                if (sidebarImg) {
                    const foto = window.currentUser.fotoPerfil || window.currentUser.urlFotoPerfil;

                    sidebarImg.onerror = function () {
                        if (this.src !== defaultImage) this.src = defaultImage;
                    };

                    if (foto) {
                        if (typeof window.getAvatarUrl === 'function') {
                            sidebarImg.src = window.getAvatarUrl(foto);
                        } else if (foto.startsWith('http')) {
                            sidebarImg.src = foto;
                        } else {
                            const cleanPath = foto.startsWith('/') ? foto : `/${foto}`;
                            sidebarImg.src = `${window.backendUrl}/api/arquivos${cleanPath}`;
                        }
                    } else {
                        sidebarImg.src = defaultImage;
                    }
                }

                if (userInfoContainer) {
                    userInfoContainer.classList.add('loaded');
                }
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DE BUSCA E RENDERIZAÇÃO
        // -----------------------------------------------------------------

        async function fetchVagas() {
            if (!elements.vagasListContainer) return;
            elements.vagasListContainer.innerHTML = '<div class="results-loading"><div class="loading-spinner"></div><p>Carregando vagas...</p></div>';
            try {
                const response = await axios.get(`${backendUrl}/api/vagas`);
                allVagas = response.data; // Armazena no cache
                renderVagas(allVagas); // Renderiza todas as vagas

                // --- NOVO: Verifica se deve abrir uma vaga específica via URL ---
                checkAndOpenUrlVaga();

            } catch (error) {
                console.error("Erro ao buscar vagas:", error);
                elements.vagasListContainer.innerHTML = '<p class="sem-vagas" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Não foi possível carregar as vagas no momento.</p>';
            }
        }

        function checkAndOpenUrlVaga() {
            const urlParams = new URLSearchParams(window.location.search);
            const vagaIdParam = urlParams.get('id'); // Pega o ID da URL (?id=123)

            if (vagaIdParam && allVagas.length > 0) {
                const vagaId = parseInt(vagaIdParam);

                // Busca a vaga na lista que acabamos de carregar
                const vagaAlvo = allVagas.find(v => v.id === vagaId);

                if (vagaAlvo) {
                    openVagaDetailsModal(vagaAlvo); // Abre o modal

                    // Opcional: Limpa a URL para não reabrir ao atualizar a página (F5)
                    // window.history.replaceState({}, document.title, "vaga.html");
                }
            }
        }

        // -----------------------------------------------------------------
        // ATUALIZAÇÃO: RENDERIZAÇÃO COM BOTÕES DE ADMIN
        // -----------------------------------------------------------------
        function renderVagas(vagas) {
            if (!elements.vagasListContainer) return;
            elements.vagasListContainer.innerHTML = '';

            const userRole = (window.currentUser && window.currentUser.tipoUsuario) ? window.currentUser.tipoUsuario : '';
            const isAdminOrProf = userRole === 'ADMIN' || userRole === 'PROFESSOR';

            if (!vagas || vagas.length === 0) {
                elements.vagasListContainer.innerHTML = '<p class="sem-vagas">Nenhuma vaga encontrada.</p>';
                return;
            }

            // --- LÓGICA DE ORDENAÇÃO (Salvos no topo) ---
            // Cria uma cópia para não alterar a lista original desnecessariamente
            const vagasOrdenadas = [...vagas].sort((a, b) => {
                const aSaved = isVagaSaved(a.id);
                const bSaved = isVagaSaved(b.id);

                // Se 'a' é salvo e 'b' não, 'a' vem primeiro (-1)
                if (aSaved && !bSaved) return -1;
                if (!aSaved && bSaved) return 1;

                // Se ambos forem iguais (ambos salvos ou ambos não), mantém ordem original (data)
                return 0;
            });

            vagasOrdenadas.forEach(vaga => {
                const vagaCard = document.createElement('div');

                // Adiciona a classe 'saved' se estiver salvo
                const savedClass = isVagaSaved(vaga.id) ? 'saved' : '';
                vagaCard.className = `vaga-card ${savedClass}`;

                // Mapeamentos visuais
                const tipoContratacao = tipoContratacaoMap[vaga.tipoContratacao] || vaga.tipoContratacao;
                const localizacao = localizacaoMap[vaga.localizacao] || vaga.localizacao;
                const nivel = nivelMap[vaga.nivel] || vaga.nivel;
                const autorAvatar = window.getAvatarUrl(vaga.urlFotoAutor);

                // TRATAMENTO DA IMAGEM DA VAGA
                // Se a vaga tem imagemUrl, usa ela. Se não, usa a default.
                const jobImage = getJobImageUrl(vaga.imagemUrl);

                // Ícone do botão de salvar no card
                const bookmarkIconClass = isVagaSaved(vaga.id) ? 'fas' : 'far'; // fas = solido, far = regular
                const bookmarkBtnClass = isVagaSaved(vaga.id) ? 'saved' : '';

                // Botões de Admin (Mantido)
                let adminActions = '';
                if (isAdminOrProf) {
                    adminActions = `
                        <div class="vaga-admin-actions" style="display:flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button class="btn-secondary btn-sm edit-vaga-btn" data-id="${vaga.id}" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-secondary btn-sm delete-vaga-btn" data-id="${vaga.id}" style="padding: 0.3rem 0.8rem; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    `;
                }

                vagaCard.innerHTML = `
                    <div class="vaga-card-header">
                        <div class="vaga-empresa-logo">
                            <img src="${jobImage}" alt="${vaga.empresa}" onerror="this.src='${defaultJobUrl}'">
                        </div>
                        
                        <div class="vaga-info-principal">
                            <h2 class="vaga-titulo">${vaga.titulo}</h2>
                            <p class="vaga-empresa">${vaga.empresa}</p>
                            <div class="vaga-localidade"><i class="fas fa-map-marker-alt"></i> ${localizacao}</div>
                            ${adminActions}
                        </div>
                        <button class="save-vaga-btn ${bookmarkBtnClass}" data-id="${vaga.id}"><i class="${bookmarkIconClass} fa-bookmark"></i></button>
                    </div>
                    <div class="vaga-tags">
                        <span class="tag tag-nivel">${nivel}</span>
                        <span class="tag tag-tipo">${tipoContratacao}</span>
                    </div>
                    <div class="vaga-descricao">${vaga.descricao.substring(0, 150)}...</div>
                    <div class="vaga-card-footer">
                        <span class="vaga-publicado">Por ${vaga.autorNome}</span>
                        <button class="vaga-candidatar-btn" data-vaga-id="${vaga.id}">Ver Detalhes</button>
                    </div>
                `;
                elements.vagasListContainer.appendChild(vagaCard);
            });

            setupCardListeners();
        }

        function setupCardListeners() {

            document.querySelectorAll('.save-vaga-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Não abrir detalhes
                    const id = e.currentTarget.getAttribute('data-id');
                    handleToggleSave(id);
                });
            });

            // Ver Detalhes
            document.querySelectorAll('.vaga-candidatar-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const vaga = allVagas.find(v => v.id == e.target.getAttribute('data-vaga-id'));
                    if (vaga) openVagaDetailsModal(vaga);
                });
            });

            // Editar Vaga
            document.querySelectorAll('.edit-vaga-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Previne abrir detalhes se clicar no editar
                    e.stopPropagation();
                    const id = e.currentTarget.getAttribute('data-id');
                    const vaga = allVagas.find(v => v.id == id);
                    if (vaga) openEditModal(vaga);
                });
            });

            // Excluir Vaga
            document.querySelectorAll('.delete-vaga-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = e.currentTarget.getAttribute('data-id');
                    if (confirm("Tem certeza que deseja excluir esta vaga permanentemente?")) {
                        handleDeleteVaga(id);
                    }
                });
            });
        }

        function filterVagas() {
            // Usa o input de busca específico da página de vagas, se existir
            const searchInput = elements.searchInputVagas || elements.searchInput;
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

            const tipo = elements.filterTipo.value;
            const local = elements.filterLocal.value;
            const nivel = elements.filterNivel.value;

            const filteredVagas = allVagas.filter(vaga => {
                const titulo = vaga.titulo.toLowerCase();
                const empresa = vaga.empresa.toLowerCase();
                const descricao = vaga.descricao.toLowerCase();

                const tipoTexto = tipoContratacaoMap[vaga.tipoContratacao] || vaga.tipoContratacao;
                const localTexto = localizacaoMap[vaga.localizacao] || vaga.localizacao;
                const nivelTexto = nivelMap[vaga.nivel] || vaga.nivel;

                const matchSearch = titulo.includes(searchTerm) || empresa.includes(searchTerm) || descricao.includes(searchTerm);
                const matchTipo = tipo === 'todos' || tipoTexto === tipo;
                const matchLocal = local === 'todos' || localTexto === local;
                const matchNivel = nivel === 'todos' || nivelTexto === nivel;

                return matchSearch && matchTipo && matchLocal && matchNivel;
            });
            renderVagas(filteredVagas);
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DO MODAL DE DETALHES
        // -----------------------------------------------------------------

        // -----------------------------------------------------------------
        // FUNÇÕES AUXILIARES DE RENDERIZAÇÃO 
        // -----------------------------------------------------------------

        function renderList(elementId, items) {
            const list = document.getElementById(elementId);
            if (!list) return; // Segurança caso o elemento não exista

            list.innerHTML = '';
            if (items && items.length > 0) {
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    list.appendChild(li);
                });
            } else {
                list.innerHTML = '<li style="list-style: none; color: var(--text-secondary);">Não especificado.</li>';
            }
        }

        function renderBenefits(elementId, items) {
            const grid = document.getElementById(elementId);
            if (!grid) return; // Segurança

            grid.innerHTML = '';
            if (items && items.length > 0) {
                items.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'benefit-item';
                    div.innerHTML = `<i class="fas fa-check-circle"></i><span>${item}</span>`;
                    grid.appendChild(div);
                });
            } else {
                grid.innerHTML = '<p style="color:var(--text-secondary); width:100%;">A combinar.</p>';
            }
        }

        // 1. Atualiza o texto e ícone do botão dentro do modal
        function updateModalSaveButtonState(isSaved) {
            const btn = document.getElementById('save-vaga-details-btn');
            if (!btn) return;

            if (isSaved) {
                btn.innerHTML = '<i class="fas fa-bookmark"></i> Vaga Salva';
                btn.classList.add('saved');
            } else {
                btn.innerHTML = '<i class="far fa-bookmark"></i> Salvar Vaga';
                btn.classList.remove('saved');
            }
        }

        // 2. Substitui a antiga handleSaveVaga para usar a lógica real de salvar
        function handleSaveVaga() {
            if (!currentVagaDetails) return;

            handleToggleSave(currentVagaDetails.id);
        }

        // 3. Função Centralizada de Toggle (Caso não tenha adicionado ainda)
        function handleToggleSave(vagaId) {
            const isNowSaved = toggleSaveVagaId(vagaId);

            // Notificação visual
            if (isNowSaved) {
                showNotification("Vaga salva na sua lista!", "success");
            } else {
                showNotification("Vaga removida dos salvos.", "info");
            }

            // Re-renderiza a lista atrás do modal (para atualizar bordas/ordem)
            const searchInput = elements.searchInputVagas || elements.searchInput;
            if (searchInput && searchInput.value.length > 0) {
                filterVagas();
            } else {
                renderVagas(allVagas);
            }

            // Se o modal estiver aberto na vaga que acabamos de clicar, atualiza o botão dele
            if (currentVagaDetails && currentVagaDetails.id == vagaId) {
                updateModalSaveButtonState(isNowSaved);
            }
        }

        function openVagaDetailsModal(vaga) {
            currentVagaDetails = vaga;

            // Mapeamentos
            const tipoContratacao = tipoContratacaoMap[vaga.tipoContratacao] || vaga.tipoContratacao;
            const localizacao = localizacaoMap[vaga.localizacao] || vaga.localizacao;
            const nivel = nivelMap[vaga.nivel] || vaga.nivel;

            // --- FOTO NO MODAL ---
            const jobImage = getJobImageUrl(vaga.imagemUrl);
            const logoImg = document.getElementById('details-company-logo');
            logoImg.src = jobImage;
            // Fallback caso a imagem quebre
            logoImg.onerror = function () {
                this.src = defaultJobUrl;
            };

            // Preenche dados de texto (Mantido)
            document.getElementById('details-vaga-titulo').textContent = vaga.titulo;
            document.getElementById('details-vaga-empresa').textContent = vaga.empresa;
            document.getElementById('details-vaga-localizacao').textContent = localizacao;
            document.getElementById('details-vaga-nivel').textContent = nivel;
            document.getElementById('details-vaga-tipo').textContent = tipoContratacao;
            document.getElementById('details-vaga-descricao').textContent = vaga.descricao;
            document.getElementById('details-vaga-autor').textContent = vaga.autorNome;

            // Data
            const dataPublicacao = new Date(vaga.dataPublicacao);
            document.getElementById('details-vaga-data-completa').textContent = dataPublicacao.toLocaleDateString('pt-BR');
            const agora = new Date();
            const diffDays = Math.ceil(Math.abs(agora - dataPublicacao) / (1000 * 60 * 60 * 24));
            document.getElementById('details-vaga-data').textContent = diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;

            // Cards Detalhes
            document.getElementById('details-card-nivel').textContent = nivel;
            document.getElementById('details-card-tipo').textContent = tipoContratacao;
            document.getElementById('details-card-localizacao').textContent = localizacao;
            document.getElementById('details-card-salario').textContent = vaga.salario || 'A combinar';

            // Listas
            renderList('details-vaga-requisitos', vaga.requisitos);
            renderBenefits('details-vaga-beneficios', vaga.beneficios);

            // --- LINK PARA MENSAGEM (CHAT) ---
            // Redireciona para mensagem.html passando o ID do autor da vaga
            const contactBtn = document.getElementById('contact-vaga-btn');
            // Verifica se o usuário não está tentando falar consigo mesmo
            if (window.currentUser && window.currentUser.id === vaga.autorId) {
                contactBtn.style.display = 'none'; // Esconde se for o próprio autor
            } else {
                contactBtn.style.display = 'inline-flex';
                contactBtn.href = `mensagem.html?start_chat=${vaga.autorId}`;
                contactBtn.target = "_self"; // Abre na mesma aba (SPA feel)
            }

            // --- ESTADO DO BOTÃO SALVAR NO MODAL ---
            const isSaved = isVagaSaved(vaga.id);
            updateModalSaveButtonState(isSaved);

            // Mostra modal
            vagaDetailsModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        function closeVagaDetailsModal() {
            vagaDetailsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            currentVagaDetails = null;
        }

        function generateContactLink(vaga) {
            // Simula a geração de um link de contato baseado na empresa
            const empresaSlug = vaga.empresa.toLowerCase().replace(/\s+/g, '-');
            const tituloSlug = vaga.titulo.toLowerCase().replace(/\s+/g, '-');
            return `https://${empresaSlug}.com/carreiras/${tituloSlug}-${vaga.id}`;
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DO MODAL DE CRIAÇÃO
        // -----------------------------------------------------------------

        function openCreateVagaModal() {
            if (createVagaModal) createVagaModal.style.display = 'flex';
            if (createVagaImgInput) createVagaImgInput.value = '';

            // Define a imagem de preview como a default definida no início do arquivo
            if (createVagaPreview) {
                // Use a variável defaultJobUrl que definimos lá no começo do DOMContentLoaded
                createVagaPreview.src = defaultJobUrl;
            }
        }

        function closeCreateVagaModal() {
            if (createVagaForm) createVagaForm.reset();
            // Resetar preview
            if (createVagaImgInput) createVagaImgInput.value = '';
            if (createVagaPreview) createVagaPreview.src = defaultJobUrl;
            if (createVagaModal) createVagaModal.style.display = 'none';
            if (createPreviewContainer) createPreviewContainer.style.display = 'none';
        }

        async function handleCreateVagaSubmit(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Publicando...";

            try {
                // Captura e processa as listas (quebra por linha e remove vazios)
                const requisitosArray = document.getElementById('vaga-requisitos').value
                    .split('\n')
                    .map(item => item.trim())
                    .filter(item => item !== '');

                const beneficiosArray = document.getElementById('vaga-beneficios').value
                    .split('\n')
                    .map(item => item.trim())
                    .filter(item => item !== '');

                const vagaData = {
                    titulo: document.getElementById('vaga-titulo').value,
                    empresa: document.getElementById('vaga-empresa').value,
                    descricao: document.getElementById('vaga-descricao').value,
                    nivel: document.getElementById('vaga-nivel').value,
                    localizacao: document.getElementById('vaga-localizacao').value,
                    tipoContratacao: document.getElementById('vaga-tipo').value,
                    // Novos campos
                    salario: document.getElementById('vaga-salario').value,
                    requisitos: requisitosArray,
                    beneficios: beneficiosArray
                };

                // CRIAÇÃO DO FORMDATA (Para enviar JSON + Arquivo)
                const formData = new FormData();
                // O backend espera @RequestPart("vaga")
                formData.append("vaga", new Blob([JSON.stringify(vagaData)], { type: "application/json" }));

                // O backend espera @RequestPart("imagem")
                if (createVagaImgInput && createVagaImgInput.files[0]) {
                    formData.append("imagem", createVagaImgInput.files[0]);
                }

                // Envia para o backend (o token já está no axios graças ao principal.js)
                await axios.post(`${backendUrl}/api/vagas`, formData);

                closeCreateVagaModal();
                showNotification("Vaga publicada com sucesso!", "success");
                fetchVagas(); // Atualiza a lista

            } catch (error) {
                let msg = "Não foi possível publicar a vaga.";
                if (error.response && error.response.data && error.response.data.message) {
                    msg = error.response.data.message;
                } else if (error.response && error.response.status === 403) {
                    msg = "Acesso negado. Apenas professores ou admins podem postar vagas.";
                }
                showNotification(msg, "error");
            } finally {
                btn.disabled = false;
                btn.textContent = "Publicar Vaga";
            }
        }

        // -----------------------------------------------------------------
        // LÓGICA DE EDIÇÃO
        // -----------------------------------------------------------------
        function openEditModal(vaga) {
            // Preenche o formulário com dados existentes
            document.getElementById('edit-vaga-id').value = vaga.id;
            document.getElementById('edit-vaga-titulo').value = vaga.titulo;
            document.getElementById('edit-vaga-empresa').value = vaga.empresa;
            document.getElementById('edit-vaga-salario').value = vaga.salario || '';
            document.getElementById('edit-vaga-descricao').value = vaga.descricao;

            // Converte array de volta para texto (linha por linha)
            document.getElementById('edit-vaga-requisitos').value = vaga.requisitos ? vaga.requisitos.join('\n') : '';
            document.getElementById('edit-vaga-beneficios').value = vaga.beneficios ? vaga.beneficios.join('\n') : '';

            // Selects (Precisa coincidir com os ENUMs do backend)
            document.getElementById('edit-vaga-nivel').value = vaga.nivel; // Ex: JUNIOR
            document.getElementById('edit-vaga-localizacao').value = vaga.localizacao; // Ex: REMOTO
            document.getElementById('edit-vaga-tipo').value = vaga.tipoContratacao; // Ex: ESTAGIO


            const salarioInput = document.getElementById('edit-vaga-salario');

            if (vaga.salario) {

                let valorLimpo = vaga.salario.toString().replace(/\D/g, '');

                if (valorLimpo) {
                    const numero = parseFloat(valorLimpo) / 100;
                    salarioInput.value = numero.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    });
                } else {
                    salarioInput.value = vaga.salario;
                }
            } else {
                salarioInput.value = '';
            }

            const currentImg = getJobImageUrl(vaga.imagemUrl);

            if (editVagaPreview) {
                editVagaPreview.src = currentImg;
                editVagaPreview.onerror = function () { this.src = defaultJobUrl; };
            }

            if (editVagaImgInput) editVagaImgInput.value = '';

            editVagaModal.style.display = 'flex';
        }

        if (editVagaForm) {
            editVagaForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-vaga-id').value;
                const btn = editVagaForm.querySelector('button[type="submit"]');

                // Constrói objeto (Mesma lógica do create)
                const requisitosArray = document.getElementById('edit-vaga-requisitos').value.split('\n').map(i => i.trim()).filter(i => i !== '');
                const beneficiosArray = document.getElementById('edit-vaga-beneficios').value.split('\n').map(i => i.trim()).filter(i => i !== '');

                const vagaData = {
                    titulo: document.getElementById('edit-vaga-titulo').value,
                    empresa: document.getElementById('edit-vaga-empresa').value,
                    descricao: document.getElementById('edit-vaga-descricao').value,
                    salario: document.getElementById('edit-vaga-salario').value,
                    nivel: document.getElementById('edit-vaga-nivel').value,
                    localizacao: document.getElementById('edit-vaga-localizacao').value,
                    tipoContratacao: document.getElementById('edit-vaga-tipo').value,
                    requisitos: requisitosArray,
                    beneficios: beneficiosArray
                };

                try {
                    btn.textContent = "Salvando...";

                    // FORMDATA PARA EDIÇÃO
                    const formData = new FormData();
                    formData.append("vaga", new Blob([JSON.stringify(vagaData)], { type: "application/json" }));

                    if (editVagaImgInput && editVagaImgInput.files[0]) {
                        formData.append("imagem", editVagaImgInput.files[0]);
                    }

                    // PUT com FormData
                    await axios.put(`${backendUrl}/api/vagas/${id}`, formData);

                    showNotification("Vaga atualizada com sucesso!", "success");
                    editVagaModal.style.display = 'none';
                    fetchVagas(); // Recarrega lista
                } catch (error) {
                    showNotification("Erro ao atualizar vaga.", "error");
                } finally {
                    btn.textContent = "Salvar Alterações";
                }
            });
        }

        if (cancelEditVagaBtn) cancelEditVagaBtn.addEventListener('click', () => editVagaModal.style.display = 'none');

        // -----------------------------------------------------------------
        // LÓGICA DE EXCLUSÃO
        // -----------------------------------------------------------------
        async function handleDeleteVaga(id) {
            try {
                await axios.delete(`${backendUrl}/api/vagas/${id}`);
                showNotification("Vaga excluída.", "success");
                fetchVagas();
            } catch (error) {
                console.error(error);
                showNotification("Erro ao excluir vaga.", "error");
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DE ALERTAS
        // -----------------------------------------------------------------

        async function fetchAlerts() {
            if (!alertsListContainer) return;
            try {
                const response = await axios.get(`${backendUrl}/api/alertas`);
                renderAlerts(response.data);
            } catch (error) {
                console.error("Erro ao buscar alertas", error);
                alertsListContainer.innerHTML = '<p style="font-size:0.8rem; color:var(--text-secondary)">Erro ao carregar.</p>';
            }
        }

        function renderAlerts(alerts) {
            alertsListContainer.innerHTML = '';

            if (alerts.length === 0) {
                alertsListContainer.innerHTML = '<p style="font-size:0.8rem; color:var(--text-secondary); text-align:center;">Você não tem alertas ativos.</p>';
                return;
            }

            alerts.forEach(alert => {
                const item = document.createElement('div');
                item.className = 'alert-item';

                // Formata o nível para ficar bonito (JUNIOR -> Júnior)
                const nivelFormatado = alert.nivel
                    ? alert.nivel.charAt(0).toUpperCase() + alert.nivel.slice(1).toLowerCase()
                    : 'Qualquer';

                item.innerHTML = `
                    <div class="alert-info">
                        <strong>${alert.palavraChave}</strong>
                        <span>(${nivelFormatado})</span>
                    </div>
                    <div class="alert-actions">
                        <button class="alert-btn alert-edit" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                        <button class="alert-btn alert-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Event Listener: Editar
                item.querySelector('.alert-edit').addEventListener('click', () => {
                    openAlertModal(alert);
                });

                // Event Listener: Excluir
                item.querySelector('.alert-delete').addEventListener('click', () => {
                    if (confirm('Excluir este alerta?')) {
                        handleDeleteAlert(alert.id);
                    }
                });

                alertsListContainer.appendChild(item);
            });
        }

        async function handleDeleteAlert(id) {
            try {
                await axios.delete(`${backendUrl}/api/alertas/${id}`);
                showNotification("Alerta excluído.", "success");
                fetchAlerts(); // Atualiza a lista
            } catch (error) {
                showNotification("Erro ao excluir alerta.", "error");
            }
        }

        function openAlertModal(alert = null) {
            const modalTitle = alertModal.querySelector('h3');
            const submitBtn = alertForm.querySelector('button[type="submit"]');

            if (alert) {
                // Modo Edição
                editingAlertId = alert.id;
                modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Alerta';
                submitBtn.textContent = 'Salvar Alterações';
                document.getElementById('alert-keyword').value = alert.palavraChave;
                document.getElementById('alert-nivel').value = alert.nivel || "";
            } else {
                // Modo Criação
                editingAlertId = null;
                modalTitle.innerHTML = '<i class="fas fa-bell"></i> Novo Alerta de Vaga';
                submitBtn.textContent = 'Criar Alerta';
                alertForm.reset();
            }
            alertModal.style.display = 'flex';
        }

        // -----------------------------------------------------------------
        // EVENT LISTENERS DE ALERTAS
        // -----------------------------------------------------------------

        if (openAlertModalBtn) {
            openAlertModalBtn.addEventListener('click', () => openAlertModal(null));
        }

        if (cancelAlertBtn) {
            cancelAlertBtn.addEventListener('click', () => alertModal.style.display = 'none');
        }

        if (alertForm) {
            alertForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = alertForm.querySelector('button[type="submit"]');
                btn.disabled = true;

                const data = {
                    palavraChave: document.getElementById('alert-keyword').value,
                    nivel: document.getElementById('alert-nivel').value
                };

                try {
                    if (editingAlertId) {
                        // PUT (Editar)
                        await axios.put(`${backendUrl}/api/alertas/${editingAlertId}`, data);
                        showNotification("Alerta atualizado!", "success");
                    } else {
                        // POST (Criar)
                        await axios.post(`${backendUrl}/api/alertas`, data);
                        showNotification("Alerta criado!", "success");
                    }

                    alertModal.style.display = 'none';
                    fetchAlerts(); // Recarrega a lista lateral
                } catch (error) {
                    showNotification("Erro ao salvar alerta.", "error");
                } finally {
                    btn.disabled = false;
                }
            });
        }

        // -----------------------------------------------------------------
        // EVENT LISTENERS
        // -----------------------------------------------------------------
        function setupVagasEventListeners() {
            // Listeners dos filtros
            if (elements.searchInputVagas) elements.searchInputVagas.addEventListener('input', filterVagas);
            if (elements.filterTipo) elements.filterTipo.addEventListener('change', filterVagas);
            if (elements.filterLocal) elements.filterLocal.addEventListener('change', filterVagas);
            if (elements.filterNivel) elements.filterNivel.addEventListener('change', filterVagas);

            // Listener do Modal de Criação
            if (elements.createVagaBtn) {
                elements.createVagaBtn.addEventListener('click', openCreateVagaModal);

            }

            const createSalarioInput = document.getElementById('vaga-salario');
            if (createSalarioInput) {
                createSalarioInput.addEventListener('input', formatarMoedaInput);
            }
            const editSalarioInput = document.getElementById('edit-vaga-salario');
            if (editSalarioInput) {
                editSalarioInput.addEventListener('input', formatarMoedaInput);
            }
            if (cancelCreateVagaBtn) {
                cancelCreateVagaBtn.addEventListener('click', closeCreateVagaModal);
            }
            if (createVagaForm) {
                createVagaForm.addEventListener('submit', handleCreateVagaSubmit);
            }

            // Listeners do Modal de Detalhes
            if (closeVagaDetailsBtn) {
                closeVagaDetailsBtn.addEventListener('click', closeVagaDetailsModal);
            }
            if (saveVagaDetailsBtn) {
                saveVagaDetailsBtn.addEventListener('click', handleSaveVaga);
            }

            // Fechar modal clicando fora
            if (vagaDetailsModal) {
                vagaDetailsModal.addEventListener('click', (e) => {
                    if (e.target === vagaDetailsModal) {
                        closeVagaDetailsModal();
                    }
                });
            }
        }

        // -----------------------------------------------------------------
        // INICIALIZAÇÃO DA PÁGINA
        // -----------------------------------------------------------------

        // 1. ATUALIZA A SIDEBAR (Perfil)
        updateSidebarUserInfo();

        // Verifica permissão para mostrar o botão de criar vaga
        if (currentUser) {
            const userRoles = currentUser.tipoUsuario ? [currentUser.tipoUsuario] : [];
            if ((userRoles.includes('ADMIN') || userRoles.includes('PROFESSOR')) && elements.createVagaBtn) {
                elements.createVagaBtn.style.display = 'flex';
            }
        }

        // Inicialização
        fetchAlerts(); // Busca os alertas ao carregar a página
        fetchVagas();  // Busca as vagas
        setupVagasEventListeners(); // Configura os listeners
    });
});