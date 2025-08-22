document.addEventListener('DOMContentLoaded', () => {

    // ==================== VARIÁVEIS GLOBAIS ====================
    const currentUser = {
        id: 1,
        name: "Vinicius Gallo Santos",
        username: "Vinicius G.",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        title: "Estudante de ADS",
        connections: 11,
        projects: 2
    };

    // ==================== GERENCIAMENTO DE TEMA ====================
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
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
        themeToggle.innerHTML = theme === 'dark' ?
            '<i class="fas fa-moon"></i>' :
            '<i class="fas fa-sun"></i>';
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
        menuToggle.innerHTML = sidebar.classList.contains('mobile-hidden') ?
            '<i class="fas fa-bars"></i>' :
            '<i class="fas fa-times"></i>';
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

    if(searchInput) {
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
    }

    function loadSearchResults(query = '') {
        const mockResults = [{
                id: 1,
                name: "Curso de Desenvolvimento Web",
                type: "course"
            },
            {
                id: 2,
                name: "Grupo de Projetos IoT",
                type: "group"
            },
            {
                id: 3,
                name: "Miguel Piscki",
                type: "user"
            },
            {
                id: 4,
                name: "Workshop de React",
                type: "event"
            }
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

    if (postCreatorInput) {
        postCreatorInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && postCreatorInput.value.trim()) {
                createPost(postCreatorInput.value.trim());
                postCreatorInput.value = '';
            }
        });
    }
    
    if (postOptions) {
        postOptions.forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                showNotification(`Adicionar ${type === 'photo' ? 'imagem' : type === 'video' ? 'vídeo' : 'código'}`);
            });
        });
    }

    function createPost(content, images = []) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.dataset.id = Date.now();
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <div class="post-icon"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div>
                    <div class="post-info">
                        <h2>${currentUser.name}</h2>
                        <span>agora • <i class="fas fa-globe-americas"></i></span>
                    </div>
                </div>
                <div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div>
            </div>
            <div class="post-text">${content}</div>
            <div class="post-actions">
                <button class="like-btn"><i class="far fa-thumbs-up"></i> <span>Curtir</span> <span class="count">0</span></button>
                <button class="comment-btn"><i class="far fa-comment"></i> <span>Comentar</span> <span class="count">0</span></button>
                <button class="share-btn"><i class="far fa-share-square"></i> <span>Compartilhar</span></button>
            </div>
            <div class="post-comments"></div>
            <div class="add-comment">
                <div class="avatar-small"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div>
                <input type="text" placeholder="Adicione um comentário...">
            </div>`;
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

    function showPostOptionsMenu(postElement, target) {
        document.querySelectorAll('.post-options-menu').forEach(menu => menu.remove());
        const menu = document.createElement('div');
        menu.className = 'post-options-menu';
        menu.innerHTML = `
            <button data-action="save"><i class="far fa-bookmark"></i> Salvar</button>
            <button data-action="edit"><i class="far fa-edit"></i> Editar</button>
            <button data-action="delete"><i class="far fa-trash-alt"></i> Excluir</button>`;
        document.body.appendChild(menu);

        const rect = target.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX - 150}px`;

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
        comment.innerHTML = `
            <div class="avatar-small"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${currentUser.name}</span>
                    <span class="comment-time">agora</span>
                </div>
                <p>${content}</p>
            </div>`;
        commentsContainer.appendChild(comment);
        commentCount.textContent = parseInt(commentCount.textContent) + 1;
    }

    // ==================== AMIGOS ONLINE ====================
    function loadOnlineFriends() {
        const onlineFriendsContainer = document.querySelector('.online-friends');
        if (!onlineFriendsContainer) return;

        const mockFriends = [
            { id: 2, name: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg", status: "online" },
            { id: 4, name: "Eliezer B.", avatar: "https://randomuser.me/api/portraits/men/45.jpg", status: "online" },
            { id: 5, name: "Julia Melo", avatar: "https://randomuser.me/api/portraits/women/48.jpg", status: "online" },
            { id: 6, name: "Carlos Lima", avatar: "https://randomuser.me/api/portraits/men/51.jpg", status: "away" },
            { id: 7, name: "Laura Costa", avatar: "https://randomuser.me/api/portraits/women/55.jpg", status: "online" },
        ];
        const friendsHTML = mockFriends.map(friend => `
            <div class="friend" data-id="${friend.id}" title="${friend.name}">
                <div class="friend-avatar ${friend.status}"><img src="${friend.avatar}" alt="${friend.name}"></div>
                <span>${friend.name.split(' ')[0]}</span>
            </div>`).join('');
        onlineFriendsContainer.innerHTML = `
            <div class="section-header">
                <h3><i class="fas fa-satellite-dish"></i> Amigos Online</h3>
                <a href="#" class="see-all">Ver todos</a>
            </div>
            <div class="friends-grid">${friendsHTML}</div>`;
        onlineFriendsContainer.querySelectorAll('.friend').forEach(friend => {
            friend.addEventListener('click', () => {
                showNotification(`Iniciando chat com ${friend.getAttribute('title')}`, 'info');
            });
        });
    }

    // ==================== DADOS PARA WIDGETS ====================
    const mockEventos = [
        { id: 5, titulo: "Semana da Cibersegurança", data: new Date(2025, 5, 9), formato: "Híbrido"},
        { id: 2, titulo: "Workshop de Design de APIs com Node.js", data: new Date(2025, 6, 15), formato: "Online"},
        { id: 6, titulo: "Construindo seu Portfólio de Dev", data: new Date(2025, 6, 12), formato: "Online"},
        { id: 7, titulo: "Introdução à Cloud com AWS e Azure", data: new Date(2025, 5, 28), formato: "Online"},
        { id: 3, titulo: "Feira de Carreiras Tech 2025", data: new Date(2025, 7, 5), formato: "Presencial"},
        { id: 8, titulo: "SENAI Games: Torneio de E-Sports", data: new Date(2025, 7, 22), formato: "Presencial"},
        { id: 1, titulo: "Hackathon de Inteligência Artificial", data: new Date(2025, 5, 20), formato: "Presencial"},
        { id: 4, titulo: "Palestra: O Futuro da Computação Quântica", data: new Date(2025, 5, 1), formato: "Online"},
        { id: 9, titulo: "Painel: Indústria 4.0 e o Papel do Técnico", data: new Date(2025, 4, 29), formato: "Híbrido"},
        { id: 10, titulo: "Workshop: Como Brilhar no LinkedIn", data: new Date(2025, 4, 20), formato: "Online"},
        { id: 11, titulo: "Bootcamp: Python para Análise de Dados", data: new Date(2025, 4, 15), formato: "Presencial"}
    ];
    
    const mockProjetos = [
        { id: 101, titulo: "Sistema de Irrigação Automatizado com IoT", autor: "Ana Silva", avatarAutor: "https://randomuser.me/api/portraits/women/33.jpg", imagem: "https://images.unsplash.com/photo-1615143105096-74c04390cf33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: 102, titulo: "Dashboard de Análise de Vendas em Power BI", autor: "Carlos Lima", avatarAutor: "https://randomuser.me/api/portraits/men/51.jpg", imagem: "https://images.unsplash.com/photo-1634733591032-15ac4c3411d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" },
        { id: 103, titulo: "App de Gerenciamento de Tarefas em React", autor: "Julia Melo", avatarAutor: "https://randomuser.me/api/portraits/women/48.jpg", imagem: "https://images.unsplash.com/photo-1589652717521-10c0d0c2dea9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400" }
    ];

    // ==================== WIDGET DE EVENTOS ====================
    function loadUpcomingEventsWidget() {
        const widgetContainer = document.getElementById('upcoming-events-widget');
        if (!widgetContainer) return;

        const proximosEventos = mockEventos
            .filter(evento => evento.data >= new Date())
            .sort((a, b) => a.data - b.data)
            .slice(0, 3);
        
        let widgetContent = `
            <div class="widget-header">
                <h3><i class="fas fa-calendar-star"></i> Próximos Eventos</h3>
                <a href="evento.html" class="see-all">Ver todos</a>
            </div>
            <div class="events-preview-list">`;
        if (proximosEventos.length > 0) {
            proximosEventos.forEach(evento => {
                const dia = evento.data.getDate();
                const mes = evento.data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                widgetContent += `
                    <div class="event-preview-item">
                        <div class="event-preview-date">
                            <span>${dia}</span><span>${mes}</span>
                        </div>
                        <div class="event-preview-info">
                            <h4>${evento.titulo}</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${evento.formato}</p>
                        </div>
                    </div>`;
            });
        } else {
            widgetContent += '<p class="empty-message">Nenhum evento programado.</p>';
        }
        widgetContent += '</div>';
        widgetContainer.innerHTML = widgetContent;
    }
    
    // ==================== WIDGET DE PROJETOS EM DESTAQUE ====================
    function loadFeaturedProjectsWidget() {
        const widgetContainer = document.getElementById('featured-projects-widget');
        if (!widgetContainer) return;
    
        const projetosEmDestaque = mockProjetos.slice(0, 2); 
    
        let widgetContent = `
            <div class="widget-header">
                <h3><i class="fas fa-lightbulb"></i> Projetos em Destaque</h3>
                <a href="projeto.html" class="see-all">Ver todos</a>
            </div>
            <div class="project-preview-list">`;
    
        if (projetosEmDestaque.length > 0) {
            projetosEmDestaque.forEach(projeto => {
                widgetContent += `
                    <a href="#" class="project-preview-item" title="${projeto.titulo}">
                        <div class="project-preview-image">
                            <img src="${projeto.imagem}" alt="${projeto.titulo}">
                        </div>
                        <div class="project-preview-info">
                            <h4>${projeto.titulo}</h4>
                            <p>
                                <img src="${projeto.avatarAutor}" class="author-avatar" alt="${projeto.autor}">
                                <span>Por ${projeto.autor}</span>
                            </p>
                        </div>
                    </a>`;
            });
        } else {
            widgetContent += '<p class="empty-message">Nenhum projeto em destaque.</p>';
        }
        widgetContent += '</div>';
        widgetContainer.innerHTML = widgetContent;
    }

    // ==================== NOTIFICAÇÕES ====================
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.querySelector('.notification-center').appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ==================== CARREGAR POSTS INICIAIS ====================
    function loadInitialPosts() {
        if (!postsContainer) return;
        const mockPosts = [
            { id: 1, author: { 
                name: "Miguel Borges", avatar: "https://randomuser.me/api/portraits/men/22.jpg" }, 
                content: "Finalizamos hoje o projeto de automação industrial usando Arduino e sensores IoT. O sistema monitora temperatura, umidade e controla atuadores remotamente!", 
                images: ["/img/unnamed.png"], time: "Ontem", likes: 24, comments: [{ author: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg", content: "Incrível, Miguel! Poderia compartilhar o código fonte?", time: "2h atrás" }] },
            
                { id: 2, author: { name: "Eliezer Biancolini", 
                avatar: "https://randomuser.me/api/portraits/men/45.jpg" }, 
                content: "Alguém interessado em formar um grupo de estudos para a maratona de programação? Estou pensando em reunir 3-5 pessoas para treinar 2x por semana.", 
                images: [], time: "11h", likes: 11, comments: [] },

                { id: 3, author: { 
                name: "Gustavo Beltrame", avatar: "https://t4.ftcdn.net/jpg/02/24/86/95/360_F_224869519_aRaeLneqALfPNBzg0xxMZXghtvBXkfIA.jpg" }, 
                content: "Desenvolvimento de um sistema que monitora o estoque em tempo real. A plataforma utiliza dados de consumo para prever a demanda futura e gera alertas automáticos para reposição de produtos, com o objetivo principal de otimizar o inventário, evitar perdas e reduzir custos operacionais.", 
                images: ["/img/tiProjeto.png"], time: "12d", likes: 13, comments: [] },

                { id: 4, author: { 
                    name: "Ruth Azevedo", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5tbMgjWv9P8gwFgrcjVgH7m8wqcTFOMpnXw&s" }, 
                    content: "Preciso projetar um mecanismo de acionamento para um pequeno robô explorador terrestre. A ideia é um sistema de locomoção com múltiplas pernas (hexápede ou octópede) que consiga se adaptar a terrenos irregulares.", 
                    images: ["/img/robo.png"], time: "20d", likes: 30, comments: [{ author: "Naiara Piscke", avatar: "https://img.freepik.com/fotos-gratis/retrato-de-mulher-feliz-com-tablet-digital_329181-11681.jpg?semt=ais_hybrid&w=740", content: "Este projeto de robô tem um potencial incrível para explorar terrenos difíceis!" , time: "2h atrás" }] },

                    { id: 5, author: { name: "Lais Vitoria", 
                        avatar: "https://diariodocomercio.com.br/wp-content/uploads/2022/08/mulher-na-politica-eleicoes.jpg" }, 
                        content: "Estou buscando colaboradores com experiência em mecatrônica e eletroeletrônica para um projeto inovador. Se você tem paixão por robótica e automação, entre em contato!", 
                        images: [], time: "21d", likes: 22, comments: [] },
        ];
        postsContainer.innerHTML = '';
        mockPosts.forEach(postData => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-author">
                        <div class="post-icon"><img src="${postData.author.avatar}" alt="${postData.author.name}"></div>
                        <div class="post-info">
                            <h2>${postData.author.name}</h2>
                            <span>${postData.time} • <i class="fas fa-globe-americas"></i></span>
                        </div>
                    </div>
                    <div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div>
                </div>
                <div class="post-text">${postData.content}</div>
                ${postData.images.length ? `<div class="post-images"><img src="${postData.images[0]}" alt="Post image"></div>` : ''}
                <div class="post-actions">
                    <button class="like-btn"><i class="far fa-thumbs-up"></i> <span>Curtir</span> <span class="count">${postData.likes}</span></button>
                    <button class="comment-btn"><i class="far fa-comment"></i> <span>Comentar</span> <span class="count">${postData.comments.length}</span></button>
                    <button class="share-btn"><i class="far fa-share-square"></i> <span>Compartilhar</span></button>
                </div>
                <div class="post-comments">${postData.comments.map(c => `<div class="comment"><div class="avatar-small"><img src="${c.avatar}" alt="${c.author}"></div><div class="comment-content"><div class="comment-header"><span class="comment-author">${c.author}</span><span class="comment-time">${c.time}</span></div><p>${c.content}</p></div></div>`).join('')}</div>
                <div class="add-comment">
                    <div class="avatar-small"><img src="${currentUser.avatar}" alt="${currentUser.name}"></div>
                    <input type="text" placeholder="Adicione um comentário...">
                </div>`;
            postsContainer.appendChild(postElement);
            addPostEvents(postElement);
        });
    }

    // ==================== INICIALIZAÇÃO ====================
    function init() {
        if (document.body.contains(document.querySelector('.posts-container'))) {
            loadInitialPosts();
            loadOnlineFriends();
            loadUpcomingEventsWidget();
            loadFeaturedProjectsWidget();
        }
    
        setTimeout(() => {
            showNotification(`Bem-vindo de volta, ${currentUser.name.split(' ')[0]}!`, 'success');
        }, 1000);
    }
    
    init();

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