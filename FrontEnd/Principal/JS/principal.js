// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {

    // ==================== FUNÇÃO DE NOTIFICAÇÃO ====================
    function showNotification(message, type = 'info') {
        const notificationCenter = document.querySelector('.notification-center');
        if (!notificationCenter) {
            console.error('Elemento .notification-center não encontrado no DOM.');
            return;
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationCenter.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        // O tempo de exibição foi alterado de 5000 para 3000 (3 segundos)
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    }

    // ==================== VARIÁVEIS GLOBAIS ====================
    const currentUser = {
        id: 1,
        name: "Usuário Temporário",
        username: "Usuário Temporário",
        avatar: "./img/perfil.png",
        title: "Estudante de ADS",
        connections: 11,
        projects: 2
    };

    // ==================== GERENCIAMENTO DE TEMA ====================
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        const body = document.body;
        const savedTheme = localStorage.getItem('theme') || 'dark';
        body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });

        function updateThemeIcon(theme) {
            themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
    }

    // ==================== MENU MOBILE ====================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'block';
            sidebar.classList.add('mobile-hidden');
        }
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-hidden');
            menuToggle.innerHTML = sidebar.classList.contains('mobile-hidden') ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
        });
    }
    
    // ==================== DROPDOWN DO USUÁRIO ====================
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown) {
        const dropdownMenu = userDropdown.querySelector('.dropdown-menu');
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', () => {
            if (dropdownMenu) dropdownMenu.style.display = 'none';
        });
    }

    // ==================== CRIAÇÃO DE POSTS (FUNCIONALIDADE RESTAURADA) ====================
    const postsContainer = document.querySelector('.posts-container');
    const postCreatorSimpleView = document.querySelector('.post-creator-simple');
    const postCreatorExpandedView = document.querySelector('.post-creator-expanded');

    if (postCreatorSimpleView && postCreatorExpandedView) {
        const simpleViewTrigger = postCreatorSimpleView.querySelector('.post-creator-trigger');
        const cancelBtn = postCreatorExpandedView.querySelector('.cancel-btn');
        const publishBtn = postCreatorExpandedView.querySelector('.publish-btn');
        const textarea = postCreatorExpandedView.querySelector('.editor-textarea');
        
        const openEditor = () => {
            postCreatorSimpleView.style.display = 'none';
            postCreatorExpandedView.style.display = 'block';
            textarea.focus();
        };

        const closeEditor = () => {
            postCreatorSimpleView.style.display = 'flex';
            postCreatorExpandedView.style.display = 'none';
            textarea.value = '';
            publishBtn.disabled = true;
        };
        
        const checkPublishButtonState = () => {
            publishBtn.disabled = !textarea.value.trim();
        };
        
        simpleViewTrigger.addEventListener('click', openEditor);
        cancelBtn.addEventListener('click', closeEditor);
        textarea.addEventListener('input', checkPublishButtonState);

        publishBtn.addEventListener('click', () => {
            const content = textarea.value.trim();
            if (content) {
                createPost(content);
                closeEditor();
            }
        });
    }

    function createPost(content) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.dataset.id = Date.now();
        postElement.dataset.authorName = currentUser.name;
        postElement.innerHTML = `
            <div class="post-header"><div class="post-author"><div class="post-icon"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div><div class="post-info"><h2>${currentUser.name}</h2><span>agora • <i class="fas fa-globe-americas"></i></span></div></div><div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div></div>
            <div class="post-text">${content}</div>
            <div class="post-actions"><button class="like-btn"><i class="far fa-thumbs-up"></i> <span>Curtir</span> <span class="count">0</span></button><button class="comment-btn"><i class="far fa-comment"></i> <span>Comentar</span> <span class="count">0</span></button><button class="share-btn"><i class="far fa-share-square"></i> <span>Compartilhar</span></button></div>
            <div class="post-comments"></div>
            <div class="add-comment"><div class="avatar-small"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div><input type="text" placeholder="Adicione um comentário..."></div>`;
        addPostEvents(postElement);
        postsContainer.prepend(postElement);
    }

    // ==================== INTERAÇÕES COM POSTS ====================
    function addPostEvents(postElement) {
        const optionsBtn = postElement.querySelector('.post-options-btn');
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPostOptionsMenu(postElement, e.currentTarget);
        });
        const likeBtn = postElement.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => {
            likeBtn.classList.toggle('liked');
            const icon = likeBtn.querySelector('i');
            const count = likeBtn.querySelector('.count');
            const isLiked = likeBtn.classList.contains('liked');
            icon.className = isLiked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
            count.textContent = parseInt(count.textContent) + (isLiked ? 1 : -1);
        });
        const commentInput = postElement.querySelector('.add-comment input');
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && commentInput.value.trim()) {
                addComment(postElement, commentInput.value.trim());
                commentInput.value = '';
            }
        });
        const shareBtn = postElement.querySelector('.share-btn');
        shareBtn.addEventListener('click', () => showNotification('Post compartilhado com sucesso!'));
    }
    
    function showPostOptionsMenu(postElement, targetButton) {
        document.querySelectorAll('.post-options-menu').forEach(menu => menu.remove());
        const menu = document.createElement('div');
        menu.className = 'post-options-menu';
        const isMyPost = postElement.dataset.authorName === currentUser.name;
        let menuHTML = `<button data-action="save"><i class="far fa-bookmark"></i> Salvar</button>`;
        if (isMyPost) {
            menuHTML += `<button data-action="edit"><i class="far fa-edit"></i> Editar</button><button data-action="delete"><i class="far fa-trash-alt"></i> Excluir</button>`;
        }
        menu.innerHTML = menuHTML;
        document.body.appendChild(menu);
        const rect = targetButton.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('button').dataset.action;
            if (action === 'delete') {
                postElement.remove();
                showNotification('Post excluído com sucesso!');
            } else {
                showNotification('Funcionalidade ainda não implementada.');
            }
            menu.remove();
        });
        setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
    }

    function addComment(postElement, content) {
        const commentsContainer = postElement.querySelector('.post-comments');
        const commentCount = postElement.querySelector('.comment-btn .count');
        const comment = document.createElement('div');
        comment.className = 'comment';
        comment.innerHTML = `<div class="avatar-small"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div><div class="comment-content"><div class="comment-header"><span class="comment-author">${currentUser.name}</span><span class="comment-time">agora</span></div><p>${content}</p></div>`;
        commentsContainer.appendChild(comment);
        commentCount.textContent = parseInt(commentCount.textContent) + 1;
    }

    // ==================== AMIGOS ONLINE (FUNCIONALIDADE RESTAURADA) ====================
    function loadOnlineFriends() {
        const onlineFriendsContainer = document.querySelector('.online-friends');
        if (!onlineFriendsContainer) return;
        const mockFriends = [
            { id: 'miguel', name: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg", status: "online" },
            { id: 'senai', name: "Senai", avatar: "https://yt3.googleusercontent.com/wyGnsuVLCBoHStdhQ3Tj7Wr48yb_Oi2e1OmP2Rly99xB6wwe66T64bhCNDZkP5xxNHxF-lsE1A=s900-c-k-c0x00ffffff-no-rj", status: "online" },
            { id: 'vinicius', name: "Vinicius Gallo", avatar: "./img/viniciusGallo.jpg", status: "online" }
        ];
        const friendsHTML = mockFriends.map(friend => `
            <a href="perfil.html?id=${friend.id}" class="friend" title="${friend.name}">
                <div class="friend-avatar ${friend.status}"><img src="${friend.avatar}" alt="${friend.name}"></div>
                <span>${friend.name.split(' ')[0]}</span>
            </a>`).join('');
        onlineFriendsContainer.innerHTML = `<div class="section-header"><h3><i class="fas fa-user-friends"></i> Colegas Online</h3><a href="#" class="see-all">Ver todos</a></div><div class="friends-grid">${friendsHTML}</div>`;
    }
    
    // ==================== WIDGETS (FUNCIONALIDADE RESTAURADA) ====================
    function loadAllWidgets() {
        const eventsWidget = document.getElementById('upcoming-events-widget');
        if (eventsWidget) {
            const mockEventos = [
                { id: 5, titulo: "Semana da Cibersegurança", data: new Date(2025, 9, 9), formato: "Híbrido" },
                { id: 2, titulo: "Workshop de APIs com Node.js", data: new Date(2025, 9, 15), formato: "Online" },
                { id: 6, titulo: "Construindo seu Portfólio", data: new Date(2025, 10, 12), formato: "Online" }
            ];
            const proximosEventos = mockEventos.filter(e => e.data >= new Date()).sort((a, b) => a.data - b.data).slice(0, 3);
            let eventsHTML = `<div class="widget-header"><h3><i class="fas fa-calendar-star"></i> Próximos Eventos</h3><a href="evento.html" class="see-all">Ver todos</a></div><div class="events-preview-list">`;
            if (proximosEventos.length) {
                proximosEventos.forEach(evento => {
                    const dia = evento.data.getDate();
                    const mes = evento.data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                    eventsHTML += `<div class="event-preview-item"><div class="event-preview-date"><span>${dia}</span><span>${mes}</span></div><div class="event-preview-info"><h4>${evento.titulo}</h4><p><i class="fas fa-map-marker-alt"></i> ${evento.formato}</p></div></div>`;
                });
            } else {
                eventsHTML += '<p class="empty-message">Nenhum evento programado.</p>';
            }
            eventsWidget.innerHTML = eventsHTML + '</div>';
        }
    }

    // ==================== CARREGAR POSTS INICIAIS ====================
    function loadInitialPosts() {
        if (!postsContainer) return;
        const mockPosts = [
            { id: 6, authorId: 'senai', author: { name: "Senai São Carlos", avatar: "./img/senai.jpg" }, content: "Bem-vindos à comunidade oficial do Senai São Carlos! Um espaço para conectar alunos, professores e empresas. #SenaiSaoCarlos #Inovacao", images: [], time: "1h", likes: 58, comments: [] },
            { id: 1, authorId: 'miguel', author: { name: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" }, content: "Finalizamos hoje o projeto de automação industrial usando Arduino e sensores IoT!", images: ["./img/unnamed.png"], time: "Ontem", likes: 24, comments: [{ authorId: 'ana', author: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg", content: "Incrível, Miguel!", time: "2h" }] }
        ];
        postsContainer.innerHTML = '';
        mockPosts.forEach(postData => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.dataset.authorName = postData.author.name;
            const authorHTML = `<a href="perfil.html?id=${postData.authorId}" class="post-author-link">${postData.author.name}</a>`;
            postElement.innerHTML = `
                <div class="post-header"><div class="post-author"><div class="post-icon"><img src="${postData.author.avatar}" alt="${postData.author.name}"></div><div class="post-info"><h2>${authorHTML}</h2><span>${postData.time} • <i class="fas fa-globe-americas"></i></span></div></div><div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div></div>
                <div class="post-text">${postData.content}</div>
                ${postData.images.length ? `<div class="post-images"><img src="${postData.images[0]}" alt="Post image"></div>` : ''}
                <div class="post-actions"><button class="like-btn"><i class="far fa-thumbs-up"></i> <span>Curtir</span> <span class="count">${postData.likes}</span></button><button class="comment-btn"><i class="far fa-comment"></i> <span>Comentar</span> <span class="count">${postData.comments.length}</span></button><button class="share-btn"><i class="far fa-share-square"></i> <span>Compartilhar</span></button></div>
                <div class="post-comments">${postData.comments.map(c => `<div class="comment"><div class="avatar-small"><img src="${c.avatar}" alt="${c.author}"></div><div class="comment-content"><div class="comment-header"><span class="comment-author"><a href="perfil.html?id=${c.authorId}" class="post-author-link">${c.author}</a></span><span class="comment-time">${c.time}</span></div><p>${c.content}</p></div></div>`).join('')}</div>
                <div class="add-comment"><div class="avatar-small"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div><input type="text" placeholder="Adicione um comentário..."></div>`;
            postsContainer.appendChild(postElement);
            addPostEvents(postElement);
        });
    }

    // ==================== BOTÕES DE POST COM FUNCIONALIDADE EM DESENVOLVIMENTO ====================
    const mediaButtons = document.querySelectorAll('.post-options .option-btn, .editor-options .option-btn');
    mediaButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            showNotification('Funcionalidade em desenvolvimento.', 'info');
        });
    });

    // ==================== AVISO NO BOTÃO DE CONFIGURAÇÕES ====================
    const settingsButton = document.querySelector('.dropdown-menu a[href="#"]');
    if (settingsButton) {
        settingsButton.addEventListener('click', (event) => {
            event.preventDefault(); // Impede que o link navegue
            showNotification('Funcionalidade em desenvolvimento.', 'info');
        });
    }

    // ==================== AVISO NO ÍCONE DE NOTIFICAÇÕES ====================
    const notificationIcon = document.querySelector('#notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', () => {
            showNotification('Funcionalidade em desenvolvimento.', 'info');
        });
    }

    // ==================== INICIALIZAÇÃO ====================
    function init() {
        loadOnlineFriends();
        loadAllWidgets();
        if (postsContainer) {
            loadInitialPosts();
        }
    }
    
    init();
});