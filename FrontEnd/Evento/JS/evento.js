// JavaScript para /Eventos/JS/eventos.js
document.addEventListener('DOMContentLoaded', () => {

  const eventosGrid = document.querySelector('.eventos-grid');
  const meusEventosLista = document.getElementById('meus-eventos-lista');
  const hoje = new Date(); // Usado para o filtro de eventos passados/futuros

  // Simulação de dados de eventos (LISTA ATUALIZADA E EXPANDIDA)
  const mockEventos = [
    // --- EVENTOS FUTUROS (DEPOIS DE 06/06/2025) ---
    {
      id: 5,
      titulo: "Semana da Cibersegurança: Defenda-se no Mundo Digital",
      imagem: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 5, 9), // 09 de Junho de 2025
      hora: "19:00 - 21:00 (dias 9 a 13)",
      local: "Online e Laboratório 5",
      formato: "Híbrido",
      categoria: "Tecnologia",
      confirmado: false
    },
    {
      id: 2,
      titulo: "Workshop de Design de APIs com Node.js",
      imagem: "https://images.unsplash.com/photo-1521185496955-15097b20c5fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 6, 15), // 15 de Julho de 2025
      hora: "19:00 - 22:00",
      local: "Plataforma Zoom",
      formato: "Online",
      categoria: "Tecnologia",
      confirmado: true // Deixei um como confirmado para exemplo
    },
    {
      id: 6,
      titulo: "Workshop: Construindo seu Portfólio de Desenvolvedor",
      imagem: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 6, 12), // 12 de Julho de 2025
      hora: "10:00 - 13:00",
      local: "YouTube Live",
      formato: "Online",
      categoria: "Carreira",
      confirmado: false
    },
     {
      id: 7,
      titulo: "Introdução à Cloud com AWS e Azure",
      imagem: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 5, 28), // 28 de Junho de 2025
      hora: "14:00 - 18:00",
      local: "Plataforma Teams",
      formato: "Online",
      categoria: "Tecnologia",
      confirmado: false
    },
    {
      id: 3,
      titulo: "Feira de Carreiras Tech 2025",
      imagem: "https://images.unsplash.com/photo-1556761175-b413da4baf72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 7, 5), // 05 de Agosto de 2025
      hora: "10:00 - 17:00",
      local: "Ginásio de Esportes",
      formato: "Presencial",
      categoria: "Carreira",
      confirmado: false
    },
    {
      id: 8,
      titulo: "SENAI Games: Torneio de E-Sports",
      imagem: "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 7, 22), // 22 de Agosto de 2025
      hora: "Dia todo",
      local: "Arena Gamer SENAI",
      formato: "Presencial",
      categoria: "Competição",
      confirmado: false
    },
    {
      id: 1,
      titulo: "Hackathon de Inteligência Artificial",
imagem: "https://www.aen.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2024-09/hackathon_copel_11_0.jpg",      data: new Date(2025, 5, 20), // 20 de Junho de 2025
      hora: "09:00 - 18:00 (dois dias)",
      local: "Auditório Principal SENAI",
      formato: "Presencial",
      categoria: "Competição",
      confirmado: false
    },
    
    // --- EVENTOS PASSADOS (ANTES DE 06/06/2025) ---
    {
      id: 4,
      titulo: "Palestra: O Futuro da Computação Quântica",
      imagem: "https://images.unsplash.com/photo-1635070045091-d3a3f5a0e9aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 5, 1), // 01 de Junho de 2025 (passado)
      hora: "20:00",
      local: "YouTube Live",
      formato: "Online",
      categoria: "Inovação",
      confirmado: false
    },
    {
      id: 9,
      titulo: "Painel: Indústria 4.0 e o Papel do Técnico",
      imagem: "https://images.unsplash.com/photo-1581092921462-63f1c11d95ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 4, 29), // 29 de Maio de 2025 (passado)
      hora: "19:30",
      local: "Teatro SENAI",
      formato: "Híbrido",
      categoria: "Inovação",
      confirmado: false
    },
    {
      id: 10,
      titulo: "Workshop: Como Brilhar no LinkedIn",
      imagem: "https://images.unsplash.com/photo-1611944212129-29955ae402c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 4, 20), // 20 de Maio de 2025 (passado)
      hora: "19:00 - 21:00",
      local: "Plataforma Zoom",
      formato: "Online",
      categoria: "Carreira",
      confirmado: false
    },
     {
      id: 11,
      titulo: "Bootcamp: Python para Análise de Dados",
      imagem: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      data: new Date(2025, 4, 15), // 15 de Maio de 2025 (passado)
      hora: "18:30 - 22:30",
      local: "Laboratório 3",
      formato: "Presencial",
      categoria: "Tecnologia",
      confirmado: false
    }
  ];
  
  // Função para renderizar os eventos no grid
  function renderEventos(eventos) {
    eventosGrid.innerHTML = '';
    if (eventos.length === 0) {
      eventosGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1 / -1;">Nenhum evento encontrado para os filtros selecionados.</p>';
      return;
    }
    eventos.forEach(evento => {
      const dia = evento.data.getDate();
      const mes = evento.data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      const isConfirmed = evento.confirmado;
      
      const card = document.createElement('div');
      card.className = 'evento-card';
      card.dataset.id = evento.id;
      card.innerHTML = `
        <div class="evento-imagem" style="background-image: url('${evento.imagem}')">
          <div class="evento-data">
            <span>${dia}</span>
            <span>${mes}</span>
          </div>
        </div>
        <div class="evento-conteudo">
          <span class="evento-categoria">${evento.categoria}</span>
          <h2 class="evento-titulo">${evento.titulo}</h2>
          <div class="evento-detalhe"><i class="fas fa-clock"></i> ${evento.hora}</div>
          <div class="evento-detalhe"><i class="fas fa-map-marker-alt"></i> ${evento.local} (${evento.formato})</div>
          <button class="rsvp-btn ${isConfirmed ? 'confirmed' : ''}">
            <i class="fas ${isConfirmed ? 'fa-check' : 'fa-calendar-plus'}"></i> 
            ${isConfirmed ? 'Presença Confirmada' : 'Confirmar Presença'}
          </button>
        </div>
      `;
      eventosGrid.appendChild(card);
    });
  }

  // Função para atualizar a lista "Meus Eventos"
  function updateMeusEventos() {
    const eventosConfirmados = mockEventos.filter(e => e.confirmado);
    meusEventosLista.innerHTML = '';
    if (eventosConfirmados.length === 0) {
        meusEventosLista.innerHTML = '<p class="empty-message">Você ainda não confirmou presença em nenhum evento.</p>';
        return;
    }
    eventosConfirmados.forEach(evento => {
        meusEventosLista.innerHTML += `
            <div class="evento-confirmado-item">
                <div class="evento-data" style="position: static; padding: 0.3rem; background: var(--bg-tertiary);">
                    <span>${evento.data.getDate()}</span>
                    <span>${evento.data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                </div>
                <span>${evento.titulo}</span>
            </div>
        `;
    });
  }

  // Função para aplicar filtros
  function applyFilters() {
    const periodo = document.getElementById('filter-periodo').value;
    const formato = document.getElementById('filter-formato').value;
    const categoria = document.getElementById('filter-categoria').value;
    
    let filteredEventos = mockEventos.filter(evento => {
      // Normaliza 'hoje' para o início do dia para uma comparação justa
      const hojeInicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      
      const periodoMatch = periodo === 'proximos' ? evento.data >= hojeInicioDoDia : evento.data < hojeInicioDoDia;
      const formatoMatch = formato === 'todos' || evento.formato === formato;
      const categoriaMatch = categoria === 'todos' || evento.categoria === categoria;
      return periodoMatch && formatoMatch && categoriaMatch;
    });

    // Ordena os eventos por data
    filteredEventos.sort((a, b) => {
        if(periodo === 'proximos') {
            return a.data - b.data; // mais próximos primeiro
        } else {
            return b.data - a.data; // mais recentes (passados) primeiro
        }
    });

    renderEventos(filteredEventos);
  }

  // Delegação de evento para os botões de RSVP
  eventosGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('rsvp-btn')) {
      const card = e.target.closest('.evento-card');
      const eventoId = parseInt(card.dataset.id);
      
      const evento = mockEventos.find(ev => ev.id === eventoId);
      if (evento) {
        evento.confirmado = !evento.confirmado;
        // Usar a função de notificação global do principal.js
        if(typeof showNotification === 'function'){
          showNotification(evento.confirmado ? `Presença confirmada: ${evento.titulo}` : 'Presença cancelada.', evento.confirmado ? 'success' : 'info');
        }
        applyFilters(); 
        updateMeusEventos();
      }
    }
  });

  // Adiciona event listeners aos filtros
  document.getElementById('filter-periodo').addEventListener('change', applyFilters);
  document.getElementById('filter-formato').addEventListener('change', applyFilters);
  document.getElementById('filter-categoria').addEventListener('change', applyFilters);

  // Inicialização
  applyFilters();
  updateMeusEventos();
});