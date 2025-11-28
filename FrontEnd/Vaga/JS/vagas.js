document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------------------
    // AGUARDA O SCRIPT PRINCIPAL (principal.js)
    // -----------------------------------------------------------------
    document.addEventListener('globalScriptsLoaded', (e) => {
        
        // Variáveis globais vindas do principal.js
        const currentUser = window.currentUser;
        const backendUrl = window.backendUrl;
        const showNotification = window.showNotification; 

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
            sidebarClose: document.getElementById('sidebar-close')
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

        // Cache local para todas as vagas
        let allVagas = [];
        let currentVagaDetails = null;

        // Mapeamentos para filtros
        const tipoContratacaoMap = { 'TODOS': '', 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };
        const localizacaoMap = { 'TODOS': '', 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
        const nivelMap = { 'TODOS': '', 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };

        // -----------------------------------------------------------------
        // FUNÇÕES DE RESPONSIVIDADE (Copiado de amizades.js)
        // -----------------------------------------------------------------
        function initResponsiveFeatures() {
            if (elements.mobileMenuToggle) {
                elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
            }
            if (elements.sidebarClose) {
                elements.sidebarClose.addEventListener('click', toggleMobileMenu);
            }
            if (elements.mobileOverlay) {
                elements.mobileOverlay.addEventListener('click', toggleMobileMenu);
            }

            // Fecha o menu ao clicar em um link da sidebar
            const menuLinks = document.querySelectorAll('.menu-item');
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) { // Ajustado para coincidir com o CSS mobile
                        toggleMobileMenu();
                    }
                });
            });

            window.addEventListener('resize', handleResize);
        }

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
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÃO: Atualizar Sidebar do Usuário
        // -----------------------------------------------------------------
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

                if(sidebarName) {
                    sidebarName.textContent = window.currentUser.nome || "Usuário";
                }

                // 2. CORREÇÃO: Lógica robusta para o Cargo/Título
                if(sidebarTitle) {
                    const role = window.currentUser.cargo || 
                                 window.currentUser.titulo || 
                                 window.currentUser.tipoUsuario || 
                                 'Membro da Comunidade';
                    sidebarTitle.textContent = role;
                } 
                
                if(sidebarImg) {
                    const foto = window.currentUser.fotoPerfil || window.currentUser.urlFotoPerfil;

                    sidebarImg.onerror = function() {
                        if (this.src !== defaultImage) this.src = defaultImage;
                    };

                    if(foto) {
                         if(typeof window.getAvatarUrl === 'function') {
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
            } catch (error) {
                console.error("Erro ao buscar vagas:", error);
                elements.vagasListContainer.innerHTML = '<p class="sem-vagas" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Não foi possível carregar as vagas no momento.</p>';
            }
        }

        function renderVagas(vagas) {
            if (!elements.vagasListContainer) return;
            elements.vagasListContainer.innerHTML = '';

            if (!vagas || vagas.length === 0) {
                elements.vagasListContainer.innerHTML = '<p class="sem-vagas" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhuma vaga encontrada para os filtros selecionados.</p>';
                return;
            }

            vagas.forEach(vaga => {
                const vagaCard = document.createElement('div');
                vagaCard.className = 'vaga-card';

                // Mapeia os dados do DTO
                const tipoContratacao = tipoContratacaoMap[vaga.tipoContratacao] || vaga.tipoContratacao;
                const localizacao = localizacaoMap[vaga.localizacao] || vaga.localizacao;
                const nivel = nivelMap[vaga.nivel] || vaga.nivel;

                vagaCard.innerHTML = `
                    <div class="vaga-card-header">
                        <div class="vaga-empresa-logo">
                            <img src="https://placehold.co/100x100/58a6ff/ffffff?text=${vaga.empresa.substring(0, 2).toUpperCase()}" alt="Logo da ${vaga.empresa}">
                        </div>
                        <div class="vaga-info-principal">
                            <h2 class="vaga-titulo">${vaga.titulo}</h2>
                            <p class="vaga-empresa">${vaga.empresa}</p>
                            <div class="vaga-localidade"><i class="fas fa-map-marker-alt"></i> ${localizacao}</div>
                        </div>
                        <button class="save-vaga-btn"><i class="far fa-bookmark"></i></button>
                    </div>
                    <div class="vaga-tags">
                        <span class="tag tag-nivel">${nivel}</span>
                        <span class="tag tag-tipo">${tipoContratacao}</span>
                    </div>
                    <div class="vaga-descricao">${vaga.descricao.substring(0, 150)}${vaga.descricao.length > 150 ? '...' : ''}</div>
                    <div class="vaga-card-footer">
                        <span class="vaga-publicado">Publicado por ${vaga.autorNome} em ${new Date(vaga.dataPublicacao).toLocaleDateString()}</span>
                        <button class="vaga-candidatar-btn" data-vaga-id="${vaga.id}">Ver Detalhes</button>
                    </div>
                `;
                elements.vagasListContainer.appendChild(vagaCard);
            });

            // Adiciona event listeners para os botões "Ver Detalhes"
            document.querySelectorAll('.vaga-candidatar-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const vagaId = e.target.getAttribute('data-vaga-id');
                    const vaga = allVagas.find(v => v.id == vagaId);
                    if (vaga) {
                        openVagaDetailsModal(vaga);
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

        function openVagaDetailsModal(vaga) {
            currentVagaDetails = vaga;
            
            // Mapeia os dados
            const tipoContratacao = tipoContratacaoMap[vaga.tipoContratacao] || vaga.tipoContratacao;
            const localizacao = localizacaoMap[vaga.localizacao] || vaga.localizacao;
            const nivel = nivelMap[vaga.nivel] || vaga.nivel;
            
            // Preenche os dados básicos
            document.getElementById('details-vaga-titulo').textContent = vaga.titulo;
            document.getElementById('details-vaga-empresa').textContent = vaga.empresa;
            document.getElementById('details-vaga-localizacao').textContent = localizacao;
            document.getElementById('details-vaga-nivel').textContent = nivel;
            document.getElementById('details-vaga-tipo').textContent = tipoContratacao;
            document.getElementById('details-vaga-descricao').textContent = vaga.descricao;
            document.getElementById('details-vaga-autor').textContent = vaga.autorNome;
            
            // Data de publicação formatada
            const dataPublicacao = new Date(vaga.dataPublicacao);
            document.getElementById('details-vaga-data-completa').textContent = dataPublicacao.toLocaleDateString('pt-BR');
            
            // Calcula "há quanto tempo" foi publicado
            const agora = new Date();
            const diffTime = Math.abs(agora - dataPublicacao);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const tempoPublicacao = diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
            document.getElementById('details-vaga-data').textContent = tempoPublicacao;
            
            // Logo da empresa
            document.getElementById('details-company-logo').src = `https://placehold.co/200x200/58a6ff/ffffff?text=${vaga.empresa.substring(0, 2).toUpperCase()}`;
            
            // Cards de detalhes
            document.getElementById('details-card-nivel').textContent = nivel;
            document.getElementById('details-card-tipo').textContent = tipoContratacao;
            document.getElementById('details-card-localizacao').textContent = localizacao;
            // Salário Real ou Padrão
            document.getElementById('details-card-salario').textContent = vaga.salario || 'A combinar';
            
            // --- GERA REQUISITOS (DO BANCO) ---
            const requisitosList = document.getElementById('details-vaga-requisitos');
            requisitosList.innerHTML = '';
            
            if (vaga.requisitos && vaga.requisitos.length > 0) {
                vaga.requisitos.forEach(requisito => {
                    const li = document.createElement('li');
                    li.textContent = requisito;
                    requisitosList.appendChild(li);
                });
            } else {
                requisitosList.innerHTML = '<li style="list-style: none; color: var(--text-secondary);">Nenhum requisito especificado.</li>';
            }
            
            // --- GERA BENEFÍCIOS (DO BANCO) ---
            const beneficiosGrid = document.getElementById('details-vaga-beneficios');
            beneficiosGrid.innerHTML = '';
            
            if (vaga.beneficios && vaga.beneficios.length > 0) {
                vaga.beneficios.forEach(beneficio => {
                    const div = document.createElement('div');
                    div.className = 'benefit-item';
                    div.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span>${beneficio}</span>
                    `;
                    beneficiosGrid.appendChild(div);
                });
            } else {
                beneficiosGrid.innerHTML = '<p style="color:var(--text-secondary); width:100%;">A combinar ou não informado.</p>';
            }
            
            // Configura o link de contato
            contactVagaBtn.href = generateContactLink(vaga);
            
            // Mostra o modal
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

        function handleSaveVaga() {
            if (!currentVagaDetails) return;
            
            showNotification(`Vaga "${currentVagaDetails.titulo}" salva com sucesso!`, "success");
            
            // Aqui você pode implementar a lógica para salvar a vaga para o usuário
            saveVagaDetailsBtn.innerHTML = '<i class="fas fa-bookmark"></i> Vaga Salva';
            saveVagaDetailsBtn.disabled = true;
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DO MODAL DE CRIAÇÃO
        // -----------------------------------------------------------------

        function openCreateVagaModal() {
            if (createVagaModal) createVagaModal.style.display = 'flex';
        }

        function closeCreateVagaModal() {
            if (createVagaModal) createVagaModal.style.display = 'none';
            if (createVagaForm) createVagaForm.reset();
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

                // Envia para o backend (o token já está no axios graças ao principal.js)
                await axios.post(`${backendUrl}/api/vagas`, vagaData);

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

        // 2. INICIALIZA O MENU MOBILE (Agora usando a função robusta)
        initResponsiveFeatures();

        // Verifica permissão para mostrar o botão de criar vaga
        if (currentUser) { 
            const userRoles = currentUser.tipoUsuario ? [currentUser.tipoUsuario] : [];
            if ((userRoles.includes('ADMIN') || userRoles.includes('PROFESSOR')) && elements.createVagaBtn) {
                elements.createVagaBtn.style.display = 'flex'; 
            }
        }
        
        fetchVagas(); // Busca as vagas
        setupVagasEventListeners(); // Configura os listeners
    });
});