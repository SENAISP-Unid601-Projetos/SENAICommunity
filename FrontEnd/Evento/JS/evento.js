// evento.js - Substitua todo o conteúdo por este código
document.addEventListener('DOMContentLoaded', () => {
  const eventosGrid = document.querySelector('.eventos-grid');
  const meusEventosLista = document.getElementById('meus-eventos-lista');
  const searchInput = document.getElementById('search-input');
  const loadingOverlay = document.getElementById('loading-overlay');
  
  // Elementos do modal
  const eventoModal = document.getElementById('evento-modal');
  const eventoForm = document.getElementById('evento-form');
  const eventoIdInput = document.getElementById('evento-id');
  const eventoTituloInput = document.getElementById('evento-titulo');
  const eventoDescricaoInput = document.getElementById('evento-descricao');
  const eventoDataInput = document.getElementById('evento-data');
  const eventoHoraInput = document.getElementById('evento-hora');
  const eventoLocalInput = document.getElementById('evento-local');
  const eventoFormatoSelect = document.getElementById('evento-formato');
  const eventoCategoriaSelect = document.getElementById('evento-categoria');
  const eventoImagemInput = document.getElementById('evento-imagem');
  const salvarEventoBtn = document.getElementById('salvar-evento-btn');
  const cancelarEventoBtn = document.getElementById('cancelar-evento-btn');
  
  let eventos = [];
  let eventosInteressados = [];
  let isAdmin = false;

  // Inicialização
  async function init() {
    await checkUserRole();
    await loadEventos();
    setupEventListeners();
  }

  // Verificar se o usuário é admin
  async function checkUserRole() {
    try {
      const response = await axios.get(`${window.backendUrl}/usuarios/me`);
      isAdmin = response.data.tipoUsuario === 'ADMIN';
      
      // Mostrar botão de criar evento se for admin
      if (isAdmin) {
        const criarEventoBtn = document.createElement('button');
        criarEventoBtn.className = 'criar-evento-btn';
        criarEventoBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Evento';
        criarEventoBtn.addEventListener('click', () => openEventoModal());
        
        const eventosHeader = document.querySelector('.eventos-header');
        eventosHeader.appendChild(criarEventoBtn);
      }
    } catch (error) {
      console.error('Erro ao verificar role do usuário:', error);
    }
  }

  // Carregar eventos do backend
  async function loadEventos() {
    showLoading();
    try {
      const response = await axios.get(`${window.backendUrl}/api/eventos`);
      eventos = response.data;
      
      // Carregar eventos com interesse do usuário
      await loadEventosInteressados();
      
      renderEventos();
      updateMeusEventos();
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      showNotification('Erro ao carregar eventos', 'error');
    } finally {
      hideLoading();
    }
  }

  // Carregar eventos que o usuário tem interesse
  async function loadEventosInteressados() {
    try {
      // Esta é uma implementação simplificada - você precisará ajustar conforme sua API
      const userEvents = localStorage.getItem('eventosInteressados');
      eventosInteressados = userEvents ? JSON.parse(userEvents) : [];
    } catch (error) {
      console.error('Erro ao carregar eventos interessados:', error);
      eventosInteressados = [];
    }
  }

  // Salvar eventos com interesse do usuário
  async function saveEventosInteressados() {
    try {
      localStorage.setItem('eventosInteressados', JSON.stringify(eventosInteressados));
    } catch (error) {
      console.error('Erro ao salvar eventos interessados:', error);
    }
  }

  // Renderizar eventos no grid
  function renderEventos() {
    eventosGrid.innerHTML = '';
    
    if (eventos.length === 0) {
      eventosGrid.innerHTML = `
        <div class="no-events" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
          <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhum evento encontrado</h3>
          <p style="color: var(--text-secondary);">Não há eventos cadastrados no momento.</p>
        </div>
      `;
      return;
    }

    eventos.forEach(evento => {
      const card = createEventoCard(evento);
      eventosGrid.appendChild(card);
    });
  }

  // Criar card de evento
  function createEventoCard(evento) {
    const card = document.createElement('div');
    card.className = 'evento-card';
    card.dataset.id = evento.id;

    const dataEvento = new Date(evento.data);
    const dia = dataEvento.getDate();
    const mes = dataEvento.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    const isInteressado = eventosInteressados.includes(evento.id);

    let adminActions = '';
    if (isAdmin) {
      adminActions = `
        <div class="evento-admin-actions">
          <button class="evento-edit-btn" onclick="editEvento(${evento.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="evento-delete-btn" onclick="deleteEvento(${evento.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="evento-imagem" style="background-image: url('${evento.imagemCapaUrl || 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'}')">
        ${adminActions}
        <div class="evento-data">
          <span>${dia}</span>
          <span>${mes}</span>
        </div>
      </div>
      <div class="evento-conteudo">
        <span class="evento-categoria">${evento.categoria}</span>
        <h2 class="evento-titulo">${evento.nome}</h2>
        <div class="evento-detalhe"><i class="fas fa-clock"></i> ${formatarHora(dataEvento)}</div>
        <div class="evento-detalhe"><i class="fas fa-map-marker-alt"></i> ${evento.local} (${evento.formato})</div>
        ${!isAdmin ? `
          <button class="rsvp-btn ${isInteressado ? 'confirmed' : ''}" onclick="toggleInteresse(${evento.id})">
            <i class="fas ${isInteressado ? 'fa-check' : 'fa-calendar-plus'}"></i> 
            ${isInteressado ? 'Lembrete Ativo' : 'Definir Lembrete'}
          </button>
        ` : ''}
      </div>
    `;

    return card;
  }

  // Formatar hora
  function formatarHora(data) {
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Atualizar lista "Meus Eventos"
  function updateMeusEventos() {
    meusEventosLista.innerHTML = '';
    
    const eventosConfirmados = eventos.filter(evento => 
      eventosInteressados.includes(evento.id)
    );

    if (eventosConfirmados.length === 0) {
      meusEventosLista.innerHTML = '<p class="empty-message">Você ainda não definiu lembrete para nenhum evento.</p>';
      return;
    }

    eventosConfirmados.forEach(evento => {
      const dataEvento = new Date(evento.data);
      const dia = dataEvento.getDate();
      const mes = dataEvento.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      
      const item = document.createElement('div');
      item.className = 'evento-confirmado-item';
      item.innerHTML = `
        <div class="evento-data" style="position: static; padding: 0.3rem; background: var(--bg-tertiary);">
          <span>${dia}</span>
          <span>${mes}</span>
        </div>
        <span>${evento.nome}</span>
      `;
      meusEventosLista.appendChild(item);
    });
  }

  // Alternar interesse em evento
  async function toggleInteresse(eventoId) {
    try {
      const response = await axios.post(`${window.backendUrl}/api/eventos/${eventoId}/interesse`);
      
      const index = eventosInteressados.indexOf(eventoId);
      if (index > -1) {
        eventosInteressados.splice(index, 1);
        showNotification('Lembrete removido', 'info');
      } else {
        eventosInteressados.push(eventoId);
        showNotification('Lembrete definido com sucesso!', 'success');
      }
      
      await saveEventosInteressados();
      renderEventos();
      updateMeusEventos();
    } catch (error) {
      console.error('Erro ao alternar interesse:', error);
      showNotification('Erro ao definir lembrete', 'error');
    }
  }

  // Abrir modal para criar evento
  function openEventoModal(evento = null) {
    const modalTitulo = document.getElementById('evento-modal-titulo');
    
    if (evento) {
      modalTitulo.textContent = 'Editar Evento';
      eventoIdInput.value = evento.id;
      eventoTituloInput.value = evento.nome;
      eventoDescricaoInput.value = evento.descricao || '';
      eventoDataInput.value = formatDateTimeForInput(evento.data);
      eventoHoraInput.value = evento.hora || '';
      eventoLocalInput.value = evento.local;
      eventoFormatoSelect.value = evento.formato;
      eventoCategoriaSelect.value = evento.categoria;
      eventoImagemInput.value = evento.imagemCapaUrl || '';
    } else {
      modalTitulo.textContent = 'Criar Evento';
      eventoForm.reset();
      eventoIdInput.value = '';
    }
    
    eventoModal.style.display = 'flex';
  }

  // Formatar data para input datetime-local
  function formatDateTimeForInput(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toISOString().slice(0, 16);
  }

  // Salvar evento (criar ou editar)
  async function saveEvento() {
    const eventoData = {
      nome: eventoTituloInput.value,
      data: eventoDataInput.value,
      local: eventoLocalInput.value,
      formato: eventoFormatoSelect.value,
      categoria: eventoCategoriaSelect.value
    };

    if (eventoDescricaoInput.value) {
      eventoData.descricao = eventoDescricaoInput.value;
    }

    if (eventoHoraInput.value) {
      eventoData.hora = eventoHoraInput.value;
    }

    if (eventoImagemInput.value) {
      eventoData.imagemCapaUrl = eventoImagemInput.value;
    }

    try {
      showLoading();
      
      if (eventoIdInput.value) {
        // Editar evento existente
        await axios.put(`${window.backendUrl}/api/eventos/${eventoIdInput.value}`, eventoData);
        showNotification('Evento atualizado com sucesso!', 'success');
      } else {
        // Criar novo evento
        await axios.post(`${window.backendUrl}/api/eventos`, eventoData);
        showNotification('Evento criado com sucesso!', 'success');
      }
      
      eventoModal.style.display = 'none';
      await loadEventos();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      showNotification('Erro ao salvar evento', 'error');
    } finally {
      hideLoading();
    }
  }

  // Excluir evento
  async function deleteEvento(eventoId) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }

    try {
      showLoading();
      await axios.delete(`${window.backendUrl}/api/eventos/${eventoId}`);
      showNotification('Evento excluído com sucesso!', 'success');
      await loadEventos();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      showNotification('Erro ao excluir evento', 'error');
    } finally {
      hideLoading();
    }
  }

  // Aplicar filtros
  function applyFilters() {
    const periodo = document.getElementById('filter-periodo').value;
    const formato = document.getElementById('filter-formato').value;
    const categoria = document.getElementById('filter-categoria').value;
    const searchTerm = searchInput.value.toLowerCase();
    const hoje = new Date();
    
    let filteredEventos = eventos.filter(evento => {
      const dataEvento = new Date(evento.data);
      const hojeInicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      
      const periodoMatch = periodo === 'proximos' ? 
        dataEvento >= hojeInicioDoDia : 
        dataEvento < hojeInicioDoDia;
      
      const formatoMatch = formato === 'todos' || evento.formato === formato;
      const categoriaMatch = categoria === 'todos' || evento.categoria === categoria;
      const searchMatch = evento.nome.toLowerCase().includes(searchTerm);

      return periodoMatch && formatoMatch && categoriaMatch && searchMatch;
    });

    // Ordenar eventos
    filteredEventos.sort((a, b) => {
      const dataA = new Date(a.data);
      const dataB = new Date(b.data);
      
      if (periodo === 'proximos') {
        return dataA - dataB; // Mais próximos primeiro
      } else {
        return dataB - dataA; // Mais recentes primeiro
      }
    });

    // Renderizar eventos filtrados
    eventosGrid.innerHTML = '';
    if (filteredEventos.length === 0) {
      eventosGrid.innerHTML = `
        <div class="no-events" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
          <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhum evento encontrado</h3>
          <p style="color: var(--text-secondary);">Tente ajustar os filtros ou termos de pesquisa.</p>
        </div>
      `;
      return;
    }

    filteredEventos.forEach(evento => {
      const card = createEventoCard(evento);
      eventosGrid.appendChild(card);
    });
  }

  // Mostrar loading
  function showLoading() {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
  }

  // Esconder loading
  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Filtros
    document.getElementById('filter-periodo').addEventListener('change', applyFilters);
    document.getElementById('filter-formato').addEventListener('change', applyFilters);
    document.getElementById('filter-categoria').addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    // Modal
    salvarEventoBtn.addEventListener('click', saveEvento);
    cancelarEventoBtn.addEventListener('click', () => {
      eventoModal.style.display = 'none';
    });

    // Fechar modal ao clicar fora
    eventoModal.addEventListener('click', (e) => {
      if (e.target === eventoModal) {
        eventoModal.style.display = 'none';
      }
    });
  }

  // Funções globais para os botões
  window.editEvento = (eventoId) => {
    const evento = eventos.find(e => e.id === eventoId);
    if (evento) {
      openEventoModal(evento);
    }
  };

  window.deleteEvento = deleteEvento;
  window.toggleInteresse = toggleInteresse;
  window.openEventoModal = openEventoModal;

  // Inicializar
  init();
});