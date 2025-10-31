document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------------------
    // AGUARDA O SCRIPT PRINCIPAL
    // -----------------------------------------------------------------
    document.addEventListener('globalScriptsLoaded', (e) => {
        const currentUser = window.currentUser;

        // --- SELEÇÃO DE ELEMENTOS (Específicos da Página) ---
        const elements = {
            vagasListContainer: document.querySelector('.vagas-list'),
            createAlertBtn: document.querySelector('.create-alert-btn'),
            searchInput: document.getElementById("search-input"),
            filterTipo: document.getElementById("filter-tipo"),
            filterLocal: document.getElementById("filter-local"),
            filterNivel: document.getElementById("filter-nivel"),
        };
                const tipoContratacaoMap = { 'TODOS': '', 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };
        const localizacaoMap = { 'TODOS': '', 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
        const nivelMap = { 'TODOS': '', 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };

        // -----------------------------------------------------------------
        // FUNÇÕES DE BUSCA E RENDERIZAÇÃO (Específicas da Página)
        // -----------------------------------------------------------------
        async function fetchVagas() {
            if (!elements.vagasListContainer) return;
            try {
                const response = await window.axios.get(`${window.backendUrl}/api/vagas`);
                renderVagas(response.data);
            } catch (error) {
                console.error("Erro ao buscar vagas:", error);
                elements.vagasListContainer.innerHTML = '<p class="sem-vagas">Não foi possível carregar as vagas no momento.</p>';
            }
        }

        /**
         * Renderiza os cards de vagas no container.
         */
        function renderVagas(vagas) {
            if (!elements.vagasListContainer) return;
            elements.vagasListContainer.innerHTML = '';

            if (!vagas || vagas.length === 0) {
                elements.vagasListContainer.innerHTML = '<p class="sem-vagas">Nenhuma vaga encontrada no momento.</p>';
                return;
            }

            vagas.forEach(vaga => {
                const vagaCard = document.createElement('div');
                vagaCard.className = 'vaga-card';

                vagaCard.innerHTML = `
                    <div class="vaga-card-header">
                        <div class="vaga-empresa-logo">
                            <img src="https://placehold.co/100x100/58a6ff/ffffff?text=${vaga.empresa.substring(0, 2).toUpperCase()}" alt="Logo da ${vaga.empresa}">
                        </div>
                        <div class="vaga-info-principal">
                            <h2 class="vaga-titulo">${vaga.titulo}</h2>
                            <p class="vaga-empresa">${vaga.empresa}</p>
                            <div class="vaga-localidade"><i class="fas fa-map-marker-alt"></i> ${localizacaoMap[vaga.localizacao] || vaga.localizacao}</div>
                        </div>
                        <button class="save-vaga-btn"><i class="far fa-bookmark"></i></button>
                    </div>
                    <div class="vaga-tags">
                        <span class="tag">${nivelMap[vaga.nivel] || vaga.nivel}</span>
                        <span class="tag">${tipoContratacaoMap[vaga.tipoContratacao] || vaga.tipoContratacao}</span>
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

        // -----------------------------------------------------------------
        // FUNÇÕES DE FILTRO (Específicas da Página)
        // -----------------------------------------------------------------
        function filterVagas() {
            const searchTerm = elements.searchInput.value.toLowerCase();
            const tipoValue = elements.filterTipo.value;
            const localValue = elements.filterLocal.value;
            const nivelValue = elements.filterNivel.value;
            const cards = document.querySelectorAll('.vaga-card');

            cards.forEach(card => {
                const titulo = card.querySelector('.vaga-titulo').textContent.toLowerCase();
                const empresa = card.querySelector('.vaga-empresa').textContent.toLowerCase();
                const descricao = card.querySelector('.vaga-descricao').textContent.toLowerCase();
                
                const tagsText = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent).join(' ');
                const localText = card.querySelector('.vaga-localidade').textContent;
                
                const matchSearch = titulo.includes(searchTerm) || empresa.includes(searchTerm) || descricao.includes(searchTerm);
                
                const matchTipo = tipoValue === 'todos' || tagsText.includes(tipoContratacaoMap[tipoValue]);
                const matchLocal = localValue === 'todos' || localText.includes(localizacaoMap[localValue]);
                const matchNivel = nivelValue === 'todos' || tagsText.includes(nivelMap[nivelValue]);

                if (matchSearch && matchTipo && matchLocal && matchNivel) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // -----------------------------------------------------------------
        // EVENT LISTENERS (Específicos da Página)
        // -----------------------------------------------------------------
        function setupVagasEventListeners() {
            if (elements.searchInput) elements.searchInput.addEventListener('input', filterVagas);
            if (elements.filterTipo) elements.filterTipo.addEventListener('change', filterVagas);
            if (elements.filterLocal) elements.filterLocal.addEventListener('change', filterVagas);
            if (elements.filterNivel) elements.filterNivel.addEventListener('change', filterVagas);
        }

        // -----------------------------------------------------------------
        // INICIALIZAÇÃO DA PÁGINA
        // -----------------------------------------------------------------
        if (currentUser) { 
            const userRoles = currentUser.tipoUsuario ? [currentUser.tipoUsuario] : [];
            if ((userRoles.includes('ADMIN') || userRoles.includes('PROFESSOR')) && elements.createAlertBtn) {
                elements.createAlertBtn.style.display = 'block';
            }
        }
        fetchVagas();
        setupVagasEventListeners();
    });
});