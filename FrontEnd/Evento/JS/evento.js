// evento.js - Código completo com Correção do Modal, Tempo Real e Tratamento de Imagens
document.addEventListener("DOMContentLoaded", () => {
  // Aguardar a inicialização global do principal.js
  if (!window.currentUser) {
    document.addEventListener("globalScriptsLoaded", () => {
      initEventos();
      initResponsiveFeatures();
    });
  } else {
    initEventos();
    initResponsiveFeatures();
  }
});

// --- FUNÇÃO: Gerencia a Responsividade (Menu Mobile) - VERSÃO ROBUSTA ---
function initResponsiveFeatures() {
  console.log("Iniciando recursos responsivos...");

  // 1. Seleção precisa dos elementos pelo ID que está no seu HTML
  const elements = {
    openBtn: document.getElementById("mobile-menu-toggle"), // O ID correto do seu HTML
    sidebar: document.getElementById("sidebar"),
    closeBtn: document.getElementById("sidebar-close"),
    overlay: document.getElementById("mobile-overlay"),
  };

  // 2. Verificação de segurança (Debug)
  if (!elements.openBtn)
    console.error("ERRO: Botão 'mobile-menu-toggle' não encontrado!");
  if (!elements.sidebar) console.error("ERRO: Sidebar não encontrada!");

  // 3. Função única para Alternar (Abrir/Fechar)
  function toggleMenu(e) {
    if (e) {
      e.preventDefault(); // Evita comportamentos padrão
      e.stopPropagation(); // Impede que o clique passe para outros elementos
    }

    if (elements.sidebar) {
      // Alterna a classe 'active' na sidebar e no overlay
      elements.sidebar.classList.toggle("active");

      if (elements.overlay) {
        elements.overlay.classList.toggle("active");
      }

      // Trava o scroll do corpo do site quando o menu está aberto
      const isOpen = elements.sidebar.classList.contains("active");
      document.body.style.overflow = isOpen ? "hidden" : "";

      console.log("Menu alternado. Aberto?", isOpen);
    }
  }

  // 4. Adicionar Event Listeners (Garante que o clique funcione)

  // Botão de Abrir (Hambúrguer)
  if (elements.openBtn) {
    // Removemos listener antigo para evitar duplicação (cloneNode)
    const newOpenBtn = elements.openBtn.cloneNode(true);
    elements.openBtn.parentNode.replaceChild(newOpenBtn, elements.openBtn);
    newOpenBtn.addEventListener("click", toggleMenu);
  }

  // Botão de Fechar (X)
  if (elements.closeBtn) {
    const newCloseBtn = elements.closeBtn.cloneNode(true);
    elements.closeBtn.parentNode.replaceChild(newCloseBtn, elements.closeBtn);
    newCloseBtn.addEventListener("click", toggleMenu);
  }

  // Clicar no Overlay (Fundo escuro)
  if (elements.overlay) {
    const newOverlay = elements.overlay.cloneNode(true);
    elements.overlay.parentNode.replaceChild(newOverlay, elements.overlay);
    newOverlay.addEventListener("click", toggleMenu);
  }

  // 5. Resetar ao redimensionar a tela (Desktop)
  window.addEventListener("resize", () => {
    if (
      window.innerWidth > 1024 &&
      elements.sidebar &&
      elements.sidebar.classList.contains("active")
    ) {
      elements.sidebar.classList.remove("active");
      if (elements.overlay) elements.overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// --- FUNÇÃO PRINCIPAL DE EVENTOS ---
async function initEventos() {
  const backendUrl = window.backendUrl || "http://localhost:8080";
  // Define a URL padrão apontando para o backend, caso a string venha vazia
  const defaultEventUrl = `${backendUrl}/images/default-event.png`;

  const eventosGrid = document.querySelector(".eventos-grid");
  const meusEventosLista = document.getElementById("meus-eventos-lista");
  const searchInput = document.getElementById("search-input");
  const loadingOverlay = document.getElementById("loading-overlay");

  // Elementos do modal de criação/edição
  const eventoModal = document.getElementById("evento-modal");
  const eventoForm = document.getElementById("evento-form");
  const eventoIdInput = document.getElementById("evento-id");
  const eventoTituloInput = document.getElementById("evento-titulo");
  const eventoDescricaoInput = document.getElementById("evento-descricao");
  const eventoDataInput = document.getElementById("evento-data");
  const eventoHoraInicioInput = document.getElementById("evento-hora-inicio");
  const eventoHoraFimInput = document.getElementById("evento-hora-fim");
  const eventoLocalInput = document.getElementById("evento-local");
  const eventoFormatoSelect = document.getElementById("evento-formato");
  const eventoCategoriaSelect = document.getElementById("evento-categoria");
  const eventoImagemInput = document.getElementById("evento-imagem");
  const salvarEventoBtn = document.getElementById("salvar-evento-btn");
  const cancelEventoBtn = document.getElementById("cancel-evento-btn");

  // Elementos do modal de detalhes
  const eventoDetailsModal = document.getElementById("evento-details-modal");
  const closeEventoDetailsBtn = document.getElementById(
    "close-evento-details-btn"
  );

  let eventos = [];
  let eventosInteressados = [];
  let isAdmin = false;
  let currentDetailsEventoId = null; // Rastreia qual evento está aberto no modal

  // --- FUNÇÃO AUXILIAR PARA TRATAR URL DA IMAGEM ---
  function getEventoImageUrl(url) {
    if (!url || url.trim() === "") {
      return defaultEventUrl;
    }
    // Se já for http (Cloudinary ou externo), retorna. Se for relativo (/images/...), adiciona backendUrl
    return url.startsWith("http")
      ? url
      : `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  // Inicialização
  async function init() {
    await checkUserRole();
    updateSidebarUserInfo();
    await loadEventos();
    setupEventListeners();
    setupWebSocketListeners(); // Inicia escuta em tempo real
    checkAndOpenUrlEvento();
  }

  function checkAndOpenUrlEvento() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventoIdParam = urlParams.get("id");

    if (eventoIdParam) {
      // Converte para número para comparar corretamente
      const eventoId = parseInt(eventoIdParam);

      // Procura o evento na lista carregada (variável 'eventos' do escopo de initEventos)
      const eventoAlvo = eventos.find((e) => e.id === eventoId);

      if (eventoAlvo) {
        // Abre o modal de detalhes
        openEventoDetailsModal(eventoAlvo);

        // Opcional: Limpa a URL para que o modal não reabra se o usuário der F5
        window.history.replaceState({}, document.title, "evento.html");
      } else {
        console.warn("Evento da notificação não encontrado na lista atual.");
      }
    }
  }

  // Verificar se o usuário é admin
  async function checkUserRole() {
    try {
      isAdmin =
        window.currentUser && window.currentUser.tipoUsuario === "ADMIN";

      if (isAdmin) {
        const criarEventoBtn = document.createElement("button");
        criarEventoBtn.className = "criar-evento-btn";
        criarEventoBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Evento';
        criarEventoBtn.addEventListener("click", () => openEventoModal());

        const eventosHeader = document.querySelector(".eventos-header");
        if (eventosHeader) {
          eventosHeader.appendChild(criarEventoBtn);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar role do usuário:", error);
    }
  }

  // Carregar eventos do backend
  async function loadEventos() {
    showLoading();
    try {
      const response = await axios.get(`${backendUrl}/api/eventos`);
      eventos = response.data;
      await loadEventosInteressados();
      renderEventos();
      updateMeusEventos();
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      showNotification("Erro ao carregar eventos", "error");
    } finally {
      hideLoading();
    }
  }

  // Carregar eventos que o usuário tem interesse
  async function loadEventosInteressados() {
    try {
      const response = await axios.get(
        `${backendUrl}/api/eventos/meus-eventos`
      );
      eventosInteressados = response.data.map((evento) => evento.id);
    } catch (error) {
      console.error("Erro ao carregar eventos interessados:", error);
      eventosInteressados = [];
    }
  }

  // --- WEB SOCKET (TEMPO REAL) ---
  function setupWebSocketListeners() {
    if (window.stompClient && window.stompClient.connected) {
      subscribeToEvents();
    }
    document.addEventListener("webSocketConnected", () => {
      subscribeToEvents();
    });
  }

  function subscribeToEvents() {
    if (!window.stompClient) return;
    try {
      window.stompClient.subscribe("/topic/eventos", (message) => {
        const eventoAtualizado = JSON.parse(message.body);
        handleRealTimeUpdate(eventoAtualizado);
      });
    } catch (e) {
      console.warn("Não foi possível inscrever no tópico de eventos.");
    }
  }

  function handleRealTimeUpdate(eventoAtualizado) {
    // 1. Atualiza o objeto na lista local de eventos
    const index = eventos.findIndex((e) => e.id === eventoAtualizado.id);
    if (index !== -1) {
      eventos[index].numeroInteressados = eventoAtualizado.numeroInteressados;

      // 2. Se o modal deste evento estiver aberto, atualiza o número na tela
      if (currentDetailsEventoId === eventoAtualizado.id) {
        const contadorElement = document.getElementById(
          "details-evento-interessados"
        );
        if (contadorElement) {
          contadorElement.style.color = "var(--accent-primary)"; // Efeito visual
          contadorElement.textContent = eventoAtualizado.numeroInteressados;
          setTimeout(() => {
            contadorElement.style.color = "";
          }, 500);
        }
      }
    }
  }

  // Renderizar eventos no grid
  function renderEventos() {
    if (!eventosGrid) return;
    eventosGrid.innerHTML = "";

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

    eventos.forEach((evento) => {
      const card = createEventoCard(evento);
      eventosGrid.appendChild(card);
    });
  }

  // Criar card de evento
  function createEventoCard(evento) {
    // Usa a função de tratamento de URL
    const imagemUrl = getEventoImageUrl(evento.imagemCapaUrl);

    const card = document.createElement("div");
    card.className = "evento-card";
    card.dataset.id = evento.id;

    // Parse manual da data para evitar UTC shift
    let dia = "--",
      mes = "---";
    if (evento.data) {
      const [anoStr, mesStr, diaStr] = evento.data.split("-");
      const dataObj = new Date(anoStr, mesStr - 1, diaStr);
      dia = diaStr;
      mes = dataObj
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
    }

    // Formatação de horários
    const horaInicio = evento.horaInicio
      ? evento.horaInicio.substring(0, 5)
      : "--:--";
    const horaFim = evento.horaFim ? evento.horaFim.substring(0, 5) : "--:--";

    const isInteressado = eventosInteressados.includes(evento.id);

    let adminActions = "";
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
      <div class="evento-imagem" style="background-image: url('${imagemUrl}')">
        ${adminActions}
        <div class="evento-data">
          <span>${dia}</span>
          <span>${mes}</span>
        </div>
      </div>
      <div class="evento-conteudo">
        <span class="evento-categoria">${evento.categoria}</span>
        <h2 class="evento-titulo" title="${evento.nome}">${evento.nome}</h2>
        
        <div class="evento-detalhe">
             <i class="fas fa-clock"></i> ${horaInicio} - ${horaFim}
        </div>
        
        <div class="evento-detalhe"><i class="fas fa-map-marker-alt"></i> ${
          evento.local
        } (${evento.formato})</div>
        ${
          !isAdmin
            ? `
          <button class="rsvp-btn ${
            isInteressado ? "confirmed" : ""
          }" onclick="event.stopPropagation(); window.toggleInteresse(${
                evento.id
              }, this)">
            <i class="fas ${
              isInteressado ? "fa-check" : "fa-calendar-plus"
            }"></i> 
            ${isInteressado ? "Lembrete Ativo" : "Definir Lembrete"}
          </button>
        `
            : ""
        }
      </div>
    `;

    // Tornar o card clicável para abrir o modal de detalhes
    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      // Não abrir modal se clicar nos botões de admin ou RSVP
      if (
        !e.target.closest(".evento-admin-actions") &&
        !e.target.closest(".rsvp-btn")
      ) {
        openEventoDetailsModal(evento);
      }
    });

    return card;
  }

  // Atualizar lista "Meus Eventos"
  function updateMeusEventos() {
    if (!meusEventosLista) return;
    meusEventosLista.innerHTML = "";

    // 1. Filtra e Ordena
    const eventosConfirmados = eventos.filter((evento) =>
      eventosInteressados.includes(evento.id)
    );

    // Ordena: Eventos mais próximos primeiro
    eventosConfirmados.sort((a, b) => a.data.localeCompare(b.data));

    // 2. Estado Vazio
    if (eventosConfirmados.length === 0) {
      meusEventosLista.innerHTML = `
        <div style="text-align: center; padding: 1rem; opacity: 0.6;">
            <p style="font-size: 0.85rem;">Nenhum evento salvo.</p>
        </div>`;
      return;
    }

    // 3. Renderiza Cards Compactos
    eventosConfirmados.forEach((evento) => {
      // Formata data simples (Ex: 15/03)
      let dataFormatada = "--/--";
      if (evento.data) {
        const parts = evento.data.split("-"); // YYYY-MM-DD
        dataFormatada = `${parts[2]}/${parts[1]}`;
      }

      // Usa a função de tratamento de URL
      const imagemUrl = getEventoImageUrl(evento.imagemCapaUrl);

      const card = document.createElement("div");
      card.className = "mini-card";

      // HTML Mais limpo
      card.innerHTML = `
        <img src="${imagemUrl}" alt="Capa" class="mini-card-img">
        <div class="mini-card-info">
            <div class="mini-card-title" title="${evento.nome}">${
        evento.nome
      }</div>
            <div class="mini-card-date">
                <i class="fas fa-calendar-alt"></i> ${dataFormatada} • ${evento.horaInicio.slice(
        0,
        5
      )}
            </div>
        </div>
      `;

      // Clique abre o modal
      card.addEventListener("click", () => {
        openEventoDetailsModal(evento);
      });

      meusEventosLista.appendChild(card);
    });
  }

  // --- FUNÇÕES DO MODAL DE DETALHES ---

  // Abrir modal de detalhes do evento
  function openEventoDetailsModal(evento) {
    currentDetailsEventoId = evento.id; // Define qual evento está aberto

    // Mapeamento de meses
    const meses = {
      "01": "JAN",
      "02": "FEV",
      "03": "MAR",
      "04": "ABR",
      "05": "MAI",
      "06": "JUN",
      "07": "JUL",
      "08": "AGO",
      "09": "SET",
      10: "OUT",
      11: "NOV",
      12: "DEZ",
    };

    // Parse da data
    let dia = "--",
      mes = "---",
      dataFormatada = "--/--/----";
    if (evento.data) {
      const [anoStr, mesStr, diaStr] = evento.data.split("-");
      const dataObj = new Date(anoStr, mesStr - 1, diaStr);
      dia = diaStr;
      mes = meses[mesStr] || "---";
      dataFormatada = dataObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }

    // Horários
    const horaInicio = evento.horaInicio
      ? evento.horaInicio.substring(0, 5)
      : "--:--";
    const horaFim = evento.horaFim ? evento.horaFim.substring(0, 5) : "--:--";

    // Preencher dados do modal
    document.getElementById("details-evento-day").textContent = dia;
    document.getElementById("details-evento-month").textContent = mes;
    document.getElementById("details-evento-categoria").textContent =
      evento.categoria;
    document.getElementById("details-evento-titulo").textContent = evento.nome;
    document.getElementById("details-evento-empresa").textContent =
      "SENAI Community";
    document.getElementById("details-evento-data").textContent = dataFormatada;
    document.getElementById(
      "details-evento-horario"
    ).textContent = `${horaInicio} - ${horaFim}`;
    document.getElementById("details-evento-local").textContent = evento.local;
    document.getElementById("details-evento-formato").textContent =
      evento.formato;

    // Descrição
    const descricaoElement = document.getElementById(
      "details-evento-descricao"
    );
    descricaoElement.textContent =
      evento.descricao ||
      "Este evento oferece uma oportunidade única de aprendizado e networking para profissionais e estudantes da área.";

    // Imagem - Usa a função de tratamento de URL
    const imagemUrl = getEventoImageUrl(evento.imagemCapaUrl);
    const imageElement = document.getElementById("details-evento-image");
    imageElement.style.backgroundImage = `url('${imagemUrl}')`;

    // Estatísticas
    document.getElementById("details-evento-interessados").textContent =
      evento.numeroInteressados || "0";

    // Configurar botões de ação
    const isInteressado = eventosInteressados.includes(evento.id);
    setupActionButtons(evento.id, isInteressado);

    // Mostrar modal
    eventoDetailsModal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  // Fechar modal de detalhes
  function closeEventoDetailsModal() {
    eventoDetailsModal.style.display = "none";
    document.body.style.overflow = "auto";
    currentDetailsEventoId = null; // Limpa ID
  }

  // Configurar botões de ação
  function setupActionButtons(eventoId, isInteressado) {
    const rsvpBtn = document.getElementById("rsvp-evento-details-btn");
    const saveBtn = document.getElementById("save-evento-details-btn");

    // Botão de lembrete
    if (rsvpBtn) {
      // Clona para remover listeners antigos e atualizar referência
      const newRsvpBtn = rsvpBtn.cloneNode(true);
      if (rsvpBtn.parentNode) {
        rsvpBtn.parentNode.replaceChild(newRsvpBtn, rsvpBtn);
      }

      if (isInteressado) {
        newRsvpBtn.innerHTML = '<i class="fas fa-check"></i> Lembrete Ativo';
        newRsvpBtn.classList.add("confirmed");
      } else {
        newRsvpBtn.innerHTML =
          '<i class="fas fa-calendar-plus"></i> Definir Lembrete';
        newRsvpBtn.classList.remove("confirmed");
      }

      newRsvpBtn.addEventListener("click", async () => {
        await toggleInteresse(eventoId, newRsvpBtn);
        // Atualiza o visual do botão após a ação
        const updatedInterest = eventosInteressados.includes(eventoId);
        if (updatedInterest) {
          newRsvpBtn.innerHTML = '<i class="fas fa-check"></i> Lembrete Ativo';
          newRsvpBtn.classList.add("confirmed");
        } else {
          newRsvpBtn.innerHTML =
            '<i class="fas fa-calendar-plus"></i> Definir Lembrete';
          newRsvpBtn.classList.remove("confirmed");
        }
        // Não fechamos o modal automaticamente para permitir ver a mudança
      });

      // Se for admin, esconde o botão de interesse
      if (isAdmin) {
        newRsvpBtn.style.display = "none";
      } else {
        newRsvpBtn.style.display = "inline-flex";
      }
    }

    // Botão salvar
    if (saveBtn) {
      const newSaveBtn = saveBtn.cloneNode(true);
      if (saveBtn.parentNode) {
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
      }

      newSaveBtn.addEventListener("click", () => {
        handleSaveEvento(eventoId);
      });
    }
  }

  // Salvar evento (favoritar)
  function handleSaveEvento(eventoId) {
    showNotification("Evento salvo nos seus favoritos!", "success");
    const saveBtn = document.getElementById("save-evento-details-btn");
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Salvo';
      saveBtn.classList.add("saved");
      saveBtn.disabled = true;
    }
  }

  // Alternar interesse em evento (COM ATUALIZAÇÃO OTIMISTA)
  async function toggleInteresse(eventoId, btnElement) {
    const originalContent = btnElement ? btnElement.innerHTML : "";

    if (btnElement) {
      btnElement.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processando...';
      btnElement.disabled = true;
    }

    // 1. Atualização Otimista
    const eventoIndex = eventos.findIndex((e) => e.id === eventoId);
    const isAdding = !eventosInteressados.includes(eventoId);
    let previousCount = 0;

    if (eventoIndex !== -1) {
      previousCount = eventos[eventoIndex].numeroInteressados || 0;
      let newCount = previousCount + (isAdding ? 1 : -1);
      if (newCount < 0) newCount = 0;
      eventos[eventoIndex].numeroInteressados = newCount;

      // Atualiza contador no modal se estiver aberto
      if (currentDetailsEventoId === eventoId) {
        document.getElementById("details-evento-interessados").textContent =
          newCount;
      }
    }

    try {
      // 2. Requisição ao backend
      await axios.post(`${backendUrl}/api/eventos/${eventoId}/interesse`);

      // 3. Confirma alteração na lista local
      if (isAdding) {
        eventosInteressados.push(eventoId);
        showNotification("Lembrete definido com sucesso!", "success");
      } else {
        const index = eventosInteressados.indexOf(eventoId);
        if (index > -1) {
          eventosInteressados.splice(index, 1);
          showNotification("Lembrete removido", "info");
        }
      }

      // 4. Atualiza Grid e Sidebar
      renderEventos();
      updateMeusEventos();
    } catch (error) {
      console.error("Erro ao alternar interesse:", error);
      showNotification("Erro ao definir lembrete", "error");

      // Reverte mudança em caso de erro
      if (eventoIndex !== -1) {
        eventos[eventoIndex].numeroInteressados = previousCount;
        if (currentDetailsEventoId === eventoId) {
          document.getElementById("details-evento-interessados").textContent =
            previousCount;
        }
      }
      if (btnElement) btnElement.innerHTML = originalContent;
    } finally {
      if (btnElement) btnElement.disabled = false;
    }
  }

  // Abrir modal para criar/editar evento
  function openEventoModal(evento = null) {
    const modalTitulo = document.getElementById("evento-modal-titulo");
    const previewContainer = document.getElementById("preview-container");
    const previewImg = document.getElementById("evento-imagem-preview");

    // Limpeza do input de arquivo
    if (eventoImagemInput) eventoImagemInput.value = "";

    if (evento) {
      // Modo edição
      modalTitulo.textContent = "Editar Evento";
      eventoIdInput.value = evento.id;
      eventoTituloInput.value = evento.nome;
      if (eventoDescricaoInput)
        eventoDescricaoInput.value = evento.descricao || "";

      // Data vem como YYYY-MM-DD do backend
      eventoDataInput.value = evento.data;

      // Horários
      eventoHoraInicioInput.value = evento.horaInicio
        ? evento.horaInicio.substring(0, 5)
        : "";
      eventoHoraFimInput.value = evento.horaFim
        ? evento.horaFim.substring(0, 5)
        : "";

      eventoLocalInput.value = evento.local;
      eventoFormatoSelect.value = evento.formato;
      eventoCategoriaSelect.value = evento.categoria;

      // Preview da imagem - Usa a função de tratamento de URL
      if (previewContainer && previewImg) {
        const imagemUrl = getEventoImageUrl(evento.imagemCapaUrl);
        previewImg.src = imagemUrl;
        previewContainer.style.display = "block";
      } else if (previewContainer) {
        previewContainer.style.display = "none";
      }
    } else {
      // Modo criação
      modalTitulo.textContent = "Criar Evento";
      eventoForm.reset();
      eventoIdInput.value = "";

      // Reseta preview
      if (previewContainer) previewContainer.style.display = "none";
      if (previewImg) previewImg.src = "";
    }

    eventoModal.style.display = "flex";
  }

  // SALVAR EVENTO (Create ou Update)
  async function saveEvento() {
    // Coleta e Normaliza os dados
    const normalizeEnum = (valor) =>
      valor
        ? valor
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
        : "";

    const eventoData = {
      nome: eventoTituloInput.value,
      descricao: eventoDescricaoInput.value,
      data: eventoDataInput.value,
      horaInicio:
        eventoHoraInicioInput.value.length === 5
          ? eventoHoraInicioInput.value + ":00"
          : eventoHoraInicioInput.value,
      horaFim:
        eventoHoraFimInput.value.length === 5
          ? eventoHoraFimInput.value + ":00"
          : eventoHoraFimInput.value,
      local: eventoLocalInput.value,
      formato: normalizeEnum(eventoFormatoSelect.value),
      categoria: normalizeEnum(eventoCategoriaSelect.value),
    };

    // Validação básica
    if (
      !eventoData.nome ||
      !eventoData.data ||
      !eventoData.horaInicio ||
      !eventoData.horaFim ||
      !eventoData.descricao
    ) {
      showNotification(
        "Preencha todos os campos obrigatórios, incluindo a descrição.",
        "info"
      );
      return;
    }

    const formData = new FormData();
    formData.append(
      "evento",
      new Blob([JSON.stringify(eventoData)], { type: "application/json" })
    );

    if (eventoImagemInput.files && eventoImagemInput.files[0]) {
      formData.append("imagem", eventoImagemInput.files[0]);
    }

    try {
      showLoading();
      if (eventoIdInput.value) {
        await axios.put(
          `${backendUrl}/api/eventos/${eventoIdInput.value}`,
          formData
        );
        showNotification("Evento atualizado!", "success");
      } else {
        await axios.post(`${backendUrl}/api/eventos`, formData);
        showNotification("Evento criado!", "success");
      }
      eventoModal.style.display = "none";
      await loadEventos();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Erro ao salvar.";
      showNotification(msg, "error");
    } finally {
      hideLoading();
    }
  }

  // Excluir evento
  async function deleteEvento(eventoId) {
    if (!confirm("Tem certeza que deseja excluir este evento?")) {
      return;
    }

    try {
      showLoading();
      await axios.delete(`${backendUrl}/api/eventos/${eventoId}`);
      showNotification("Evento excluído com sucesso!", "success");
      await loadEventos();
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      showNotification("Erro ao excluir evento", "error");
    } finally {
      hideLoading();
    }
  }

  // Aplicar filtros
  function applyFilters() {
    // 1. Captura os valores dos elementos HTML
    const periodoElement = document.getElementById("filter-periodo");
    const formatoElement = document.getElementById("filter-formato");
    const categoriaElement = document.getElementById("filter-categoria");

    // Verificação de segurança para evitar erros se o elemento não existir
    const periodo = periodoElement ? periodoElement.value : "proximos";
    const formato = formatoElement ? formatoElement.value : "todos";
    const categoria = categoriaElement ? categoriaElement.value : "todos";

    // Captura o termo de busca
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    // 2. Prepara a data de hoje formatada (YYYY-MM-DD) para comparação precisa
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    const hojeStr = `${ano}-${mes}-${dia}`;

    let filteredEventos = eventos.filter((evento) => {
      // 3. Lógica de Filtro de Data
      const dataEventoStr = evento.data;

      const periodoMatch =
        periodo === "proximos"
          ? dataEventoStr >= hojeStr // Inclui hoje nos próximos
          : dataEventoStr < hojeStr; // Passados são estritamente anteriores a hoje

      // 4. Lógica de Outros Filtros
      const formatoMatch = formato === "todos" || evento.formato === formato;
      const categoriaMatch =
        categoria === "todos" || evento.categoria === categoria;

      // Busca por nome
      const nomeEvento = evento.nome ? evento.nome.toLowerCase() : "";
      const searchMatch = nomeEvento.includes(searchTerm);

      return periodoMatch && formatoMatch && categoriaMatch && searchMatch;
    });

    // 5. Ordenação dos Resultados
    filteredEventos.sort((a, b) => {
      if (periodo === "proximos") {
        return a.data.localeCompare(b.data); // Crescente (mais próximo primeiro)
      } else {
        return b.data.localeCompare(a.data); // Decrescente (mais recente primeiro)
      }
    });

    // 6. Renderizar na tela
    if (!eventosGrid) return;
    eventosGrid.innerHTML = "";

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

    filteredEventos.forEach((evento) => {
      const card = createEventoCard(evento);
      eventosGrid.appendChild(card);
    });
  }

  // Mostrar loading
  function showLoading() {
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }
  }

  // Esconder loading
  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Filtros
    document
      .getElementById("filter-periodo")
      .addEventListener("change", applyFilters);
    document
      .getElementById("filter-formato")
      .addEventListener("change", applyFilters);
    document
      .getElementById("filter-categoria")
      .addEventListener("change", applyFilters);
    if (searchInput) searchInput.addEventListener("input", applyFilters);

    // Modal de criação/edição
    if (salvarEventoBtn) salvarEventoBtn.addEventListener("click", saveEvento);
    if (cancelEventoBtn)
      cancelEventoBtn.addEventListener("click", () => {
        eventoModal.style.display = "none";
      });

    // Fechar modal ao clicar fora
    if (eventoModal) {
      eventoModal.addEventListener("click", (e) => {
        if (e.target === eventoModal) {
          eventoModal.style.display = "none";
        }
      });
    }

    const closeBtn = document.querySelector(".close-modal-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        eventoModal.style.display = "none";
      });
    }

    // Modal de detalhes
    if (closeEventoDetailsBtn) {
      closeEventoDetailsBtn.addEventListener("click", closeEventoDetailsModal);
    }

    if (eventoDetailsModal) {
      eventoDetailsModal.addEventListener("click", (e) => {
        if (e.target === eventoDetailsModal) {
          closeEventoDetailsModal();
        }
      });
    }

    // Fechar modais com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (eventoModal && eventoModal.style.display === "flex") {
          eventoModal.style.display = "none";
        }
        if (
          eventoDetailsModal &&
          eventoDetailsModal.style.display === "block"
        ) {
          closeEventoDetailsModal();
        }
      }
    });
  }

  // Funções globais para os botões (onClick no HTML)
  window.editEvento = (eventoId) => {
    const evento = eventos.find((e) => e.id === eventoId);
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

// --- FUNÇÃO AUXILIAR: Sidebar do Usuário (Atualizada e Robusta) ---
function updateSidebarUserInfo() {
  const userInfoContainer = document.querySelector(".user-info");

  if (window.currentUser) {
    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarTitle = document.getElementById("sidebar-user-title");
    const sidebarImg = document.getElementById("sidebar-user-img");

    // 1. Define a imagem padrão de forma robusta
    const defaultImage =
      window.defaultAvatarUrl ||
      (window.backendUrl
        ? `${window.backendUrl}/images/default-avatar.jpg`
        : "") ||
      "https://via.placeholder.com/80?text=User";

    if (sidebarName) {
      sidebarName.textContent = window.currentUser.nome || "Usuário";
    }

    // 2. CORREÇÃO PRINCIPAL: Verifica múltiplos campos para o cargo
    if (sidebarTitle) {
      const role =
        window.currentUser.cargo ||
        window.currentUser.titulo ||
        window.currentUser.tipoUsuario ||
        "Membro da Comunidade";
      sidebarTitle.textContent = role;
    }

    if (sidebarImg) {
      const foto =
        window.currentUser.fotoPerfil || window.currentUser.urlFotoPerfil;

      // Tratamento de erro de imagem
      sidebarImg.onerror = function () {
        if (this.src !== defaultImage) {
          this.src = defaultImage;
        }
      };

      // Lógica de URL da imagem
      if (foto) {
        if (typeof window.getAvatarUrl === "function") {
          sidebarImg.src = window.getAvatarUrl(foto);
        } else if (foto.startsWith("http")) {
          sidebarImg.src = foto;
        } else {
          const cleanPath = foto.startsWith("/") ? foto : `/${foto}`;
          sidebarImg.src = `${window.backendUrl}/api/arquivos${cleanPath}`;
        }
      } else {
        sidebarImg.src = defaultImage;
      }
    }

    // Esconde o spinner de carregamento
    if (userInfoContainer) {
      userInfoContainer.classList.add("loaded");
    }
  }
}
