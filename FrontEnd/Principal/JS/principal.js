// =================================================================
// 1. BLOCO DE ACESSIBILIDADE GLOBAL (COLE ISTE NO TOPO DO ARQUIVO)
// =================================================================
window.aplicarAcessibilidadeGlobal = function() {

    const html = document.documentElement;
    const body = document.body;
    // 1. Tamanho da Fonte (Aplica no HTML)
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    html.setAttribute('data-font-size', savedFontSize);
    // 2. Alto Contraste (Aplica no HTML para ser mais rápido)
    if (localStorage.getItem('highContrast') === 'true') {
        html.classList.add('acessibilidade-alto-contraste');
    } else {
        html.classList.remove('acessibilidade-alto-contraste');
    }
    // 3. Configurações que dependem do BODY
    if (body) {
        // Redução de Movimento
        if (localStorage.getItem('reduceMotion') === 'true') {
            body.classList.add('reduce-motion');
        } else {
            body.classList.remove('reduce-motion');
        }
        // Fonte Legível
        if (localStorage.getItem('readableFont') === 'true') {
            html.classList.add('acessibilidade-fonte-legivel');
        } else {
            html.classList.remove('acessibilidade-fonte-legivel');
        }
        // Destacar Links
        if (localStorage.getItem('highlightLinks') === 'true') {
            html.classList.add('acessibilidade-destacar-links');
        } else {
            html.classList.remove('acessibilidade-destacar-links');
        }
    }
};
// Executa IMEDIATAMENTE (antes da página aparecer)
window.aplicarAcessibilidadeGlobal();
// =================================================================
// SEU CÓDIGO ANTIGO COMEÇA AQUI (NÃO APAGUE O RESTO)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    // ADICIONE ESTA LINHA DENTRO DO SEU DOMContentLoaded:
    window.aplicarAcessibilidadeGlobal();   
  function setInitialTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  }

  
    initMobileFeatures();

  // Adicione estas funções dentro do DOMContentLoaded em principal.js

// Mobile sidebar toggle
// Substitua a função setupMobileSidebar existente por esta versão corrigida
function setupMobileSidebar() {
    const menuToggle = document.getElementById('mobile-menu-toggle'); // ID específico
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('mobile-overlay'); // ID específico

    function toggleMenu() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        // Previne scroll do corpo quando menu está aberto
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', toggleMenu);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleMenu);
    }
    
    // Fechar ao clicar em links (exceto dropdowns)
    if (sidebar) {
        sidebar.querySelectorAll('.menu-item').forEach(link => {
            link.addEventListener('click', () => {
                // Pequeno delay para visualização do clique
                if (window.innerWidth <= 768) {
                    setTimeout(toggleMenu, 150);
                }
            });
        });
    }
}

// Além disso, na função updateUIWithUserData, certifique-se de remover o loading:
// Dentro da função updateUIWithUserData(user) {...}:
const userInfoContainer = document.querySelector('.user-info');
if (userInfoContainer) {
    userInfoContainer.classList.add('loaded'); // Isso esconde o spinner cinza
}
// Mobile responsive adjustments
function setupMobileResponsive() {
    // Hide certain elements on mobile
    const hideOnMobile = document.querySelectorAll('.d-none-mobile');
    
    function checkMobile() {
        const isMobile = window.innerWidth <= 768;
        hideOnMobile.forEach(el => {
            el.style.display = isMobile ? 'none' : 'flex';
        });
        
        // Adjust post actions for mobile
        const postActions = document.querySelectorAll('.post-actions');
        postActions.forEach(actions => {
            if (isMobile) {
                actions.style.flexDirection = 'row';
                actions.style.justifyContent = 'space-around';
            } else {
                actions.style.flexDirection = 'row';
                actions.style.justifyContent = 'space-around';
            }
        });
    }
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
}

// Enhanced mobile post creator
function setupMobilePostCreator() {
    const postTextarea = document.getElementById('post-creator-textarea');
    const publishBtn = document.getElementById('publish-post-btn');
    
    if (postTextarea && publishBtn) {
        postTextarea.addEventListener('input', function() {
            // Auto-resize
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            // Enable/disable button
            const hasContent = this.value.trim().length > 0;
            publishBtn.disabled = !hasContent;
            publishBtn.style.opacity = hasContent ? '1' : '0.7';
        });
        
        // Mobile file upload enhancement
        const fileInput = document.getElementById('post-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    showNotification(`${this.files.length} arquivo(s) selecionado(s)`, 'info');
                }
            });
        }
    }
}

// Touch-optimized carousel
function setupMobileCarousel() {
    // Add touch events to carousels
    document.addEventListener('touchstart', handleTouchStart, false);        
    document.addEventListener('touchmove', handleTouchMove, false);
    
    let xDown = null;                                                        
    let yDown = null;
    
    function handleTouchStart(evt) {                                         
        xDown = evt.touches[0].clientX;                                      
        yDown = evt.touches[0].clientY;                                      
    };                                                
    
    function handleTouchMove(evt) {
        if (!xDown || !yDown) return;
        
        const xUp = evt.touches[0].clientX;
        const yUp = evt.touches[0].clientY;
        const xDiff = xDown - xUp;
        const yDiff = yDown - yUp;
        
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                // Swipe left - next
                if (currentMediaIndex < currentMediaItems.length - 1) {
                    nextMedia();
                }
            } else {
                // Swipe right - previous
                if (currentMediaIndex > 0) {
                    prevMedia();
                }
            }
        }
        
        xDown = null;
        yDown = null;
    };
}

// Enhanced loading states for mobile
function showMobileLoadingState() {
    const postsContainer = document.querySelector('.posts-container');
    if (postsContainer && window.innerWidth <= 768) {
        postsContainer.innerHTML = `
            <div class="posts-loading" id="posts-loading">
                <div class="post-skeleton">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line long"></div>
                    </div>
                </div>
                <div class="post-skeleton">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line long"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize all mobile features
function initMobileFeatures() {
    setupMobileSidebar();
    setupMobileResponsive();
    setupMobilePostCreator();
    // setupMobileNotifications(); // REMOVIDO - CONFLITAVA COM O LISTENER GLOBAL
    setupMobileCarousel();
    
    // Show loading state initially on mobile
    if (window.innerWidth <= 768) {
        showMobileLoadingState();
    }
}

  function updateThemeIcon(theme) {
    const themeToggleIcon = document.querySelector(".theme-toggle i");
    if (themeToggleIcon) {
      if (theme === "dark") {
        themeToggleIcon.classList.remove("fa-sun");
        themeToggleIcon.classList.add("fa-moon");
      } else {
        themeToggleIcon.classList.remove("fa-moon");
        themeToggleIcon.classList.add("fa-sun");
      }
    }
  }
  setInitialTheme();
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
});

// =================================================================
// LÓGICA GLOBAL (Executa em TODAS as páginas)
// =================================================================
const backendUrl = "http://localhost:8080";
const jwtToken = localStorage.getItem("token");
const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;
const messageBadgeElement = document.getElementById("message-badge");
const defaultProjectUrl = `${backendUrl}/images/default-project.jpg`;

// Variáveis globais para que outros scripts (como mensagem.js) possam acessá-las
let stompClient = null;
let currentUser = null;
let userFriends = [];
let friendsLoaded = false;
let latestOnlineEmails = [];

// Variáveis globais para o carrossel
let currentMediaIndex = 0;
let currentMediaItems = [];

// Torna as variáveis e funções essenciais acessíveis globalmente
window.stompClient = stompClient;
window.currentUser = currentUser;
window.jwtToken = jwtToken;
window.backendUrl = backendUrl;
window.getAvatarUrl = function(fotoPerfil) {
    if (!fotoPerfil) {
        return window.defaultAvatarUrl || 'https://via.placeholder.com/150'; 
    }
    if (fotoPerfil.startsWith('http')) {
        return fotoPerfil;
    }
    return `${window.backendUrl}/api/arquivos/${fotoPerfil}`;
}
window.defaultProjectUrl = defaultProjectUrl;
window.defaultAvatarUrl = defaultAvatarUrl;
window.showNotification = showNotification;
window.axios = axios; // Assume que Axios está carregado globalmente

// --- SELEÇÃO DE ELEMENTOS GLOBAIS ---
// (Presentes em principal.html e mensagem.html)
const globalElements = {
  userDropdownTrigger: document.querySelector(".user-dropdown .user"),
  logoutBtn: document.getElementById("logout-btn"),
  notificationCenter: document.querySelector(".notification-center"),
  notificationsIcon: document.getElementById("notifications-icon"),
  notificationsPanel: document.getElementById("notifications-panel"),
  notificationsList: document.getElementById("notifications-list"),
  notificationsBadge: document.getElementById("notifications-badge"),
  onlineFriendsList: document.getElementById("online-friends-list"),
  connectionsCount: document.getElementById("connections-count"),
  topbarUserName: document.getElementById("topbar-user-name"),
  sidebarUserName: document.getElementById("sidebar-user-name"),
  sidebarUserTitle: document.getElementById("sidebar-user-title"),
  topbarUserImg: document.getElementById("topbar-user-img"),
  sidebarUserImg: document.getElementById("sidebar-user-img"),

  // Modais de Perfil
  editProfileBtn: document.getElementById("edit-profile-btn"),
  deleteAccountBtn: document.getElementById("delete-account-btn"),
  editProfileModal: document.getElementById("edit-profile-modal"),
  // Adicionando os elementos do modal de perfil que faltavam (baseado no principal.js original)
  editProfileForm: document.getElementById("edit-profile-form"),
  cancelEditProfileBtn: document.getElementById("cancel-edit-profile-btn"),
  editProfilePicInput: document.getElementById("edit-profile-pic-input"),
  editProfilePicPreview: document.getElementById("edit-profile-pic-preview"),
  editProfileName: document.getElementById("edit-profile-name"),
  editProfileBio: document.getElementById("edit-profile-bio"),
  editProfileDob: document.getElementById("edit-profile-dob"),
  editProfilePassword: document.getElementById("edit-profile-password"),
  editProfilePasswordConfirm: document.getElementById(
    "edit-profile-password-confirm"
  ),
  deleteAccountModal: document.getElementById("delete-account-modal"),
  deleteAccountForm: document.getElementById("delete-account-form"),
  cancelDeleteAccountBtn: document.getElementById("cancel-delete-account-btn"),
  deleteConfirmPassword: document.getElementById("delete-confirm-password"),
};

function highlightActiveSidebarItem() {
    // 1. Pega o nome da página atual (ex: "amizades.html" ou "principal.html")
    const currentPage = window.location.pathname.split("/").pop() || "principal.html";
    
    // 2. Seleciona todos os links do menu lateral
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    
    // 3. Remove a classe 'active' de todos e adiciona no correto
    menuItems.forEach(item => {
        // Remove active de todos primeiro
        item.classList.remove('active');
        
        // Pega o href do link (ex: "amizades.html")
        const itemHref = item.getAttribute('href');
        
        // Verifica se o link corresponde à página atual
        if (itemHref === currentPage || (currentPage === "" && itemHref === "principal.html")) {
            item.classList.add('active');
        }
        
        // Caso especial: Se estiver em "buscar_amigos.html", destaca "Encontrar Pessoas"
        if (currentPage === "buscar_amigos.html" && itemHref === "buscar_amigos.html") {
             item.classList.add('active');
        }
    });
}

/**
 * Função de inicialização global. Carrega usuário, conecta WS, busca amigos e notificações.
 */
async function initGlobal() {



  if (!jwtToken) {
    window.location.href = "login.html";
    return;
  }
  axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

  try {
    // 1. Carrega o usuário
    const response = await axios.get(`${backendUrl}/usuarios/me`);
    currentUser = response.data;
    window.currentUser = currentUser; // Atualiza a global

    // 2. Atualiza a UI (sidebar/topbar)
    updateUIWithUserData(currentUser);
    
   
    // 4. Conecta ao WebSocket
    connectWebSocket(); // Define window.stompClient

    // 5. Busca dados da sidebar (Amigos/Notificações)
    await fetchFriends();
    await fetchInitialOnlineFriends();
    atualizarStatusDeAmigosNaUI();
    fetchNotifications();

    setupGlobalEventListeners();
  } catch (error) {
    console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }
}

// --- FUNÇÕES GLOBAIS (Auth, UI, WebSocket, Notificações) ---


function updateUIWithUserData(user) {
  if (!user) return;
  const userImage =
    user.urlFotoPerfil && user.urlFotoPerfil.startsWith("http")
      ? user.urlFotoPerfil
      : `${window.backendUrl}${
          user.urlFotoPerfil || "/images/default-avatar.jpg"
        }`;

  const topbarUser = document.querySelector(".user-dropdown .user");
  if (topbarUser) {
    topbarUser.innerHTML = `
            <div class="profile-pic"><img src="${userImage}" alt="Perfil"></div>
            <span>${user.nome}</span>
            <i class="fas fa-chevron-down"></i>
        `;
  }

  // Atualiza a Sidebar (se existir na página)
  if (globalElements.sidebarUserName)
    globalElements.sidebarUserName.textContent = user.nome;
  if (globalElements.sidebarUserTitle)
    globalElements.sidebarUserTitle.textContent =
      user.tipoUsuario || "Membro da Comunidade";
  if (globalElements.sidebarUserImg)
    globalElements.sidebarUserImg.src = userImage;

  const projectsCountElement = document.getElementById("projects-count");
  if (projectsCountElement) {
      // Usa o valor vindo do Backend ou 0 se for nulo
      projectsCountElement.textContent = user.totalProjetos || 0;
  }

  // Atualiza a imagem do criador de post (se existir na página)
  const postCreatorImg = document.getElementById("post-creator-img");
  if (postCreatorImg) postCreatorImg.src = userImage;
}

// Função global para expandir/recolher comentários
window.toggleCommentReadMore = (btn) => {
    // O botão é irmão (sibling) do parágrafo .comment-content
    // Estrutura: .comment-body > .comment-author, .comment-content, button
    const commentParagraph = btn.previousElementSibling; 
    
    if (commentParagraph && commentParagraph.classList.contains('text-clamped')) {
        // Expandir
        commentParagraph.classList.remove('text-clamped');
        btn.textContent = "Ler menos";
    } else if (commentParagraph) {
        // Recolher
        commentParagraph.classList.add('text-clamped');
        btn.textContent = "Ler mais";
    }
};

function connectWebSocket() {
  const socket = new SockJS(`${backendUrl}/ws`);
  stompClient = Stomp.over(socket);
  stompClient.debug = null;
  const headers = { Authorization: `Bearer ${jwtToken}` };

  stompClient.connect(
    headers,
    (frame) => {
      window.stompClient = stompClient;

      // INSCRIÇÃO GLOBAL: Notificações
      stompClient.subscribe(`/user/queue/notifications`, (message) => {
        console.log("NOTIFICAÇÃO RECEBIDA!", message.body);
        const newNotification = JSON.parse(message.body);
        showNotification(
          `Nova notificação: ${newNotification.mensagem}`,
          "info"
        );
        if (globalElements.notificationsList) {
          const emptyState =
            globalElements.notificationsList.querySelector(".empty-state");
          if (emptyState) emptyState.remove();
          const newItem = createNotificationElement(newNotification); //
          globalElements.notificationsList.prepend(newItem);
        }
        if (globalElements.notificationsBadge) {
          const currentCount =
            parseInt(globalElements.notificationsBadge.textContent) || 0;
          const newCount = currentCount + 1;
          globalElements.notificationsBadge.textContent = newCount;
          globalElements.notificationsBadge.style.display = "flex";
        }
      });

      stompClient.subscribe('/user/queue/errors', (message) => {
            const errorMessage = message.body; 
            window.showNotification(errorMessage, 'error');
        });

      // INSCRIÇÃO GLOBAL: Status Online
      stompClient.subscribe("/topic/status", (message) => {
        latestOnlineEmails = JSON.parse(message.body); //
        atualizarStatusDeAmigosNaUI();
        document.dispatchEvent(new CustomEvent("onlineStatusUpdated"));
      });

      document.dispatchEvent(
        new CustomEvent("globalScriptsLoaded", {
          detail: { stompClient: window.stompClient, currentUser },
        })
      );

      // Dispara evento para que scripts de página (feed, chat) façam suas inscrições
      document.dispatchEvent(
        new CustomEvent("webSocketConnected", {
          detail: { stompClient },
        })
      );

      stompClient.subscribe(`/user/queue/amizades`, (message) => {
        fetchFriends().then(() => {
          atualizarStatusDeAmigosNaUI();
          document.dispatchEvent(new CustomEvent("friendsListUpdated"));
        });
      });

      // INSCRIÇÃO GLOBAL: Contagem de Mensagens
      stompClient.subscribe(`/user/queue/contagem`, (message) => {
        const count = JSON.parse(message.body);
        updateMessageBadge(count);
      });
      fetchAndUpdateUnreadCount();
    },
    (error) => console.error("ERRO WEBSOCKET:", error)
  );
}

async function fetchAndUpdateUnreadCount() {
  if (!messageBadgeElement) return; // Só executa se o badge existir na página
  try {
    const response = await axios.get(
      `${backendUrl}/api/chat/privado/nao-lidas/contagem`
    );
    const count = response.data;
    updateMessageBadge(count);
  } catch (error) {
    console.error("Erro ao buscar contagem de mensagens não lidas:", error);
  }
}

function updateMessageBadge(count) {
  if (messageBadgeElement) {
    messageBadgeElement.textContent = count;
    messageBadgeElement.style.display = count > 0 ? "flex" : "none";
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  if (globalElements.notificationCenter)
    globalElements.notificationCenter.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// --- Funções Globais: Amigos e Notificações ---

async function fetchFriends() {
  try {
    const response = await axios.get(`${backendUrl}/api/amizades/`); //
    userFriends = response.data;
    window.userFriends = userFriends; // Torna global
    if (globalElements.connectionsCount) {
      globalElements.connectionsCount.textContent = userFriends.length; //
    }
  } catch (error) {
    console.error("Erro ao buscar lista de amigos:", error);
    userFriends = [];
  } finally {
    friendsLoaded = true;
  }
}

async function fetchInitialOnlineFriends() {
  try {
    const response = await axios.get(`${backendUrl}/api/amizades/online`); //
    const amigosOnlineDTOs = response.data;
    latestOnlineEmails = amigosOnlineDTOs.map((amigo) => amigo.email); //
    document.dispatchEvent(new CustomEvent("onlineStatusUpdated"));
  } catch (error) {
    console.error("Erro ao buscar status inicial de amigos online:", error);
    latestOnlineEmails = [];
  }
}

function atualizarStatusDeAmigosNaUI() {
    if (!globalElements.onlineFriendsList) return;
    
    if (!friendsLoaded) {
        // Mantém o loading como está
        globalElements.onlineFriendsList.innerHTML = `
            <div class="results-loading" style="padding: 1rem;">
                <div class="loading-spinner"></div>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Carregando...</p>
            </div>`;
        return;
    }

    const onlineFriends = userFriends.filter(friend => latestOnlineEmails.includes(friend.email));
    globalElements.onlineFriendsList.innerHTML = '';

    if (onlineFriends.length === 0) {
        // --- AQUI ESTÁ A MUDANÇA PARA O ESTILO DA IMAGEM ---
        globalElements.onlineFriendsList.innerHTML = `
            <div class="online-friends-empty-wrapper">
                <div class="online-friends-dashed-box">
                    Nenhum amigo online.
                </div>
            </div>
        `;
    } else {
        onlineFriends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            
            const friendAvatar = friend.fotoPerfil 
                ? (friend.fotoPerfil.startsWith('http') 
                    ? friend.fotoPerfil 
                    : `${window.backendUrl}/api/arquivos/${friend.fotoPerfil}`) 
                : window.defaultAvatarUrl;
            
            const friendId = friend.idUsuario; 

            friendElement.innerHTML = `
                <a href="perfil.html?id=${friendId}" class="friend-item-link">
                    <div class="avatar"><img src="${friendAvatar}" alt="Avatar" onerror="this.src='${window.defaultAvatarUrl}';"></div>
                    <span class="friend-name">${friend.nome}</span>
                </a>
                <div class="status online"></div>
            `;
            globalElements.onlineFriendsList.appendChild(friendElement);
        });
    }
}

async function fetchNotifications() {
  try {
    const response = await axios.get(`${backendUrl}/api/notificacoes`);
    renderNotifications(response.data); //
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
  }
}

function renderNotifications(notifications) {
  if (!globalElements.notificationsList) return;
  globalElements.notificationsList.innerHTML = "";
  const unreadCount = notifications.filter((n) => !n.lida).length; //
  if (globalElements.notificationsBadge) {
    globalElements.notificationsBadge.style.display =
      unreadCount > 0 ? "flex" : "none"; //
    globalElements.notificationsBadge.textContent = unreadCount;
  }
  if (notifications.length === 0) {
    globalElements.notificationsList.innerHTML =
      '<p class="empty-state">Nenhuma notificação.</p>';
    return;
  }
  notifications.forEach((notification) => {
    const item = createNotificationElement(notification); //
    globalElements.notificationsList.appendChild(item);
  });
}

/* --- No arquivo FrontEnd/Principal/JS/principal.js --- */

function createNotificationElement(notification) {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.id = `notification-item-${notification.id}`;
    if (!notification.lida) item.classList.add('unread');

    const data = new Date(notification.dataCriacao).toLocaleString('pt-BR');
    
    let actionButtonsHtml = '';
    let iconClass = 'fa-info-circle'; // Ícone padrão
    let notificationLink = '#'; 

    // IDs vindos do Backend
    const idRef = notification.idReferencia; // ID do Usuário (msg), Projeto ou Post
    const idSec = notification.idReferenciaSecundaria; // ID do Comentário, se houver

    // --- LÓGICA DE ÍCONES E LINKS POR TIPO ---

    // 1. PEDIDO DE AMIZADE
    if (notification.tipo === 'PEDIDO_AMIZADE') {
        iconClass = 'fa-user-plus';
        notificationLink = 'amizades.html';
        
        if (!notification.lida) {
             actionButtonsHtml = `
              <div class="notification-actions">
                 <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.aceitarSolicitacao(${idRef}, ${notification.id})">Aceitar</button>
                 <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); window.recusarSolicitacao(${idRef}, ${notification.id})">Recusar</button>
              </div>`;
        }
    } 
    // 2. MENSAGEM PRIVADA (Novo)
    else if (notification.tipo === 'MENSAGEM_PRIVADA' || notification.tipo === 'NOVA_MENSAGEM') {
        iconClass = 'fa-envelope'; // Ícone de carta/envelope
        // Redireciona para o chat e abre a conversa com o remetente
        notificationLink = `mensagem.html?start_chat=${idRef}`;
    }
    // 3. MENSAGEM DE PROJETO / ATUALIZAÇÃO DE PROJETO (Novo)
    else if (notification.tipo === 'MENSAGEM_PROJETO' || notification.tipo === 'CONVITE_PROJETO' || notification.tipo === 'ATUALIZACAO_PROJETO') {
        iconClass = 'fa-project-diagram'; // Ícone de projeto/diagrama
        // Redireciona para os detalhes do projeto
        notificationLink = `projeto-detalhe.html?id=${idRef}`;
    }
    // 4. INTERAÇÕES SOCIAIS (Comentários/Likes)
    else if (notification.tipo === 'NOVO_COMENTARIO' || notification.tipo === 'CURTIDA_POST' || notification.tipo === 'CURTIDA_COMENTARIO') {
        if (notification.tipo.startsWith('CURTIDA')) {
            iconClass = 'fa-heart';
        } else {
            iconClass = 'fa-comment';
        }
        
        notificationLink = `principal.html?postId=${idRef}`;
        if (idSec) {
            notificationLink += `#comment-${idSec}`;
        }
    }

    // --- CRIAÇÃO DO HTML ---
    // Usa a função handleNotificationClick que criamos no passo anterior
    item.innerHTML = `
        <a href="${notificationLink}" class="notification-link" onclick="window.handleNotificationClick(event, ${notification.id}, '${notificationLink}')">
            <div class="notification-icon-wrapper">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="notification-content">
                <p>${notification.mensagem}</p>
                <span class="timestamp">${data}</span>
            </div>
        </a>
        <div class="notification-actions-wrapper">${actionButtonsHtml}</div>
    `;

    const actionsWrapper = item.querySelector('.notification-actions-wrapper');
    if (actionsWrapper) {
        actionsWrapper.addEventListener('click', e => e.stopPropagation());
    }
    
    return item;
}

/* --- Adicionar no FrontEnd/Principal/JS/principal.js --- */

window.handleNotificationClick = function(event, notificationId, targetUrl) {
    // 1. Previne o comportamento padrão do link para controlarmos a ordem
    event.preventDefault(); 

    // 2. Remove visualmente a marcação de "não lida" imediatamente (UI Otimista)
    const item = document.getElementById(`notification-item-${notificationId}`);
    if(item) item.classList.remove('unread');
    
    // 3. Atualiza o contador de notificações (decrementa 1)
    const badge = document.getElementById('notifications-badge');
    if(badge) {
        let count = parseInt(badge.textContent) || 0;
        if(count > 0) badge.textContent = count - 1;
        if(count - 1 <= 0) badge.style.display = 'none';
    }

    // 4. Envia requisição para o backend marcar como lida (sem await para não travar a navegação)
    axios.put(`${window.backendUrl}/api/notificacoes/${notificationId}/ler`)
        .catch(err => console.error("Erro ao marcar notificação:", err));

    // 5. Redireciona o usuário para a página correta
    if (targetUrl && targetUrl !== '#' && targetUrl !== 'null') {
        window.location.href = targetUrl;
    }
};

async function checkAndHighlightComment() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    const hash = window.location.hash; // Pega o #comment-123

    // Só continua se tiver um postId na URL
    if (!postId) return; 

    let commentId = null;
    if (hash && hash.startsWith('#comment-')) {
        commentId = hash.substring(1); // "comment-123"
    }

    // 1. Encontrar o Post
    let postElement = document.getElementById(`post-${postId}`);
    let attempts = 0;

    // Tenta encontrar o post por até 5 segundos (esperando o fetch das postagens)
    while (!postElement && attempts < 25) {
        await new Promise(resolve => setTimeout(resolve, 200));
        postElement = document.getElementById(`post-${postId}`);
        attempts++;
    }

    if (!postElement) {
        console.warn(`Post ${postId} não encontrado para destacar.`);
        return;
    }

    // 2. Rolar até o Post e Abrir os Comentários
    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const commentsSection = postElement.querySelector('.comments-section');
    if (commentsSection && commentsSection.style.display === 'none') {
        // Clica no botão de comentários (usando a função global)
        window.toggleComments(postId);
        // Espera a UI atualizar
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 3. Se houver um commentId, encontrar e destacar o comentário
    if (commentId) {
        const commentElement = document.getElementById(commentId);
        if (commentElement) {
            // Rola até o comentário
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Adiciona a classe de "flash"
            commentElement.classList.add('highlight-flash');
            
            // Remove a classe após a animação
            setTimeout(() => {
                commentElement.classList.remove('highlight-flash');
            }, 2000); // 2 segundos
        } else {
            console.warn(`Comentário ${commentId} não encontrado no post ${postId}.`);
        }
    }
}

// Função para mostrar/ocultar respostas aninhadas
window.toggleReplies = (buttonElement, commentId) => {
    const repliesContainer = document.getElementById(`replies-for-${commentId}`);
    if (!repliesContainer) return;

    if (repliesContainer.style.display === 'none') {
        // Mostrar respostas
        repliesContainer.style.display = 'flex'; // Usamos 'flex' pois .comment-replies é flex
        buttonElement.innerHTML = `<i class="fas fa-minus-circle"></i> Ocultar respostas`;
    } else {
        // Ocultar respostas
        repliesContainer.style.display = 'none';
        // Re-calcula o número de respostas para o texto do botão
        const replyCount = repliesContainer.children.length;
        const plural = replyCount > 1 ? 'respostas' : 'resposta';
        buttonElement.innerHTML = `<i class="fas fa-comment-dots"></i> Ver ${replyCount} ${plural}`;
    }
};

async function markAllNotificationsAsRead() {
  //
  const unreadCount = parseInt(
    globalElements.notificationsBadge.textContent,
    10
  );
  if (isNaN(unreadCount) || unreadCount === 0) return;
  try {
    await axios.post(`${backendUrl}/api/notificacoes/ler-todas`);
    if (globalElements.notificationsBadge) {
      globalElements.notificationsBadge.style.display = "none";
      globalElements.notificationsBadge.textContent = "0";
    }
    if (globalElements.notificationsList) {
      globalElements.notificationsList
        .querySelectorAll(".notification-item.unread")
        .forEach((item) => item.classList.remove("unread"));
    }
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
  }
}

window.aceitarSolicitacao = async (amizadeId, notificationId) => {
  //
  try {
    await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`); //
    handleFriendRequestFeedback(notificationId, "Pedido aceito!", "success");
    fetchFriends();
  } catch (error) {
    handleFriendRequestFeedback(notificationId, "Erro ao aceitar.", "error");
  }
};

window.recusarSolicitacao = async (amizadeId, notificationId) => {
  //
  try {
    await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`); //
    handleFriendRequestFeedback(notificationId, "Pedido recusado.", "info");
  } catch (error) {
    handleFriendRequestFeedback(notificationId, "Erro ao recusar.", "error");
  }
};

function handleFriendRequestFeedback(notificationId, message, type = "info") {
  //
  const item = document.getElementById(`notification-item-${notificationId}`);
  if (item) {
    const actionsDiv = item.querySelector(".notification-actions-wrapper");
    if (actionsDiv)
      actionsDiv.innerHTML = `<p class="feedback-text ${
        type === "success" ? "success" : ""
      }">${message}</p>`;
    setTimeout(() => {
      item.classList.add("removing");
      setTimeout(() => {
        item.remove();
        if (
          globalElements.notificationsList &&
          globalElements.notificationsList.children.length === 0
        ) {
          globalElements.notificationsList.innerHTML =
            '<p class="empty-state">Nenhuma notificação.</p>';
        }
      }, 500);
    }, 2500);
  }
  fetchNotifications();
}

const closeAllMenus = () => {
  document
    .querySelectorAll(".options-menu, .dropdown-menu")
    .forEach((m) => (m.style.display = "none"));
};

function openEditProfileModal() {
  //
  const elements = globalElements; // usa os elementos globais
  if (!currentUser || !elements.editProfileModal) return;
  elements.editProfilePicPreview.src =
    currentUser.urlFotoPerfil && currentUser.urlFotoPerfil.startsWith("http")
      ? currentUser.urlFotoPerfil
      : `${window.backendUrl}${
          currentUser.urlFotoPerfil || "/images/default-avatar.jpg"
        }`;
  elements.editProfileName.value = currentUser.nome;
  elements.editProfileBio.value = currentUser.bio || "";
  if (currentUser.dataNascimento) {
    elements.editProfileDob.value = currentUser.dataNascimento.split("T")[0];
  }
  elements.editProfilePassword.value = "";
  elements.editProfilePasswordConfirm.value = "";
  elements.editProfileModal.style.display = "flex";
}

function openDeleteAccountModal() {
  //
  const elements = globalElements; // usa os elementos globais
  if (elements.deleteConfirmPassword) elements.deleteConfirmPassword.value = "";
  if (elements.deleteAccountModal)
    elements.deleteAccountModal.style.display = "flex";
}

// --- SETUP DE EVENT LISTENERS GLOBAIS ---
function setupGlobalEventListeners() {
  document.body.addEventListener("click", (e) => {
    if (
      globalElements.notificationsPanel &&
      !globalElements.notificationsPanel.contains(e.target) &&
      !globalElements.notificationsIcon.contains(e.target)
    ) {
      globalElements.notificationsPanel.style.display = "none";
    }
    closeAllMenus();
  });

  const notifIcon = document.getElementById('notifications-icon');
  
  if (notifIcon) {
    // 1. Remove o elemento antigo e cria um novo clone LIMPO (sem eventos antigos)
    const newIcon = notifIcon.cloneNode(true);
    notifIcon.parentNode.replaceChild(newIcon, notifIcon);
    
    // 2. IMPORTANTE: Atualiza TODAS as referências globais para apontar para o NOVO elemento
    // Se não fizermos isso, o código vai tentar colocar as notificações no painel antigo que foi deletado
    globalElements.notificationsIcon = newIcon;
    globalElements.notificationsPanel = newIcon.querySelector('#notifications-panel');
    globalElements.notificationsList = newIcon.querySelector('#notifications-list');
    globalElements.notificationsBadge = newIcon.querySelector('#notifications-badge');

    // 3. Adiciona o evento de clique no NOVO ícone
    globalElements.notificationsIcon.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
        
        // Usa a referência global atualizada
        const panel = globalElements.notificationsPanel;
        const isVisible = panel.style.display === "block";
        
        // Fecha outros menus
        closeAllMenus();
        
        // Alterna visibilidade
        panel.style.display = isVisible ? "none" : "block";
        
        if (!isVisible) {
            markAllNotificationsAsRead();
        }
    });
  }

  if (globalElements.userDropdownTrigger) {
    globalElements.userDropdownTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = globalElements.userDropdownTrigger.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        const isVisible = menu.style.display === "block";
        closeAllMenus();
        if (!isVisible) menu.style.display = "block";
      }
    });
  }


  // --- Listeners de Modais de Perfil ---
  //
if (globalElements.editProfileBtn) {
    // Remove listeners antigos (cloneNode) para evitar abrir modal antigo
    const newProfileBtn = globalElements.editProfileBtn.cloneNode(true);
    globalElements.editProfileBtn.parentNode.replaceChild(newProfileBtn, globalElements.editProfileBtn);
    globalElements.editProfileBtn = newProfileBtn; // Atualiza referência

    globalElements.editProfileBtn.addEventListener("click", (e) => {
        // Se quiser que seja um link padrão, nem precisa do preventDefault
        // Mas se quiser garantir via JS:
        e.preventDefault();
        window.location.href = "perfil.html";
    });
  }

  // 2. Botão SAIR (Logout)
  if (globalElements.logoutBtn) {
    // Remove listeners antigos
    const newLogoutBtn = globalElements.logoutBtn.cloneNode(true);
    globalElements.logoutBtn.parentNode.replaceChild(newLogoutBtn, globalElements.logoutBtn);
    globalElements.logoutBtn = newLogoutBtn;

    globalElements.logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
  if (globalElements.cancelEditProfileBtn)
    globalElements.cancelEditProfileBtn.addEventListener(
      "click",
      () => (globalElements.editProfileModal.style.display = "none")
    );
  if (globalElements.editProfilePicInput)
    globalElements.editProfilePicInput.addEventListener("change", () => {
      const file = globalElements.editProfilePicInput.files[0];
      if (file)
        globalElements.editProfilePicPreview.src = URL.createObjectURL(file);
    });


  // Deletar conta
  if (globalElements.cancelDeleteAccountBtn)
    globalElements.cancelDeleteAccountBtn.addEventListener(
      "click",
      () => (globalElements.deleteAccountModal.style.display = "none")
    );
  if (globalElements.deleteAccountForm)
    globalElements.deleteAccountForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = globalElements.deleteConfirmPassword.value;
      if (!password) {
        showNotification(
          "Por favor, digite sua senha para confirmar.",
          "error"
        );
        return;
      }
      try {
        await axios.post(`${backendUrl}/autenticacao/login`, {
          email: currentUser.email,
          senha: password,
        });
        if (
          confirm("Você tem ABSOLUTA CERTEZA? Esta ação não pode ser desfeita.")
        ) {
          await axios.delete(`${backendUrl}/usuarios/me`);
          alert("Sua conta foi excluída com sucesso.");
          localStorage.clear();
          window.location.href = "login.html";
        }
      } catch (error) {
        showNotification("Senha incorreta. A conta não foi excluída.", "error");
      }
    });
}

// =================================================================
// FUNÇÕES DE RENDERIZAÇÃO (GLOBAL)
// =================================================================

window.createCommentElement = (comment, post, allComments) => {
    const commentAuthorName = comment.autor?.nome || comment.nomeAutor || "Usuário";
    
    // URL da foto
    const rawAvatarUrl = comment.autor?.urlFotoPerfil || comment.urlFotoAutor;
    const commentAuthorAvatar = window.getAvatarUrl(rawAvatarUrl);
    
    // IDs para lógica e link
    const autorIdDoComentario = comment.autor?.id || comment.autorId;
    const autorIdDoPost = post.autor?.id || post.autorId;
    
    // Link para o perfil
    const profileLink = `perfil.html?id=${autorIdDoComentario}`;

    const isAuthor = window.currentUser && String(autorIdDoComentario) === String(window.currentUser.id);
    const isPostOwner = window.currentUser && String(autorIdDoPost) === String(window.currentUser.id);
    
    let optionsMenu = "";

    // Menu de opções (Editar/Excluir)
    if (isAuthor || isPostOwner) {
        // Escapa aspas para evitar erro no JS inline
        const safeContent = comment.conteudo ? comment.conteudo.replace(/'/g, "\\'") : "";
        
        optionsMenu = `
            <button class="comment-options-btn" onclick="event.stopPropagation(); window.openCommentMenu(${comment.id})">
                <i class="fas fa-ellipsis-h"></i>
            </button>
            <div class="options-menu" id="comment-menu-${comment.id}" onclick="event.stopPropagation();">
                ${isAuthor ? `<button onclick="window.openEditCommentModal(${comment.id}, '${safeContent}')"><i class="fas fa-pen"></i> Editar</button>` : ""}
                ${isAuthor || isPostOwner ? `<button class="danger" onclick="window.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Excluir</button>` : ""}
                ${isPostOwner ? `<button onclick="window.highlightComment(${comment.id})"><i class="fas fa-star"></i> ${comment.destacado ? "Remover Destaque" : "Destacar"}</button>` : ""}
            </div>`;
    }

    // Tag de resposta (@Usuario)
    let tagHtml = '';
    if (comment.parentId && allComments) {
        const parentComment = allComments.find(c => c.id === comment.parentId);
        if (parentComment && parentComment.parentId) { 
            const parentAuthorId = parentComment.autorId || parentComment.autor?.id;
            tagHtml = `<a href="perfil.html?id=${parentAuthorId}" class="reply-tag">@${comment.replyingToName || 'Usuario'}</a>`;
        }
    }

    // --- CORREÇÃO DE ESPAÇO: TRIM() ---
    // Remove espaços vazios no inicio e fim
    const rawContent = (comment.conteudo || "").trim(); 

    // --- LÓGICA DE TEXTO LONGO (LER MAIS) ---
    const CHAR_LIMIT = 300;
    let contentHtml = `${tagHtml} ${rawContent}`;
    let readMoreBtnHtml = '';
    let clampClass = '';

    if (rawContent.length > CHAR_LIMIT) {
        clampClass = 'text-clamped';
        readMoreBtnHtml = `<button class="comment-read-more-btn" onclick="window.toggleCommentReadMore(this)">Ler mais</button>`;
    }

    return `
            <div class="comment-container">
                <div class="comment ${comment.destacado ? "destacado" : ""}" id="comment-${comment.id}">
                    
                    <a href="${profileLink}" class="comment-avatar-link">
                        <div class="comment-avatar">
                            <img src="${commentAuthorAvatar}" alt="Avatar" onerror="this.src='${window.defaultAvatarUrl}'">
                        </div>
                    </a>
                    
                    <div class="comment-body">
                        <a href="${profileLink}" class="comment-author-link">
                            <span class="comment-author">${commentAuthorName}</span>
                        </a>

                        <p class="comment-content ${clampClass}">${contentHtml}</p>
                        ${readMoreBtnHtml}
                    </div>

                    ${optionsMenu}
                </div>
                
                <div class="comment-actions-footer">
                    <button class="action-btn-like ${comment.curtidoPeloUsuario ? "liked" : ""}" onclick="window.toggleLike(event, ${post.id}, ${comment.id})">Curtir</button>
                    <button class="action-btn-reply" onclick="window.toggleReplyForm(${comment.id})">Responder</button>
                    <span class="like-count" id="like-count-comment-${comment.id}"><i class="fas fa-heart"></i> ${comment.totalCurtidas || 0}</span>
                </div>
                
                <div class="reply-form" id="reply-form-${comment.id}">
                    <input type="text" id="reply-input-${comment.id}" placeholder="Escreva sua resposta..."><button onclick="window.sendComment(${post.id}, ${comment.id})"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>`;
};

window.renderCommentWithReplies = (comment, allComments, post, isAlreadyInReplyThread = false) => {
    let commentHtml = window.createCommentElement(comment, post, allComments);
    const replies = allComments
        .filter((reply) => reply.parentId === comment.id)
        .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));

    if (replies.length > 0 && !isAlreadyInReplyThread) {
        const plural = replies.length > 1 ? 'respostas' : 'resposta';
        commentHtml += `
            <div class="view-replies-container">
                <button class="btn-view-replies" onclick="window.toggleReplies(this, ${comment.id})">
                    <i class="fas fa-comment-dots"></i> Ver ${replies.length} ${plural}
                </button>
            </div>
            <div class="comment-replies" id="replies-for-${comment.id}" style="display: none;">`;
        
        replies.forEach((reply) => {
            commentHtml += window.renderCommentWithReplies(reply, allComments, post, true);
        });
        commentHtml += `</div>`;
    } else if (replies.length > 0 && isAlreadyInReplyThread) {
        replies.forEach((reply) => {
            commentHtml += window.renderCommentWithReplies(reply, allComments, post, true);
        });
    }
    return commentHtml;
};

// =================================================================
// LÓGICA DE MODAIS DE EDIÇÃO (GLOBAL)
// =================================================================
let selectedFilesForEdit = [];
let urlsParaRemover = [];

function updateEditFilePreview() {
    const container = document.getElementById("edit-file-preview-container");
    if(!container) return;
    
    container.innerHTML = "";
    selectedFilesForEdit.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "file-preview-item";
        const previewElement = document.createElement("img");
        previewElement.src = URL.createObjectURL(file);
        item.appendChild(previewElement);
        
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "remove-file-btn";
        removeBtn.innerHTML = "&times;";
        removeBtn.onclick = () => {
            selectedFilesForEdit.splice(index, 1);
            updateEditFilePreview();
        };
        item.appendChild(removeBtn);
        container.appendChild(item);
    });
}

window.openEditPostModal = async (postId) => {
    const modal = document.getElementById("edit-post-modal");
    const existingMediaContainer = document.getElementById("edit-existing-media-container");
    const idInput = document.getElementById("edit-post-id");
    const textArea = document.getElementById("edit-post-textarea");
    
    if (!modal || !existingMediaContainer) return;
    
    selectedFilesForEdit = [];
    urlsParaRemover = [];
    updateEditFilePreview();
    existingMediaContainer.innerHTML = "<div class='loading-spinner'></div>";
    
    modal.style.display = "flex";

    try {
        const response = await axios.get(`${window.backendUrl}/postagem/${postId}`);
        const post = response.data;
        
        idInput.value = post.id;
        textArea.value = post.conteudo;
        existingMediaContainer.innerHTML = "";

        if(post.urlsMidia) {
            post.urlsMidia.forEach((url) => {
                const item = document.createElement("div");
                item.className = "existing-media-item";
                
                const fullUrl = url.startsWith('http') ? url : `${window.backendUrl}${url}`;
                const preview = document.createElement("img");
                preview.src = fullUrl;
                
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "remove-existing-media-checkbox";
                checkbox.title = "Marque para remover esta imagem";
                checkbox.onchange = (e) => {
                    if (e.target.checked) {
                        urlsParaRemover.push(url);
                        item.style.opacity = "0.5";
                        item.style.border = "2px solid red";
                    } else {
                        urlsParaRemover = urlsParaRemover.filter((u) => u !== url);
                        item.style.opacity = "1";
                        item.style.border = "none";
                    }
                };
                
                item.appendChild(preview);
                item.appendChild(checkbox);
                existingMediaContainer.appendChild(item);
            });
        }
    } catch (error) {
        window.showNotification("Erro ao carregar postagem.", "error");
        modal.style.display = "none";
    }
};

window.openEditCommentModal = (commentId, content) => {
    const modal = document.getElementById("edit-comment-modal");
    if(modal) {
        document.getElementById("edit-comment-id").value = commentId;
        const textarea = document.getElementById("edit-comment-textarea");
        
        // Decodifica o conteúdo caso venha com entities HTML
        textarea.value = content;
        
        modal.style.display = "flex";

        // MELHORIA UX: Foca no final do texto automaticamente
        setTimeout(() => {
            textarea.focus();
            const val = textarea.value;
            textarea.value = ''; 
            textarea.value = val; // Truque para mover o cursor para o final
        }, 50);
    }
};

// Configuração dos Listeners de Modal (Executa ao carregar a página)
document.addEventListener("DOMContentLoaded", () => {

    highlightActiveSidebarItem();

    // Listener do Formulário de Edição de Post
    const editPostForm = document.getElementById("edit-post-form");
    if (editPostForm) {
        // Remover listeners antigos clonando o elemento (opcional, mas seguro)
        const newForm = editPostForm.cloneNode(true);
        editPostForm.parentNode.replaceChild(newForm, editPostForm);
        
        newForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = newForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Salvando...";

            try {
                const postId = document.getElementById("edit-post-id").value;
                const postagemDTO = {
                    conteudo: document.getElementById("edit-post-textarea").value,
                    urlsParaRemover: urlsParaRemover,
                };
                
                const formData = new FormData();
                formData.append("postagem", new Blob([JSON.stringify(postagemDTO)], { type: "application/json" }));
                selectedFilesForEdit.forEach((file) => formData.append("arquivos", file));

                await axios.put(`${window.backendUrl}/postagem/${postId}`, formData);
                
                document.getElementById("edit-post-modal").style.display = "none";
                window.showNotification("Postagem editada com sucesso.", "success");
                
                // Atualiza a postagem na tela sem recarregar
                if(typeof window.fetchAndReplacePost === 'function') {
                    window.fetchAndReplacePost(postId);
                } else {
                    window.location.reload();
                }
            } catch (error) {
                window.showNotification("Erro ao editar postagem.", "error");
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
        
        // Listener do Input de Arquivo no Modal
        const fileInput = document.getElementById("edit-post-files");
        if(fileInput) {
            fileInput.addEventListener("change", (event) => {
                Array.from(event.target.files).forEach((file) => selectedFilesForEdit.push(file));
                updateEditFilePreview();
            });
        }
        
        // Botão Cancelar
        const cancelBtn = document.getElementById("cancel-edit-post-btn");
        if(cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                document.getElementById("edit-post-modal").style.display = "none";
            });
        }
    }

    // Listener do Formulário de Edição de Comentário
    const editCommentForm = document.getElementById("edit-comment-form");
    if(editCommentForm) {
        editCommentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const commentId = document.getElementById("edit-comment-id").value;
            const content = document.getElementById("edit-comment-textarea").value;
            try {
                await axios.put(`${window.backendUrl}/comentarios/${commentId}`, 
                    { conteudo: content },
                    { headers: { "Content-Type": "application/json" } }
                );
                window.showNotification("Comentário editado.", "success");
                document.getElementById("edit-comment-modal").style.display = "none";
                // Recarrega a página ou o post para ver a mudança
                const postElement = document.getElementById(`comment-${commentId}`).closest('.post');
                if(postElement) {
                    const postId = postElement.id.replace('post-', '');
                    window.fetchAndReplacePost(postId);
                }
            } catch (error) {
                window.showNotification("Erro ao editar comentário.", "error");
            }
        });
        
        document.getElementById("cancel-edit-comment-btn")?.addEventListener("click", () => {
            document.getElementById("edit-comment-modal").style.display = "none";
        });
    }
});

// =================================================================
// INICIALIZAÇÃO GLOBAL
// =================================================================
// Inicia a lógica global em TODAS as páginas
document.addEventListener("DOMContentLoaded", initGlobal);

// =================================================================
// LÓGICA DE INTERAÇÃO COM POSTS (GLOBAL - FEED E PERFIL)
// =================================================================
// Estas funções precisam estar disponíveis em qualquer página que exiba posts

// Funções de Ação (Janelas e Menus)
window.openPostMenu = (postId) => {
    closeAllMenus();
    const menu = document.getElementById(`post-menu-${postId}`);
    if (menu) menu.style.display = "block";
};

window.openCommentMenu = (commentId) => {
    closeAllMenus();
    const menu = document.getElementById(`comment-menu-${commentId}`);
    if (menu) menu.style.display = "block";
};

window.toggleComments = (postId) => {
    const cs = document.getElementById(`comments-section-${postId}`);
    if (cs) cs.style.display = cs.style.display === "block" ? "none" : "block";
};

window.toggleReplyForm = (commentId) => {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (form) form.style.display = form.style.display === "flex" ? "none" : "flex";
};

window.sendComment = (postId, parentId = null) => {
    const inputId = parentId ?
        `reply-input-${parentId}` :
        `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    
    if (!input) return;

    const content = input.value.trim();
    if (window.stompClient?.connected && content) {
        window.stompClient.send(
            `/app/postagem/${postId}/comentar`, {},
            JSON.stringify({
                conteudo: content,
                parentId: parentId
            })
        );
        input.value = "";
        if (parentId) {
            const replyForm = document.getElementById(`reply-form-${parentId}`);
            if (replyForm) replyForm.style.display = "none";
        }
    } else {
        window.showNotification("Erro: Conexão perdida ou comentário vazio.", "error");
    }
};

window.toggleLike = async (event, postagemId, comentarioId = null) => {
    const btn = event.currentTarget;
    const isPost = comentarioId === null;
    const countId = isPost ?
        `like-count-post-${postagemId}` :
        `like-count-comment-${comentarioId}`;
    const countSpan = document.getElementById(countId);
    
    // Fallback se o elemento não existir
    if (!countSpan) return;

    let count = parseInt(
        countSpan.innerText.trim().replace(/<[^>]*>/g, ""),
        10
    );
    if (isNaN(count)) count = 0;

    // Atualização Otimista (UI primeiro)
    btn.classList.toggle("liked");
    const isLiked = btn.classList.contains("liked");
    const newCount = isLiked ? count + 1 : count - 1;

    if (isPost) countSpan.textContent = newCount;
    else countSpan.innerHTML = `<i class="fas fa-heart"></i> ${newCount}`;

    try {
        await axios.post(`${window.backendUrl}/curtidas/toggle`, {
            postagemId,
            comentarioId,
        });
    } catch (error) {
        window.showNotification("Erro ao processar curtida.", "error");
        // Reverte em caso de erro
        btn.classList.toggle("liked");
        if (isPost) countSpan.textContent = count;
        else countSpan.innerHTML = `<i class="fas fa-heart"></i> ${count}`;
    }
};

window.deletePost = async (postId) => {
    if (confirm("Tem certeza que deseja excluir esta postagem?")) {
        try {
            await axios.delete(`${window.backendUrl}/postagem/${postId}`);
            window.showNotification("Postagem excluída.", "success");
            
            // Remove da tela imediatamente
            const postElement = document.getElementById(`post-${postId}`);
            if(postElement) postElement.remove();
            
        } catch (error) {
            window.showNotification("Erro ao excluir postagem.", "error");
        }
    }
};

window.deleteComment = async (commentId) => {
    if (confirm("Tem certeza que deseja excluir este comentário?")) {
        try {
            await axios.delete(`${window.backendUrl}/comentarios/${commentId}`);
            window.showNotification("Comentário excluído.", "success");
            // A atualização visual virá via WebSocket geralmente, mas podemos forçar recarregamento se necessário
        } catch (error) {
            window.showNotification("Erro ao excluir comentário.", "error");
        }
    }
};

window.highlightComment = async (commentId) => {
    try {
        await axios.put(`${window.backendUrl}/comentarios/${commentId}/destacar`);
    } catch (error) {
        window.showNotification("Erro ao destacar.", "error");
    }
};

// =================================================================
// LÓGICA ESPECIALIZADA (Só executa se estiver na página principal)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {

  
  // 1. Verifica se estamos na página principal para carregar o feed
  const postsContainer = document.querySelector(".posts-container");
  if (!postsContainer) {
    return; // Sai se não for a página de feed (ex: está em mensagem.html)
  }

  // --- SELEÇÃO DE ELEMENTOS (Específicos do Feed) ---
  //
  const feedElements = {
    postsContainer: postsContainer,
    postTextarea: document.getElementById("post-creator-textarea"),
    postFileInput: document.getElementById("post-file-input"),
    filePreviewContainer: document.getElementById("file-preview-container"),
    publishBtn: document.getElementById("publish-post-btn"),
    editPostModal: document.getElementById("edit-post-modal"),
    editPostForm: document.getElementById("edit-post-form"),
    editPostIdInput: document.getElementById("edit-post-id"),
    editPostTextarea: document.getElementById("edit-post-textarea"),
    cancelEditPostBtn: document.getElementById("cancel-edit-post-btn"),
    editPostFileInput: document.getElementById("edit-post-files"),
    editFilePreviewContainer: document.getElementById(
      "edit-file-preview-container"
    ),
    editCommentModal: document.getElementById("edit-comment-modal"),
    editCommentForm: document.getElementById("edit-comment-form"),
    editCommentIdInput: document.getElementById("edit-comment-id"),
    editCommentTextarea: document.getElementById("edit-comment-textarea"),
    cancelEditCommentBtn: document.getElementById("cancel-edit-comment-btn"),
  };

  let selectedFilesForPost = [];
  const searchInput = document.getElementById("search-input");

  // --- FUNÇÕES DE CARROSSEL ---
  
  // Função para abrir o visualizador de mídias
  window.openMediaViewer = (mediaUrls, startIndex = 0) => {
      const modal = document.getElementById('media-viewer-modal');
      const container = document.getElementById('carousel-container');
      const indicators = document.getElementById('carousel-indicators');
      
      if (!modal || !container) return;
      
      currentMediaItems = mediaUrls;
      currentMediaIndex = startIndex;
      
      // Limpar conteúdo anterior
      container.innerHTML = '';
      indicators.innerHTML = '';
      
      // Adicionar mídias ao carrossel
      mediaUrls.forEach((url, index) => {
          const slide = document.createElement('div');
          slide.className = `carousel-slide ${index === startIndex ? 'active' : ''}`;
          
          const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          
          if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
              slide.innerHTML = `<video controls autoplay src="${fullMediaUrl}" style="max-width: 100%; max-height: 100%;"></video>`;
          } else {
              slide.innerHTML = `<img src="${fullMediaUrl}" alt="Mídia da postagem" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
          }
          
          container.appendChild(slide);
          
          // Adicionar indicador
          const indicator = document.createElement('span');
          indicator.className = `carousel-indicator ${index === startIndex ? 'active' : ''}`;
          indicator.onclick = () => goToMedia(index);
          indicators.appendChild(indicator);
      });
      
      modal.style.display = 'flex';
      updateCarouselControls();
  };

  // Função para navegar para uma mídia específica
  function goToMedia(index) {
      const slides = document.querySelectorAll('.carousel-slide');
      const indicators = document.querySelectorAll('.carousel-indicator');
      
      if (index < 0 || index >= slides.length) return;
      
      // Remover classe active de todos
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));
      
      // Adicionar classe active ao slide e indicador atual
      slides[index].classList.add('active');
      indicators[index].classList.add('active');
      
      currentMediaIndex = index;
      updateCarouselControls();
  }

  // Função para ir para a próxima mídia
  function nextMedia() {
      goToMedia(currentMediaIndex + 1);
  }

  // Função para ir para a mídia anterior
  function prevMedia() {
      goToMedia(currentMediaIndex - 1);
  }

  // Função para atualizar controles do carrossel
  function updateCarouselControls() {
      const prevBtn = document.getElementById('carousel-prev');
      const nextBtn = document.getElementById('carousel-next');
      
      if (prevBtn) prevBtn.disabled = currentMediaIndex === 0;
      if (nextBtn) nextBtn.disabled = currentMediaIndex === currentMediaItems.length - 1;
  }

  // Fechar visualizador de mídias
  function closeMediaViewer() {
      const modal = document.getElementById('media-viewer-modal');
      if (modal) modal.style.display = 'none';
      
      // Parar vídeos
      document.querySelectorAll('.carousel-slide video').forEach(video => {
          video.pause();
          video.currentTime = 0;
      });
      
      currentMediaItems = [];
      currentMediaIndex = 0;
  }

  // Função para renderizar mídias em grid
  function renderMediaGrid(mediaUrls) {
      if (!mediaUrls || mediaUrls.length === 0) return '';
      
      const count = mediaUrls.length;
      let gridClass = 'single';
      let displayItems = mediaUrls;
      
      if (count === 2) {
          gridClass = 'double';
      } else if (count === 3) {
          gridClass = 'triple';
      } else if (count >= 4) {
          gridClass = 'multiple';
          displayItems = mediaUrls.slice(0, 4);
      }
      
      let mediaHtml = `<div class="post-media-grid ${gridClass}">`;
      
      displayItems.forEach((url, index) => {
          const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          const isMoreItem = count > 4 && index === 3;
          const moreClass = isMoreItem ? ' more' : '';
          
          mediaHtml += `
              <div class="post-media-item${moreClass}" 
                   onclick="window.openMediaViewer(${JSON.stringify(mediaUrls)}, ${index})">
          `;
          
          if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
              mediaHtml += `<video src="${fullMediaUrl}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
          } else {
              mediaHtml += `<img src="${fullMediaUrl}" alt="Mídia da postagem" style="width: 100%; height: 100%; object-fit: cover;">`;
          }
          
          if (isMoreItem) {
              mediaHtml += `<div class="more-overlay">+${count - 4}</div>`;
          }
          
          mediaHtml += `</div>`;
      });
      
      mediaHtml += `</div>`;
      return mediaHtml;
  }

  // =================================================================
// NOVAS FUNÇÕES DO CARROSSEL DO FEED
// =================================================================

// Função para rolar o carrossel do feed
window.scrollFeedCarousel = (postId, direction) => {
    const track = document.getElementById(`feed-track-${postId}`);
    if (track) {
        // Rola a largura do container (um slide completo)
        const scrollAmount = track.clientWidth; 
        track.scrollBy({
            left: scrollAmount * direction,
            behavior: 'smooth'
        });
    }
};



// Função que gera o HTML do carrossel para o Feed
function renderFeedCarousel(mediaUrls, postId) {
    let slidesHtml = '';

    mediaUrls.forEach((url, index) => {
        const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
        // Escapa as aspas
        const safeMediaArray = JSON.stringify(mediaUrls).replace(/"/g, '&quot;');
        
        let contentHtml = '';
        if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
            contentHtml = `<video src="${fullMediaUrl}" preload="metadata"></video>`;
        } else {
            contentHtml = `<img src="${fullMediaUrl}" alt="Mídia do post" loading="lazy">`;
        }

        slidesHtml += `
            <div class="feed-carousel-slide" onclick="window.openMediaViewer(${safeMediaArray}, ${index})">
                ${contentHtml}
            </div>
        `;
    });

    // Adicionei IDs específicos para o contador e atributos de dados
    return `
        <div class="feed-carousel-wrapper">
            <button class="feed-carousel-btn prev" onclick="event.stopPropagation(); window.scrollFeedCarousel(${postId}, -1)">
                <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="feed-carousel-track" id="feed-track-${postId}">
                ${slidesHtml}
            </div>
            
            <button class="feed-carousel-btn next" onclick="event.stopPropagation(); window.scrollFeedCarousel(${postId}, 1)">
                <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="feed-carousel-counter" id="feed-counter-${postId}">1 / ${mediaUrls.length}</div>
        </div>
    `;
}

// Nova função para ativar o listener de scroll do carrossel
function setupCarouselEventListeners(postElement, postId) {
    const track = postElement.querySelector(`#feed-track-${postId}`);
    const counter = postElement.querySelector(`#feed-counter-${postId}`);

    if (track && counter) {
        // Usamos um pequeno debounce para performance, ou chamamos direto no scroll
        track.addEventListener('scroll', () => {
            const trackWidth = track.clientWidth;
            if (trackWidth === 0) return;
            
            // Calcula o índice atual baseado na rolagem horizontal
            const index = Math.round(track.scrollLeft / trackWidth) + 1;
            
            // Pega o total de slides contando os filhos
            const total = track.children.length;
            
            // Atualiza o texto
            counter.textContent = `${index} / ${total}`;
        });
    }
}

  // --- FUNÇÕES (Específicas do Feed) ---

  // NOVA FUNÇÃO: Mostrar estado de carregamento do feed
  function showFeedLoading() {
    feedElements.postsContainer.innerHTML = `
      <div class="post-skeleton">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line long"></div>
        </div>
      </div>
      <div class="post-skeleton">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line long"></div>
        </div>
      </div>
    `;
  }

  async function fetchPublicPosts() {
    //
    // Mostra estado de carregamento
    showFeedLoading();
    
    try {
      const response = await axios.get(`${backendUrl}/api/chat/publico`);
      feedElements.postsContainer.innerHTML = "";
      const sortedPosts = response.data.sort(
        (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)
      );
      sortedPosts.forEach((post) => showPublicPost(post));
    } catch (error) {
      console.error("Erro ao buscar postagens:", error);
      feedElements.postsContainer.innerHTML =
        "<p>Não foi possível carregar o feed.</p>";
    }
  }

// Localize e substitua a função createPostElement no arquivo principal.js
function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.id = `post-${post.id}`;
    
    const autorNome = post.nomeAutor || "Usuário Desconhecido";
    const autorIdDoPost = post.autorId;
    const fotoAutorPath = post.urlFotoAutor;
    const autorAvatar = fotoAutorPath && fotoAutorPath.startsWith("http")
        ? fotoAutorPath
        : `${window.backendUrl}${fotoAutorPath || "/images/default-avatar.jpg"}`;
        
    const dataFormatada = new Date(post.dataCriacao).toLocaleString("pt-BR");
    const isAuthor = currentUser && autorIdDoPost === currentUser.id;
    
    // Link para o perfil do autor
    const profileLink = `perfil.html?id=${autorIdDoPost}`;
    
    let mediaHtml = "";

    if (post.urlsMidia && post.urlsMidia.length > 0) {
        if (post.urlsMidia.length > 2) {
            mediaHtml = renderFeedCarousel(post.urlsMidia, post.id);
        } else if (post.urlsMidia.length === 1) {
            const url = post.urlsMidia[0];
            const fullMediaUrl = url.startsWith("http") ? url : `${window.backendUrl}${url}`;
            const safeMediaArray = JSON.stringify(post.urlsMidia).replace(/"/g, '&quot;');

            if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
                mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)">
                                <video controls src="${fullMediaUrl}" style="max-width: 100%; border-radius: 8px;"></video>
                             </div>`;
            } else {
                mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)">
                                <img src="${fullMediaUrl}" alt="Mídia da postagem" style="max-width: 100%; border-radius: 8px; cursor: pointer;">
                             </div>`;
            }
        } else {
            mediaHtml = renderMediaGrid(post.urlsMidia);
        }
    }

    const rootComments = (post.comentarios || []).filter((c) => !c.parentId);
    let commentsHtml = rootComments
      .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao))
      .map((comment) =>
        window.renderCommentWithReplies(comment, post.comentarios, post)
      )
      .join("");
      
    let optionsMenu = "";
    if (isAuthor) {
      optionsMenu = `
                <div class="post-options">
                    <button class="post-options-btn" onclick="event.stopPropagation(); window.openPostMenu(${post.id})"><i class="fas fa-ellipsis-h"></i></button>
                    <div class="options-menu" id="post-menu-${post.id}" onclick="event.stopPropagation();">
                        <button onclick="window.openEditPostModal(${post.id})"><i class="fas fa-pen"></i> Editar</button>
                        <button class="danger" onclick="window.deletePost(${post.id})"><i class="fas fa-trash"></i> Excluir</button>
                    </div>
                </div>`;
    }

    // AQUI ESTÁ A ALTERAÇÃO PRINCIPAL (Adição do <a>)
    postElement.innerHTML = `
            <div class="post-header">
                <a href="${profileLink}" class="post-author-details-link">
                    <div class="post-author-details">
                        <div class="post-author-avatar">
                            <img src="${autorAvatar}" alt="${autorNome}" onerror="this.src='${defaultAvatarUrl}';">
                        </div>
                        <div class="post-author-info">
                            <strong>${autorNome}</strong>
                            <span>${dataFormatada}</span>
                        </div>
                    </div>
                </a>
                ${optionsMenu}
            </div>
            <div class="post-content"><p>${post.conteudo}</p></div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="action-btn ${post.curtidoPeloUsuario ? "liked" : ""}" onclick="window.toggleLike(event, ${post.id}, null)"><i class="fas fa-heart"></i> <span id="like-count-post-${post.id}">${post.totalCurtidas || 0}</span></button>
                <button class="action-btn" onclick="window.toggleComments(${post.id})"><i class="fas fa-comment"></i> <span>${post.comentarios?.length || 0}</span></button>
            </div>
            <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
                <div class="comments-list">${commentsHtml}</div>
                <div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Adicione um comentário..."><button onclick="window.sendComment(${post.id}, null)"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>`;

    if (post.urlsMidia && post.urlsMidia.length > 2) {
        setupCarouselEventListeners(postElement, post.id);
    }
    return postElement;
}

  function showPublicPost(post, prepend = false) {
    //
    const postElement = createPostElement(post);
    prepend
      ? feedElements.postsContainer.prepend(postElement)
      : feedElements.postsContainer.appendChild(postElement);
  }

async function fetchAndReplacePost(postId) {
    const oldPostElement = document.getElementById(`post-${postId}`);
    
    // --- 1. Salvar Estado da UI (Antes do Fetch) ---
    let wasCommentsVisible = false;
    const openReplyContainerIds = new Set(); // Guarda IDs dos containers de resposta abertos

    if (oldPostElement) {
        // Salva se os comentários principais (nível 0) estavam abertos
        const oldCommentsSection = oldPostElement.querySelector(".comments-section");
        if (oldCommentsSection) {
            wasCommentsVisible = oldCommentsSection.style.display === 'block';
        }
        
        // Salva o ID de todos os containers de RESPOSTA (nível 1+) que estavam abertos
        const oldReplyContainers = oldPostElement.querySelectorAll('.comment-replies');
        oldReplyContainers.forEach(container => {
            // Usamos 'flex' porque foi o que definimos no toggleReplies
            if (container.style.display === 'flex') { 
                openReplyContainerIds.add(container.id);
            }
        });
    }

    try {
        // --- 2. Buscar Novos Dados ---
        const response = await axios.get(`${backendUrl}/postagem/${postId}`);
        const newPostElement = createPostElement(response.data); // Cria o novo HTML

        // --- 3. Restaurar Estado da UI (no Novo Elemento) ---
        
        // Restaura o container principal de comentários
        if (wasCommentsVisible) {
            const newCommentsSection = newPostElement.querySelector(".comments-section");
            if (newCommentsSection) newCommentsSection.style.display = 'block';
        }
        
        // Restaura todos os containers de resposta que estavam abertos
        if (openReplyContainerIds.size > 0) {
            openReplyContainerIds.forEach(containerId => {
                const newReplyContainer = newPostElement.querySelector(`#${containerId}`);
                if (newReplyContainer) {
                    // Encontra o botão que controla este container
                    const commentId = containerId.replace('replies-for-', '');
                    const button = newPostElement.querySelector(`button[onclick*="window.toggleReplies(this, ${commentId})"]`);
                    
                    // Aplica o estado "aberto"
                    newReplyContainer.style.display = 'flex';
                    if (button) {
                        button.innerHTML = `<i class="fas fa-minus-circle"></i> Ocultar respostas`;
                    }
                }
            });
        }
        
        // --- 4. Substituir o Elemento na DOM ---
        if (oldPostElement) {
            oldPostElement.replaceWith(newPostElement);
        } else {
            // Lógica de fallback caso o post antigo não exista
            // Garante que o nome da função é o correto para o script
            if (typeof showPublicPost === 'function') {
                showPublicPost(response.data, true); // Para principal.js
            } else if (typeof showPost === 'function') {
                showPost(response.data, true); // Para perfil.js
            }
        }

    } catch (error) {
        console.error(`Falha ao recarregar post ${postId}:`, error);
        // Se o post foi excluído (ex: 404), remove o elemento antigo
        if (error.response && error.response.status === 404) {
             if (oldPostElement) oldPostElement.remove();
        }
    }
}

  function handlePublicFeedUpdate(payload) {
    
    const postId = payload.postagem?.id || payload.id || payload.postagemId;
    if (payload.tipo === "remocao" && payload.postagemId) {
      const postElement = document.getElementById(`post-${payload.postagemId}`);
      if (postElement) postElement.remove();
    } else if (postId) {
      fetchAndReplacePost(postId);
    }
  }

  function updateFilePreview() {
    //
    feedElements.filePreviewContainer.innerHTML = "";
    selectedFilesForPost.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "file-preview-item";
      let previewElement = file.type.startsWith("image/")
        ? document.createElement("img")
        : document.createElement("video");
      previewElement.src = URL.createObjectURL(file);
      item.appendChild(previewElement);
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-file-btn";
      removeBtn.innerHTML = "&times;";
      removeBtn.onclick = () => {
        selectedFilesForPost.splice(index, 1);
        feedElements.postFileInput.value = "";
        updateFilePreview();
      };
      item.appendChild(removeBtn);
      feedElements.filePreviewContainer.appendChild(item);
    });
  }
  
  function filterPosts() {
    //
    const searchTerm = searchInput.value.toLowerCase();
    document.querySelectorAll(".post").forEach((post) => {
      const author = post
        .querySelector(".post-author-info strong")
        .textContent.toLowerCase();
      const content = post
        .querySelector(".post-content p")
        .textContent.toLowerCase();
      post.style.display =
        author.includes(searchTerm) || content.includes(searchTerm)
          ? "block"
          : "none";
    });
  }

  // --- SETUP DE EVENT LISTENERS (Específicos do Feed) ---
  function setupFeedEventListeners() {

    
    if (searchInput) searchInput.addEventListener("input", filterPosts);

    // Event listeners para o carrossel de mídias
    const mediaViewerModal = document.getElementById('media-viewer-modal');
    const mediaViewerClose = document.getElementById('media-viewer-close');
    const carouselPrev = document.getElementById('carousel-prev');
    const carouselNext = document.getElementById('carousel-next');
    
    if (mediaViewerClose) {
        mediaViewerClose.addEventListener('click', closeMediaViewer);
    }
    
    if (carouselPrev) {
        carouselPrev.addEventListener('click', prevMedia);
    }
    
    if (carouselNext) {
        carouselNext.addEventListener('click', nextMedia);
    }
    
    // Fechar modal ao clicar fora do conteúdo
    if (mediaViewerModal) {
        mediaViewerModal.addEventListener('click', (e) => {
            if (e.target === mediaViewerModal) {
                closeMediaViewer();
            }
        });
    }
    
    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
        const mediaViewer = document.getElementById('media-viewer-modal');
        if (mediaViewer && mediaViewer.style.display === 'flex') {
            if (e.key === 'Escape') {
                closeMediaViewer();
            } else if (e.key === 'ArrowLeft') {
                prevMedia();
            } else if (e.key === 'ArrowRight') {
                nextMedia();
            }
        }
    });

    if (feedElements.postFileInput)
      feedElements.postFileInput.addEventListener("change", (event) => {
        selectedFilesForPost = Array.from(event.target.files);
        updateFilePreview();
      });
    if (feedElements.publishBtn)
      feedElements.publishBtn.addEventListener("click", async () => {
        const content = feedElements.postTextarea.value.trim();
        if (!content && selectedFilesForPost.length === 0) return;
        feedElements.publishBtn.disabled = true;
        feedElements.publishBtn.innerHTML = `<i class="fas fa-spinner"></i> Publicando...`;
        const formData = new FormData();
        formData.append(
          "postagem",
          new Blob([JSON.stringify({ conteudo: content })], {
            type: "application/json",
          })
        );
        selectedFilesForPost.forEach((file) =>
          formData.append("arquivos", file)
        );
        try {
          await axios.post(`${backendUrl}/postagem/upload-mensagem`, formData);
          feedElements.postTextarea.value = "";
          selectedFilesForPost = [];
          feedElements.postFileInput.value = "";
          updateFilePreview();
        } catch (error) {
          let errorMessage = "Erro ao publicar.";
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                showNotification(errorMessage, "error");
        } finally {
          feedElements.publishBtn.disabled = false;
          feedElements.publishBtn.innerHTML = "Publicar";
        }
      });

    // Espera o WebSocket conectar para carregar o feed e se inscrever
    document.addEventListener("webSocketConnected", (e) => {
      const stompClient = e.detail.stompClient;
      fetchPublicPosts();
      checkAndHighlightComment();
      stompClient.subscribe("/topic/publico", (message) => {
        handlePublicFeedUpdate(JSON.parse(message.body));
      });
    });
  }

  // --- INICIA A LÓGICA DO FEED ---
  setupFeedEventListeners();
});