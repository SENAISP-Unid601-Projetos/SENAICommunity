document.addEventListener('DOMContentLoaded', () => {
    // ==================== VARIÁVEIS GLOBAIS ====================
    const currentUser = {
      id: 1,
      name: "Vinicius Gallo Santos",
      username: "Vinicius G.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      title: "Estudante de ADS",
      connections: 156,
      projects: 24
    };
  
    // ==================== GERENCIAMENTO DE TEMA ====================
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Verificar preferência salva ou usar o padrão
    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
    
    // Atualizar ícone do toggle
    updateThemeIcon(savedTheme);
  
    themeToggle.addEventListener('click', () => {
      const currentTheme = body.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      
      showNotification(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
    });
  
    function updateThemeIcon(theme) {
      themeToggle.innerHTML = theme === 'dark' 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
    }
  
    // ==================== MENU MOBILE ====================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (window.innerWidth <= 768) {
      menuToggle.style.display = 'block';
      sidebar.classList.add('mobile-hidden');
    }
  
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-hidden');
      menuToggle.innerHTML = sidebar.classList.contains('mobile-hidden') 
        ? '<i class="fas fa-bars"></i>' 
        : '<i class="fas fa-times"></i>';
    });
  
    // ==================== DROPDOWN DO USUÁRIO ====================
    const userDropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    userDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
  
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
  
    // ==================== BARRA DE PESQUISA ====================
    const searchInput = document.querySelector('.search input');
    const searchResults = document.querySelector('.search-results');
    
    searchInput.addEventListener('focus', () => {
      searchResults.style.display = 'block';
      loadSearchResults();
    });
    
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        searchResults.style.display = 'none';
      }, 200);
    });
    
    searchInput.addEventListener('input', (e) => {
      loadSearchResults(e.target.value);
    });
  
    function loadSearchResults(query = '') {
      // Simulação de resultados da API
      const mockResults = [
        { id: 1, name: "Curso de Desenvolvimento Web", type: "course" },
        { id: 2, name: "Grupo de Projetos IoT", type: "group" },
        { id: 3, name: "Miguel Piscki", type: "user" },
        { id: 4, name: "Workshop de React", type: "event" }
      ];
      
      const filteredResults = mockResults.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      
      searchResults.innerHTML = filteredResults.map(result => `
        <div class="search-result" data-type="${result.type}" data-id="${result.id}">
          <i class="fas fa-${getIconByType(result.type)}"></i>
          <span>${result.name}</span>
        </div>
      `).join('');
      
      // Adicionar eventos aos resultados
      document.querySelectorAll('.search-result').forEach(result => {
        result.addEventListener('click', () => {
          showNotification(`Redirecionando para: ${result.querySelector('span').textContent}`);
          searchInput.value = '';
          searchResults.style.display = 'none';
        });
      });
    }
    
    function getIconByType(type) {
      const icons = {
        course: 'book',
        group: 'users',
        user: 'user',
        event: 'calendar'
      };
      return icons[type] || 'search';
    }
  
    // ==================== CRIAÇÃO DE POSTS ====================
    const postCreatorInput = document.querySelector('.post-creator input');
    const postOptions = document.querySelectorAll('.post-options .option-btn');
    const postsContainer = document.querySelector('.posts-container');
    
    postCreatorInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && postCreatorInput.value.trim()) {
        createPost(postCreatorInput.value.trim());
        postCreatorInput.value = '';
      }
    });
    
    postOptions.forEach(option => {
      option.addEventListener('click', () => {
        const type = option.dataset.type;
        showNotification(`Adicionar ${type === 'photo' ? 'imagem' : type === 'video' ? 'vídeo' : 'código'}`);
      });
    });
  
    function createPost(content, images = []) {
      const postId = Date.now();
      const postElement = document.createElement('div');
      postElement.className = 'post';
      postElement.dataset.id = postId;
      
      postElement.innerHTML = `
        <div class="post-header">
          <div class="post-author">
            <div class="post-icon">
              <img src="${currentUser.avatar}" alt="${currentUser.name}">
            </div>
            <div class="post-info">
              <h2>${currentUser.name}</h2>
              <span>agora • <i class="fas fa-globe-americas"></i></span>
            </div>
          </div>
          <div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div>
        </div>
        <div class="post-text">${content}</div>
        ${images.length ? `
          <div class="post-images">
            ${images.map(img => `<img src="${img}" alt="Post image">`).join('')}
          </div>
        ` : ''}
        <div class="post-actions">
          <button class="like-btn"><i class="far fa-thumbs-up"></i> <span>Curtir</span> <span class="count">0</span></button>
          <button class="comment-btn"><i class="far fa-comment"></i> <span>Comentar</span> <span class="count">0</span></button>
          <button class="share-btn"><i class="far fa-share-square"></i> <span>Compartilhar</span></button>
        </div>
        <div class="post-comments"></div>
        <div class="add-comment">
          <div class="avatar-small">
            <img src="${currentUser.avatar}" alt="${currentUser.name}">
          </div>
          <input type="text" placeholder="Adicione um comentário...">
        </div>
      `;
      
      // Adicionar eventos ao novo post
      addPostEvents(postElement);
      
      // Adicionar no topo do feed
      postsContainer.prepend(postElement);
      
      // Animação de entrada
      setTimeout(() => {
        postElement.style.opacity = 1;
        postElement.style.transform = 'translateY(0)';
      }, 10);
      
      showNotification('Post criado com sucesso!');
    }
  
    // ==================== INTERAÇÕES COM POSTS ====================
    function addPostEvents(postElement) {
      // Opções do post
      const optionsBtn = postElement.querySelector('.post-options-btn');
      optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPostOptionsMenu(postElement, e.currentTarget);
      });
      
      // Curtir post
      const likeBtn = postElement.querySelector('.like-btn');
      likeBtn.addEventListener('click', () => {
        const isLiked = likeBtn.classList.toggle('liked');
        const icon = likeBtn.querySelector('i');
        const count = likeBtn.querySelector('.count');
        
        if (isLiked) {
          icon.className = 'fas fa-thumbs-up';
          count.textContent = parseInt(count.textContent) + 1;
        } else {
          icon.className = 'far fa-thumbs-up';
          count.textContent = parseInt(count.textContent) - 1;
        }
      });
      
      // Comentar
      const commentInput = postElement.querySelector('.add-comment input');
      commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && commentInput.value.trim()) {
          addComment(postElement, commentInput.value.trim());
          commentInput.value = '';
        }
      });
      
      // Compartilhar
      const shareBtn = postElement.querySelector('.share-btn');
      shareBtn.addEventListener('click', () => {
        showNotification('Post compartilhado com sucesso!');
      });
    }
  
    function showPostOptionsMenu(postElement, target) {
      // Remover menus existentes
      document.querySelectorAll('.post-options-menu').forEach(menu => menu.remove());
      
      const menu = document.createElement('div');
      menu.className = 'post-options-menu';
      menu.innerHTML = `
        <button data-action="save"><i class="far fa-bookmark"></i> Salvar</button>
        <button data-action="edit"><i class="far fa-edit"></i> Editar</button>
        <button data-action="delete"><i class="far fa-trash-alt"></i> Excluir</button>
      `;
      
      document.body.appendChild(menu);
      
      // Posicionar o menu
      const rect = target.getBoundingClientRect();
      menu.style.top = `${rect.bottom + window.scrollY}px`;
      menu.style.left = `${rect.left + window.scrollX - 150}px`;
      
      // Adicionar eventos
      menu.querySelector('[data-action="save"]').addEventListener('click', () => {
        showNotification('Post salvo nos favoritos!');
        menu.remove();
      });
      
      menu.querySelector('[data-action="edit"]').addEventListener('click', () => {
        showNotification('Edição de post ainda não implementada');
        menu.remove();
      });
      
      menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
        postElement.style.transform = 'scale(0.9)';
        postElement.style.opacity = '0';
        
        setTimeout(() => {
          postElement.remove();
          showNotification('Post excluído com sucesso!');
        }, 300);
        
        menu.remove();
      });
      
      // Fechar ao clicar fora
      setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        });
      }, 10);
    }
  
    function addComment(postElement, content) {
      const commentsContainer = postElement.querySelector('.post-comments');
      const commentCount = postElement.querySelector('.comment-btn .count');
      
      const comment = document.createElement('div');
      comment.className = 'comment';
      comment.innerHTML = `
        <div class="avatar-small">
          <img src="${currentUser.avatar}" alt="${currentUser.name}">
        </div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">${currentUser.name}</span>
            <span class="comment-time">agora</span>
          </div>
          <p>${content}</p>
        </div>
      `;
      
      commentsContainer.appendChild(comment);
      commentCount.textContent = parseInt(commentCount.textContent) + 1;
      
      // Animação
      comment.style.opacity = '0';
      comment.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        comment.style.opacity = '1';
        comment.style.transform = 'translateY(0)';
      }, 10);
    }
  
    // ==================== STORIES ====================
    const stories = document.querySelectorAll('.story');
    
    stories.forEach(story => {
      story.addEventListener('click', () => {
        if (story.classList.contains('create-story')) {
          showNotification('Criar novo story');
        } else {
          const username = story.querySelector('span').textContent;
          showNotification(`Visualizando story de ${username}`);
        }
      });
    });
  
    // ==================== AMIGOS ONLINE ====================
    const friends = document.querySelectorAll('.friend');
    
    friends.forEach(friend => {
      friend.addEventListener('click', () => {
        const friendId = friend.dataset.id;
        const friendName = friend.querySelector('span').textContent;
        showNotification(`Iniciar chat com ${friendName}`);
      });
    });
  
    // ==================== EVENTOS ====================
    const rsvpButtons = document.querySelectorAll('.rsvp-btn');
    
    rsvpButtons.forEach(button => {
      button.addEventListener('click', () => {
        const eventName = button.closest('.event-info').querySelector('h4').textContent;
        button.textContent = button.textContent === 'Confirmar Presença' 
          ? 'Presença Confirmada ✓' 
          : 'Confirmar Presença';
        
        button.classList.toggle('confirmed');
        showNotification(button.classList.contains('confirmed') 
          ? `Presença confirmada para ${eventName}` 
          : `Presença cancelada para ${eventName}`);
      });
    });
  
    // ==================== AÇÕES RÁPIDAS ====================
    const quickActions = document.querySelectorAll('.action-btn');
    
    quickActions.forEach(action => {
      action.addEventListener('click', () => {
        const actionName = action.querySelector('span').textContent;
        showNotification(`Ação: ${actionName}`);
      });
    });
  
    // ==================== BOTÕES FLUTUANTES ====================
    const floatBtn = document.querySelector('.float-btn.main-btn');
    const floatMenu = document.querySelector('.float-menu');
    
    floatBtn.addEventListener('click', () => {
      floatMenu.classList.toggle('visible');
      
      // Animar botões do menu
      if (floatMenu.classList.contains('visible')) {
        const buttons = floatMenu.querySelectorAll('.float-btn');
        buttons.forEach((btn, index) => {
          setTimeout(() => {
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0)';
          }, index * 100);
        });
      } else {
        floatMenu.querySelectorAll('.float-btn').forEach(btn => {
          btn.style.opacity = '0';
          btn.style.transform = 'translateY(20px)';
        });
      }
    });
    
    floatMenu.querySelectorAll('.float-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        
        switch(action) {
          case 'project':
            showNotification('Criar novo projeto');
            break;
          case 'post':
            showNotification('Criar nova postagem');
            break;
          case 'event':
            showNotification('Criar novo evento');
            break;
        }
        
        floatMenu.classList.remove('visible');
      });
    });
  
    // ==================== NOTIFICAÇÕES ====================
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      document.querySelector('.notification-center').appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    }
  
    // ==================== CARREGAR POSTS INICIAIS ====================
    function loadInitialPosts() {
      const mockPosts = [
        {
          id: 1,
          author: {
            name: "Miguel Piscki",
            avatar: "https://randomuser.me/api/portraits/men/22.jpg"
          },
          content: "Finalizamos hoje o projeto de automação industrial usando Arduino e sensores IoT. O sistema monitora temperatura, umidade e controla atuadores remotamente!",
          images: ["https://images.unsplash.com/photo-1558522195-e1201b090344?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"],
          time: "13h",
          likes: 24,
          comments: [
            {
              author: "Ana Silva",
              avatar: "https://randomuser.me/api/portraits/women/33.jpg",
              content: "Incrível, Miguel! Poderia compartilhar o código fonte?",
              time: "2h atrás"
            }
          ]
        },
        {
          id: 2,
          author: {
            name: "Matheus Biancolini",
            avatar: "https://randomuser.me/api/portraits/men/45.jpg"
          },
          content: "Alguém interessado em formar um grupo de estudos para a maratona de programação? Estou pensando em reunir 3-5 pessoas para treinar 2x por semana.",
          images: [],
          time: "Ontem",
          likes: 12,
          comments: []
        }
      ];
      
      mockPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.dataset.id = post.id;
        
        postElement.innerHTML = `
          <div class="post-header">
            <div class="post-author">
              <div class="post-icon">
                <img src="${post.author.avatar}" alt="${post.author.name}">
              </div>
              <div class="post-info">
                <h2>${post.author.name}</h2>
                <span>${post.time} • <i class="fas fa-globe-americas"></i></span>
              </div>
            </div>
            <div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div>
          </div>
          <div class="post-text">${post.content}</div>
          ${post.images.length ? `
            <div class="post-images">
              ${post.images.map(img => `<img src="${img}" alt="Post image">`).join('')}
            </div>
          ` : ''}
          <div class="post-actions">
            <button class="like-btn"><i class="far fa-thumbs-up"></i> <span>Curtir</span> <span class="count">${post.likes}</span></button>
            <button class="comment-btn"><i class="far fa-comment"></i> <span>Comentar</span> <span class="count">${post.comments.length}</span></button>
            <button class="share-btn"><i class="far fa-share-square"></i> <span>Compartilhar</span></button>
          </div>
          <div class="post-comments">
            ${post.comments.map(comment => `
              <div class="comment">
                <div class="avatar-small">
                  <img src="${comment.avatar}" alt="${comment.author}">
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${comment.time}</span>
                  </div>
                  <p>${comment.content}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="add-comment">
            <div class="avatar-small">
              <img src="${currentUser.avatar}" alt="${currentUser.name}">
            </div>
            <input type="text" placeholder="Adicione um comentário...">
          </div>
        `;
        
        postsContainer.appendChild(postElement);
        addPostEvents(postElement);
      });
    }
  
    // ==================== INICIALIZAÇÃO ====================
    loadInitialPosts();
    
    // Mostrar notificação de boas-vindas
    setTimeout(() => {
      showNotification(`Bem-vindo de volta, ${currentUser.name.split(' ')[0]}!`, 'success');
    }, 1000);
  
    // ==================== RESPONSIVIDADE ====================
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        menuToggle.style.display = 'block';
      } else {
        menuToggle.style.display = 'none';
        sidebar.classList.remove('mobile-hidden');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  });