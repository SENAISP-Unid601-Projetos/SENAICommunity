// JavaScript para /Vaga/JS/vaga.js
document.addEventListener('DOMContentLoaded', () => {

  const vagasListContainer = document.querySelector('.vagas-list');

  // Simulação de dados de vagas que viriam de uma API
  const mockVagas = [
    {
      id: 1,
      titulo: "Desenvolvedor Front-End Pleno",
      empresa: "Tech Solutions Inc.",
      logo: "https://placehold.co/100x100/58a6ff/ffffff?text=TS",
      local: "Híbrido",
      cidade: "São Paulo, SP",
      nivel: "Pleno",
      tipo: "Tempo Integral",
      tags: ["React", "TypeScript", "Next.js"],
      descricao: "Estamos expandindo nosso time e buscamos um desenvolvedor Front-End com experiência para criar interfaces incríveis e responsivas para nossos clientes.",
      publicado: "há 1 dia"
    },
    {
      id: 2,
      titulo: "Estágio em Análise de Dados",
      empresa: "Inova Dev",
      logo: "https://placehold.co/100x100/f78166/ffffff?text=ID",
      local: "Remoto",
      cidade: "Brasil",
      nivel: "Júnior",
      tipo: "Estágio",
      tags: ["Python", "SQL", "Power BI"],
      descricao: "Oportunidade para estudantes que desejam iniciar a carreira em dados, aprendendo e aplicando técnicas de análise e visualização em projetos reais.",
      publicado: "há 3 dias"
    },
    {
      id: 3,
      titulo: "Engenheiro de Software Backend Sênior",
      empresa: "Code Masters",
      logo: "https://placehold.co/100x100/3fb950/ffffff?text=CM",
      local: "Presencial",
      cidade: "Campinas, SP",
      nivel: "Sênior",
      tipo: "Tempo Integral",
      tags: ["Java", "Spring Boot", "AWS"],
      descricao: "Procuramos um engenheiro experiente para liderar o desenvolvimento de microserviços escaláveis em nossa plataforma de nuvem.",
      publicado: "há 5 dias"
    },
     {
      id: 4,
      titulo: "UI/UX Designer Júnior",
      empresa: "Pixel Perfect",
      logo: "https://placehold.co/100x100/e060e0/ffffff?text=PP",
      local: "Remoto",
      cidade: "Brasil",
      nivel: "Júnior",
      tipo: "Meio Período",
      tags: ["Figma", "Design System", "User Research"],
      descricao: "Junte-se ao nosso time de design para criar experiências de usuário intuitivas e visualmente atraentes para aplicativos web e mobile.",
      publicado: "há 1 semana"
    }
  ];

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
            <img src="${vaga.logo}" alt="Logo da ${vaga.empresa}">
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

  // Função para aplicar os filtros
  function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const tipo = document.getElementById('filter-tipo').value;
    const local = document.getElementById('filter-local').value;
    const nivel = document.getElementById('filter-nivel').value;

    const filteredVagas = mockVagas.filter(vaga => {
      const searchMatch = vaga.titulo.toLowerCase().includes(searchTerm) ||
                          vaga.empresa.toLowerCase().includes(searchTerm) ||
                          vaga.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      const tipoMatch = tipo === 'todos' || vaga.tipo === tipo;
      const localMatch = local === 'todos' || vaga.local === local;
      const nivelMatch = nivel === 'todos' || vaga.nivel === nivel;

      return searchMatch && tipoMatch && localMatch && nivelMatch;
    });

    renderVagas(filteredVagas);
  }

  // Adiciona os event listeners aos inputs de filtro
  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('filter-tipo').addEventListener('change', applyFilters);
  document.getElementById('filter-local').addEventListener('change', applyFilters);
  document.getElementById('filter-nivel').addEventListener('change', applyFilters);

  // Renderiza as vagas iniciais ao carregar a página
  renderVagas(mockVagas);
});