document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------------------
    // AGUARDA O SCRIPT PRINCIPAL (principal.js)
    // -----------------------------------------------------------------
    // Usamos 'globalScriptsLoaded' que é disparado pelo principal.js
    document.addEventListener('globalScriptsLoaded', (e) => {
        
        // Variáveis globais vindas do principal.js
        const currentUser = window.currentUser;
        const backendUrl = window.backendUrl;
        const showNotification = window.showNotification; // Pega a função global de notificação

        // --- SELEÇÃO DE ELEMENTOS (Específicos da Página) ---
        const elements = {
            vagasListContainer: document.querySelector('.vagas-list'),
            createAlertBtn: document.querySelector('.create-alert-btn'),
            searchInput: document.getElementById("search-input"), // ID do input de busca da página de vagas
            filterTipo: document.getElementById("filter-tipo"),
            filterLocal: document.getElementById("filter-local"),
            filterNivel: document.getElementById("filter-nivel"),
        };
        
        // --- SELEÇÃO DE ELEMENTOS (Do Novo Modal) ---
        const createVagaModal = document.getElementById('create-vaga-modal');
        const createVagaForm = document.getElementById('create-vaga-form');
        const cancelCreateVagaBtn = document.getElementById('cancel-create-vaga-btn');

        // Cache local para todas as vagas
        let allVagas = [];

        // Mapeamentos para filtros
        const tipoContratacaoMap = { 'TODOS': '', 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };
        const localizacaoMap = { 'TODOS': '', 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
        const nivelMap = { 'TODOS': '', 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };

        // -----------------------------------------------------------------
        // FUNÇÕES DE BUSCA E RENDERIZAÇÃO (Específicas da Página)
        // -----------------------------------------------------------------
        
        async function fetchVagas() {
            if (!elements.vagasListContainer) return;
            elements.vagasListContainer.innerHTML = '<p class="sem-vagas" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Carregando vagas...</p>';
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
                    <div class="vaga-descricao">${vaga.descricao}</div>
                    <div class="vaga-card-footer">
                        <span class="vaga-publicado">Publicado por ${vaga.autorNome} em ${new Date(vaga.dataPublicacao).toLocaleDateString()}</span>
                        <button class="vaga-candidatar-btn">Ver Detalhes</button>
                    </div>
                `;
                elements.vagasListContainer.appendChild(vagaCard);
            });
        }

        function filterVagas() {
            const searchTerm = elements.searchInput.value.toLowerCase();
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
        // FUNÇÕES DO MODAL (NOVO)
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
                const vagaData = {
                    titulo: document.getElementById('vaga-titulo').value,
                    empresa: document.getElementById('vaga-empresa').value,
                    descricao: document.getElementById('vaga-descricao').value,
                    nivel: document.getElementById('vaga-nivel').value,
                    localizacao: document.getElementById('vaga-localizacao').value,
                    tipoContratacao: document.getElementById('vaga-tipo').value
                };

                // Envia para o backend (o token já está no axios graças ao principal.js)
                await axios.post(`${backendUrl}/api/vagas`, vagaData);

                closeCreateVagaModal();
                showNotification("Vaga publicada com sucesso!", "success");
                fetchVagas(); // Atualiza a lista

            } catch (error) {
                console.error("Erro ao criar vaga:", error);
                let msg = "Não foi possível publicar a vaga.";
                if (error.response && error.response.status === 403) {
                    msg = "Acesso negado. Apenas professores ou admins podem postar vagas.";
                }
                showNotification(msg, "error");
            } finally {
                btn.disabled = false;
                btn.textContent = "Publicar Vaga";
            }
        }

        // -----------------------------------------------------------------
        // EVENT LISTENERS (Específicos da Página)
        // -----------------------------------------------------------------
        function setupVagasEventListeners() {
            // Listeners dos filtros
            if (elements.searchInput) elements.searchInput.addEventListener('input', filterVagas);
            if (elements.filterTipo) elements.filterTipo.addEventListener('change', filterVagas);
            if (elements.filterLocal) elements.filterLocal.addEventListener('change', filterVagas);
            if (elements.filterNivel) elements.filterNivel.addEventListener('change', filterVagas);
            
            // Listeners do Modal (NOVOS)
            if (elements.createAlertBtn) {
                elements.createAlertBtn.addEventListener('click', openCreateVagaModal);
            }
            if (cancelCreateVagaBtn) {
                cancelCreateVagaBtn.addEventListener('click', closeCreateVagaModal);
            }
            if (createVagaForm) {
                createVagaForm.addEventListener('submit', handleCreateVagaSubmit);
            }
        }

        // -----------------------------------------------------------------
        // INICIALIZAÇÃO DA PÁGINA
        // -----------------------------------------------------------------
        
        // Verifica permissão para mostrar o botão
        if (currentUser) { 
            const userRoles = currentUser.tipoUsuario ? [currentUser.tipoUsuario] : [];
            // O tipoUsuario vem do UsuarioSaidaDTO
            if ((userRoles.includes('ADMIN') || userRoles.includes('PROFESSOR')) && elements.createAlertBtn) {
                elements.createAlertBtn.style.display = 'block';
                elements.createAlertBtn.textContent = "Publicar Vaga"; // Muda o texto
            }
        }
        
        fetchVagas(); // Busca as vagas
        setupVagasEventListeners(); // Configura os listeners
    });
});