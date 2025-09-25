// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {

  const EventosPage = {
      state: {
          eventos: [],
          confirmedEventIds: [],
          // Array com os caminhos das imagens locais
          localImages: [
              'img/evento1.jpg',
              'img/evento2.jpg',
              'img/evento3.jpg'
          ]
      },
      elements: {
          grid: document.querySelector('.eventos-grid'),
          meusEventosLista: document.getElementById('meus-eventos-lista'),
          searchInput: document.getElementById('search-input'),
          filterPeriodo: document.getElementById('filter-periodo'),
          filterFormato: document.getElementById('filter-formato'),
          filterCategoria: document.getElementById('filter-categoria')
      },
      api: {
          backendUrl: 'http://localhost:8080',
          jwtToken: localStorage.getItem('token'),
      },
      
      async fetchAndRenderEventos() {
          const { searchInput, filterPeriodo, filterFormato, filterCategoria } = this.elements;
          
          const params = new URLSearchParams({
              busca: searchInput.value,
              periodo: filterPeriodo.value,
              formato: filterFormato.value,
              categoria: filterCategoria.value
          }).toString();

          try {
              const response = await axios.get(`${this.api.backendUrl}/api/eventos?${params}`, {
                  headers: { 'Authorization': `Bearer ${this.api.jwtToken}` }
              });

              const sortedEventos = response.data.sort((a, b) => {
                  const dateA = new Date(a.data);
                  const dateB = new Date(b.data);
                  return filterPeriodo.value === 'proximos' ? dateA - dateB : dateB - dateA;
              });
              
              this.state.eventos = sortedEventos;
              this.render.eventosGrid();
              this.render.meusEventos();

          } catch (error) {
              console.error("Erro ao buscar eventos:", error);
              this.elements.grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1 / -1;">Não foi possível carregar os eventos.</p>';
          }
      },
      
      render: {
          eventosGrid() {
              const { grid } = EventosPage.elements;
              const { eventos, confirmedEventIds, localImages } = EventosPage.state;
              
              grid.innerHTML = '';
              if (eventos.length === 0) {
                  grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1 / -1;">Nenhum evento encontrado para os filtros selecionados.</p>';
                  return;
              }
              
              eventos.forEach((evento, index) => {
                  const data = new Date(evento.data);
                  const dia = data.getUTCDate(); // Usar getUTCDate para evitar problemas de fuso
                  const mes = data.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
                  const isConfirmed = confirmedEventIds.includes(evento.id);

                  // *** ALTERAÇÃO AQUI ***
                  // Seleciona uma imagem local de forma cíclica usando o índice do evento
                  const imagemCapa = localImages[index % localImages.length];

                  const card = document.createElement('div');
                  card.className = 'evento-card';
                  card.dataset.id = evento.id;
                  
                  card.innerHTML = `
                      <div class="evento-imagem" style="background-image: url('${imagemCapa}')">
                          <div class="evento-data">
                              <span>${dia}</span>
                              <span>${mes}</span>
                          </div>
                      </div>
                      <div class="evento-conteudo">
                          <span class="evento-categoria">${evento.categoria}</span>
                          <h2 class="evento-titulo">${evento.nome}</h2>
                          <div class="evento-detalhe"><i class="fas fa-clock"></i> ${evento.hora || 'Não definido'}</div>
                          <div class="evento-detalhe"><i class="fas fa-map-marker-alt"></i> ${evento.local} (${evento.formato})</div>
                          <button class="rsvp-btn ${isConfirmed ? 'confirmed' : ''}">
                              <i class="fas ${isConfirmed ? 'fa-check' : 'fa-calendar-plus'}"></i> 
                              ${isConfirmed ? 'Presença Confirmada' : 'Confirmar Presença'}
                          </button>
                      </div>
                  `;
                  grid.appendChild(card);
              });
          },
          meusEventos() {
              const { meusEventosLista } = EventosPage.elements;
              const { eventos, confirmedEventIds } = EventosPage.state;
              
              const eventosConfirmados = eventos.filter(e => confirmedEventIds.includes(e.id));
              meusEventosLista.innerHTML = '';

              if (eventosConfirmados.length === 0) {
                  meusEventosLista.innerHTML = '<p class="empty-message">Você ainda não confirmou presença em nenhum evento.</p>';
                  return;
              }

              eventosConfirmados.forEach(evento => {
                  const data = new Date(evento.data);
                  meusEventosLista.innerHTML += `
                      <div class="evento-confirmado-item">
                          <div class="evento-data" style="position: static; padding: 0.3rem; background: var(--bg-tertiary);">
                              <span>${data.getUTCDate()}</span>
                              <span>${data.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')}</span>
                          </div>
                          <span>${evento.nome}</span>
                      </div>
                  `;
              });
          }
      },

      handlers: {
          toggleRsvp(eventoId) {
              let confirmedIds = EventosPage.utils.getConfirmedEvents();
              const evento = EventosPage.state.eventos.find(ev => ev.id === eventoId);
              
              if (confirmedIds.includes(eventoId)) {
                  confirmedIds = confirmedIds.filter(id => id !== eventoId);
                   if (typeof showNotification === 'function') {
                      showNotification(`Presença em "${evento.nome}" cancelada.`, 'info');
                  }
              } else {
                  confirmedIds.push(eventoId);
                  if (typeof showNotification === 'function') {
                      showNotification(`Presença confirmada: ${evento.nome}`, 'success');
                  }
              }
              
              EventosPage.utils.saveConfirmedEvents(confirmedIds);
              EventosPage.state.confirmedEventIds = confirmedIds;
              
              EventosPage.render.eventosGrid();
              EventosPage.render.meusEventos();
          }
      },

      utils: {
          getConfirmedEvents() {
              const stored = localStorage.getItem('confirmedEvents');
              return stored ? JSON.parse(stored) : [];
          },
          saveConfirmedEvents(ids) {
              localStorage.setItem('confirmedEvents', JSON.stringify(ids));
          }
      },
      
      init() {
          if (!this.api.jwtToken) {
              window.location.href = 'login.html';
              return;
          }

          this.state.confirmedEventIds = this.utils.getConfirmedEvents();

          const { grid, searchInput, filterPeriodo, filterFormato, filterCategoria } = this.elements;

          grid.addEventListener('click', (e) => {
              const rsvpButton = e.target.closest('.rsvp-btn');
              if (rsvpButton) {
                  const card = rsvpButton.closest('.evento-card');
                  const eventoId = parseInt(card.dataset.id, 10);
                  this.handlers.toggleRsvp(eventoId);
              }
          });

          [searchInput, filterPeriodo, filterFormato, filterCategoria].forEach(el => {
              el.addEventListener('input', () => this.fetchAndRenderEventos());
              el.addEventListener('change', () => this.fetchAndRenderEventos());
          });

          this.fetchAndRenderEventos();
      }
  };

  EventosPage.init();
});