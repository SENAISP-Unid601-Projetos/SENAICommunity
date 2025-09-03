document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    let stompClient = null;
    let currentUser = null;
    let selectedFilesForPost = [];
    let selectedFilesForEdit = [];

    // --- ELEMENTOS DO DOM ---
    const postsContainer = document.querySelector('.posts-container');
    const logoutBtn = document.getElementById('logout-btn');
    const postTextarea = document.getElementById('post-creator-textarea');
    const postFileInput = document.getElementById('post-file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const publishBtn = document.getElementById('publish-post-btn');
    const notificationCenter = document.querySelector('.notification-center');
    
    // Modais de Edição
    const editPostModal = document.getElementById('edit-post-modal');
    const editPostForm = document.getElementById('edit-post-form');
    const editPostIdInput = document.getElementById('edit-post-id');
    const editPostTextarea = document.getElementById('edit-post-textarea');
    const cancelEditPostBtn = document.getElementById('cancel-edit-post-btn');
    const editPostFileInput = document.getElementById('edit-post-files');
    const editFilePreviewContainer = document.getElementById('edit-file-preview-container');

    const editCommentModal = document.getElementById('edit-comment-modal');
    const editCommentForm = document.getElementById('edit-comment-form');
    const editCommentIdInput = document.getElementById('edit-comment-id');
    const editCommentTextarea = document.getElementById('edit-comment-textarea');
    const cancelEditCommentBtn = document.getElementById('cancel-edit-comment-btn');

    // --- INICIALIZAÇÃO ---
    async function init() {
        if (!jwtToken) {
            console.log("Nenhum token, redirecionando para login.");
            window.location.href = 'login.html';
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

        try {
            const response = await axios.get(`${backendUrl}/usuarios/me`);
            currentUser = response.data;
            updateUIWithUserData(currentUser);
            connectWebSocket();
            setupEventListeners();
        } catch (error) {
            console.error("ERRO DETALHADO NA INICIALIZAÇÃO:", error);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }

    // --- FUNÇÕES DE UI ---
    function updateUIWithUserData(user) {
        if (!user) return;
        const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : 'path/to/default/image.png';
        const topbarUserName = document.getElementById('topbar-user-name');
        if (topbarUserName) topbarUserName.textContent = user.nome;
        const sidebarUserName = document.getElementById('sidebar-user-name');
        if (sidebarUserName) sidebarUserName.textContent = user.nome;
        const sidebarUserTitle = document.getElementById('sidebar-user-title');
        if (sidebarUserTitle) sidebarUserTitle.textContent = user.titulo || 'Membro da Comunidade';
        const topbarUserImg = document.getElementById('topbar-user-img');
        if (topbarUserImg) topbarUserImg.src = userImage;
        const sidebarUserImg = document.getElementById('sidebar-user-img');
        if (sidebarUserImg) sidebarUserImg.src = userImage;
        const postCreatorImg = document.getElementById('post-creator-img');
        if (postCreatorImg) postCreatorImg.src = userImage;
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationCenter.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => { notification.remove(); }, 300);
        }, 5000);
    }

    // --- LÓGICA DO WEBSOCKET ---
    function connectWebSocket() {
        const socket = new SockJS(`${backendUrl}/ws`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
        const headers = { 'Authorization': `Bearer ${jwtToken}` };
        stompClient.connect(headers, (frame) => {
            console.log('CONECTADO AO WEBSOCKET');
            fetchPublicPosts();
            stompClient.subscribe('/topic/publico', (message) => {
                const payload = JSON.parse(message.body);
                handlePublicFeedUpdate(payload);
            });
        }, (error) => console.error('ERRO WEBSOCKET:', error));
    }

    async function fetchPublicPosts() {
        try {
            const response = await axios.get(`${backendUrl}/api/chat/publico`);
            postsContainer.innerHTML = '';
            const sortedPosts = response.data.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            sortedPosts.forEach(post => showPublicPost(post));
        } catch (error) {
            console.error("Erro ao buscar postagens:", error);
            postsContainer.innerHTML = '<p>Não foi possível carregar o feed.</p>';
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderCommentWithReplies(comment, allComments, post) {
        let commentHtml = createCommentElement(comment, post);
        const replies = allComments
            .filter(reply => reply.parentId === comment.id)
            .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));

        if (replies.length > 0) {
            commentHtml += `<div class="comment-replies">`;
            replies.forEach(reply => {
                commentHtml += renderCommentWithReplies(reply, allComments, post);
            });
            commentHtml += `</div>`;
        }
        return commentHtml;
    }

    function createCommentElement(comment, post) {
        const commentAuthorName = comment.autor?.nome || comment.nomeAutor || 'Usuário';
        const commentAuthorAvatar = `${backendUrl}${comment.autor?.urlFotoPerfil || '/images/default-avatar.png'}`;
        const autorIdDoComentario = comment.autor?.id || comment.autorId;
        const autorIdDoPost = post.autor?.id || post.autorId;
        const isAuthor = currentUser && autorIdDoComentario == currentUser.id;
        const isPostOwner = currentUser && autorIdDoPost == currentUser.id;
        let optionsMenu = '';
        if (isAuthor || isPostOwner) {
            optionsMenu = `
                <button class="comment-options-btn" onclick="event.stopPropagation(); window.openCommentMenu(${comment.id})">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="options-menu" id="comment-menu-${comment.id}" onclick="event.stopPropagation();">
                    ${isAuthor ? `<button onclick="window.openEditCommentModal(${comment.id}, '${comment.conteudo.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i> Editar</button>` : ''}
                    ${(isAuthor || isPostOwner) ? `<button class="danger" onclick="window.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Excluir</button>` : ''}
                    ${isPostOwner ? `<button onclick="window.highlightComment(${comment.id})"><i class="fas fa-star"></i> ${comment.destacado ? 'Remover Destaque' : 'Destacar'}</button>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="comment-container">
                <div class="comment ${comment.destacado ? 'destacado' : ''}" id="comment-${comment.id}">
                    <div class="comment-avatar"><img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}"></div>
                    <div class="comment-body">
                        <span class="comment-author">${commentAuthorName}</span>
                        <p class="comment-content">${comment.conteudo}</p>
                    </div>
                    ${optionsMenu}
                </div>
                <div class="comment-actions-footer">
                    <button class="action-btn-like ${comment.curtidoPeloUsuario ? 'liked' : ''}" onclick="window.toggleLike(event, ${post.id}, ${comment.id})">
                        Curtir
                    </button>
                    <button class="action-btn-reply" onclick="window.toggleReplyForm(${comment.id})">
                        Responder
                    </button>
                    <span class="like-count" id="like-count-comment-${comment.id}">
                        <i class="fas fa-heart"></i> ${comment.totalCurtidas || 0}
                    </span>
                </div>
                <div class="reply-form" id="reply-form-${comment.id}">
                    <input type="text" id="reply-input-${comment.id}" placeholder="Escreva sua resposta...">
                    <button onclick="window.sendComment(${post.id}, ${comment.id})"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
    }

    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.id = `post-${post.id}`;

        const autorNome = post.autor?.nome || post.nomeAutor || 'Usuário Desconhecido';
        const autorAvatar = `${backendUrl}${post.autor?.urlFotoPerfil || '/images/default-avatar.png'}`;
        const dataFormatada = new Date(post.dataCriacao).toLocaleString('pt-BR');
        const autorIdDoPost = post.autor?.id || post.autorId;
        const isAuthor = currentUser && autorIdDoPost == currentUser.id;
        let mediaHtml = '';
        if (post.urlsMidia && post.urlsMidia.length > 0) {
            mediaHtml = `<div class="post-media">${post.urlsMidia.map(url => {
                const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
                if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return `<img src="${fullMediaUrl}" alt="Mídia">`;
                if (url.match(/\.(mp4|webm|ogg)$/i)) return `<video controls src="${fullMediaUrl}"></video>`;
                return '';
            }).join('')}</div>`;
        }

        const rootComments = (post.comentarios || []).filter(c => !c.parentId);
        let commentsHtml = rootComments
            .sort((a,b) => new Date(a.dataCriacao) - new Date(b.dataCriacao))
            .map(comment => renderCommentWithReplies(comment, post.comentarios, post))
            .join('');

        let optionsMenu = '';
        if (isAuthor) {
            optionsMenu = `
                <div class="post-options">
                    <button class="post-options-btn" onclick="event.stopPropagation(); window.openPostMenu(${post.id})">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div class="options-menu" id="post-menu-${post.id}" onclick="event.stopPropagation();">
                        <button onclick="window.openEditPostModal(${post.id}, '${post.conteudo.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i> Editar</button>
                        <button class="danger" onclick="window.deletePost(${post.id})"><i class="fas fa-trash"></i> Excluir</button>
                    </div>
                </div>
            `;
        }

        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author-details">
                    <div class="post-author-avatar"><img src="${autorAvatar}" alt="${autorNome}"></div>
                    <div class="post-author-info"><strong>${autorNome}</strong><span>${dataFormatada}</span></div>
                </div>
                ${optionsMenu}
            </div>
            <div class="post-content"><p>${post.conteudo}</p></div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="action-btn ${post.curtidoPeloUsuario ? 'liked' : ''}" onclick="window.toggleLike(event, ${post.id}, null)">
                    <i class="fas fa-heart"></i> <span id="like-count-post-${post.id}">${post.totalCurtidas || 0}</span>
                </button>
                <button class="action-btn" onclick="window.toggleComments(${post.id})">
                    <i class="fas fa-comment"></i> <span>${post.comentarios?.length || 0}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
                <div class="comments-list">${commentsHtml}</div>
                <div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Adicione um comentário...">
                    <button onclick="window.sendComment(${post.id}, null)"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        return postElement;
    }

    function showPublicPost(post, prepend = false) {
        if (postsContainer) {
            const postElement = createPostElement(post);
            prepend ? postsContainer.prepend(postElement) : postsContainer.appendChild(postElement);
        }
    }
    
    // --- FUNÇÕES DE ATUALIZAÇÃO E INTERAÇÃO ---
    async function fetchAndReplacePost(postId) {
        try {
            const response = await axios.get(`${backendUrl}/postagem/${postId}`);
            const oldPostElement = document.getElementById(`post-${postId}`);
            if (oldPostElement) {
                const wasCommentsVisible = oldPostElement.querySelector('.comments-section').style.display === 'block';
                const newPostElement = createPostElement(response.data);
                if (wasCommentsVisible) {
                    newPostElement.querySelector('.comments-section').style.display = 'block';
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
        const postId = payload.postagem?.id || payload.id || payload.postagemId;
        if (payload.tipo === 'remocao' && payload.postagemId) {
            const postElement = document.getElementById(`post-${payload.postagemId}`);
            if(postElement) postElement.remove();
        } else if (postId) {
            fetchAndReplacePost(postId);
        }
    }

    // --- FUNÇÕES GLOBAIS (disponíveis para o HTML) ---
    const closeAllMenus = () => document.querySelectorAll('.options-menu').forEach(m => m.style.display = 'none');
    document.body.addEventListener('click', closeAllMenus);

    window.openPostMenu = (postId) => {
        closeAllMenus();
        const menu = document.getElementById(`post-menu-${postId}`);
        if(menu) menu.style.display = 'block';
    };
    window.openCommentMenu = (commentId) => {
        closeAllMenus();
        const menu = document.getElementById(`comment-menu-${commentId}`);
        if(menu) menu.style.display = 'block';
    };

    window.toggleComments = (postId) => {
        const commentsSection = document.getElementById(`comments-section-${postId}`);
        if (commentsSection) commentsSection.style.display = commentsSection.style.display === 'block' ? 'none' : 'block';
    };
    
    window.sendComment = (postId, parentId = null) => {
        const inputId = parentId ? `reply-input-${parentId}` : `comment-input-${postId}`;
        const input = document.getElementById(inputId);
        if(!input) return;
        const content = input.value.trim();
        if (stompClient?.connected && content) {
            stompClient.send(`/app/postagem/${postId}/comentar`, {}, JSON.stringify({ conteudo: content, parentId: parentId }));
            input.value = '';
            if (parentId) {
                const form = document.getElementById(`reply-form-${parentId}`);
                if(form) form.style.display = 'none';
            }
        }
    };
    
    window.toggleReplyForm = (commentId) => {
        const form = document.getElementById(`reply-form-${commentId}`);
        if(form) form.style.display = form.style.display === 'flex' ? 'none' : 'flex';
    };

    window.toggleLike = async (event, postagemId, comentarioId = null) => {
        const likeButton = event.currentTarget;
        let likeCountSpan;
        let isPostLike = false;

        if (comentarioId) {
            likeCountSpan = document.getElementById(`like-count-comment-${comentarioId}`);
        } else {
            likeCountSpan = document.getElementById(`like-count-post-${postagemId}`);
            isPostLike = true;
        }
        
        if (!likeButton || !likeCountSpan) return;

        const isLiked = likeButton.classList.contains('liked');
        
        // Extrai o número atual, independentemente do formato
        let currentLikes = parseInt(likeCountSpan.innerText.trim().replace(/[^0-9]/g, ''), 10);
        
        // 1. Atualização Otimista da UI
        likeButton.classList.toggle('liked');
        const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
        
        if (isPostLike) {
            likeCountSpan.textContent = newLikes;
        } else {
            likeCountSpan.innerHTML = `<i class="fas fa-heart"></i> ${newLikes}`;
        }

        // 2. Enviar requisição para o backend
        try {
            await axios.post(`${backendUrl}/curtidas/toggle`, { postagemId, comentarioId });
        } catch(error) {
            // 3. Reverter a UI em caso de erro
            showNotification('Erro ao processar curtida.', 'error');
            console.error("Erro ao curtir:", error);
            likeButton.classList.toggle('liked'); // Reverte o estado do botão
            
            if (isPostLike) {
                likeCountSpan.textContent = currentLikes; // Reverte o contador do post
            } else {
                likeCountSpan.innerHTML = `<i class="fas fa-heart"></i> ${currentLikes}`; // Reverte o contador do comentário
            }
        }
    };
    
    window.openEditPostModal = (postId, content) => {
        if(editPostIdInput) editPostIdInput.value = postId;
        if(editPostTextarea) editPostTextarea.value = content;
        selectedFilesForEdit = [];
        updateEditFilePreview();
        if(editPostModal) editPostModal.style.display = 'flex';
    };
    window.deletePost = async (postId) => {
        if (confirm('Tem certeza que deseja excluir esta postagem?')) {
            try {
                await axios.delete(`${backendUrl}/postagem/${postId}`);
                showNotification('Postagem excluída com sucesso.', 'success');
            } catch (error) {
                showNotification('Não foi possível excluir a postagem.', 'error');
                console.error("Erro ao excluir post:", error);
            }
        }
    };

    window.openEditCommentModal = (commentId, content) => {
        if(editCommentIdInput) editCommentIdInput.value = commentId;
        if(editCommentTextarea) editCommentTextarea.value = content;
        if(editCommentModal) editCommentModal.style.display = 'flex';
    };
    window.deleteComment = async (commentId) => {
        if (confirm('Tem certeza que deseja excluir este comentário?')) {
            try {
                await axios.delete(`${backendUrl}/comentarios/${commentId}`);
                showNotification('Comentário excluído.', 'success');
            } catch (error) {
                showNotification('Não foi possível excluir o comentário.', 'error');
                console.error("Erro ao excluir comentário:", error);
            }
        }
    };
    window.highlightComment = async (commentId) => {
        try {
            await axios.put(`${backendUrl}/comentarios/${commentId}/destacar`);
        } catch (error) {
            showNotification('Não foi possível destacar o comentário.', 'error');
            console.error("Erro ao destacar comentário:", error);
        }
    };
    
    function updateEditFilePreview() {
        if(!editFilePreviewContainer) return;
        editFilePreviewContainer.innerHTML = '';
        selectedFilesForEdit.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-preview-item';
            const previewElement = document.createElement('img');
            previewElement.src = URL.createObjectURL(file);
            item.appendChild(previewElement);
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-file-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => {
                selectedFilesForEdit.splice(index, 1);
                updateEditFilePreview();
            };
            item.appendChild(removeBtn);
            editFilePreviewContainer.appendChild(item);
        });
    }

    // --- SETUP DOS EVENT LISTENERS ---
    function setupEventListeners() {
        if (logoutBtn) logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });

        if (editPostFileInput) editPostFileInput.addEventListener('change', (event) => {
            Array.from(event.target.files).forEach(file => {
                if (!selectedFilesForEdit.some(f => f.name === file.name)) {
                    selectedFilesForEdit.push(file);
                }
            });
            updateEditFilePreview();
        });
        
        if (editPostForm) editPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postId = editPostIdInput.value;
            const content = editPostTextarea.value;
            
            const postagemDTO = { conteudo: content };
            const formData = new FormData();
            formData.append('postagem', new Blob([JSON.stringify(postagemDTO)], { type: 'application/json' }));
            selectedFilesForEdit.forEach(file => formData.append('arquivos', file));
            
            try {
                await axios.put(`${backendUrl}/postagem/${postId}`, formData);
                if(editPostModal) editPostModal.style.display = 'none';
                showNotification('Postagem editada com sucesso.', 'success');
            } catch(error) {
                showNotification('Não foi possível salvar as alterações.', 'error');
                console.error("Erro ao editar post:", error);
            }
        });
        if (cancelEditPostBtn) cancelEditPostBtn.addEventListener('click', () => editPostModal.style.display = 'none');
        
        if (editCommentForm) editCommentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const commentId = editCommentIdInput.value;
            const content = editCommentTextarea.value;
            try {
                await axios.put(`${backendUrl}/comentarios/${commentId}`, JSON.stringify(content), {
                    headers: { 'Content-Type': 'application/json' }
                });
                if(editCommentModal) editCommentModal.style.display = 'none';
                showNotification('Comentário editado.', 'success');
            } catch (error) {
                showNotification('Não foi possível salvar o comentário.', 'error');
                console.error("Erro ao editar comentário:", error);
            }
        });
        if (cancelEditCommentBtn) cancelEditCommentBtn.addEventListener('click', () => editCommentModal.style.display = 'none');

        if (postFileInput) postFileInput.addEventListener('change', (event) => {
            selectedFilesForPost = Array.from(event.target.files);
            updateFilePreview();
        });

        function updateFilePreview() {
            if(!filePreviewContainer) return;
            filePreviewContainer.innerHTML = '';
            selectedFilesForPost.forEach((file, index) => {
                const item = document.createElement('div'); item.className = 'file-preview-item';
                let previewElement;
                if (file.type.startsWith('image/')) {
                    previewElement = document.createElement('img');
                } else {
                    previewElement = document.createElement('video');
                }
                previewElement.src = URL.createObjectURL(file);
                item.appendChild(previewElement);
                const removeBtn = document.createElement('button'); removeBtn.className = 'remove-file-btn'; removeBtn.innerHTML = '&times;';
                removeBtn.onclick = () => {
                    selectedFilesForPost.splice(index, 1);
                    if(postFileInput) postFileInput.value = "";
                    updateFilePreview();
                };
                item.appendChild(removeBtn);
                filePreviewContainer.appendChild(item);
            });
        }
        
        if (publishBtn) publishBtn.addEventListener('click', async () => {
            const content = postTextarea.value.trim();
            if (!content && selectedFilesForPost.length === 0) {
                showNotification('Escreva algo ou anexe um arquivo.', 'info');
                return;
            }
            const formData = new FormData();
            formData.append('postagem', new Blob([JSON.stringify({ conteudo: content })], { type: 'application/json' }));
            selectedFilesForPost.forEach(file => formData.append('arquivos', file));
            try {
                await axios.post(`${backendUrl}/postagem/upload-mensagem`, formData);
                if(postTextarea) postTextarea.value = '';
                selectedFilesForPost = [];
                if(postFileInput) postFileInput.value = '';
                updateFilePreview();
                showNotification('Publicado com sucesso!', 'success');
            } catch (error) {
                showNotification('Erro ao publicar postagem.', 'error');
                console.error("Erro ao publicar:", error);
            }
        });
    }
    
    init();
});