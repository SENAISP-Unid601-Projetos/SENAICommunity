document.addEventListener("DOMContentLoaded", () => {
// -----------------------------------------------------------------
// AGUARDA O SCRIPT PRINCIPAL
// -----------------------------------------------------------------
document.addEventListener("globalScriptsLoaded", (e) => {
// --- SELEÇÃO DE ELEMENTOS (Específicos da Página) ---
const elements = {
receivedRequestsList: document.getElementById("received-requests-list"),
sentRequestsList: document.getElementById("sent-requests-list"),
friendsList: document.getElementById("friends-list"),
};

// -----------------------------------------------------------------
// FUNÇÕES DE BUSCA DE DADOS (Específicas da Página)
// -----------------------------------------------------------------

/**
 * Busca apenas os pedidos de amizade RECEBIDOS.
 */
async function fetchReceivedRequests() {
  if (!elements.receivedRequestsList) return;
  try {
    const response = await window.axios.get(
      `${window.backendUrl}/api/amizades/pendentes`
    );
    renderRequests(
      response.data,
      elements.receivedRequestsList,
      "received"
    );
  } catch (error) {
    console.error("Erro ao buscar pedidos recebidos:", error);
    elements.receivedRequestsList.innerHTML = `<div class="empty-state">Não foi possível carregar os pedidos.</div>`;
  }
}

/**
 * Busca apenas os pedidos de amizade ENVIADOS.
 */
async function fetchSentRequests() {
  if (!elements.sentRequestsList) return;
  try {
    const response = await window.axios.get(
      `${window.backendUrl}/api/amizades/enviadas`
    );
    renderRequests(response.data, elements.sentRequestsList, "sent");
  } catch (error) {
    console.error("Erro ao buscar pedidos enviados:", error);
    elements.sentRequestsList.innerHTML = `<div class="empty-state">Não foi possível carregar os pedidos.</div>`;
  }
}

// -----------------------------------------------------------------
// FUNÇÕES DE RENDERIZAÇÃO (Específicas da Página)
// -----------------------------------------------------------------

/**
 * Renderiza os cards de pedidos (recebidos ou enviados).
 */
function renderRequests(requests, container, type) {
  if (!container) return;
  container.innerHTML = "";
  if (requests.length === 0) {
    container.innerHTML = `<div class="empty-state">Nenhum pedido ${type === 'received' ? 'recebido' : 'enviado'}.</div>`;
    return;
  }

  requests.forEach((req) => {
    const card = document.createElement("div");
    card.className = "request-card";
    card.id = `${type}-card-${req.idAmizade}`;

    const data = new Date(req.dataSolicitacao).toLocaleDateString("pt-BR");
    const nome =
      type === "received" ? req.nomeSolicitante : req.nomeSolicitado;
    const fotoPath =
      type === "received"
        ? req.fotoPerfilSolicitante
        : req.fotoPerfilSolicitado;

    const fotoUrl = window.getAvatarUrl(fotoPath);

    let actionsHtml = "";
    if (type === "received") {
      actionsHtml = `
                    <button class="btn btn-primary" onclick="window.aceitar(${req.idAmizade})">Aceitar</button>
                    <button class="btn btn-secondary" onclick="window.recusar(${req.idAmizade})">Recusar</button>
                `;
    } else {
      actionsHtml = `<button class="btn btn-danger" onclick="window.cancelar(${req.idAmizade})">Cancelar Pedido</button>`;
    }

    card.innerHTML = `
                <div class="request-avatar">
                    <img src="${fotoUrl}" alt="Foto de ${nome}">
                </div>
                <div class="request-info">
                    <h4>${nome}</h4>
                    <p>Pedido enviado em: ${data}</p>
                </div>
                <div class="request-actions">
                    ${actionsHtml}
                </div>
            `;
    container.appendChild(card);
  });
}

/**
 * Renderiza a lista principal de amigos.
 * Esta função agora usa a lista global 'window.userFriends' carregada pelo principal.js
 */
function renderFriends() {
  const container = elements.friendsList;
  if (!container) return;
  container.innerHTML = "";

  const friends = window.userFriends || [];

  if (friends.length === 0) {
    container.innerHTML = `
      <div class="empty-friends-state">
        <i class="fas fa-user-friends"></i>
        <h3>Nenhuma conexão ainda</h3>
        <p>Encontre pessoas para se conectar e expandir sua rede</p>
        <a href="buscar_amigos.html" class="btn btn-primary">
          <i class="fas fa-user-plus"></i> Encontrar Pessoas
        </a>
      </div>
    `;
    return;
  }

  friends.forEach((friend, index) => {
    const card = document.createElement("div");
    card.className = "friend-card";
    card.id = `friend-card-${friend.idAmizade}`;

    const fotoUrl = window.getAvatarUrl(friend.fotoPerfil);
    const isOnline = window.latestOnlineEmails?.includes(friend.email);
    const statusClass = isOnline ? 'online' : 'offline';

    card.innerHTML = `
      <a href="perfil.html?id=${friend.idUsuario}" class="friend-card-header">
        <div class="friend-avatar">
          <img src="${fotoUrl}" alt="Foto de ${friend.nome}">
          <div class="friend-status ${statusClass}"></div>
        </div>
        <div class="friend-info">
          <h3 class="friend-name">${friend.nome}</h3>
          <p class="friend-email">${friend.email}</p>
        </div>
      </a>
      
      <div class="friend-actions">
        <a href="mensagem.html?start_chat=${friend.idUsuario}" class="friend-action-btn primary">
          <i class="fas fa-comment-dots"></i> Mensagem
        </a>
        <button class="friend-action-btn danger" onclick="window.removerAmizade(${friend.idAmizade})">
          <i class="fas fa-user-minus"></i> Remover
        </button>
      </div>
    `;

    // Adiciona animação de entrada
    card.style.animationDelay = `${index * 0.1}s`;
    container.appendChild(card);
  });
  
  // Atualiza status online após renderizar
  if (typeof window.atualizarStatusDeAmigosNaUI === "function") {
    window.atualizarStatusDeAmigosNaUI();
  }
}

// -----------------------------------------------------------------
// FUNÇÕES DE AÇÃO (Expostas para o HTML)
// -----------------------------------------------------------------
window.aceitar = async (amizadeId) => {
  try {
    await window.axios.post(
      `${window.backendUrl}/api/amizades/aceitar/${amizadeId}`
    );
    window.showNotification("Amizade aceita!", "success");
    // Recarregar as listas
    fetchReceivedRequests();
    carregarDadosDaPagina();
  } catch (err) {
    console.error(err);
    window.showNotification("Erro ao aceitar amizade.", "error");
  }
};

window.recusar = async (amizadeId) => {
  try {
    await window.axios.delete(
      `${window.backendUrl}/api/amizades/recusar/${amizadeId}`
    );
    window.showNotification("Pedido recusado.", "info");
    fetchReceivedRequests();
  } catch (err) {
    console.error(err);
    window.showNotification("Erro ao recusar.", "error");
  }
};

window.cancelar = async (amizadeId) => {
  try {
    await window.axios.delete(
      `${window.backendUrl}/api/amizades/recusar/${amizadeId}`
    );
    window.showNotification("Pedido cancelado.", "info");
    fetchSentRequests();
  } catch (err) {
    console.error(err);
    window.showNotification("Erro ao cancelar pedido.", "error");
  }
};

window.removerAmizade = async (amizadeId) => {
  if (confirm("Tem certeza que deseja remover esta amizade?")) {
    try {
      await window.axios.delete(
        `${window.backendUrl}/api/amizades/recusar/${amizadeId}`
      );
      window.showNotification("Amizade removida.", "info");
      // Recarregar a lista de amigos
      carregarDadosDaPagina();
    } catch (err) {
      console.error("Erro ao remover amizade:", err);
      window.showNotification("Erro ao remover amizade.", "error");
    }
  }
};

// -----------------------------------------------------------------
// INICIALIZAÇÃO DA PÁGINA E LISTENERS GLOBAIS
// -----------------------------------------------------------------

/**
 * Função unificada para carregar/recarregar os dados desta página.
 */
function carregarDadosDaPagina() {
  // Mostrar loading state
  if (elements.friendsList) {
    elements.friendsList.innerHTML = `
      <div class="friends-loading">
        ${Array(6).fill(0).map(() => `
          <div class="friend-card-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line long"></div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  fetchReceivedRequests();
  fetchSentRequests();
  
  // Pequeno delay para melhor UX
  setTimeout(() => {
    renderFriends();
  }, 500);
}

// Inicializar a página
carregarDadosDaPagina();

// Ouvir atualizações da lista de amigos
document.addEventListener("friendsListUpdated", () => {
  console.log("Página amizades.js ouviu o evento 'friendsListUpdated'!");
  carregarDadosDaPagina();
});

// Ouvir atualizações de status online
document.addEventListener("onlineStatusUpdated", () => {
  renderFriends();
});
});
});