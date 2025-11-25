// evento.js - Código completo e funcional com Modal de Detalhes
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar a inicialização global do principal.js
  if (!window.currentUser) {
    document.addEventListener('globalScriptsLoaded', () => {
      initEventos();
      initResponsiveFeatures();
    });
  } else {
    initEventos();
    initResponsiveFeatures();
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
  
  // Elementos do modal de criação/edição
  const eventoModal = document.getElementById('evento-modal');
  const eventoForm = document.getElementById('evento-form');
  const eventoIdInput = document.getElementById('evento-id');
  const eventoTituloInput = document.getElementById('evento-titulo');
  const eventoDescricaoInput = document.getElementById('evento-descricao');
  const eventoDataInput = document.getElementById('evento-data');
  const eventoHoraInicioInput = document.getElementById('evento-hora-inicio');
  const eventoHoraFimInput = document.getElementById('evento-hora-fim');
  const eventoLocalInput = document.getElementById('evento-local');
  const eventoFormatoSelect = document.getElementById('evento-formato');
  const eventoCategoriaSelect = document.getElementById('evento-categoria');
  const eventoImagemInput = document.getElementById('evento-imagem');
  const salvarEventoBtn = document.getElementById('salvar-evento-btn');
  const cancelEventoBtn = document.getElementById('cancel-evento-btn');
  
  // Elementos do modal de detalhes
  const eventoDetailsModal = document.getElementById('evento-details-modal');
  const closeEventoDetailsBtn = document.getElementById('close-evento-details-btn');
  const saveEventoDetailsBtn = document.getElementById('save-evento-details-btn');
  const rsvpEventoDetailsBtn = document.getElementById('rsvp-evento-details-btn');
  const contactEventoBtn = document.getElementById('contact-evento-btn');

  let eventos = [];
  let eventosInteressados = [];
  let isAdmin = false;

  // Inicialização
  async function init() {
    await checkUserRole();
    updateSidebarUserInfo();
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

    // Parse manual da data para evitar UTC shift
    let dia = '--', mes = '---';
    if(evento.data) {
        const [anoStr, mesStr, diaStr] = evento.data.split('-');
        const dataObj = new Date(anoStr, mesStr - 1, diaStr);
        dia = diaStr;
        mes = dataObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    }

    // Formatação de horários
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

    // Tornar o card clicável para abrir o modal de detalhes
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Não abrir modal se clicar nos botões de admin ou RSVP
      if (!e.target.closest('.evento-admin-actions') && !e.target.closest('.rsvp-btn')) {
        openEventoDetailsModal(evento);
      }
    });

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

  // --- FUNÇÕES DO MODAL DE DETALHES ---

  // Abrir modal de detalhes do evento
  function openEventoDetailsModal(evento) {
    // Mapeamento de meses
    const meses = {
      '01': 'JAN', '02': 'FEV', '03': 'MAR', '04': 'ABR', '05': 'MAI', '06': 'JUN',
      '07': 'JUL', '08': 'AGO', '09': 'SET', '10': 'OUT', '11': 'NOV', '12': 'DEZ'
    };

    // Parse da data
    let dia = '--', mes = '---', dataFormatada = '--/--/----';
    if(evento.data) {
      const [anoStr, mesStr, diaStr] = evento.data.split('-');
      const dataObj = new Date(anoStr, mesStr - 1, diaStr);
      dia = diaStr;
      mes = meses[mesStr] || '---';
      dataFormatada = dataObj.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    }

    // Horários
    const horaInicio = evento.horaInicio ? evento.horaInicio.substring(0, 5) : '--:--';
    const horaFim = evento.horaFim ? evento.horaFim.substring(0, 5) : '--:--';

    // Preencher dados do modal
    document.getElementById('details-evento-day').textContent = dia;
    document.getElementById('details-evento-month').textContent = mes;
    document.getElementById('details-evento-categoria').textContent = evento.categoria;
    document.getElementById('details-evento-titulo').textContent = evento.nome;
    document.getElementById('details-evento-empresa').textContent = 'SENAI Community';
    document.getElementById('details-evento-data').textContent = dataFormatada;
    document.getElementById('details-evento-horario').textContent = `${horaInicio} - ${horaFim}`;
    document.getElementById('details-evento-local').textContent = evento.local;
    document.getElementById('details-evento-formato').textContent = evento.formato;
    
    // Descrição
    const descricaoElement = document.getElementById('details-evento-descricao');
    descricaoElement.textContent = evento.descricao || 'Este evento oferece uma oportunidade única de aprendizado e networking para profissionais e estudantes da área.';

    // Imagem
    const imageElement = document.getElementById('details-evento-image');
    imageElement.style.backgroundImage = `url('${evento.imagemCapaUrl || 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'}')`;

    // Gerar tópicos baseados na categoria
    generateEventoTopics(evento);
    
    // Gerar público-alvo
    generatePublicoAlvo(evento);
    
    // Organizador
    document.getElementById('details-evento-organizador-nome').textContent = 'Equipe SENAI';
    document.getElementById('details-evento-organizador-email').textContent = 'eventos@senai.com';
    
    // Estatísticas
    document.getElementById('details-evento-interessados').textContent = evento.numeroInteressados || '0';

    // Configurar botões de ação
    const isInteressado = eventosInteressados.includes(evento.id);
    setupActionButtons(evento.id, isInteressado);

    // Mostrar modal
    eventoDetailsModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  // Fechar modal de detalhes
  function closeEventoDetailsModal() {
    eventoDetailsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // Gerar tópicos do evento
  function generateEventoTopics(evento) {
    const topicsList = document.getElementById('details-evento-topics');
    topicsList.innerHTML = '';

    const topicsBase = {
      'Tecnologia': [
        'Desenvolvimento de aplicações modernas',
        'Tendências do mercado tech',
        'Ferramentas e frameworks atualizados',
        'Boas práticas de programação',
        'Networking com profissionais'
      ],
      'Carreira': [
        'Oportunidades de crescimento',
        'Desenvolvimento de soft skills',
        'Networking estratégico',
        'Preparação para o mercado',
        'Mentoria e orientação'
      ],
      'Inovação': [
        'Metodologias ágeis e criativas',
        'Cases de sucesso',
        'Ferramentas de inovação',
        'Mindset empreendedor',
        'Tendências do futuro'
      ],
      'Competição': [
        'Desafios práticos',
        'Avaliação de especialistas',
        'Premiações e reconhecimento',
        'Networking competitivo',
        'Desenvolvimento técnico'
      ]
    };

    const topics = topicsBase[evento.categoria] || [
      'Aprendizado prático',
      'Networking profissional',
      'Desenvolvimento de skills',
      'Oportunidades de carreira',
      'Experiência enriquecedora'
    ];

    topics.forEach(topic => {
      const li = document.createElement('li');
      li.textContent = topic;
      topicsList.appendChild(li);
    });
  }

  // Gerar público-alvo
  function generatePublicoAlvo(evento) {
    const publicoElement = document.getElementById('details-evento-publico');
    publicoElement.innerHTML = '';

    const publicoBase = {
      'Tecnologia': ['Desenvolvedores', 'Estudantes de TI', 'Product Managers', 'UX/UI Designers'],
      'Carreira': ['Profissionais Júnior', 'Estudantes', 'Career Changers', 'Líderes'],
      'Inovação': ['Empreendedores', 'Innovators', 'Gestores', 'Design Thinkers'],
      'Competição': ['Competidores', 'Estudantes', 'Profissionais', 'Hackers']
    };

    const publico = publicoBase[evento.categoria] || ['Profissionais', 'Estudantes', 'Interessados'];

    publico.forEach(item => {
      const tag = document.createElement('span');
      tag.className = 'publico-alvo-tag';
      tag.textContent = item;
      publicoElement.appendChild(tag);
    });
  }

  // Configurar botões de ação
  function setupActionButtons(eventoId, isInteressado) {
    // Botão de lembrete
    if (rsvpEventoDetailsBtn) {
      if (isInteressado) {
        rsvpEventoDetailsBtn.innerHTML = '<i class="fas fa-check"></i> Lembrete Ativo';
        rsvpEventoDetailsBtn.classList.add('confirmed');
      } else {
        rsvpEventoDetailsBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Definir Lembrete';
        rsvpEventoDetailsBtn.classList.remove('confirmed');
      }
      
      // Remover event listeners anteriores
      rsvpEventoDetailsBtn.replaceWith(rsvpEventoDetailsBtn.cloneNode(true));
      const newRsvpBtn = document.getElementById('rsvp-evento-details-btn');
      
      newRsvpBtn.addEventListener('click', () => {
        toggleInteresse(eventoId);
        closeEventoDetailsModal();
      });
    }

    // Botão salvar
    if (saveEventoDetailsBtn) {
      saveEventoDetailsBtn.replaceWith(saveEventoDetailsBtn.cloneNode(true));
      const newSaveBtn = document.getElementById('save-evento-details-btn');
      
      newSaveBtn.addEventListener('click', () => {
        handleSaveEvento(eventoId);
      });
    }

    // Botão de contato
    if (contactEventoBtn) {
      contactEventoBtn.href = `mailto:eventos@senai.com?subject=Dúvida sobre: ${document.getElementById('details-evento-titulo').textContent}`;
    }
  }

  // Salvar evento (favoritar)
  function handleSaveEvento(eventoId) {
    showNotification('Evento salvo nos seus favoritos!', 'success');
    if (saveEventoDetailsBtn) {
      saveEventoDetailsBtn.innerHTML = '<i class="fas fa-bookmark"></i> Salvo';
      saveEventoDetailsBtn.classList.add('saved');
      saveEventoDetailsBtn.disabled = true;
    }
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

    // Limpeza do input de arquivo
    if(eventoImagemInput) eventoImagemInput.value = '';

    if (evento) {
      // Modo edição
      modalTitulo.textContent = 'Editar Evento';
      eventoIdInput.value = evento.id;
      eventoTituloInput.value = evento.nome;
      if(eventoDescricaoInput) eventoDescricaoInput.value = evento.descricao || '';
      
      // Data vem como YYYY-MM-DD do backend
      eventoDataInput.value = evento.data; 
      
      // Horários
      eventoHoraInicioInput.value = evento.horaInicio ? evento.horaInicio.substring(0, 5) : '';
      eventoHoraFimInput.value = evento.horaFim ? evento.horaFim.substring(0, 5) : '';
      
      eventoLocalInput.value = evento.local;
      eventoFormatoSelect.value = evento.formato; 
      eventoCategoriaSelect.value = evento.categoria;

      // Preview da imagem
      if (evento.imagemCapaUrl && previewContainer && previewImg) {
          previewImg.src = evento.imagemCapaUrl;
          previewContainer.style.display = 'block';
      } else if (previewContainer) {
          previewContainer.style.display = 'none';
      }

    } else {
      // Modo criação
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
    // Coleta e Normaliza os dados
    const normalizeEnum = (valor) => valor ? valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';

    const eventoData = {
      nome: eventoTituloInput.value,
      descricao: eventoDescricaoInput.value,
      data: eventoDataInput.value,
      horaInicio: eventoHoraInicioInput.value.length === 5 ? eventoHoraInicioInput.value + ':00' : eventoHoraInicioInput.value,
      horaFim: eventoHoraFimInput.value.length === 5 ? eventoHoraFimInput.value + ':00' : eventoHoraFimInput.value,
      local: eventoLocalInput.value,
      formato: normalizeEnum(eventoFormatoSelect.value),
      categoria: normalizeEnum(eventoCategoriaSelect.value)
    };
    
    // Validação básica
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

    // Modal de criação/edição
    if(salvarEventoBtn) salvarEventoBtn.addEventListener('click', saveEvento);
    if(cancelEventoBtn) cancelEventoBtn.addEventListener('click', () => {
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

    // Modal de detalhes
    if (closeEventoDetailsBtn) {
      closeEventoDetailsBtn.addEventListener('click', closeEventoDetailsModal);
    }

    if (eventoDetailsModal) {
      eventoDetailsModal.addEventListener('click', (e) => {
        if (e.target === eventoDetailsModal) {
          closeEventoDetailsModal();
        }
      });
    }

    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (eventoModal && eventoModal.style.display === 'flex') {
          eventoModal.style.display = 'none';
        }
        if (eventoDetailsModal && eventoDetailsModal.style.display === 'block') {
          closeEventoDetailsModal();
        }
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
    }
}