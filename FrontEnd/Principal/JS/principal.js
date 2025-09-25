document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
  const backendUrl = "http://localhost:8080";
  const jwtToken = localStorage.getItem("token");
  let stompClient = null;
  let currentUser = null;
  let userFriends = []; // VARIÁVEL GLOBAL PARA ARMAZENAR AMIGOS
  let selectedFilesForPost = [];
  let selectedFilesForEdit = [];
  let friendsLoaded = false;
  let latestOnlineEmails = [];

  const searchInput = document.getElementById("search-input");

  // --- ELEMENTOS DO DOM (Seleção Centralizada) ---
  const elements = {
    userDropdownTrigger: document.querySelector(".user-dropdown .user"),
    postsContainer: document.querySelector(".posts-container"),
    logoutBtn: document.getElementById("logout-btn"),
    postTextarea: document.getElementById("post-creator-textarea"),
    postFileInput: document.getElementById("post-file-input"),
    filePreviewContainer: document.getElementById("file-preview-container"),
    publishBtn: document.getElementById("publish-post-btn"),
    notificationCenter: document.querySelector(".notification-center"),

    editPostModal: document.getElementById("edit-post-modal"),
    editPostForm: document.getElementById("edit-post-form"),
    editPostIdInput: document.getElementById("edit-post-id"),
    editPostTextarea: document.getElementById("edit-post-textarea"),
    cancelEditPostBtn: document.getElementById("cancel-edit-post-btn"),
    editPostFileInput: document.getElementById("edit-post-files"),
    editFilePreviewContainer: document.getElementById("edit-file-preview-container"),

    editCommentModal: document.getElementById("edit-comment-modal"),
    editCommentForm: document.getElementById("edit-comment-form"),
    editCommentIdInput: document.getElementById("edit-comment-id"),
    editCommentTextarea: document.getElementById("edit-comment-textarea"),
    cancelEditCommentBtn: document.getElementById("cancel-edit-comment-btn"),

    editProfileBtn: document.getElementById("edit-profile-btn"),
    deleteAccountBtn: document.getElementById("delete-account-btn"),
    editProfileModal: document.getElementById("edit-profile-modal"),
    editProfileForm: document.getElementById("edit-profile-form"),
    cancelEditProfileBtn: document.getElementById("cancel-edit-profile-btn"),
    editProfilePicInput: document.getElementById("edit-profile-pic-input"),
    editProfilePicPreview: document.getElementById("edit-profile-pic-preview"),
    editProfileName: document.getElementById("edit-profile-name"),
    editProfileBio: document.getElementById("edit-profile-bio"),
    editProfileDob: document.getElementById("edit-profile-dob"),
    editProfilePassword: document.getElementById("edit-profile-password"),
    editProfilePasswordConfirm: document.getElementById("edit-profile-password-confirm"),

    deleteAccountModal: document.getElementById("delete-account-modal"),
    deleteAccountForm: document.getElementById("delete-account-form"),
    cancelDeleteAccountBtn: document.getElementById("cancel-delete-account-btn"),
    deleteConfirmPassword: document.getElementById("delete-confirm-password"),

    notificationsIcon: document.getElementById('notifications-icon'),
    notificationsPanel: document.getElementById('notifications-panel'),
    notificationsList: document.getElementById('notifications-list'),
    notificationsBadge: document.getElementById('notifications-badge'),
    onlineFriendsList: document.getElementById('online-friends-list'),
    connectionsCount: document.getElementById('connections-count')
  };

  // --- INICIALIZAÇÃO ---
  async function init() {
    if (!jwtToken) {
      window.location.href = "login.html";
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

    try {
      const response = await axios.get(`${backendUrl}/usuarios/me`);
      currentUser = response.data;
      updateUIWithUserData(currentUser);
      connectWebSocket();
      setupEventListeners();
      fetchFriends();
      fetchNotifications();
    } catch (error) {
      console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }

  // --- FUNÇÕES DE UI ---
  function updateUIWithUserData(user) {
    if (!user) return;

    const userImage = user.urlFotoPerfil
      ? `${backendUrl}${user.urlFotoPerfil}`
      : `${backendUrl}/images/default-avatar.png`;

    const topbarUserName = document.getElementById("topbar-user-name");
    if (topbarUserName) topbarUserName.textContent = user.nome;

    const sidebarUserName = document.getElementById("sidebar-user-name");
    if (sidebarUserName) sidebarUserName.textContent = user.nome;

    const sidebarUserTitle = document.getElementById("sidebar-user-title");
    if (sidebarUserTitle)
      sidebarUserTitle.textContent = user.titulo || "Membro da Comunidade";

    const topbarUserImg = document.getElementById("topbar-user-img");
    if (topbarUserImg) topbarUserImg.src = userImage;

    const sidebarUserImg = document.getElementById("sidebar-user-img");
    if (sidebarUserImg) sidebarUserImg.src = userImage;

    const postCreatorImg = document.getElementById("post-creator-img");
    if (postCreatorImg) postCreatorImg.src = userImage;
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    if (elements.notificationCenter)
      elements.notificationCenter.appendChild(notification);
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

  // --- LÓGICA DO WEBSOCKET ---
  function connectWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    const headers = { Authorization: `Bearer ${jwtToken}` };
    stompClient.connect(
      headers,
      (frame) => {
        console.log("CONECTADO AO WEBSOCKET");
        fetchPublicPosts();
        // Inscrição no feed público
        stompClient.subscribe("/topic/publico", (message) => {
          const payload = JSON.parse(message.body);
          handlePublicFeedUpdate(payload);
        });
        // INSCRIÇÃO PARA NOTIFICAÇÕES
        stompClient.subscribe(`/user/${currentUser.email}/queue/notifications`, (message) => {
          const notification = JSON.parse(message.body);
          showNotification(`Nova notificação: ${notification.mensagem}`, 'info');
          fetchNotifications(); // Busca a lista atualizada para incluir a nova notificação
        });

        // INSCRIÇÃO PARA STATUS ONLINE/OFFLINE
        // 2. Adicione esta inscrição dentro da sua função connectWebSocket
        stompClient.subscribe("/topic/status", (message) => {
          latestOnlineEmails = JSON.parse(message.body);
          // Chama a função para atualizar a UI sempre que a lista de online mudar
         atualizarStatusDeAmigosNaUI();
        });
      },
      (error) => console.error("ERRO WEBSOCKET:", error)
    );
  }

  async function fetchPublicPosts() {
    try {
      const response = await axios.get(`${backendUrl}/api/chat/publico`);
      if (elements.postsContainer) elements.postsContainer.innerHTML = "";
      const sortedPosts = response.data.sort(
        (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)
      );
      sortedPosts.forEach((post) => showPublicPost(post));
    } catch (error) {
      console.error("Erro ao buscar postagens:", error);
      if (elements.postsContainer)
        elements.postsContainer.innerHTML =
          "<p>Não foi possível carregar o feed.</p>";
    }
  }

  // --- FUNÇÕES DE RENDERIZAÇÃO ---
  function renderCommentWithReplies(comment, allComments, post) {
    let commentHtml = createCommentElement(comment, post);
    const replies = allComments
      .filter((reply) => reply.parentId === comment.id)
      .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));
    if (replies.length > 0) {
      commentHtml += `<div class="comment-replies">`;
      replies.forEach((reply) => {
        commentHtml += renderCommentWithReplies(reply, allComments, post);
      });
      commentHtml += `</div>`;
    }
    return commentHtml;
  }

  function createCommentElement(comment, post) {
    const commentAuthorName =
      comment.autor?.nome || comment.nomeAutor || "Usuário";
    const commentAuthorAvatar = comment.urlFotoAutor
      ? `${backendUrl}/api/arquivos/${comment.urlFotoAutor}`
      : `${backendUrl}/images/default-avatar.png`;
    const autorIdDoComentario = comment.autor?.id || comment.autorId;
    const autorIdDoPost = post.autor?.id || post.autorId;
    const isAuthor = currentUser && autorIdDoComentario == currentUser.id;
    const isPostOwner = currentUser && autorIdDoPost == currentUser.id;
    let optionsMenu = "";
    if (isAuthor || isPostOwner) {
      optionsMenu = `
                <button class="comment-options-btn" onclick="event.stopPropagation(); window.openCommentMenu(${comment.id
        })">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="options-menu" id="comment-menu-${comment.id
        }" onclick="event.stopPropagation();">
                    ${isAuthor
          ? `<button onclick="window.openEditCommentModal(${comment.id
          }, '${comment.conteudo.replace(
            /'/g,
            "\\'"
          )}')"><i class="fas fa-pen"></i> Editar</button>`
          : ""
        }
                    ${isAuthor || isPostOwner
          ? `<button class="danger" onclick="window.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Excluir</button>`
          : ""
        }
                    ${isPostOwner
          ? `<button onclick="window.highlightComment(${comment.id
          })"><i class="fas fa-star"></i> ${comment.destacado ? "Remover Destaque" : "Destacar"
          }</button>`
          : ""
        }
                </div>
            `;
    }
    return `
            <div class="comment-container">
                <div class="comment ${comment.destacado ? "destacado" : ""
      }" id="comment-${comment.id}">
                    <div class="comment-avatar"><img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}"></div>
                    <div class="comment-body">
                        <span class="comment-author">${commentAuthorName}</span>
                        <p class="comment-content">${comment.conteudo}</p>
                    </div>
                    ${optionsMenu}
                </div>
                <div class="comment-actions-footer">
                    <button class="action-btn-like ${comment.curtidoPeloUsuario ? "liked" : ""
      }" onclick="window.toggleLike(event, ${post.id}, ${comment.id
      })">Curtir</button>
                    <button class="action-btn-reply" onclick="window.toggleReplyForm(${comment.id
      })">Responder</button>
                    <span class="like-count" id="like-count-comment-${comment.id
      }"><i class="fas fa-heart"></i> ${comment.totalCurtidas || 0
      }</span>
                </div>
                <div class="reply-form" id="reply-form-${comment.id}">
                    <input type="text" id="reply-input-${comment.id
      }" placeholder="Escreva sua resposta..."><button onclick="window.sendComment(${post.id
      }, ${comment.id})"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
  }

  function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.id = `post-${post.id}`;

    // Extrai informações do autor de forma segura
    const autorNome = post.nomeAutor || "Usuário Desconhecido";
    const autorIdDoPost = post.autorId;

    // Lógica para obter a URL da foto do autor
    const fotoAutorPath = post.urlFotoAutor;

    // Se a URL já for uma URL completa (ex: começa com http), use-a diretamente.
    // Caso contrário, concatene a URL base do backend.
    const autorAvatar = fotoAutorPath
      ? fotoAutorPath.startsWith("http")
        ? fotoAutorPath
        : `${backendUrl}/api/arquivos/${fotoAutorPath}`
      : `${backendUrl}/images/default-avatar.png`;

    const dataFormatada = new Date(post.dataCriacao).toLocaleString("pt-BR");
    const isAuthor = currentUser && autorIdDoPost === currentUser.id;

    // Constrói o HTML da mídia
    let mediaHtml = "";
    if (post.urlsMidia && post.urlsMidia.length > 0) {
      mediaHtml = `<div class="post-media">${post.urlsMidia
        .map((url) => {
          const fullMediaUrl = url.startsWith("http")
            ? url
            : `${backendUrl}${url}`;
          if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i))
            return `<img src="${fullMediaUrl}" alt="Mídia da postagem">`;
          if (url.match(/\.(mp4|webm|ogg)$/i))
            return `<video controls src="${fullMediaUrl}"></video>`;
          return "";
        })
        .join("")}</div>`;
    }

    // Constrói o HTML dos comentários
    const rootComments = (post.comentarios || []).filter((c) => !c.parentId);
    let commentsHtml = rootComments
      .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao))
      .map((comment) =>
        renderCommentWithReplies(comment, post.comentarios, post)
      )
      .join("");

    // Constrói o menu de opções
    let optionsMenu = "";
    if (isAuthor) {
      optionsMenu = `
            <div class="post-options">
                <button class="post-options-btn" onclick="event.stopPropagation(); window.openPostMenu(${post.id
        })"><i class="fas fa-ellipsis-h"></i></button>
                <div class="options-menu" id="post-menu-${post.id
        }" onclick="event.stopPropagation();">
                    <button onclick="window.openEditPostModal(${post.id
        }, '${post.conteudo.replace(
          /'/g,
          "\\'"
        )}')"><i class="fas fa-pen"></i> Editar</button>
                    <button class="danger" onclick="window.deletePost(${post.id
        })"><i class="fas fa-trash"></i> Excluir</button>
                </div>
            </div>
        `;
    }

    // Define o conteúdo interno do elemento de postagem
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-author-details">
                <div class="post-author-avatar"><img src="${autorAvatar}" alt="${autorNome}" onerror="this.src='${backendUrl}/images/default-avatar.png';"></div>
                <div class="post-author-info"><strong>${autorNome}</strong><span>${dataFormatada}</span></div>
            </div>
            ${optionsMenu}
        </div>
        <div class="post-content"><p>${post.conteudo}</p></div>
        ${mediaHtml}
        <div class="post-actions">
            <button class="action-btn ${post.curtidoPeloUsuario ? "liked" : ""
      }" onclick="window.toggleLike(event, ${post.id
      }, null)"><i class="fas fa-heart"></i> <span id="like-count-post-${post.id
      }">${post.totalCurtidas || 0}</span></button>
            <button class="action-btn" onclick="window.toggleComments(${post.id
      })"><i class="fas fa-comment"></i> <span>${post.comentarios?.length || 0
      }</span></button>
        </div>
        <div class="comments-section" id="comments-section-${post.id
      }" style="display: none;">
            <div class="comments-list">${commentsHtml}</div>
            <div class="comment-form">
                <input type="text" id="comment-input-${post.id
      }" placeholder="Adicione um comentário..."><button onclick="window.sendComment(${post.id
      }, null)"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    return postElement;
  }

  function showPublicPost(post, prepend = false) {
    if (elements.postsContainer) {
      const postElement = createPostElement(post);
      prepend
        ? elements.postsContainer.prepend(postElement)
        : elements.postsContainer.appendChild(postElement);
    }
  }

  async function fetchAndReplacePost(postId) {
    try {
      const response = await axios.get(`${backendUrl}/postagem/${postId}`);
      const oldPostElement = document.getElementById(`post-${postId}`);
      if (oldPostElement) {
        const wasCommentsVisible =
          oldPostElement.querySelector(".comments-section").style.display ===
          "block";
        const newPostElement = createPostElement(response.data);
        if (wasCommentsVisible) {
          newPostElement.querySelector(".comments-section").style.display =
            "block";
        }
        oldPostElement.replaceWith(newPostElement);
      } else {
        showPublicPost(response.data, true);
      }
    } catch (error) {
      console.error(`Falha ao recarregar post ${postId}:`, error);
    }
  }

  function handlePublicFeedUpdate(payload) {
    if (
      payload.autorAcaoId &&
      currentUser &&
      payload.autorAcaoId == currentUser.id
    ) {
      return;
    }
    const postId = payload.postagem?.id || payload.id || payload.postagemId;
    if (payload.tipo === "remocao" && payload.postagemId) {
      const postElement = document.getElementById(`post-${payload.postagemId}`);
      if (postElement) postElement.remove();
    } else if (postId) {
      fetchAndReplacePost(postId);
    }
  }

  // --- NOVAS FUNÇÕES PARA NOTIFICAÇÕES ---
  async function fetchNotifications() {
    try {
      const response = await axios.get(`${backendUrl}/api/notificacoes`);
      renderNotifications(response.data);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  }

  function renderNotifications(notifications) {
    // Garante que o elemento da lista de notificações existe antes de continuar
    if (!elements.notificationsList) return;

    // Limpa a lista de notificações para renderizar a nova lista atualizada
    elements.notificationsList.innerHTML = '';

    // Calcula a contagem de notificações não lidas
    const unreadCount = notifications.filter(n => !n.lida).length;

    // Atualiza o contador (badge) no ícone de sino
    if (elements.notificationsBadge) {
      if (unreadCount > 0) {
        elements.notificationsBadge.textContent = unreadCount;
        elements.notificationsBadge.style.display = 'flex';
      } else {
        elements.notificationsBadge.style.display = 'none';
      }
    }

    // Se não houver notificações, exibe uma mensagem de estado vazio
    if (notifications.length === 0) {
      elements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
      return;
    }

    // Itera sobre cada notificação para criar seu elemento HTML
    notifications.forEach(notification => {
      const item = document.createElement('div');
      item.className = 'notification-item';
      item.id = `notification-item-${notification.id}`;
      if (!notification.lida) {
        item.classList.add('unread');
      }

      const data = new Date(notification.dataCriacao).toLocaleString('pt-BR');
      let actionButtonsHtml = '';
      let iconClass = 'fa-info-circle'; // Ícone padrão para notificações gerais

      // Verifica se a notificação é um pedido de amizade para adicionar os botões
      if (notification.tipo === 'PEDIDO_AMIZADE') {
        iconClass = 'fa-user-plus'; // Muda o ícone para um de amizade
        actionButtonsHtml = `
                <div class="notification-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
                </div>
            `;
      }

      // Monta o HTML do item da notificação.
      // O corpo principal é um link para a página de gerenciamento de amizades.
      // Os botões de ação ficam fora do link.
      item.innerHTML = `
            <a href="amizades.html" class="notification-link">
                <div class="notification-icon-wrapper">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <p>${notification.mensagem}</p>
                    <span class="timestamp">${data}</span>
                </div>
            </a>
            <div class="notification-actions-wrapper">
                 ${actionButtonsHtml}
            </div>
        `;

      // Adiciona um listener para impedir que o clique nos botões ative o link da notificação
      const actionsWrapper = item.querySelector('.notification-actions-wrapper');
      if (actionsWrapper) {
        actionsWrapper.addEventListener('click', e => e.stopPropagation());
      }

      elements.notificationsList.appendChild(item);
    });
  }

  async function markNotificationAsRead(notificationId) {
    try {
      await axios.post(`${backendUrl}/api/notificacoes/${notificationId}/ler`);
      fetchNotifications(); // Recarrega a lista para refletir a mudança
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      showNotification('Erro ao atualizar notificação.', 'error');
    }
  }

  // --- FUNÇÕES PARA AMIGOS ONLINE ---

  async function fetchFriends() {
    try {
      const response = await axios.get(`${backendUrl}/api/amizades/`);
      userFriends = response.data;
      friendsLoaded = true;
      if (elements.connectionsCount) {
        elements.connectionsCount.textContent = userFriends.length;
      }
      // Chama a atualização dos amigos online DEPOIS de ter a lista completa
     atualizarStatusDeAmigosNaUI()
    } catch (error) {
      console.error("Erro ao buscar lista de amigos:", error);
      friendsLoaded = true;
    }
  }

/**
 * Função centralizada para atualizar todos os indicadores visuais de amigos online.
 * Isso inclui o widget da sidebar e os pontos de status em qualquer card de usuário.
 */
function atualizarStatusDeAmigosNaUI() {
    if (elements.onlineFriendsList) {

        if (!friendsLoaded) {
            elements.onlineFriendsList.innerHTML = '<p class="empty-state">Carregando...</p>';
            return;
        }

        const onlineFriends = userFriends.filter(friend => latestOnlineEmails.includes(friend.email));

        elements.onlineFriendsList.innerHTML = '';
        if (onlineFriends.length === 0) {
            elements.onlineFriendsList.innerHTML = '<p class="empty-state">Nenhum amigo online.</p>';
        } else {
            onlineFriends.forEach(friend => {
                const friendElement = document.createElement('div');
                friendElement.className = 'friend-item';
                const friendAvatar = friend.fotoPerfil 
                    ? `${backendUrl}/api/arquivos/${friend.fotoPerfil}` 
                    : defaultAvatarUrl;

                friendElement.innerHTML = `
                    <div class="avatar"><img src="${friendAvatar}" alt="Avatar de ${friend.nome}"></div>
                    <span class="friend-name">${friend.nome}</span>
                    <div class="status online"></div>
                `;
                elements.onlineFriendsList.appendChild(friendElement);
            });
        }
    }

    const statusDots = document.querySelectorAll('.status[data-user-email]');
    statusDots.forEach(dot => {
        const email = dot.getAttribute('data-user-email');
        if (latestOnlineEmails.includes(email)) {
            dot.classList.add('online');
            dot.classList.remove('offline');
        } else {
            dot.classList.remove('online');
            dot.classList.add('offline');
        }
    });
}

  // Função modificada para fechar todos os tipos de menu
  const closeAllMenus = () => {
    document
      .querySelectorAll(".options-menu, .dropdown-menu")
      .forEach((m) => (m.style.display = "none"));
  };

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
    const commentsSection = document.getElementById(
      `comments-section-${postId}`
    );
    if (commentsSection)
      commentsSection.style.display =
        commentsSection.style.display === "block" ? "none" : "block";
  };

  window.sendComment = (postId, parentId = null) => {
    const inputId = parentId
      ? `reply-input-${parentId}`
      : `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    if (!input) return;
    const content = input.value.trim();
    if (stompClient?.connected && content) {
      stompClient.send(
        `/app/postagem/${postId}/comentar`,
        {},
        JSON.stringify({ conteudo: content, parentId: parentId })
      );
      input.value = "";
      if (parentId) {
        const form = document.getElementById(`reply-form-${parentId}`);
        if (form) form.style.display = "none";
      }
    }
  };

  window.toggleReplyForm = (commentId) => {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (form)
      form.style.display = form.style.display === "flex" ? "none" : "flex";
  };

  window.toggleLike = async (event, postagemId, comentarioId = null) => {
    const likeButton = event.currentTarget;
    if (!likeButton) return;

    // Determina se é um like de post ou de comentário
    const isPostLike = comentarioId === null;
    const likeCountSpanId = isPostLike
      ? `like-count-post-${postagemId}`
      : `like-count-comment-${comentarioId}`;
    const likeCountSpan = document.getElementById(likeCountSpanId);

    if (!likeCountSpan) return;

    const isLiked = likeButton.classList.contains("liked");
    // Pega o número diretamente do texto do span, ignorando o ícone
    let currentLikes = parseInt(likeCountSpan.innerText.trim(), 10);

    // Altera o estado visual imediatamente para dar feedback ao usuário
    likeButton.classList.toggle("liked");
    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;

    // Atualiza a contagem visualmente
    if (isPostLike) {
      likeCountSpan.textContent = newLikes; // Para posts, só o número
    } else {
      likeCountSpan.innerHTML = `<i class="fas fa-heart"></i> ${newLikes}`; // Para comentários, mantém o ícone
    }

    try {
      // Envia a requisição para o backend
      await axios.post(`${backendUrl}/curtidas/toggle`, {
        postagemId,
        comentarioId,
      });

      // A requisição foi um sucesso, nenhuma ação extra é necessária
    } catch (error) {
      // Se a requisição falhar, reverte as alterações visuais
      showNotification("Erro ao processar curtida.", "error");
      console.error("Erro ao curtir:", error);

      likeButton.classList.toggle("liked"); // Reverte o botão
      if (isPostLike) {
        likeCountSpan.textContent = currentLikes; // Reverte a contagem do post
      } else {
        likeCountSpan.innerHTML = `<i class="fas fa-heart"></i> ${currentLikes}`; // Reverte a contagem do comentário
      }
    }
  };

  window.openEditPostModal = (postId, content) => {
    if (elements.editPostIdInput) elements.editPostIdInput.value = postId;
    if (elements.editPostTextarea) elements.editPostTextarea.value = content;
    selectedFilesForEdit = [];
    updateEditFilePreview();
    if (elements.editPostModal) elements.editPostModal.style.display = "flex";
  };
  window.deletePost = async (postId) => {
    if (confirm("Tem certeza que deseja excluir esta postagem?")) {
      try {
        await axios.delete(`${backendUrl}/postagem/${postId}`);
        showNotification("Postagem excluída com sucesso.", "success");
      } catch (error) {
        showNotification("Não foi possível excluir a postagem.", "error");
        console.error("Erro ao excluir post:", error);
      }
    }
  };

  function closeAndResetEditCommentModal() {
    if (elements.editCommentModal) {
      elements.editCommentModal.style.display = "none";
    }
    if (elements.editCommentIdInput) {
      elements.editCommentIdInput.value = "";
    }
    if (elements.editCommentTextarea) {
      elements.editCommentTextarea.value = "";
    }
  }

  window.openEditCommentModal = (commentId, content) => {
    if (elements.editCommentIdInput)
      elements.editCommentIdInput.value = commentId;
    if (elements.editCommentTextarea)
      elements.editCommentTextarea.value = content;
    if (elements.editCommentModal)
      elements.editCommentModal.style.display = "flex";
  };
  window.deleteComment = async (commentId) => {
    if (confirm("Tem certeza que deseja excluir este comentário?")) {
      try {
        await axios.delete(`${backendUrl}/comentarios/${commentId}`);
        showNotification("Comentário excluído.", "success");
      } catch (error) {
        showNotification("Não foi possível excluir o comentário.", "error");
        console.error("Erro ao excluir comentário:", error);
      }
    }
  };
  window.highlightComment = async (commentId) => {
    try {
      await axios.put(`${backendUrl}/comentarios/${commentId}/destacar`);
    } catch (error) {
      showNotification("Não foi possível destacar o comentário.", "error");
      console.error("Erro ao destacar comentário:", error);
    }
  };

  window.aceitar = async (amizadeId) => {
    await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`);
    document.getElementById(`received-card-${amizadeId}`).remove();

  };

  window.recusar = async (amizadeId) => {
    await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`);
    document.getElementById(`received-card-${amizadeId}`).remove();
  };

  function updateEditFilePreview() {
    if (!elements.editFilePreviewContainer) return;
    elements.editFilePreviewContainer.innerHTML = "";
    selectedFilesForEdit.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "file-preview-item";
      const previewElement = document.createElement("img");
      previewElement.src = URL.createObjectURL(file);
      item.appendChild(previewElement);
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-file-btn";
      removeBtn.innerHTML = "&times;";
      removeBtn.onclick = () => {
        selectedFilesForEdit.splice(index, 1);
        updateEditFilePreview();
      };
      item.appendChild(removeBtn);
      elements.editFilePreviewContainer.appendChild(item);
    });
  }

  function openEditProfileModal() {
    if (!currentUser || !elements.editProfileModal) return;
    elements.editProfilePicPreview.src = currentUser.urlFotoPerfil
      ? `${backendUrl}${currentUser.urlFotoPerfil}`
      : defaultAvatarUrl;
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
    if (elements.deleteConfirmPassword)
      elements.deleteConfirmPassword.value = "";
    if (elements.deleteAccountModal)
      elements.deleteAccountModal.style.display = "flex";
  }

  function filterPosts() {
    const searchTerm = searchInput.value.toLowerCase();
    const posts = document.querySelectorAll(".post");

    posts.forEach((post) => {
      const authorNameElement = post.querySelector(".post-author-info strong");
      const postContentElement = post.querySelector(".post-content p");

      if (authorNameElement && postContentElement) {
        const authorName = authorNameElement.textContent.toLowerCase();
        const postContent = postContentElement.textContent.toLowerCase();

        if (
          authorName.includes(searchTerm) ||
          postContent.includes(searchTerm)
        ) {
          post.style.display = "block"; // Mostra o post
        } else {
          post.style.display = "none"; // Esconde o post
        }
      }
    });
  }

  function setupEventListeners() {
    //  Listener principal no body para fechar menus e o painel de notificações ao clicar fora
    document.body.addEventListener("click", (e) => {
      // Fecha o painel de notificações se o clique for fora dele e fora do ícone
      if (elements.notificationsPanel && !elements.notificationsPanel.contains(e.target) && !elements.notificationsIcon.contains(e.target)) {
        elements.notificationsPanel.style.display = 'none';
      }
      // A função closeAllMenus fecha os menus de post/comentário e o dropdown do usuário
      closeAllMenus();
    });

    // Listener para o ícone de notificações para abrir/fechar o painel
    if (elements.notificationsIcon) {
      elements.notificationsIcon.addEventListener('click', (event) => {
        event.stopPropagation(); // Impede que o clique no body feche o painel imediatamente
        const isVisible = elements.notificationsPanel.style.display === 'block';
        elements.notificationsPanel.style.display = isVisible ? 'none' : 'block';
      });
    }

    // Listener para abrir o dropdown do usuário
    if (elements.userDropdownTrigger) {
      elements.userDropdownTrigger.addEventListener("click", (event) => {
        event.stopPropagation(); // Impede que o clique no body feche o menu imediatamente
        const menu = elements.userDropdownTrigger.nextElementSibling;
        if (menu && menu.classList.contains("dropdown-menu")) {
          const isVisible = menu.style.display === "block";
          closeAllMenus(); // Garante que outros menus (como de posts) fechem
          if (!isVisible) {
            menu.style.display = "block";
          }
        }
      });
    }

    // Listener para o campo de busca
    if (searchInput) {
      searchInput.addEventListener("input", filterPosts);
    }

    // Listener do botão de Logout
    if (elements.logoutBtn)
      elements.logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
      });

    // Listeners para os botões de perfil e conta
    if (elements.editProfileBtn)
      elements.editProfileBtn.addEventListener("click", openEditProfileModal);
    if (elements.deleteAccountBtn)
      elements.deleteAccountBtn.addEventListener(
        "click",
        openDeleteAccountModal
      );

    // Listeners do Modal de Edição de Perfil
    if (elements.cancelEditProfileBtn)
      elements.cancelEditProfileBtn.addEventListener(
        "click",
        () => (elements.editProfileModal.style.display = "none")
      );
    if (elements.editProfilePicInput)
      elements.editProfilePicInput.addEventListener("change", () => {
        const file = elements.editProfilePicInput.files[0];
        if (file && elements.editProfilePicPreview) {
          elements.editProfilePicPreview.src = URL.createObjectURL(file);
        }
      });
    if (elements.editProfileForm)
      elements.editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (elements.editProfilePicInput.files[0]) {
          const formData = new FormData();
          formData.append("foto", elements.editProfilePicInput.files[0]);
          try {
            const response = await axios.put(
              `${backendUrl}/usuarios/me/foto`,
              formData
            );
            currentUser = response.data;
            updateUIWithUserData(currentUser);
            showNotification("Foto de perfil atualizada!", "success");
          } catch (error) {
            showNotification("Erro ao atualizar a foto.", "error");
            console.error("Erro na foto:", error);
          }
        }
        const password = elements.editProfilePassword.value;
        const passwordConfirm = elements.editProfilePasswordConfirm.value;
        if (password && password !== passwordConfirm) {
          showNotification("As novas senhas não coincidem.", "error");
          return;
        }
        const updateData = {
          nome: elements.editProfileName.value,
          bio: elements.editProfileBio.value,
          dataNascimento: elements.editProfileDob.value
            ? new Date(elements.editProfileDob.value).toISOString()
            : null,
          senha: password || null,
        };
        try {
          const response = await axios.put(
            `${backendUrl}/usuarios/me`,
            updateData
          );
          currentUser = response.data;
          updateUIWithUserData(currentUser);
          showNotification("Perfil atualizado com sucesso!", "success");
          elements.editProfileModal.style.display = "none";
        } catch (error) {
          showNotification("Erro ao atualizar o perfil.", "error");
          console.error("Erro no perfil:", error);
        }
      });

    // Listeners do Modal de Exclusão de Conta
    if (elements.cancelDeleteAccountBtn)
      elements.cancelDeleteAccountBtn.addEventListener(
        "click",
        () => (elements.deleteAccountModal.style.display = "none")
      );
    if (elements.deleteAccountForm)
      elements.deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = elements.deleteConfirmPassword.value;
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
            confirm(
              "Você tem ABSOLUTA CERTEZA? Esta ação não pode ser desfeita."
            )
          ) {
            await axios.delete(`${backendUrl}/usuarios/me`);
            alert("Sua conta foi excluída com sucesso.");
            localStorage.clear();
            window.location.href = "login.html";
          }
        } catch (error) {
          showNotification(
            "Senha incorreta. A conta não foi excluída.",
            "error"
          );
          console.error("Erro na confirmação de senha:", error);
        }
      });

    // Listeners do Modal de Edição de Post
    if (elements.editPostFileInput)
      elements.editPostFileInput.addEventListener("change", (event) => {
        Array.from(event.target.files).forEach((file) => {
          if (!selectedFilesForEdit.some((f) => f.name === file.name)) {
            selectedFilesForEdit.push(file);
          }
        });
        updateEditFilePreview();
      });
    if (elements.editPostForm)
      elements.editPostForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const postId = elements.editPostIdInput.value;
        const content = elements.editPostTextarea.value;
        const postagemDTO = { conteudo: content };
        const formData = new FormData();
        formData.append(
          "postagem",
          new Blob([JSON.stringify(postagemDTO)], { type: "application/json" })
        );
        selectedFilesForEdit.forEach((file) =>
          formData.append("arquivos", file)
        );
        try {
          await axios.put(`${backendUrl}/postagem/${postId}`, formData);
          if (elements.editPostModal)
            elements.editPostModal.style.display = "none";
          showNotification("Postagem editada com sucesso.", "success");
        } catch (error) {
          showNotification("Não foi possível salvar as alterações.", "error");
          console.error("Erro ao editar post:", error);
        }
      });
    if (elements.cancelEditPostBtn)
      elements.cancelEditPostBtn.addEventListener(
        "click",
        () => (elements.editPostModal.style.display = "none")
      );

    // Listeners do Modal de Edição de Comentário
    if (elements.editCommentForm) {
      elements.editCommentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const commentId = elements.editCommentIdInput.value;
        const content = elements.editCommentTextarea.value;
        try {
          await axios.put(
            `${backendUrl}/comentarios/${commentId}`,
            { conteudo: content },
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          showNotification("Comentário editado.", "success");
          closeAndResetEditCommentModal();
        } catch (error) {
          showNotification("Não foi possível salvar o comentário.", "error");
          console.error("Erro ao editar comentário:", error);
        }
      });
    }
    if (elements.cancelEditCommentBtn)
      elements.cancelEditCommentBtn.addEventListener(
        "click",
        () => {
          closeAndResetEditCommentModal();
        });

    // Listeners do Criador de Post
    if (elements.postFileInput)
      elements.postFileInput.addEventListener("change", (event) => {
        selectedFilesForPost = Array.from(event.target.files);
        updateFilePreview();
      });

    function updateFilePreview() {
      if (!elements.filePreviewContainer) return;
      elements.filePreviewContainer.innerHTML = "";
      selectedFilesForPost.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "file-preview-item";
        let previewElement;
        if (file.type.startsWith("image/")) {
          previewElement = document.createElement("img");
        } else {
          previewElement = document.createElement("video");
        }
        previewElement.src = URL.createObjectURL(file);
        item.appendChild(previewElement);
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-file-btn";
        removeBtn.innerHTML = "&times;";
        removeBtn.onclick = () => {
          selectedFilesForPost.splice(index, 1);
          if (elements.postFileInput) elements.postFileInput.value = "";
          updateFilePreview();
        };
        item.appendChild(removeBtn);
        elements.filePreviewContainer.appendChild(item);
      });
    }

    if (elements.publishBtn)
      elements.publishBtn.addEventListener("click", async () => {
        const content = elements.postTextarea.value.trim();
        if (!content && selectedFilesForPost.length === 0) {
          showNotification("Escreva algo ou anexe um arquivo.", "info");
          return;
        }
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
          if (elements.postTextarea) elements.postTextarea.value = "";
          selectedFilesForPost = [];
          if (elements.postFileInput) elements.postFileInput.value = "";
          updateFilePreview();
          showNotification("Publicado com sucesso!", "success");
        } catch (error) {
          showNotification("Erro ao publicar postagem.", "error");
          console.error("Erro ao publicar:", error);
        }
      });
  }

  init();
});
