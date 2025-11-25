// evento.js - Código completo e funcional (Versão Final)
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar a inicialização global do principal.js
  if (!window.currentUser) {
    document.addEventListener('globalScriptsLoaded', () => {
      initEventos();
      initResponsiveFeatures(); // Inicia funcionalidades mobile
    });
  } else {
    initEventos();
    initResponsiveFeatures(); // Inicia funcionalidades mobile
  }
});

// --- FUNÇÃO: Gerencia a Responsividade (Menu Mobile) ---
function initResponsiveFeatures() {
  const elements = {
      mobileMenuBtn: document.getElementById('mobile-menu-btn'),
      sidebar: document.getElementById('sidebar'),
      sidebarClose: document.getElementById('sidebar-close'),
      mobileOverlay: document.getElementById('mobile-overlay')
  };

  function toggleMobileMenu() {
      if(elements.sidebar) {
          elements.sidebar.classList.toggle('active');
          
          if(elements.mobileOverlay) {
              elements.mobileOverlay.classList.toggle('active');
          }
          
          document.body.style.overflow = elements.sidebar.classList.contains('active') ? 'hidden' : '';
      }
  }

  if (elements.mobileMenuBtn) elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  if (elements.sidebarClose) elements.sidebarClose.addEventListener('click', toggleMobileMenu);
  if (elements.mobileOverlay) elements.mobileOverlay.addEventListener('click', toggleMobileMenu);

  const menuLinks = document.querySelectorAll('.menu a');
  menuLinks.forEach(link => {
      link.addEventListener('click', () => {
          if (window.innerWidth <= 1024 && elements.sidebar.classList.contains('active')) {
              toggleMobileMenu();
          }
      });
  });

  window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && elements.sidebar) {
          elements.sidebar.classList.remove('active');
          if(elements.mobileOverlay) elements.mobileOverlay.classList.remove('active');
          document.body.style.overflow = '';
      }
  });
}

// --- FUNÇÃO PRINCIPAL DE EVENTOS ---
async function initEventos() {
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
  
  // Inputs de Data e Hora
  const eventoDataInput = document.getElementById('evento-data');
  const eventoHoraInicioInput = document.getElementById('evento-hora-inicio');
  const eventoHoraFimInput = document.getElementById('evento-hora-fim');
  
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
    updateSidebarUserInfo(); // Sidebar do usuário
    await loadEventos();
    setupEventListeners();
  }

  // Verificar se o usuário é admin
  async function checkUserRole() {
    try {
      isAdmin = window.currentUser && window.currentUser.tipoUsuario === 'ADMIN';
      
      if (isAdmin) {
        const criarEventoBtn = document.createElement('button');
        criarEventoBtn.className = 'criar-evento-btn';
        criarEventoBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Evento';
        criarEventoBtn.addEventListener('click', () => openEventoModal());
        
        const eventosHeader = document.querySelector('.eventos-header');
        if (eventosHeader) {
            eventosHeader.appendChild(criarEventoBtn);
        }
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
      const response = await axios.get(`${window.backendUrl}/api/eventos/meus-eventos`);
      eventosInteressados = response.data.map(evento => evento.id);
    } catch (error) {
      console.error('Erro ao carregar eventos interessados:', error);
      eventosInteressados = [];
    }
  }

  // Renderizar eventos no grid
  function renderEventos() {
    if (!eventosGrid) return;
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

    // CORREÇÃO DE FUSO HORÁRIO E DATA
    // Parse manual da data para evitar UTC shift (Bug das 21h)
    let dia = '--', mes = '---';
    if(evento.data) {
        const [anoStr, mesStr, diaStr] = evento.data.split('-');
        const dataObj = new Date(anoStr, mesStr - 1, diaStr);
        dia = diaStr;
        mes = dataObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    }

    // FORMATAÇÃO DE HORÁRIOS
    // Pega HH:mm (5 chars) ignorando segundos
    const horaInicio = evento.horaInicio ? evento.horaInicio.substring(0, 5) : '--:--';
    const horaFim = evento.horaFim ? evento.horaFim.substring(0, 5) : '--:--';

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
        
        <div class="evento-detalhe">
             <i class="fas fa-clock"></i> ${horaInicio} - ${horaFim}
        </div>
        
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

  // Atualizar lista "Meus Eventos"
  function updateMeusEventos() {
    if (!meusEventosLista) return;
    meusEventosLista.innerHTML = '';
    
    const eventosConfirmados = eventos.filter(evento => 
      eventosInteressados.includes(evento.id)
    );

    if (eventosConfirmados.length === 0) {
      meusEventosLista.innerHTML = '<p class="empty-message">Você ainda não definiu lembrete para nenhum evento.</p>';
      return;
    }

    eventosConfirmados.forEach(evento => {
      // Parse manual da data para o sidebar também
      let dia = '--', mes = '---';
      if(evento.data) {
        const [anoStr, mesStr, diaStr] = evento.data.split('-');
        const dataObj = new Date(anoStr, mesStr - 1, diaStr);
        dia = diaStr;
        mes = dataObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      }
      
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
      
      renderEventos();
      updateMeusEventos();
    } catch (error) {
      console.error('Erro ao alternar interesse:', error);
      showNotification('Erro ao definir lembrete', 'error');
    }
  }

  // Abrir modal para criar/editar evento
  function openEventoModal(evento = null) {
    const modalTitulo = document.getElementById('evento-modal-titulo');
    const previewContainer = document.getElementById('preview-container');
    const previewImg = document.getElementById('evento-imagem-preview');

    // 1. LIMPEZA DO INPUT DE ARQUIVO (Correção InvalidStateError)
    if(eventoImagemInput) eventoImagemInput.value = '';

    if (evento) {
      // --- MODO EDIÇÃO ---
      modalTitulo.textContent = 'Editar Evento';
      eventoIdInput.value = evento.id;
      eventoTituloInput.value = evento.nome;
      if(eventoDescricaoInput) eventoDescricaoInput.value = evento.descricao || '';
      
      // Data vem como YYYY-MM-DD do backend
      eventoDataInput.value = evento.data; 
      
      // Horários (Pega HH:mm do HH:mm:ss)
      eventoHoraInicioInput.value = evento.horaInicio ? evento.horaInicio.substring(0, 5) : '';
      eventoHoraFimInput.value = evento.horaFim ? evento.horaFim.substring(0, 5) : '';
      
      eventoLocalInput.value = evento.local;
      eventoFormatoSelect.value = evento.formato; 
      eventoCategoriaSelect.value = evento.categoria;

      // 2. PREVIEW DA IMAGEM
      if (evento.imagemCapaUrl && previewContainer && previewImg) {
          previewImg.src = evento.imagemCapaUrl;
          previewContainer.style.display = 'block';
      } else if (previewContainer) {
          previewContainer.style.display = 'none';
      }

    } else {
      // --- MODO CRIAÇÃO ---
      modalTitulo.textContent = 'Criar Evento';
      eventoForm.reset();
      eventoIdInput.value = '';
      
      // Reseta preview
      if (previewContainer) previewContainer.style.display = 'none';
      if (previewImg) previewImg.src = '';
    }
    
    eventoModal.style.display = 'flex';
  }

  // SALVAR EVENTO (Create ou Update)
  async function saveEvento() {
    // 1. Coleta e Normaliza os dados
    const normalizeEnum = (valor) => valor ? valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';

    const eventoData = {
      nome: eventoTituloInput.value,
      descricao: eventoDescricaoInput.value, // <--- ADICIONADO AQUI
      data: eventoDataInput.value,
      horaInicio: eventoHoraInicioInput.value.length === 5 ? eventoHoraInicioInput.value + ':00' : eventoHoraInicioInput.value,
      horaFim: eventoHoraFimInput.value.length === 5 ? eventoHoraFimInput.value + ':00' : eventoHoraFimInput.value,
      local: eventoLocalInput.value,
      formato: normalizeEnum(eventoFormatoSelect.value),
      categoria: normalizeEnum(eventoCategoriaSelect.value)
    };
    
    // Validação básica (Adicionei descrição se for obrigatória no banco)
    if (!eventoData.nome || !eventoData.data || !eventoData.horaInicio || !eventoData.horaFim || !eventoData.descricao) {
        showNotification('Preencha todos os campos obrigatórios, incluindo a descrição.', 'info');
        return;
    }

    const formData = new FormData();
    formData.append('evento', new Blob([JSON.stringify(eventoData)], { type: 'application/json' }));

    if (eventoImagemInput.files && eventoImagemInput.files[0]) {
      formData.append('imagem', eventoImagemInput.files[0]);
    }

    try {
      showLoading();
      if (eventoIdInput.value) {
        await axios.put(`${window.backendUrl}/api/eventos/${eventoIdInput.value}`, formData);
        showNotification('Evento atualizado!', 'success');
      } else {
        await axios.post(`${window.backendUrl}/api/eventos`, formData);
        showNotification('Evento criado!', 'success');
      }
      eventoModal.style.display = 'none';
      await loadEventos();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Erro ao salvar.';
      showNotification(msg, 'error');
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
      // Parse manual para filtro também
      let dataEvento = new Date();
      if(evento.data) {
          const [ano, mes, dia] = evento.data.split('-');
          dataEvento = new Date(ano, mes - 1, dia);
      }

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
        return dataA - dataB; 
      } else {
        return dataB - dataA; 
      }
    });

    // Renderizar
    if (!eventosGrid) return;
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
    if(searchInput) searchInput.addEventListener('input', applyFilters);

    // Modal
    if(salvarEventoBtn) salvarEventoBtn.addEventListener('click', saveEvento);
    if(cancelarEventoBtn) cancelarEventoBtn.addEventListener('click', () => {
      eventoModal.style.display = 'none';
    });

    // Fechar modal ao clicar fora
    if(eventoModal) {
        eventoModal.addEventListener('click', (e) => {
        if (e.target === eventoModal) {
            eventoModal.style.display = 'none';
        }
        });
    }

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && eventoModal && eventoModal.style.display === 'flex') {
        eventoModal.style.display = 'none';
      }
    });
  }

  // Funções globais para os botões (onClick no HTML)
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
}

// --- FUNÇÃO AUXILIAR: Sidebar do Usuário ---
function updateSidebarUserInfo() {
    // 1. Seleciona o container que possui o spinner
    const userInfoContainer = document.querySelector('.user-info');

    if (window.currentUser) {
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarTitle = document.getElementById('sidebar-user-title');
        const sidebarImg = document.getElementById('sidebar-user-img');
        
        if(sidebarName) sidebarName.textContent = window.currentUser.nome;
        if(sidebarTitle) sidebarTitle.textContent = window.currentUser.cargo || 'Membro'; 
        
        if(sidebarImg && window.currentUser.fotoPerfil) {
             if(typeof window.getAvatarUrl === 'function') {
                 sidebarImg.src = window.getAvatarUrl(window.currentUser.fotoPerfil);
             } else {
                 sidebarImg.src = window.currentUser.fotoPerfil;
             }
        }

        // 2. CORREÇÃO: Adiciona a classe 'loaded' para esconder o spinner
        if (userInfoContainer) {
            userInfoContainer.classList.add('loaded');
        }
    }
}