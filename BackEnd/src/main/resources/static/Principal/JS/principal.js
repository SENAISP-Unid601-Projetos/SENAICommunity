const backendUrl = "http://localhost:8080";
const elements = {
  notificationCenter: document.querySelector(".notification-center"),
  sidebar: document.querySelector(".sidebar"),
  menuToggle: document.querySelector(".menu-toggle"),
  publishPostBtn: document.getElementById("publish-post-btn"),
  postCreatorTextarea: document.getElementById("post-creator-textarea"),
  postsContainer: document.querySelector(".posts-container"),
  postCreatorCard: document.querySelector(".post-creator-card"),
  editPostModal: document.getElementById("edit-post-modal"),
  editPostForm: document.getElementById("edit-post-form"),
  cancelEditPostBtn: document.getElementById("cancel-edit-post-btn"),
  editCommentModal: document.getElementById("edit-comment-modal"),
  editCommentForm: document.getElementById("edit-comment-form"),
  cancelEditCommentBtn: document.getElementById("cancel-edit-comment-btn"),
  editCommentIdInput: document.getElementById("edit-comment-id"),
  editCommentTextarea: document.getElementById("edit-comment-textarea"),
  logoutBtn: document.getElementById("logout-btn"),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  searchResults: document.querySelector(".search-results"),
  themeToggle: document.querySelector(".theme-toggle"),
  // Perfil
  editProfileModal: document.getElementById("edit-profile-modal"),
  editProfileForm: document.getElementById("edit-profile-form"),
  cancelEditProfileBtn: document.getElementById("cancel-edit-profile-btn"),
  // Excluir Conta
  deleteAccountModal: document.getElementById("delete-account-modal"),
  deleteAccountForm: document.getElementById("delete-account-form"),
  cancelDeleteAccountBtn: document.getElementById("cancel-delete-account-btn"),
  deleteConfirmPassword: document.getElementById("delete-confirm-password"),
};

let accessToken = localStorage.getItem("accessToken");
let currentUser = null;
let stompClient = null;

document.addEventListener("DOMContentLoaded", () => {
  if (accessToken) {
    fetchCurrentUser();
    connectToWebSocket();
  } else {
    window.location.href = "login.html";
  }
});

function connectToWebSocket() {
  const socket = new SockJS(`${backendUrl}/ws`);
  stompClient = Stomp.over(socket);
  stompClient.connect({ Authorization: `Bearer ${accessToken}` }, (frame) => {
    console.log("CONECTADO AO WEBSOCKET");
    stompClient.subscribe("/topic/public", (message) => {
      const payload = JSON.parse(message.body);
      handlePublicFeedUpdate(payload);
    });
  });
}

function fetchCurrentUser() {
  axios
    .get(`${backendUrl}/usuarios/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((response) => {
      currentUser = response.data;
      updateUserProfileUI(currentUser);
      fetchPosts();
      fetchOnlineFriends();
      setupEventListeners();
    })
    .catch((error) => {
      console.error("Erro ao carregar usuário atual:", error);
      showNotification("Sessão expirada. Faça login novamente.", "error");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    });
}

function updateUserProfileUI(user) {
  const profileImgElements = document.querySelectorAll(
    "#topbar-user-img, #sidebar-user-img, #post-creator-img"
  );
  profileImgElements.forEach((img) => {
    img.src = user.urlFotoPerfil || `${backendUrl}/images/default-avatar.png`;
  });

  const userNameElements = document.querySelectorAll(
    "#topbar-user-name, #sidebar-user-name"
  );
  userNameElements.forEach((name) => {
    name.textContent = user.nome;
  });

  if (document.getElementById("sidebar-user-title")) {
    document.getElementById("sidebar-user-title").textContent =
      user.titulo || "Sem Título";
  }
  if (document.getElementById("connections-count")) {
    document.getElementById("connections-count").textContent =
      user.conexoes || 0;
  }
  if (document.getElementById("projects-count")) {
    document.getElementById("projects-count").textContent = user.projetos || 0;
  }
}

function fetchPosts() {
  axios
    .get(`${backendUrl}/postagens/feed`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((response) => {
      elements.postsContainer.innerHTML = "";
      response.data.forEach((post) => {
        elements.postsContainer.appendChild(createPostElement(post));
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar posts:", error);
      showNotification("Não foi possível carregar o feed.", "error");
    });
}

function fetchOnlineFriends() {
  axios
    .get(`${backendUrl}/usuarios/amigos/online`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((response) => {
      const onlineFriendsContainer =
        document.querySelector(".online-friends-list");
      if (onlineFriendsContainer) {
        onlineFriendsContainer.innerHTML = "";
        response.data.forEach((friend) => {
          onlineFriendsContainer.appendChild(createOnlineFriendElement(friend));
        });
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar amigos online:", error);
    });
}

function fetchAndReplacePost(postId) {
  axios
    .get(`${backendUrl}/postagens/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((response) => {
      const newPost = response.data;
      const oldPostElement = document.getElementById(`post-${postId}`);
      if (oldPostElement) {
        const newPostElement = createPostElement(newPost);
        elements.postsContainer.replaceChild(newPostElement, oldPostElement);
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar post atualizado:", error);
    });
}

function createPostElement(post) {
  const postElement = document.createElement("div");
  postElement.className = "post-card";
  postElement.id = `post-${post.id}`;
  const isAuthor = currentUser && post.autor.id === currentUser.id;

  let optionsMenu = "";
  if (isAuthor) {
    optionsMenu = `
            <button class="post-options-btn" onclick="event.stopPropagation(); window.openPostMenu(${post.id})">
                <i class="fas fa-ellipsis-h"></i>
            </button>
            <div class="options-menu" id="post-menu-${post.id}" onclick="event.stopPropagation();">
                <button onclick="window.openEditPostModal(${post.id}, '${post.conteudo.replace(
      /'/g,
      "\\'"
    )}')"><i class="fas fa-pen"></i> Editar</button>
                <button class="danger" onclick="window.deletePost(${post.id})"><i class="fas fa-trash"></i> Excluir</button>
            </div>
        `;
  }

  const postContentHtml = `
        <div class="post-header">
            <div class="user-info">
                <a href="perfil.html?id=${post.autor.id}">
                    <img src="${post.autor.urlFotoPerfil || `${backendUrl}/images/default-avatar.png`}" alt="Avatar de ${post.autor.nome}">
                    <div class="user-details">
                        <h4 class="post-author">${post.autor.nome}</h4>
                        <p class="post-time">${formatTimeAgo(post.dataPublicacao)}</p>
                    </div>
                </a>
            </div>
            ${optionsMenu}
        </div>
        <div class="post-body">
            <p>${post.conteudo}</p>
        </div>
        <div class="post-footer">
            <div class="post-stats">
                <span class="likes-count" id="likes-count-${post.id}">${post.curtidas || 0} Curtidas</span>
                <span class="comments-count" id="comments-count-${post.id}">${post.comentarios?.length || 0} Comentários</span>
            </div>
            <div class="post-actions">
                <button class="action-btn-like ${post.curtidoPeloUsuario ? "liked" : ""}" onclick="window.likePost(${post.id})">
                    <i class="fas fa-heart"></i> Curtir
                </button>
                <button class="action-btn" onclick="window.toggleCommentSection(${post.id})">
                    <i class="fas fa-comment"></i> Comentar
                </button>
                <button class="action-btn"><i class="fas fa-share"></i> Compartilhar</button>
            </div>
        </div>
        <div class="post-comments-section" id="comments-section-${post.id}" style="display: none;">
            <div class="comment-form">
                <input type="text" id="comment-input-${post.id}" placeholder="Escreva um comentário...">
                <button onclick="window.sendComment(${post.id})"><i class="fas fa-paper-plane"></i></button>
            </div>
            <div class="comments-list" id="comments-list-${post.id}">
                ${post.comentarios ? post.comentarios.map(comment => createCommentElement(comment, post)).join('') : ''}
            </div>
        </div>
    `;
  postElement.innerHTML = postContentHtml;
  return postElement;
}

function createCommentElement(comment, post) {
  const commentAuthorName = comment.autor?.nome || comment.nomeAutor || "Usuário";
  const commentAuthorAvatar = comment.urlFotoAutor
    ? `${backendUrl}/api/arquivos/${comment.urlFotoAutor}`
    : `${backendUrl}/images/default-avatar.png`;
  const autorIdDoComentario = comment.autor?.id || comment.autorId;
  const autorIdDoPost = post.autor?.id || post.autorId;
  const isAuthor = currentUser && autorIdDoComentario == currentUser.id;
  const isPostOwner = currentUser && autorIdDoPost == currentUser.id;
  
  const safeContent = String(comment.conteudo).replace(/'/g, "\\'");

  let optionsMenu = "";
  if (isAuthor || isPostOwner) {
    optionsMenu = `
            <button class="comment-options-btn" onclick="event.stopPropagation(); window.openCommentMenu(${comment.id})">
                <i class="fas fa-ellipsis-h"></i>
            </button>
            <div class="options-menu" id="comment-menu-${comment.id}" onclick="event.stopPropagation();">
                ${isAuthor ? `<button onclick="window.openEditCommentModal(${comment.id}, '${safeContent}')"><i class="fas fa-pen"></i> Editar</button>` : ""}
                ${isAuthor || isPostOwner ? `<button class="danger" onclick="window.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Excluir</button>` : ""}
                ${isPostOwner ? `<button onclick="window.highlightComment(${comment.id})"><i class="fas fa-star"></i> ${comment.destacado ? "Remover Destaque" : "Destacar"}</button>` : ""}
            </div>
        `;
  }

  return `
        <div class="comment-container">
            <div class="comment ${comment.destacado ? "destacado" : ""}" id="comment-${comment.id}">
                <div class="comment-avatar"><img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}"></div>
                <div class="comment-body">
                    <span class="comment-author">${commentAuthorName}</span>
                    <p class="comment-content">${String(comment.conteudo)}</p>
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
        </div>
    `;
}

function createOnlineFriendElement(friend) {
  const friendElement = document.createElement("a");
  friendElement.href = `perfil.html?id=${friend.id}`;
  friendElement.className = "friend-item";
  friendElement.innerHTML = `
        <div class="avatar-small">
            <img src="${friend.urlFotoPerfil || `${backendUrl}/images/default-avatar.png`}" alt="Avatar de ${friend.nome}">
            <div class="status online"></div>
        </div>
        <span class="friend-name">${friend.nome}</span>
    `;
  return friendElement;
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " anos atrás";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " meses atrás";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " dias atrás";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " horas atrás";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutos atrás";
  }
  return "agora";
}

function setupEventListeners() {
  if (elements.menuToggle)
    elements.menuToggle.addEventListener("click", () => {
      elements.sidebar.classList.toggle("open");
    });
  if (elements.themeToggle)
    elements.themeToggle.addEventListener("click", () => {
      document.documentElement.toggleAttribute("data-theme-light");
    });
  if (elements.publishPostBtn)
    elements.publishPostBtn.addEventListener("click", publishPost);
  if (elements.logoutBtn)
    elements.logoutBtn.addEventListener("click", handleLogout);
  if (elements.editPostForm)
    elements.editPostForm.addEventListener("submit", handleEditPost);
  if (elements.cancelEditPostBtn)
    elements.cancelEditPostBtn.addEventListener("click", () =>
      window.closeModal("edit-post-modal")
    );
  if (elements.editCommentForm)
    elements.editCommentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const commentId = elements.editCommentIdInput.value;
      const content = elements.editCommentTextarea.value;
      try {
        await axios.put(
          `${backendUrl}/comentarios/${commentId}`,
          { conteudo: content },
          {
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          }
        );
        showNotification("Comentário editado.", "success");
        closeAndResetEditCommentModal();
      } catch (error) {
        showNotification("Não foi possível salvar o comentário.", "error");
        console.error("Erro ao editar comentário:", error);
      }
    });
  if (elements.cancelEditCommentBtn)
    elements.cancelEditCommentBtn.addEventListener("click", () =>
      closeAndResetEditCommentModal()
    );
  if (elements.editProfileForm)
    elements.editProfileForm.addEventListener("submit", handleEditProfile);
  if (elements.cancelEditProfileBtn)
    elements.cancelEditProfileBtn.addEventListener("click", () =>
      window.closeModal("edit-profile-modal")
    );
  if (elements.deleteAccountForm)
    elements.deleteAccountForm.addEventListener("submit", handleDeleteAccount);
  if (elements.cancelDeleteAccountBtn)
    elements.cancelDeleteAccountBtn.addEventListener("click", () =>
      window.closeModal("delete-account-modal")
    );
}

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

function handleLogout() {
  localStorage.removeItem("accessToken");
  window.location.href = "login.html";
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  elements.notificationCenter.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

// Funções para manipulação de posts
window.likePost = function (postId) {
  axios
    .post(
      `${backendUrl}/postagens/${postId}/curtir`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    .then((response) => {
      const likesCountElement = document.getElementById(
        `likes-count-${postId}`
      );
      likesCountElement.textContent = `${response.data.curtidas} Curtidas`;
      const likeButton = document.querySelector(
        `#post-${postId} .action-btn-like`
      );
      if (response.data.curtidoPeloUsuario) {
        likeButton.classList.add("liked");
      } else {
        likeButton.classList.remove("liked");
      }
    })
    .catch((error) => {
      console.error("Erro ao curtir post:", error);
    });
};

window.toggleCommentSection = function (postId) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  commentsSection.style.display =
    commentsSection.style.display === "none" ? "block" : "none";
};

window.sendComment = function (postId, parentId = null) {
  const inputElement = parentId
    ? document.getElementById(`reply-input-${parentId}`)
    : document.getElementById(`comment-input-${postId}`);
  const content = inputElement.value;
  if (!content.trim()) return;

  const commentData = {
    conteudo: content,
    autorId: currentUser.id,
    postagemId: postId,
    comentarioPaiId: parentId,
  };

  axios
    .post(`${backendUrl}/comentarios`, commentData, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then(() => {
      inputElement.value = "";
    })
    .catch((error) => {
      console.error("Erro ao enviar comentário:", error);
      showNotification("Não foi possível enviar o comentário.", "error");
    });
};

window.openPostMenu = function (postId) {
  document.querySelectorAll(".options-menu").forEach((menu) => {
    if (menu.id !== `post-menu-${postId}`) {
      menu.style.display = "none";
    }
  });
  const menu = document.getElementById(`post-menu-${postId}`);
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

window.openCommentMenu = function (commentId) {
  document.querySelectorAll(".options-menu").forEach((menu) => {
    if (menu.id !== `comment-menu-${commentId}`) {
      menu.style.display = "none";
    }
  });
  const menu = document.getElementById(`comment-menu-${commentId}`);
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

window.openEditPostModal = function (postId, content) {
  window.closeModal("edit-post-modal");
  elements.editPostModal.style.display = "block";
  elements.editPostForm.dataset.postId = postId;
  document.getElementById("edit-post-textarea").value = content;
};

window.closeModal = function (modalId) {
  document.getElementById(modalId).style.display = "none";
};

window.deletePost = function (postId) {
  if (confirm("Tem certeza que deseja excluir esta publicação?")) {
    axios
      .delete(`${backendUrl}/postagens/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(() => {
        showNotification("Publicação excluída com sucesso.", "success");
        // O WebSocket vai remover o post
      })
      .catch((error) => {
        console.error("Erro ao excluir post:", error);
        showNotification("Não foi possível excluir a publicação.", "error");
      });
  }
};

window.deleteComment = function (commentId) {
  if (confirm("Tem certeza que deseja excluir este comentário?")) {
    axios
      .delete(`${backendUrl}/comentarios/${commentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(() => {
        showNotification("Comentário excluído com sucesso.", "success");
      })
      .catch((error) => {
        console.error("Erro ao excluir comentário:", error);
        showNotification("Não foi possível excluir o comentário.", "error");
      });
  }
};

window.openEditCommentModal = function (commentId, content) {
  window.closeModal("edit-comment-modal");
  elements.editCommentModal.style.display = "block";
  elements.editCommentIdInput.value = commentId;
  elements.editCommentTextarea.value = content;
};

window.toggleLike = function (event, postId, commentId) {
  const url = `${backendUrl}/comentarios/${commentId}/curtir`;
  axios
    .post(url, {}, { headers: { Authorization: `Bearer ${accessToken}` } })
    .then((response) => {
      const likeButton = event.currentTarget;
      if (response.data.curtidoPeloUsuario) {
        likeButton.classList.add("liked");
      } else {
        likeButton.classList.remove("liked");
      }
      const likeCountElement = document.getElementById(
        `like-count-comment-${commentId}`
      );
      likeCountElement.innerHTML = `<i class="fas fa-heart"></i> ${response.data.totalCurtidas || 0}`;
    })
    .catch((error) => {
      console.error("Erro ao curtir comentário:", error);
    });
};

window.toggleReplyForm = function (commentId) {
  const replyForm = document.getElementById(`reply-form-${commentId}`);
  replyForm.style.display =
    replyForm.style.display === "block" ? "none" : "block";
};

function handleEditPost(e) {
  e.preventDefault();
  const postId = elements.editPostForm.dataset.postId;
  const content = document.getElementById("edit-post-textarea").value;
  axios
    .put(
      `${backendUrl}/postagens/${postId}`,
      { conteudo: content },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    .then(() => {
      showNotification("Publicação editada.", "success");
      window.closeModal("edit-post-modal");
    })
    .catch((error) => {
      showNotification("Não foi possível editar a publicação.", "error");
      console.error("Erro ao editar publicação:", error);
    });
}

function handleEditProfile(e) {
  e.preventDefault();
  const name = document.getElementById("edit-profile-name").value;
  const bio = document.getElementById("edit-profile-bio").value;
  const dob = document.getElementById("edit-profile-dob").value;
  const password = document.getElementById("edit-profile-password").value;
  const passwordConfirm = document.getElementById("edit-profile-password-confirm").value;

  const data = {};
  if (name) data.nome = name;
  if (bio) data.bio = bio;
  if (dob) data.dataNascimento = dob;
  if (password) data.senha = password;
  if (password && password !== passwordConfirm) {
    showNotification("As senhas não coincidem.", "error");
    return;
  }

  axios
    .put(`${backendUrl}/usuarios/me`, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then(() => {
      showNotification("Perfil atualizado.", "success");
      window.closeModal("edit-profile-modal");
      fetchCurrentUser();
    })
    .catch((error) => {
      showNotification("Não foi possível atualizar o perfil.", "error");
      console.error("Erro ao atualizar perfil:", error);
    });
}

function handleDeleteAccount(e) {
  e.preventDefault();
  const password = elements.deleteConfirmPassword.value;

  if (confirm("Esta ação é irreversível. Tem certeza?")) {
    axios
      .delete(`${backendUrl}/usuarios/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Current-Password": password,
        },
      })
      .then(() => {
        showNotification("Sua conta foi excluída permanentemente.", "success");
        setTimeout(handleLogout, 2000);
      })
      .catch((error) => {
        showNotification("Senha incorreta ou erro ao excluir conta.", "error");
        console.error("Erro ao excluir conta:", error);
      });
  }
}

function publishPost() {
  const content = elements.postCreatorTextarea.value;
  if (!content.trim()) {
    showNotification("A postagem não pode estar vazia.", "error");
    return;
  }
  const postData = {
    conteudo: content,
    autorId: currentUser.id,
  };
  axios
    .post(`${backendUrl}/postagens`, postData, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then(() => {
      elements.postCreatorTextarea.value = "";
      showNotification("Publicação criada com sucesso.", "success");
      // O WebSocket fará a atualização do feed
    })
    .catch((error) => {
      console.error("Erro ao publicar post:", error);
      showNotification("Não foi possível publicar a postagem.", "error");
    });
}

function handlePublicFeedUpdate(payload) {
  if (payload.autorAcaoId && currentUser && payload.autorAcaoId == currentUser.id) {
    return;
  }
  
  const postId = payload.postagem?.id || payload.id || payload.postagemId;

  if (payload.tipo === "edicao_comentario") {
    const commentId = payload.comentarioId;
    const newContent = payload.conteudo;
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
        const contentElement = commentElement.querySelector('.comment-content');
        if (contentElement) {
            const contentToDisplay = typeof newContent === 'object' ? newContent.conteudo : newContent;
            contentElement.textContent = contentToDisplay;
        }
    }
  } else if (payload.tipo === "remocao" && payload.postagemId) {
    const postElement = document.getElementById(`post-${payload.postagemId}`);
    if (postElement) postElement.remove();
  } else if (postId) {
    fetchAndReplacePost(postId);
  }
}