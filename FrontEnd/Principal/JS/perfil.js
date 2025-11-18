document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
  const backendUrl = "http://localhost:8080";
  const jwtToken = localStorage.getItem("token");
  const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;
  const messageBadgeElement = document.getElementById("message-badge");
  
  let stompClient = null;
  let currentUser = null;
  let profileUser = null;
  let userFriends = [];
  let friendsLoaded = false;
  let latestOnlineEmails = [];
  
  // Variáveis para Posts
  let selectedFilesForEdit = [];
  let urlsParaRemover = [];
  
  // Variáveis para Carrossel de Mídia
  let currentMediaIndex = 0;
  let currentMediaItems = [];

  // --- ELEMENTOS DO DOM ---
  const elements = {
    profileName: document.getElementById("profile-name"),
    profileTitle: document.getElementById("profile-title"),
    profilePicImg: document.getElementById("profile-pic-img"),
    profileBio: document.getElementById("profile-bio"),
    profileEmail: document.getElementById("profile-email"),
    profileDob: document.getElementById("profile-dob"),
    editProfileBtnPage: document.getElementById("edit-profile-btn-page"),
    postsContainer: document.querySelector(".posts-container"),
    
    // Abas
    tabButtons: document.querySelectorAll(".tab-btn"),
    tabContents: document.querySelectorAll(".tab-content"),
    
    // Listas das Abas
    profileFriendsList: document.getElementById("profile-friends-list"),
    profileProjectsList: document.getElementById("profile-projects-list"),
    tabFriendsCount: document.getElementById("tab-friends-count"),
    tabProjectsCount: document.getElementById("tab-projects-count"),
    
    // Elementos globais (sidebar, topbar, notificações)
    notificationCenter: document.querySelector(".notification-center"),
    topbarUserName: document.getElementById("topbar-user-name"),
    topbarUserImg: document.getElementById("topbar-user-img"),
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserTitle: document.getElementById("sidebar-user-title"),
    sidebarUserImg: document.getElementById("sidebar-user-img"),
    onlineFriendsList: document.getElementById("online-friends-list"),
    connectionsCount: document.getElementById("connections-count"),
    notificationsIcon: document.getElementById("notifications-icon"),
    notificationsPanel: document.getElementById("notifications-panel"),
    notificationsList: document.getElementById("notifications-list"),
    notificationsBadge: document.getElementById("notifications-badge"),
    userDropdownTrigger: document.querySelector(".user-dropdown .user"),
    logoutBtn: document.getElementById("logout-btn"),
    
    // Modais
    editProfileModal: document.getElementById("edit-profile-modal"),
    editProfileForm: document.getElementById("edit-profile-form"),
    editPostModal: document.getElementById("edit-post-modal"),
    editPostForm: document.getElementById("edit-post-form"),
    editCommentModal: document.getElementById("edit-comment-modal"),
    editCommentForm: document.getElementById("edit-comment-form"),
    deleteAccountModal: document.getElementById("delete-account-modal"),
    deleteAccountForm: document.getElementById("delete-account-form"),
    
    // Elementos do carrossel modal
    mediaViewerModal: document.getElementById('media-viewer-modal'),
    carouselContainer: document.getElementById('carousel-container'),
    carouselIndicators: document.getElementById('carousel-indicators'),
    carouselPrev: document.getElementById('carousel-prev'),
    carouselNext: document.getElementById('carousel-next'),
    mediaViewerClose: document.getElementById('media-viewer-close'),
  };

  // --- FUNÇÕES DE TEMA (CLARO/ESCURO) ---
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

  // --- FUNÇÕES DE CARROSSEL (mantidas do código original) ---
  window.openMediaViewer = (mediaUrls, startIndex = 0) => {
      const modal = document.getElementById('media-viewer-modal');
      const container = document.getElementById('carousel-container');
      const indicators = document.getElementById('carousel-indicators');
      
      if (!modal || !container) return;
      
      currentMediaItems = mediaUrls;
      currentMediaIndex = startIndex;
      
      container.innerHTML = '';
      if(indicators) indicators.innerHTML = '';
      
      mediaUrls.forEach((url, index) => {
          const slide = document.createElement('div');
          slide.className = `carousel-slide ${index === startIndex ? 'active' : ''}`;
          const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          
          if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
              slide.innerHTML = `<video controls autoplay src="${fullMediaUrl}" style="max-width: 100%; max-height: 100%;"></video>`;
          } else {
              slide.innerHTML = `<img src="${fullMediaUrl}" alt="Mídia" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
          }
          container.appendChild(slide);
          
          if(indicators) {
            const indicator = document.createElement('span');
            indicator.className = `carousel-indicator ${index === startIndex ? 'active' : ''}`;
            indicator.onclick = () => goToMedia(index);
            indicators.appendChild(indicator);
          }
      });
      
      modal.style.display = 'flex';
      updateCarouselControls();
  };

  function goToMedia(index) {
      const slides = document.querySelectorAll('.carousel-slide');
      const indicators = document.querySelectorAll('.carousel-indicator');
      if (index < 0 || index >= slides.length) return;
      
      slides.forEach(slide => slide.classList.remove('active'));
      if(indicators.length) indicators.forEach(ind => ind.classList.remove('active'));
      
      slides[index].classList.add('active');
      if(indicators.length) indicators[index].classList.add('active');
      
      currentMediaIndex = index;
      updateCarouselControls();
  }

  function nextMedia() { goToMedia(currentMediaIndex + 1); }
  function prevMedia() { goToMedia(currentMediaIndex - 1); }
  function closeMediaViewer() {
      const modal = document.getElementById('media-viewer-modal');
      if (modal) modal.style.display = 'none';
      document.querySelectorAll('.carousel-slide video').forEach(video => {
          video.pause();
          video.currentTime = 0;
      });
  }

  function updateCarouselControls() {
      const prevBtn = document.getElementById('carousel-prev');
      const nextBtn = document.getElementById('carousel-next');
      if (prevBtn) prevBtn.disabled = currentMediaIndex === 0;
      if (nextBtn) nextBtn.disabled = currentMediaIndex === currentMediaItems.length - 1;
  }

  // Funções para o Carrossel no Feed (Horizontal Scroll)
  window.scrollFeedCarousel = (postId, direction) => {
    const track = document.getElementById(`feed-track-${postId}`);
    if (track) {
        const scrollAmount = track.clientWidth; 
        track.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
    }
  };

  function renderFeedCarousel(mediaUrls, postId) {
    let slidesHtml = '';
    mediaUrls.forEach((url, index) => {
        const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
        const safeMediaArray = JSON.stringify(mediaUrls).replace(/"/g, '&quot;');
        let contentHtml = '';
        if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
            contentHtml = `<video src="${fullMediaUrl}" preload="metadata"></video>`;
        } else {
            contentHtml = `<img src="${fullMediaUrl}" alt="Mídia" loading="lazy">`;
        }
        slidesHtml += `<div class="feed-carousel-slide" onclick="window.openMediaViewer(${safeMediaArray}, ${index})">${contentHtml}</div>`;
    });

    return `
        <div class="feed-carousel-wrapper">
            <button class="feed-carousel-btn prev" onclick="event.stopPropagation(); window.scrollFeedCarousel(${postId}, -1)"><i class="fas fa-chevron-left"></i></button>
            <div class="feed-carousel-track" id="feed-track-${postId}">${slidesHtml}</div>
            <button class="feed-carousel-btn next" onclick="event.stopPropagation(); window.scrollFeedCarousel(${postId}, 1)"><i class="fas fa-chevron-right"></i></button>
            <div class="feed-carousel-counter" id="feed-counter-${postId}">1 / ${mediaUrls.length}</div>
        </div>`;
  }

  function setupCarouselEventListeners(postElement, postId) {
    const track = postElement.querySelector(`#feed-track-${postId}`);
    const counter = postElement.querySelector(`#feed-counter-${postId}`);
    if (track && counter) {
        track.addEventListener('scroll', () => {
            const trackWidth = track.clientWidth;
            if (trackWidth === 0) return;
            const index = Math.round(track.scrollLeft / trackWidth) + 1;
            const total = track.children.length;
            counter.textContent = `${index} / ${total}`;
        });
    }
  }

  function renderMediaGrid(mediaUrls) {
      if (!mediaUrls || mediaUrls.length === 0) return '';
      const count = mediaUrls.length;
      let gridClass = count === 2 ? 'double' : (count === 3 ? 'triple' : 'multiple');
      if (count === 1) gridClass = 'single';

      let displayItems = count > 4 ? mediaUrls.slice(0, 4) : mediaUrls;
      let mediaHtml = `<div class="post-media-grid ${gridClass}">`;
      
      displayItems.forEach((url, index) => {
          const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          const safeMediaArray = JSON.stringify(mediaUrls).replace(/"/g, '&quot;');
          const isMoreItem = count > 4 && index === 3;
          
          mediaHtml += `<div class="post-media-item${isMoreItem ? ' more' : ''}" onclick="window.openMediaViewer(${safeMediaArray}, ${index})">`;
          if (url.match(/\.(mp4|webm)$/i)) {
              mediaHtml += `<video src="${fullMediaUrl}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
          } else {
              mediaHtml += `<img src="${fullMediaUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
          }
          if (isMoreItem) mediaHtml += `<div class="more-overlay">+${count - 4}</div>`;
          mediaHtml += `</div>`;
      });
      mediaHtml += `</div>`;
      return mediaHtml;
  }

  // --- INICIALIZAÇÃO ---
  async function init() {
    if (!jwtToken) { 
      window.location.href = "login.html"; 
      return; 
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const profileUserId = urlParams.get("id");

      const meResponse = await axios.get(`${backendUrl}/usuarios/me`);
      currentUser = meResponse.data;
      window.currentUser = currentUser;

      let fetchUrl = (profileUserId && profileUserId != currentUser.id) 
          ? `${backendUrl}/usuarios/${profileUserId}` 
          : `${backendUrl}/usuarios/me`;

      const profileResponse = await axios.get(fetchUrl);
      profileUser = profileResponse.data; 

      updateUIWithUserData(currentUser); 
      populateProfileData(profileUser); 
      
      // Configura botões e abas
      configureProfileActions(profileUserId ? profileUserId == currentUser.id : true);
      setupTabNavigation();

      // Busca dados para as abas
      fetchUserPosts(profileUser.id);
      fetchProfileFriends(profileUser.id);
      fetchProfileProjects(profileUser.id);

      // Inicializa funcionalidades globais
      connectWebSocket(); 
      setupEventListeners();
      setupCarouselModalEvents();
      setInitialTheme();
      
      // Busca dados globais
      await fetchFriends();
      await fetchInitialOnlineFriends();
      atualizarStatusDeAmigosNaUI();
      fetchNotifications();
      fetchAndUpdateUnreadCount();

    } catch (error) {
      console.error("ERRO NO PERFIL:", error);
      if (error.response && error.response.status === 404) {
          document.querySelector('.main-content').innerHTML = '<h1 style="text-align: center; margin-top: 2rem;">Usuário não encontrado</h1>';
      } else if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = 'login.html';
      }
    }
  }

  function populateProfileData(user) {
    if (!user) return;
    const userImage = user.urlFotoPerfil && user.urlFotoPerfil.startsWith("http") ? user.urlFotoPerfil : `${backendUrl}${user.urlFotoPerfil || defaultAvatarUrl}`;
    
    if (elements.profileName) elements.profileName.textContent = user.nome;
    if (elements.profilePicImg) elements.profilePicImg.src = userImage;
    if (elements.profileBio) elements.profileBio.textContent = user.bio || "Nenhuma bio informada.";
    if (elements.profileEmail) elements.profileEmail.textContent = user.email;
    if (elements.profileDob && user.dataNascimento) {
        elements.profileDob.textContent = new Date(user.dataNascimento).toLocaleDateString("pt-BR");
    }
    if (elements.profileTitle) {
        elements.profileTitle.textContent = user.tipoUsuario || "Membro da Comunidade";
    }
  }

  function updateUIWithUserData(user) {
    if (!user) return;
    const userImage = user.urlFotoPerfil && user.urlFotoPerfil.startsWith("http") 
        ? user.urlFotoPerfil 
        : `${backendUrl}${user.urlFotoPerfil || "/images/default-avatar.jpg"}`;

    // Atualiza topbar
    const topbarUser = document.querySelector(".user-dropdown .user");
    if (topbarUser) {
        topbarUser.innerHTML = `
            <div class="profile-pic"><img src="${userImage}" alt="Perfil"></div>
            <span>${user.nome}</span>
            <i class="fas fa-chevron-down"></i>
        `;
    }

    // Atualiza a Sidebar
    if (elements.sidebarUserName) elements.sidebarUserName.textContent = user.nome;
    if (elements.sidebarUserTitle) elements.sidebarUserTitle.textContent = user.tipoUsuario || "Membro da Comunidade";
    if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
  }

  // --- LÓGICA DAS ABAS ---
  function setupTabNavigation() {
      elements.tabButtons.forEach(btn => {
          btn.addEventListener('click', () => {
              // Remove ativo de todos
              elements.tabButtons.forEach(b => b.classList.remove('active'));
              elements.tabContents.forEach(c => {
                  c.classList.remove('active');
                  c.style.display = 'none';
              });

              // Ativa o clicado
              btn.classList.add('active');
              const targetId = btn.getAttribute('data-target');
              const targetContent = document.getElementById(targetId);
              if(targetContent) {
                  targetContent.classList.add('active');
                  targetContent.style.display = 'block';
              }
          });
      });
  }

  // --- BUSCA DE DADOS DO PERFIL ---

  // 1. Amigos do Perfil (Visualizado)
  async function fetchProfileFriends(userId) {
      try {
          let friends = [];
          if (userId === currentUser.id) {
               const response = await axios.get(`${backendUrl}/api/amizades/`);
               friends = response.data;
          } else {
               // Usa o endpoint para buscar amigos de outro usuário
               const response = await axios.get(`${backendUrl}/api/amizades/usuario/${userId}`);
               friends = response.data;
          }
          
          renderProfileFriends(friends);
      } catch (error) {
          console.error("Erro ao buscar amigos do perfil", error);
          if (elements.profileFriendsList) {
            elements.profileFriendsList.innerHTML = '<p class="empty-state">Não foi possível carregar a lista de amigos.</p>';
          }
      }
  }

  function renderProfileFriends(friends) {
      if(!elements.profileFriendsList) return;
      
      if(elements.tabFriendsCount) elements.tabFriendsCount.textContent = friends.length;
      elements.profileFriendsList.innerHTML = '';

      if (friends.length === 0) {
          elements.profileFriendsList.innerHTML = '<p class="empty-state">Nenhum amigo encontrado.</p>';
          return;
      }

      friends.forEach(friend => {
          const friendId = friend.idUsuario || friend.id;
          const friendName = friend.nome || friend.nomeUsuario;
          const friendAvatar = friend.fotoPerfil || friend.urlFotoPerfil;
          
          const avatarUrl = friendAvatar 
              ? (friendAvatar.startsWith('http') 
                  ? friendAvatar 
                  : `${backendUrl}/api/arquivos/${friendAvatar}`)
              : defaultAvatarUrl;
              
          const card = document.createElement('a');
          card.href = `perfil.html?id=${friendId}`;
          card.className = 'profile-card-item';
          card.innerHTML = `
              <img src="${avatarUrl}" alt="${friendName}" class="profile-card-img" onerror="this.src='${defaultAvatarUrl}'">
              <div class="profile-card-title">${friendName}</div>
              <div class="profile-card-subtitle">Amigo</div>
          `;
          elements.profileFriendsList.appendChild(card);
      });
  }

  // 2. Projetos do Perfil - CORRIGIDA
  async function fetchProfileProjects(userId) {
      try {
          const response = await axios.get(`${backendUrl}/projetos/usuario/${userId}`);
          renderProfileProjects(response.data);
      } catch (error) {
          console.error("Erro ao buscar projetos do perfil", error);
          renderProfileProjects([]);
      }
  }

  function renderProfileProjects(projects) {
      if(!elements.profileProjectsList) return;
      
      if(elements.tabProjectsCount) elements.tabProjectsCount.textContent = projects.length;
      elements.profileProjectsList.innerHTML = '';

      if (projects.length === 0) {
          elements.profileProjectsList.innerHTML = '<p class="empty-state">Nenhum projeto encontrado.</p>';
          return;
      }

      projects.forEach(proj => {
          const card = document.createElement('div');
          card.className = 'profile-card-item project-card';
          card.style.cursor = 'pointer';
          
          const imageUrl = proj.imagemUrl 
              ? (proj.imagemUrl.startsWith('http') 
                  ? proj.imagemUrl 
                  : `${backendUrl}${proj.imagemUrl}`)
              : 'https://via.placeholder.com/200x120?text=Projeto';
              
          card.innerHTML = `
              <img src="${imageUrl}" alt="${proj.titulo}" class="profile-card-img">
              <div class="profile-card-title">${proj.titulo}</div>
              <div class="profile-card-subtitle">${proj.categoria || 'Projeto'}</div>
              <div class="profile-card-status">${proj.status || 'Em andamento'}</div>
          `;
          
          // Adiciona evento de clique para abrir modal
          card.addEventListener('click', () => {
              window.openProjectModal(proj.id);
          });
          
          elements.profileProjectsList.appendChild(card);
      });
  }

  // --- RENDERIZAÇÃO DE POSTS COM CARROSSEL ---
  
  async function fetchUserPosts(userId) {
      if (!elements.postsContainer) return;
      try {
        const response = await axios.get(`${backendUrl}/api/chat/publico`);
        elements.postsContainer.innerHTML = "";
        
        // Filtra apenas posts do usuário do perfil
        const userPosts = response.data.filter((post) => post.autorId === userId);

        if (userPosts.length === 0) {
          elements.postsContainer.innerHTML = "<p class='empty-state' style='text-align: center; padding: 2rem;'>Nenhuma postagem.</p>";
          return;
        }

        const sortedPosts = userPosts.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        sortedPosts.forEach((post) => {
            const postElement = createPostElement(post);
            elements.postsContainer.appendChild(postElement);
        });
      } catch (error) {
        console.error("Erro ao buscar posts:", error);
        elements.postsContainer.innerHTML = "<p class='empty-state' style='text-align: center; padding: 2rem;'>Erro ao carregar postagens.</p>";
      }
  }

  function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.id = `post-${post.id}`;
    
    const autorNome = post.nomeAutor || "Usuário";
    const autorAvatar = post.urlFotoAutor ? (post.urlFotoAutor.startsWith('http') ? post.urlFotoAutor : `${backendUrl}${post.urlFotoAutor}`) : defaultAvatarUrl;
    const dataFormatada = new Date(post.dataCriacao).toLocaleDateString('pt-BR');
    const isAuthor = currentUser && post.autorId === currentUser.id;

    // --- LÓGICA DO CARROSSEL ---
    let mediaHtml = "";
    if (post.urlsMidia && post.urlsMidia.length > 0) {
        if (post.urlsMidia.length > 2) {
            // Carrossel Horizontal (> 2 mídias)
            mediaHtml = renderFeedCarousel(post.urlsMidia, post.id);
        } else if (post.urlsMidia.length === 1) {
            // Mídia Única
            const url = post.urlsMidia[0];
            const fullMediaUrl = url.startsWith("http") ? url : `${backendUrl}${url}`;
            const safeMediaArray = JSON.stringify(post.urlsMidia).replace(/"/g, '&quot;');
            if (url.match(/\.(mp4|webm)$/i)) {
                mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)"><video controls src="${fullMediaUrl}" style="max-width: 100%; border-radius: 8px;"></video></div>`;
            } else {
                mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)"><img src="${fullMediaUrl}" style="max-width: 100%; border-radius: 8px; cursor: pointer;"></div>`;
            }
        } else {
            // Grid (2 mídias)
            mediaHtml = renderMediaGrid(post.urlsMidia);
        }
    }

    // Renderizar comentários
    const rootComments = (post.comentarios || []).filter((c) => !c.parentId);
    let commentsHtml = rootComments
        .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao))
        .map((comment) => renderCommentWithReplies(comment, post.comentarios, post))
        .join("");

    // Opções do post
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

    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-author-details">
                <div class="post-author-avatar"><img src="${autorAvatar}" alt="${autorNome}"></div>
                <div class="post-author-info"><strong>${autorNome}</strong><span class="timestamp">· ${dataFormatada}</span></div>
            </div>
            ${optionsMenu}
        </div>
        <div class="post-content"><p>${post.conteudo}</p></div>
        ${mediaHtml}
        <div class="post-actions">
            <button class="action-btn ${post.curtidoPeloUsuario ? "liked" : ""}" onclick="window.toggleLike(event, ${post.id}, null)">
                <i class="${post.curtidoPeloUsuario ? "fas" : "far"} fa-heart"></i> <span id="like-count-post-${post.id}">${post.totalCurtidas || 0}</span>
            </button>
            <button class="action-btn" onclick="window.toggleComments(${post.id})">
                <i class="far fa-comment"></i> <span>${post.comentarios?.length || 0}</span>
            </button>
        </div>
        <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
            <div class="comments-list">${commentsHtml}</div>
            <div class="comment-form">
                <input type="text" id="comment-input-${post.id}" placeholder="Comentar...">
                <button onclick="window.sendComment(${post.id}, null)"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>`;

    // Ativa listeners de scroll se for carrossel
    if (post.urlsMidia && post.urlsMidia.length > 2) {
        setTimeout(() => setupCarouselEventListeners(postElement, post.id), 0);
    }

    return postElement;
  }

  function renderCommentWithReplies(comment, allComments, post, isAlreadyInReplyThread = false) {
    let commentHtml = createCommentElement(comment, post, allComments);

    const replies = allComments
        .filter((reply) => reply.parentId === comment.id)
        .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));

    if (replies.length > 0) {
        if (!isAlreadyInReplyThread) {
            commentHtml += `<div class="comment-replies">`;
        }

        replies.forEach((reply) => {
            commentHtml += renderCommentWithReplies(reply, allComments, post, true);
        });

        if (!isAlreadyInReplyThread) {
            commentHtml += `</div>`;
        }
    }

    return commentHtml;
  }

  function createCommentElement(comment, post, allComments) {
    const commentAuthorName = comment.autor?.nome || comment.nomeAutor || "Usuário";
    const commentAuthorAvatar = comment.urlFotoAutor ? (comment.urlFotoAutor.startsWith("http") ? comment.urlFotoAutor : `${backendUrl}${comment.urlFotoAutor}`) : defaultAvatarUrl;
    const autorIdDoComentario = comment.autor?.id || comment.autorId;
    const autorIdDoPost = post.autor?.id || post.autorId;
    const isAuthor = currentUser && autorIdDoComentario == currentUser.id;
    const isPostOwner = currentUser && autorIdDoPost == currentUser.id;
    
    let optionsMenu = "";
    if (isAuthor || isPostOwner) {
        optionsMenu = `
            <button class="comment-options-btn" onclick="event.stopPropagation(); window.openCommentMenu(${comment.id})">
                <i class="fas fa-ellipsis-h"></i>
            </button>
            <div class="options-menu" id="comment-menu-${comment.id}" onclick="event.stopPropagation();">
                ${isAuthor ? `<button onclick="window.openEditCommentModal(${comment.id}, '${comment.conteudo.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i> Editar</button>` : ""}
                ${isAuthor || isPostOwner ? `<button class="danger" onclick="window.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Excluir</button>` : ""}
            </div>`;
    }

    let tagHtml = '';
    if (comment.parentId && allComments) {
        const parentComment = allComments.find(c => c.id === comment.parentId);
        if (parentComment && parentComment.parentId) {
            const parentAuthorId = parentComment.autorId; 
            tagHtml = `<a href="perfil.html?id=${parentAuthorId}" class="reply-tag">@${comment.replyingToName}</a>`;
        }
    }

    return `
        <div class="comment-container">
            <div class="comment ${comment.destacado ? "destacado" : ""}" id="comment-${comment.id}">
                <div class="comment-avatar"><img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}"></div>
                <div class="comment-body">
                    <span class="comment-author">${commentAuthorName}</span>
                    <p class="comment-content">${tagHtml} ${comment.conteudo}</p>
                </div>
                ${optionsMenu}
            </div>
            <div class="comment-actions-footer">
                <button class="action-btn-like ${comment.curtidoPeloUsuario ? "liked" : ""}" onclick="window.toggleLike(event, ${post.id}, ${comment.id})">Curtir</button>
                <button class="action-btn-reply" onclick="window.toggleReplyForm(${comment.id})">Responder</button>
                <span class="like-count" id="like-count-comment-${comment.id}"><i class="fas fa-heart"></i> ${comment.totalCurtidas || 0}</span>
            </div>
            <div class="reply-form" id="reply-form-${comment.id}">
                <input type="text" id="reply-input-${comment.id}" placeholder="Escreva sua resposta...">
                <button onclick="window.sendComment(${post.id}, ${comment.id})"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>`;
  }

  // --- FUNÇÕES GLOBAIS INTEGRADAS DA PRINCIPAL.JS ---

  // Funções de Amigos
  async function fetchFriends() {
    try {
      const response = await axios.get(`${backendUrl}/api/amizades/`);
      userFriends = response.data;
      window.userFriends = userFriends;
      if (elements.connectionsCount) {
        elements.connectionsCount.textContent = userFriends.length;
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
      const response = await axios.get(`${backendUrl}/api/amizades/online`);
      const amigosOnlineDTOs = response.data;
      latestOnlineEmails = amigosOnlineDTOs.map((amigo) => amigo.email);
    } catch (error) {
      console.error("Erro ao buscar status inicial de amigos online:", error);
      latestOnlineEmails = [];
    }
  }

  function atualizarStatusDeAmigosNaUI() {
    if (!elements.onlineFriendsList) return;
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
                ? (friend.fotoPerfil.startsWith('http') 
                    ? friend.fotoPerfil 
                    : `${backendUrl}/api/arquivos/${friend.fotoPerfil}`) 
                : defaultAvatarUrl;
            
            const friendId = friend.idUsuario; 

            friendElement.innerHTML = `
                <a href="perfil.html?id=${friendId}" class="friend-item-link">
                    <div class="avatar"><img src="${friendAvatar}" alt="Avatar de ${friend.nome}" onerror="this.src='${defaultAvatarUrl}';"></div>
                    <span class="friend-name">${friend.nome}</span>
                </a>
                <div class="status online"></div>
            `;
            elements.onlineFriendsList.appendChild(friendElement);
        });
    }
  }

  // Funções de Notificações
  async function fetchNotifications() {
    try {
      const response = await axios.get(`${backendUrl}/api/notificacoes`);
      renderNotifications(response.data);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  }

  function renderNotifications(notifications) {
    if (!elements.notificationsList) return;
    elements.notificationsList.innerHTML = "";
    const unreadCount = notifications.filter((n) => !n.lida).length;
    if (elements.notificationsBadge) {
      elements.notificationsBadge.style.display = unreadCount > 0 ? "flex" : "none";
      elements.notificationsBadge.textContent = unreadCount;
    }
    if (notifications.length === 0) {
      elements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
      return;
    }
    notifications.forEach((notification) => {
      const item = createNotificationElement(notification);
      elements.notificationsList.appendChild(item);
    });
  }

  function createNotificationElement(notification) {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.id = `notification-item-${notification.id}`;
    if (!notification.lida) item.classList.add('unread');

    const data = new Date(notification.dataCriacao).toLocaleString('pt-BR');
    let actionButtonsHtml = '';
    let iconClass = 'fa-info-circle';
    let notificationLink = '#';

    const postId = notification.idReferencia;
    const commentId = notification.idReferenciaSecundaria; 

    if (notification.tipo === 'PEDIDO_AMIZADE') {
        iconClass = 'fa-user-plus';
        notificationLink = 'amizades.html';
        if (!notification.lida) {
             actionButtonsHtml = `
              <div class="notification-actions">
                 <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
                 <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
              </div>`;
        }
    } else if (notification.tipo === 'NOVO_COMENTARIO' || notification.tipo === 'CURTIDA_POST' || notification.tipo === 'CURTIDA_COMENTARIO') {
        if (notification.tipo.startsWith('CURTIDA')) {
            iconClass = 'fa-heart';
        } else {
            iconClass = 'fa-comment';
        }
        notificationLink = `principal.html?postId=${postId}`;
        if (commentId) {
            notificationLink += `#comment-${commentId}`;
        }
    }

    item.innerHTML = `
        <a href="${notificationLink}" class="notification-link" onclick="window.markNotificationAsRead(event, ${notification.id})">
            <div class="notification-icon-wrapper"><i class="fas ${iconClass}"></i></div>
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

  async function markAllNotificationsAsRead() {
    const unreadCount = parseInt(elements.notificationsBadge.textContent, 10);
    if (isNaN(unreadCount) || unreadCount === 0) return;
    try {
      await axios.post(`${backendUrl}/api/notificacoes/ler-todas`);
      if (elements.notificationsBadge) {
        elements.notificationsBadge.style.display = "none";
        elements.notificationsBadge.textContent = "0";
      }
      if (elements.notificationsList) {
        elements.notificationsList.querySelectorAll(".notification-item.unread").forEach((item) => item.classList.remove("unread"));
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  }

  window.aceitarSolicitacao = async (amizadeId, notificationId) => {
    try {
      await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`);
      handleFriendRequestFeedback(notificationId, "Pedido aceito!", "success");
      fetchFriends();
    } catch (error) {
      handleFriendRequestFeedback(notificationId, "Erro ao aceitar.", "error");
    }
  };

  window.recusarSolicitacao = async (amizadeId, notificationId) => {
    try {
      await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`);
      handleFriendRequestFeedback(notificationId, "Pedido recusado.", "info");
    } catch (error) {
      handleFriendRequestFeedback(notificationId, "Erro ao recusar.", "error");
    }
  };

  function handleFriendRequestFeedback(notificationId, message, type = "info") {
    const item = document.getElementById(`notification-item-${notificationId}`);
    if (item) {
      const actionsDiv = item.querySelector(".notification-actions-wrapper");
      if (actionsDiv)
        actionsDiv.innerHTML = `<p class="feedback-text ${type === "success" ? "success" : ""}">${message}</p>`;
      setTimeout(() => {
        item.classList.add("removing");
        setTimeout(() => {
          item.remove();
          if (elements.notificationsList && elements.notificationsList.children.length === 0) {
            elements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
          }
        }, 500);
      }, 2500);
    }
    fetchNotifications();
  }

  // Funções de Mensagens - CORRIGIDAS
  function updateMessageBadge(count) {
    if (messageBadgeElement) {
      messageBadgeElement.textContent = count;
      messageBadgeElement.style.display = count > 0 ? "flex" : "none";
    }
    
    // Atualizar também no menu
    const messageBadgeMenu = document.getElementById("message-badge-menu");
    if (messageBadgeMenu) {
      messageBadgeMenu.textContent = count;
      messageBadgeMenu.style.display = count > 0 ? "flex" : "none";
    }
  }

  async function fetchAndUpdateUnreadCount() {
    if (!messageBadgeElement) return;
    try {
      const response = await axios.get(`${backendUrl}/api/chat/privado/nao-lidas/contagem`);
      const count = response.data;
      updateMessageBadge(count);
    } catch (error) {
      console.error("Erro ao buscar contagem de mensagens não lidas:", error);
    }
  }

  // Funções de WebSocket - CORRIGIDAS
  function connectWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    const headers = { Authorization: `Bearer ${jwtToken}` };

    stompClient.connect(
      headers,
      () => {
        console.log("CONECTADO AO WEBSOCKET (Perfil)");
        window.stompClient = stompClient;

        // Inscrição em Notificações
        stompClient.subscribe(`/user/queue/notifications`, (message) => {
          console.log("NOTIFICAÇÃO RECEBIDA!", message.body);
          const newNotification = JSON.parse(message.body);
          showNotification(`Nova notificação: ${newNotification.mensagem}`, "info");
          
          if (elements.notificationsList) {
            const emptyState = elements.notificationsList.querySelector(".empty-state");
            if (emptyState) emptyState.remove();
            const newItem = createNotificationElement(newNotification);
            elements.notificationsList.prepend(newItem);
          }
          if (elements.notificationsBadge) {
            const currentCount = parseInt(elements.notificationsBadge.textContent) || 0;
            const newCount = currentCount + 1;
            elements.notificationsBadge.textContent = newCount;
            elements.notificationsBadge.style.display = "flex";
          }
        });

        stompClient.subscribe('/user/queue/errors', (message) => {
          const errorMessage = message.body; 
          window.showNotification(errorMessage, 'error');
        });

        // Inscrição em Status Online
        stompClient.subscribe("/topic/status", (message) => {
          latestOnlineEmails = JSON.parse(message.body);
          atualizarStatusDeAmigosNaUI();
        });

        // Inscrição em Posts Públicos
        stompClient.subscribe("/topic/publico", (message) => {
          handlePublicFeedUpdate(JSON.parse(message.body));
        });

        // Inscrição para atualizações de amizades
        stompClient.subscribe(`/user/queue/amizades`, (message) => {
          fetchProfileFriends(profileUser.id);
          fetchFriends().then(() => {
            atualizarStatusDeAmigosNaUI();
          });
        });

        // INSCRIÇÃO PARA CONTAGEM DE MENSAGENS - CORRIGIDA
        stompClient.subscribe(`/user/queue/contagem`, (message) => {
          try {
            const count = JSON.parse(message.body);
            console.log("Contagem de mensagens não lidas:", count);
            updateMessageBadge(count);
          } catch (error) {
            console.error("Erro ao processar contagem de mensagens:", error);
          }
        });
        
        fetchAndUpdateUnreadCount();
      },
      (error) => {
        console.error("ERRO WEBSOCKET (Perfil):", error);
      }
    );
  }

  function handlePublicFeedUpdate(payload) {
    if (payload.autorAcaoId && currentUser && payload.autorAcaoId == currentUser.id)
      return;

    const postId = payload.postagem?.id || payload.id || payload.postagemId;

    if (payload.tipo === "remocao" && payload.postagemId) {
      const postElement = document.getElementById(`post-${payload.postagemId}`);
      if (postElement) postElement.remove();
    } else if (postId) {
      fetchAndReplacePost(postId);
    }
  }

  async function fetchAndReplacePost(postId) {
    try {
      const response = await axios.get(`${backendUrl}/postagem/${postId}`);
      const oldPostElement = document.getElementById(`post-${postId}`);

      if (response.data.autorId !== profileUser.id) {
        if (oldPostElement) oldPostElement.remove();
        return;
      }

      if (oldPostElement) {
        const wasCommentsVisible = oldPostElement.querySelector(".comments-section").style.display === "block";
        const newPostElement = createPostElement(response.data);
        if (wasCommentsVisible) newPostElement.querySelector(".comments-section").style.display = "block";
        oldPostElement.replaceWith(newPostElement);
      }
    } catch (error) {
      const oldPostElement = document.getElementById(`post-${postId}`);
      if (oldPostElement) oldPostElement.remove();
      console.error(`Falha ao recarregar post ${postId}:`, error);
    }
  }

  // --- CONFIGURAÇÃO DE AÇÕES DO PERFIL ---
  function configureProfileActions(isMyProfile) {
    if(elements.editProfileBtnPage) {
      elements.editProfileBtnPage.style.display = isMyProfile ? "inline-block" : "none";
    }

    // Se não for o próprio perfil, adicionar botões de ação
    if (!isMyProfile && currentUser && profileUser) {
      const profileActions = document.querySelector('.profile-actions');
      if (profileActions) {
        // Botão de enviar mensagem
        const messageBtn = document.createElement('button');
        messageBtn.className = 'btn btn-primary';
        messageBtn.innerHTML = '<i class="fas fa-envelope"></i> Enviar Mensagem';
        messageBtn.onclick = () => {
          window.location.href = `mensagem.html?userId=${profileUser.id}`;
        };

        // Botão de amizade - verificar status atual
        const friendBtn = document.createElement('button');
        friendBtn.className = 'btn btn-secondary';
        
        // Verificar status da amizade
        checkFriendshipStatus().then(status => {
          switch(status) {
            case 'AMIGOS':
              friendBtn.innerHTML = '<i class="fas fa-user-check"></i> Amigos';
              friendBtn.onclick = () => removerAmizade();
              break;
            case 'SOLICITACAO_ENVIADA':
              friendBtn.innerHTML = '<i class="fas fa-clock"></i> Solicitação Enviada';
              friendBtn.disabled = true;
              break;
            case 'SOLICITACAO_RECEBIDA':
              friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Responder Solicitação';
              friendBtn.onclick = () => window.location.href = 'amizades.html';
              break;
            default:
              friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar Amigo';
              friendBtn.onclick = () => enviarSolicitacaoAmizade();
          }
        });

        profileActions.innerHTML = '';
        profileActions.appendChild(messageBtn);
        profileActions.appendChild(friendBtn);
      }
    }
  }

  async function checkFriendshipStatus() {
    try {
      const response = await axios.get(`${backendUrl}/usuarios/buscar?nome=${profileUser.nome}`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      
      const usuarioEncontrado = response.data.find(user => user.id === profileUser.id);
      return usuarioEncontrado ? usuarioEncontrado.statusAmizade : 'NENHUMA';
    } catch (error) {
      console.error('Erro ao verificar status de amizade:', error);
      return 'NENHUMA';
    }
  }

  async function enviarSolicitacaoAmizade() {
    try {
      await axios.post(`${backendUrl}/api/amizades/solicitar/${profileUser.id}`);
      showNotification('Solicitação de amizade enviada!', 'success');
      configureProfileActions(false); // Recarregar botões
    } catch (error) {
      showNotification('Erro ao enviar solicitação de amizade.', 'error');
    }
  }

  async function removerAmizade() {
    if (confirm('Tem certeza que deseja remover esta amizade?')) {
      try {
        // Primeiro precisamos encontrar o ID da amizade
        const response = await axios.get(`${backendUrl}/api/amizades/`);
        const amizade = response.data.find(amigo => amigo.idUsuario === profileUser.id);
        
        if (amizade) {
          await axios.delete(`${backendUrl}/api/amizades/recusar/${amizade.id}`);
          showNotification('Amizade removida.', 'success');
          configureProfileActions(false); // Recarregar botões
        }
      } catch (error) {
        showNotification('Erro ao remover amizade.', 'error');
      }
    }
  }

  // --- FUNÇÕES DE EDIÇÃO/EXCLUSÃO DE PERFIL ---
  function openEditProfileModal() {
    if (!currentUser || !elements.editProfileModal) return;
    
    // Preencher o formulário com dados atuais
    document.getElementById("edit-profile-pic-preview").src = currentUser.urlFotoPerfil && currentUser.urlFotoPerfil.startsWith("http")
      ? currentUser.urlFotoPerfil
      : `${backendUrl}${currentUser.urlFotoPerfil || "/images/default-avatar.jpg"}`;
    
    document.getElementById("edit-profile-name").value = currentUser.nome;
    document.getElementById("edit-profile-bio").value = currentUser.bio || "";
    
    if (currentUser.dataNascimento) {
      document.getElementById("edit-profile-dob").value = currentUser.dataNascimento.split("T")[0];
    }
    
    document.getElementById("edit-profile-password").value = "";
    document.getElementById("edit-profile-password-confirm").value = "";
    
    elements.editProfileModal.style.display = "flex";
  }

  function openDeleteAccountModal() {
    if (elements.deleteAccountModal) {
      document.getElementById("delete-confirm-password").value = "";
      elements.deleteAccountModal.style.display = "flex";
    }
  }

  // --- FUNÇÕES DO MODAL DE PROJETOS ---
  window.openProjectModal = async (projectId) => {
    try {
        const response = await axios.get(`${backendUrl}/projetos/${projectId}`);
        const project = response.data;
        
        // Preencher modal com dados do projeto
        document.getElementById('project-modal-title').textContent = project.titulo;
        document.getElementById('project-modal-description').textContent = project.descricao || 'Sem descrição';
        document.getElementById('project-modal-category').textContent = project.categoria || 'Não especificada';
        document.getElementById('project-modal-status').textContent = project.status || 'Em andamento';
        document.getElementById('project-modal-date').textContent = new Date(project.dataCriacao).toLocaleDateString('pt-BR');
        
        // Imagem do projeto
        const projectImage = document.getElementById('project-modal-img');
        if (project.imagemUrl) {
            projectImage.src = project.imagemUrl.startsWith('http') 
                ? project.imagemUrl 
                : `${backendUrl}${project.imagemUrl}`;
        } else {
            projectImage.src = 'https://via.placeholder.com/600x300?text=Projeto';
        }
        
        // Tecnologias
        const techContainer = document.getElementById('project-modal-technologies');
        techContainer.innerHTML = '';
        if (project.tags && project.tags.length > 0) {
            project.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tech-tag';
                tagElement.textContent = tag;
                techContainer.appendChild(tagElement);
            });
        } else {
            techContainer.innerHTML = '<span>Nenhuma tecnologia especificada</span>';
        }
        
        // Links
        const projectLink = document.getElementById('project-modal-link');
        const projectFullLink = document.getElementById('project-modal-full-link');
        if (project.link) {
            projectLink.href = project.link;
            projectLink.style.display = 'inline';
        } else {
            projectLink.style.display = 'none';
        }
        
        projectFullLink.href = `projeto.html?id=${project.id}`;
        
        // Mostrar modal
        document.getElementById('project-modal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar detalhes do projeto:', error);
        showNotification('Erro ao carregar detalhes do projeto', 'error');
    }
  };

  // Função para fechar modal do projeto
  window.closeProjectModal = () => {
    document.getElementById('project-modal').style.display = 'none';
  };

  // --- SETUP EVENT LISTENERS ---
  function setupCarouselModalEvents() {
      if (elements.mediaViewerClose) {
        elements.mediaViewerClose.addEventListener('click', closeMediaViewer);
      }
      if (elements.carouselPrev) {
        elements.carouselPrev.addEventListener('click', prevMedia);
      }
      if (elements.carouselNext) {
        elements.carouselNext.addEventListener('click', nextMedia);
      }
      
      document.addEventListener('keydown', (e) => {
          if(elements.mediaViewerModal && elements.mediaViewerModal.style.display === 'flex') {
              if(e.key === 'Escape') closeMediaViewer();
              if(e.key === 'ArrowLeft') prevMedia();
              if(e.key === 'ArrowRight') nextMedia();
          }
      });
  }

  function setupEventListeners() {
    // Listener para o botão de edição de perfil na página
    if (elements.editProfileBtnPage) {
      elements.editProfileBtnPage.addEventListener("click", openEditProfileModal);
    }

    // User dropdown
    if (elements.userDropdownTrigger) {
      elements.userDropdownTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const menu = elements.userDropdownTrigger.nextElementSibling;
        if (menu && menu.classList.contains("dropdown-menu")) {
          const isVisible = menu.style.display === "block";
          closeAllMenus();
          if (!isVisible) menu.style.display = "block";
        }
      });
    }

    // Logout
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
      });
    }

    // Notificações
    if (elements.notificationsIcon) {
      elements.notificationsIcon.addEventListener("click", (event) => {
        event.stopPropagation();
        const panel = elements.notificationsPanel;
        const isVisible = panel.style.display === "block";
        panel.style.display = isVisible ? "none" : "block";
        if (!isVisible) markAllNotificationsAsRead();
      });
    }

    // Tema
    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }

    // Modal de editar perfil
    if (elements.editProfileBtn) {
      elements.editProfileBtn.addEventListener("click", openEditProfileModal);
    }
    
    if (elements.deleteAccountBtn) {
      elements.deleteAccountBtn.addEventListener("click", openDeleteAccountModal);
    }
    
    // Cancelar edição
    if (document.getElementById("cancel-edit-profile-btn")) {
      document.getElementById("cancel-edit-profile-btn").addEventListener("click", () => {
        elements.editProfileModal.style.display = "none";
      });
    }
    
    // Cancelar exclusão
    if (document.getElementById("cancel-delete-account-btn")) {
      document.getElementById("cancel-delete-account-btn").addEventListener("click", () => {
        elements.deleteAccountModal.style.display = "none";
      });
    }
    
    // Preview da foto de perfil
    if (document.getElementById("edit-profile-pic-input")) {
      document.getElementById("edit-profile-pic-input").addEventListener("change", function() {
        const file = this.files[0];
        if (file) {
          document.getElementById("edit-profile-pic-preview").src = URL.createObjectURL(file);
        }
      });
    }

    // Submeter edição do perfil - CORRIGIDO
    if (elements.editProfileForm) {
      elements.editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const password = document.getElementById("edit-profile-password").value;
        const passwordConfirm = document.getElementById("edit-profile-password-confirm").value;
        
        if (password && password !== passwordConfirm) {
          showNotification("As novas senhas não coincidem.", "error");
          return;
        }
        
        try {
          // Primeiro, atualizar a foto se houver uma nova
          const profilePicInput = document.getElementById("edit-profile-pic-input");
          if (profilePicInput.files[0]) {
            const formData = new FormData();
            formData.append("foto", profilePicInput.files[0]);
            try {
              const fotoResponse = await axios.put(`${backendUrl}/usuarios/me/foto`, formData);
              currentUser = fotoResponse.data;
              updateUIWithUserData(currentUser);
              showNotification("Foto de perfil atualizada!", "success");
            } catch (error) {
              let errorMessage = "Erro ao atualizar a foto.";
              if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
              }
              showNotification(errorMessage, "error");
              return;
            }
          }
          
          // Depois, atualizar os outros dados
          const updateData = {
            nome: document.getElementById("edit-profile-name").value,
            bio: document.getElementById("edit-profile-bio").value,
            dataNascimento: document.getElementById("edit-profile-dob").value ? 
              new Date(document.getElementById("edit-profile-dob").value).toISOString() : null,
            senha: password || null,
          };
          
          const response = await axios.put(`${backendUrl}/usuarios/me`, updateData);
          currentUser = response.data;
          updateUIWithUserData(currentUser);
          populateProfileData(currentUser);
          showNotification("Perfil atualizado com sucesso!", "success");
          elements.editProfileModal.style.display = "none";
        } catch (error) {
          showNotification("Erro ao atualizar o perfil.", "error");
        }
      });
    }

    // Submeter exclusão de conta
    if (elements.deleteAccountForm) {
      elements.deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("delete-confirm-password").value;
        
        if (!password) {
          showNotification("Por favor, digite sua senha para confirmar.", "error");
          return;
        }
        
        try {
          // Verificar senha primeiro
          await axios.post(`${backendUrl}/autenticacao/login`, {
            email: currentUser.email,
            senha: password,
          });
          
          if (confirm("Você tem ABSOLUTA CERTEZA? Esta ação não pode ser desfeita.")) {
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

    // Fechar modal de projeto ao clicar fora
    if (document.getElementById('project-modal')) {
      document.getElementById('project-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('project-modal')) {
          closeProjectModal();
        }
      });
    }

    // Fechar modal de projeto com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.getElementById('project-modal').style.display === 'flex') {
        closeProjectModal();
      }
    });

    // Fechar menus ao clicar fora
    document.addEventListener('click', (e) => {
      if (elements.editProfileModal && e.target === elements.editProfileModal) {
        elements.editProfileModal.style.display = 'none';
      }
      if (elements.deleteAccountModal && e.target === elements.deleteAccountModal) {
        elements.deleteAccountModal.style.display = 'none';
      }
      if (elements.editPostModal && e.target === elements.editPostModal) {
        elements.editPostModal.style.display = 'none';
      }
      if (elements.editCommentModal && e.target === elements.editCommentModal) {
        elements.editCommentModal.style.display = 'none';
      }
      if (elements.mediaViewerModal && e.target === elements.mediaViewerModal) {
        closeMediaViewer();
      }
      
      // Fechar dropdowns
      closeAllMenus();
      
      // Fechar painel de notificações
      if (elements.notificationsPanel && 
          !elements.notificationsPanel.contains(e.target) && 
          !elements.notificationsIcon.contains(e.target)) {
        elements.notificationsPanel.style.display = "none";
      }
    });
  }

  function closeAllMenus() {
    document.querySelectorAll('.options-menu, .dropdown-menu').forEach(menu => {
      menu.style.display = 'none';
    });
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    if (elements.notificationCenter) elements.notificationCenter.appendChild(notification);
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
  window.showNotification = showNotification;

  // --- FUNÇÕES GLOBAIS PARA INTERAÇÃO ---

  // Funções de curtida
  window.toggleLike = async (event, postId, commentId) => {
    const btn = event.currentTarget;
    const isPost = commentId === null;
    const countId = isPost ? `like-count-post-${postId}` : `like-count-comment-${commentId}`;
    const countSpan = document.getElementById(countId);
    let count = parseInt(countSpan.innerText.trim(), 10);
    if (isNaN(count)) count = 0;

    btn.classList.toggle("liked");
    const isLiked = btn.classList.contains("liked");
    const newCount = isLiked ? count + 1 : count - 1;

    // Atualização da UI
    if (isPost) {
      const icon = btn.querySelector("i");
      if (icon) {
        if (isLiked) {
          icon.classList.remove("far");
          icon.classList.add("fas");
        } else {
          icon.classList.remove("fas");
          icon.classList.add("far");
        }
      }
      countSpan.textContent = newCount;
    } else {
      countSpan.innerHTML = `<i class="fas fa-heart"></i> ${newCount}`;
    }

    // Chamada API
    try {
      await axios.post(`${backendUrl}/curtidas/toggle`, {
        postagemId: postId,
        comentarioId: commentId,
      });
    } catch (error) {
      showNotification("Erro ao processar curtida.", "error");
      btn.classList.toggle("liked");
      if (isPost) {
        const icon = btn.querySelector("i");
        if (icon) {
          if (!isLiked) {
            icon.classList.remove("fas");
            icon.classList.add("far");
          } else {
            icon.classList.remove("far");
            icon.classList.add("fas");
          }
        }
        countSpan.textContent = count;
      } else {
        countSpan.innerHTML = `<i class="fas fa-heart"></i> ${count}`;
      }
    }
  };

  // Funções de comentários
  window.toggleComments = (postId) => { 
    const sec = document.getElementById(`comments-section-${postId}`);
    if(sec) sec.style.display = sec.style.display === 'block' ? 'none' : 'block';
  };

  window.sendComment = (postId, parentId = null) => {
    const inputId = parentId 
        ? `reply-input-${parentId}` 
        : `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    const content = input.value.trim();
    
    if (stompClient?.connected && content) {
      stompClient.send(
        `/app/postagem/${postId}/comentar`,
        {},
        JSON.stringify({ conteudo: content, parentId: parentId })
      );
      input.value = "";
      if (parentId) {
        document.getElementById(`reply-form-${parentId}`).style.display = "none";
      }
    }
  };

  window.toggleReplyForm = (commentId) => {
    const form = document.getElementById(`reply-form-${commentId}`);
    form.style.display = form.style.display === 'flex' ? 'none' : 'flex';
  };

  // Funções de menu de opções
  window.openPostMenu = (postId) => {
    document.querySelectorAll('.options-menu').forEach(menu => menu.style.display = 'none');
    const menu = document.getElementById(`post-menu-${postId}`);
    if (menu) menu.style.display = 'block';
  };

  window.openCommentMenu = (commentId) => {
    document.querySelectorAll('.options-menu').forEach(menu => menu.style.display = 'none');
    const menu = document.getElementById(`comment-menu-${commentId}`);
    if (menu) menu.style.display = 'block';
  };

  // Funções de edição e exclusão
  window.openEditPostModal = async (postId) => {
    if (!elements.editPostModal) return;
    try {
      const response = await axios.get(`${backendUrl}/postagem/${postId}`);
      const post = response.data;
      
      // Preenche o modal com os dados do post
      document.getElementById('edit-post-id').value = post.id;
      document.getElementById('edit-post-textarea').value = post.conteudo;
      
      elements.editPostModal.style.display = "flex";
    } catch (error) {
      showNotification("Erro ao carregar postagem para edição.", "error");
    }
  };

  window.deletePost = async (postId) => {
    if (confirm("Tem certeza que deseja excluir esta postagem?")) {
      try {
        await axios.delete(`${backendUrl}/postagem/${postId}`);
        showNotification("Postagem excluída.", "success");
      } catch (error) {
        showNotification("Erro ao excluir postagem.", "error");
      }
    }
  };

  window.deleteComment = async (commentId) => {
    if (confirm("Tem certeza que deseja excluir este comentário?")) {
      try {
        await axios.delete(`${backendUrl}/comentarios/${commentId}`);
        showNotification("Comentário excluído.", "success");
      } catch (error) {
        showNotification("Erro ao excluir comentário.", "error");
      }
    }
  };

  window.openEditCommentModal = (commentId, content) => {
    document.getElementById('edit-comment-id').value = commentId;
    document.getElementById('edit-comment-textarea').value = content;
    document.getElementById('edit-comment-modal').style.display = "flex";
  };

  // Inicialização
  init();
});