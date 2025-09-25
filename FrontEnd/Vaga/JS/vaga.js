// JavaScript para /Vaga/JS/vaga.js
document.addEventListener('DOMContentLoaded', () => {

  const vagasListContainer = document.querySelector('.vagas-list');
  const searchInput = document.getElementById('search-input');
  const filterTipo = document.getElementById('filter-tipo');
  const filterLocal = document.getElementById('filter-local');
  const filterNivel = document.getElementById('filter-nivel');

  const api = {
      backendUrl: 'http://localhost:8080',
      jwtToken: localStorage.getItem('token'),
  };

  // Função para buscar as vagas da API
  async function fetchVagas() {
      if (!api.jwtToken) {
          // Redireciona para o login se não houver token
          window.location.href = 'login.html';
          return;
      }

      try {
          const params = new URLSearchParams({
              busca: searchInput.value,
              tipo: filterTipo.value,
              local: filterLocal.value,
              nivel: filterNivel.value
          }).toString();

          const response = await axios.get(`${api.backendUrl}/api/vagas?${params}`, {
              headers: { 'Authorization': `Bearer ${api.jwtToken}` }
          });
          
          renderVagas(response.data);

      } catch (error) {
          console.error("Erro ao buscar vagas:", error);
          vagasListContainer.innerHTML = '<p class="sem-vagas">Não foi possível carregar as vagas. Tente novamente mais tarde.</p>';
      }
  }

  // Função para renderizar os cards de vagas
  function renderVagas(vagas) {
      vagasListContainer.innerHTML = ''; // Limpa a lista antes de renderizar

      if (vagas.length === 0) {
          vagasListContainer.innerHTML = '<p class="sem-vagas">Nenhuma vaga encontrada com os filtros selecionados.</p>';
          return;
      }

      vagas.forEach(vaga => {
          const vagaCard = document.createElement('div');
          vagaCard.className = 'vaga-card';
          vagaCard.innerHTML = `
              <div class="vaga-card-header">
                  <div class="vaga-empresa-logo">
                      <img src="${vaga.logoUrl}" alt="Logo da ${vaga.empresa}">
                  </div>
                  <div class="vaga-info-principal">
                      <h2 class="vaga-titulo">${vaga.titulo}</h2>
                      <p class="vaga-empresa">${vaga.empresa}</p>
                      <div class="vaga-localidade"><i class="fas fa-map-marker-alt"></i> ${vaga.cidade} (${vaga.local})</div>
                  </div>
                  <button class="save-vaga-btn"><i class="far fa-bookmark"></i></button>
              </div>
              <div class="vaga-tags">
                  <span class="tag">${vaga.nivel}</span>
                  <span class="tag">${vaga.tipo}</span>
                  ${vaga.tags.map(tag => `<span class="tag tag-tecnologia">${tag}</span>`).join('')}
              </div>
              <div class="vaga-descricao">${vaga.descricao}</div>
              <div class="vaga-card-footer">
                  <span class="vaga-publicado">Publicado ${vaga.publicado}</span>
                  <button class="vaga-candidatar-btn">Ver Detalhes</button>
              </div>
          `;
          vagasListContainer.appendChild(vagaCard);
      });
  }

  // Adiciona os event listeners aos inputs de filtro
  searchInput.addEventListener('input', fetchVagas);
  filterTipo.addEventListener('change', fetchVagas);
  filterLocal.addEventListener('change', fetchVagas);
  filterNivel.addEventListener('change', fetchVagas);

  // Renderiza as vagas iniciais ao carregar a página
  fetchVagas();
});