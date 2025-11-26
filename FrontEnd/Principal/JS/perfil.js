document.addEventListener("DOMContentLoaded", () => {
    const backendUrl = window.backendUrl || "http://localhost:8080";
    const defaultAvatarUrl = window.defaultAvatarUrl || `${backendUrl}/images/default-avatar.jpg`;

    let currentUser = null;
    let profileUser = null;
    let currentMediaIndex = 0;
    let currentMediaItems = [];

    const elements = {
        userInfo: document.querySelector('.sidebar .user-info'),
        topbarUser: document.querySelector('.user-dropdown .user'),
        profileName: document.getElementById("profile-name"),
        profileTitle: document.getElementById("profile-title"),
        profilePicImg: document.getElementById("profile-pic-img"),
        profileBio: document.getElementById("profile-bio"),
        profileEmail: document.getElementById("profile-email"),
        profileDob: document.getElementById("profile-dob"),
        editProfileBtnPage: document.getElementById("edit-profile-btn-page"),
        postsContainer: document.getElementById("profile-posts-container"),
        tabButtons: document.querySelectorAll(".tab-btn"),
        tabContents: document.querySelectorAll(".tab-content"),
        profileFriendsList: document.getElementById("profile-friends-list"),
        profileProjectsList: document.getElementById("profile-projects-list"),
        tabFriendsCount: document.getElementById("tab-friends-count"),
        tabProjectsCount: document.getElementById("tab-projects-count"),
        mobileMenuToggle: document.getElementById("mobile-menu-toggle"),
        sidebar: document.getElementById("sidebar"),
        mobileOverlay: document.getElementById("mobile-overlay"),
        sidebarClose: document.getElementById("sidebar-close"),
        profileMobileMenuToggle: document.getElementById("profile-mobile-menu-toggle"),
        editProfileModal: document.getElementById("edit-profile-modal"),
        mediaViewerModal: document.getElementById('media-viewer-modal'),
        carouselContainer: document.getElementById('carousel-container'),
        carouselIndicators: document.getElementById('carousel-indicators'),
        carouselPrev: document.getElementById('carousel-prev'),
        carouselNext: document.getElementById('carousel-next'),
        mediaViewerClose: document.getElementById('media-viewer-close'),
    };

    function setProfileLoading(isLoading) {
        if (elements.userInfo && elements.topbarUser) {
            const action = isLoading ? 'remove' : 'add';
            elements.userInfo.classList[action]('loaded');
            elements.topbarUser.classList[action]('loaded');
        }
    }

    // =================================================================
    // ATUALIZAÇÃO EM TEMPO REAL (COMENTÁRIOS E LIKES NO PERFIL)
    // =================================================================
    
    // Sobrescreve a função global fetchAndReplacePost APENAS no contexto do perfil.
    window.fetchAndReplacePost = async (postId) => {
        const oldPostElement = document.getElementById(`post-${postId}`);
        
        let wasCommentsVisible = false;
        const openReplyContainerIds = new Set();

        if (oldPostElement) {
            const oldCommentsSection = oldPostElement.querySelector(".comments-section");
            if (oldCommentsSection && oldCommentsSection.style.display === 'block') {
                wasCommentsVisible = true;
            }
            
            const oldReplyContainers = oldPostElement.querySelectorAll('.comment-replies');
            oldReplyContainers.forEach(container => {
                if (container.style.display === 'flex') { 
                    openReplyContainerIds.add(container.id);
                }
            });
        }

        try {
            const response = await axios.get(`${backendUrl}/postagem/${postId}`);
            
            // ESSENCIAL: Usa a função de criação de post DO PERFIL
            const newPostElement = createProfilePostElement(response.data); 

            if (wasCommentsVisible) {
                const newCommentsSection = newPostElement.querySelector(".comments-section");
                if (newCommentsSection) newCommentsSection.style.display = 'block';
            }
            
            if (openReplyContainerIds.size > 0) {
                openReplyContainerIds.forEach(containerId => {
                    const newReplyContainer = newPostElement.querySelector(`#${containerId}`);
                    if (newReplyContainer) {
                        const commentId = containerId.replace('replies-for-', '');
                        const button = newPostElement.querySelector(`button[onclick*="window.toggleReplies(this, ${commentId})"]`);
                        newReplyContainer.style.display = 'flex';
                        if (button) button.innerHTML = `<i class="fas fa-minus-circle"></i> Ocultar respostas`;
                    }
                });
            }
            
            if (oldPostElement) {
                oldPostElement.replaceWith(newPostElement);
            }
        } catch (error) {
            console.error(`Falha ao atualizar post ${postId} no perfil:`, error);
        }
    };

    function handleProfileFeedUpdate(payload) {
        const postObj = payload.postagem;
        const postId = payload.postagemId || (postObj ? postObj.id : null) || payload.id;

        const existingPostElement = document.getElementById(`post-${postId}`);
        if (existingPostElement) {
            if (payload.tipo === 'REMOCAO') {
                existingPostElement.remove();
                if (elements.postsContainer.children.length === 0) {
                    elements.postsContainer.innerHTML = `<div class='empty-state' style='text-align: center; padding: 3rem;'><p>Nenhuma postagem publicada.</p></div>`;
                }
            } else {
                window.fetchAndReplacePost(postId);
            }
            return;
        }

        if (payload.tipo === 'CRIACAO' && postObj && profileUser) {
            if (String(postObj.autorId) === String(profileUser.id)) {
                const newPostElement = createProfilePostElement(postObj);
                const emptyState = elements.postsContainer.querySelector('.empty-state');
                if (emptyState) emptyState.remove();
                elements.postsContainer.prepend(newPostElement);
                newPostElement.style.animation = "flash-animation 1.5s ease-out";
            }
        }
    }

    function setupProfileWebSocketListener() {
        const subscribeToTopics = (client) => {
            client.subscribe("/topic/publico", (message) => {
                handleProfileFeedUpdate(JSON.parse(message.body));
            });

            const urlParams = new URLSearchParams(window.location.search);
            const targetId = urlParams.get('id') || (currentUser ? currentUser.id : null);

            if (targetId) {
                client.subscribe(`/topic/perfil/${targetId}`, (message) => {
                    const updatedUserDTO = JSON.parse(message.body);
                    updateProfilePageUI(updatedUserDTO);
                    if (currentUser && String(updatedUserDTO.id) === String(currentUser.id)) {
                        if(typeof window.updateUIWithUserData === 'function') {
                            window.updateUIWithUserData(updatedUserDTO);
                        }
                    }
                });
            }
        };

        if (window.stompClient && window.stompClient.connected) {
            subscribeToTopics(window.stompClient);
        } else {
            document.addEventListener("webSocketConnected", (e) => {
                subscribeToTopics(e.detail.stompClient);
            });
        }
    }

    function updateProfilePageUI(user) {
        if (elements.profilePicImg) elements.profilePicImg.src = window.getAvatarUrl(user.urlFotoPerfil);
        const bannerEl = document.getElementById('profile-banner');
        if (bannerEl && user.urlFotoFundo) {
            bannerEl.style.backgroundImage = `url('${window.getAvatarUrl(user.urlFotoFundo)}')`;
        }
        if (elements.profileName) elements.profileName.textContent = user.nome;
        if (elements.profileTitle) elements.profileTitle.textContent = user.tipoUsuario || 'Usuário';
        if (elements.profileBio) elements.profileBio.textContent = user.bio || "Nenhuma bio informada.";
        if (elements.profileEmail) elements.profileEmail.textContent = user.email;
        if (elements.tabProjectsCount) {
             const novoTotal = user.totalProjetos !== undefined ? user.totalProjetos : elements.tabProjectsCount.textContent;
             elements.tabProjectsCount.textContent = novoTotal;
        }
    }

    // --- CARROSSEL E MÍDIA ---
    window.openMediaViewer = (mediaUrls, startIndex = 0) => {
        const modal = document.getElementById('media-viewer-modal');
        const container = document.getElementById('carousel-container');
        const indicators = document.getElementById('carousel-indicators');
        if (!modal || !container) return;
        currentMediaItems = mediaUrls;
        currentMediaIndex = startIndex;
        container.innerHTML = '';
        if (indicators) indicators.innerHTML = '';
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
            if (indicators) {
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
        if (indicators.length) indicators.forEach(ind => ind.classList.remove('active'));
        slides[index].classList.add('active');
        if (indicators.length) indicators[index].classList.add('active');
        currentMediaIndex = index;
        updateCarouselControls();
    }
    function nextMedia() { goToMedia(currentMediaIndex + 1); }
    function prevMedia() { goToMedia(currentMediaIndex - 1); }
    function closeMediaViewer() {
        const modal = document.getElementById('media-viewer-modal');
        if (modal) modal.style.display = 'none';
        document.querySelectorAll('.carousel-slide video').forEach(video => { video.pause(); video.currentTime = 0; });
    }
    function updateCarouselControls() {
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        if (prevBtn) prevBtn.disabled = currentMediaIndex === 0;
        if (nextBtn) nextBtn.disabled = currentMediaIndex === currentMediaItems.length - 1;
    }
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
        return `<div class="feed-carousel-wrapper">
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
            if (url.match(/\.(mp4|webm)$/i)) { mediaHtml += `<video src="${fullMediaUrl}" style="width: 100%; height: 100%; object-fit: cover;"></video>`; }
            else { mediaHtml += `<img src="${fullMediaUrl}" style="width: 100%; height: 100%; object-fit: cover;">`; }
            if (isMoreItem) mediaHtml += `<div class="more-overlay">+${count - 4}</div>`;
            mediaHtml += `</div>`;
        });
        mediaHtml += `</div>`;
        return mediaHtml;
    }

    function setupMobileMenu() {
        if (elements.mobileMenuToggle && elements.sidebar && elements.mobileOverlay && elements.sidebarClose) {
            const toggleMenu = () => {
                elements.sidebar.classList.toggle('active');
                elements.mobileOverlay.classList.toggle('active');
                document.body.style.overflow = elements.sidebar.classList.contains('active') ? 'hidden' : '';
            };
            elements.mobileMenuToggle.onclick = toggleMenu;
            elements.sidebarClose.onclick = toggleMenu;
            elements.mobileOverlay.onclick = toggleMenu;
        }
    }
    function setupProfileMobileMenu() {
        if (elements.profileMobileMenuToggle) {
            elements.profileMobileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentUser && profileUser && currentUser.id === profileUser.id) {
                    if (window.openEditProfileModal) window.openEditProfileModal();
                }
            });
        }
    }

    // --- INICIALIZAÇÃO ---
    async function init() {
        if (!window.jwtToken) return;
        setProfileLoading(true);
        setupMobileMenu();
        setupProfileMobileMenu();
        setupEditProfileForm();
        setupProfileWebSocketListener();

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const profileUserId = urlParams.get("id");

            if (!window.currentUser) {
                const meResponse = await axios.get(`${backendUrl}/usuarios/me`);
                currentUser = meResponse.data;
                window.currentUser = currentUser;
            } else {
                currentUser = window.currentUser;
            }

            let fetchUrl = (profileUserId && profileUserId != currentUser.id)
                ? `${backendUrl}/usuarios/${profileUserId}`
                : `${backendUrl}/usuarios/me`;

            const profileResponse = await axios.get(fetchUrl);
            profileUser = profileResponse.data;

            populateProfileData(profileUser);
            configureProfileActions(profileUser.id === currentUser.id);
            setupTabNavigation();

            await Promise.all([
                fetchUserPosts(profileUser.id),
                fetchProfileFriends(profileUser.id),
                fetchProfileProjects(profileUser.id)
            ]);

            setupEventListeners();
            setupCarouselModalEvents();
            setTimeout(() => { setProfileLoading(false); }, 500);
        } catch (error) {
            console.error("ERRO NO PERFIL:", error);
            setProfileLoading(false);
        }
    }

    function populateProfileData(user) {
        if (!user) return;
        const userImage = user.urlFotoPerfil || user.fotoPerfil || defaultAvatarUrl;
        const finalUserImage = userImage.startsWith('http') ? userImage : `${backendUrl}${userImage.startsWith('/') ? '' : '/'}${userImage}`;

        if (elements.profileName) elements.profileName.textContent = user.nome;
        if (elements.profilePicImg) elements.profilePicImg.src = finalUserImage;
        if (elements.profileBio) elements.profileBio.textContent = user.bio || "Nenhuma bio informada.";
        if (elements.profileEmail) elements.profileEmail.textContent = user.email;

        const bannerEl = document.getElementById('profile-banner');
        if (bannerEl) {
            let bgUrl = user.urlFotoFundo;
            if (bgUrl && !bgUrl.includes('default-background.jpg')) {
                bgUrl = bgUrl.startsWith('http') ? bgUrl : `${backendUrl}${bgUrl.startsWith('/') ? '' : '/'}${bgUrl}`;
            } else {
                bgUrl = `${backendUrl}/images/default-background.jpg`;
            }
            bannerEl.style.backgroundImage = `url('${bgUrl}')`;
        }

        if (elements.profileDob) {
            if (user.dataNascimento) {
                const dob = new Date(user.dataNascimento);
                const userTimezoneOffset = dob.getTimezoneOffset() * 60000;
                const adjustedDate = new Date(dob.getTime() + userTimezoneOffset);
                elements.profileDob.textContent = new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
            } else {
                elements.profileDob.textContent = "Data não informada";
            }
        }

        if (elements.profileTitle) {
            const role = user.tipoUsuario || user.role || "Membro";
            elements.profileTitle.textContent = role.replace('ROLE_', '');
        }
    }

    function setupTabNavigation() {
        elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.tabButtons.forEach(b => b.classList.remove('active'));
                elements.tabContents.forEach(c => { c.classList.remove('active'); c.style.display = 'none'; });
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) { targetContent.classList.add('active'); targetContent.style.display = 'block'; }
            });
        });
    }

    function setupEditProfileForm() {
        const editForm = document.getElementById('edit-profile-form');
        if (!editForm) return;

        const newEditForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newEditForm, editForm);

        const cancelBtn = document.getElementById('cancel-edit-profile-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('edit-profile-modal').style.display = 'none';
            });
        }

        const profilePicInput = document.getElementById('edit-profile-pic-input');
        const profilePicPreview = document.getElementById('edit-profile-pic-preview');
        if (profilePicInput && profilePicPreview) {
            profilePicInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) profilePicPreview.src = URL.createObjectURL(file);
            });
        }

        const bgInput = document.getElementById('edit-profile-bg-input');
        const bgPreviewImg = document.getElementById('bg-preview-img');
        const bgOverlayText = document.getElementById('cover-upload-text');
        if (bgInput && bgPreviewImg) {
            bgInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    bgPreviewImg.src = URL.createObjectURL(file);
                    bgPreviewImg.style.display = 'block';
                    if (bgOverlayText) bgOverlayText.textContent = "Capa Selecionada";
                }
            });
        }

        newEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const saveBtn = newEditForm.querySelector('button[type="submit"]');
            const originalBtnText = saveBtn.innerHTML;

            saveBtn.disabled = true;
            saveBtn.classList.add('btn-loading');
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

            try {
                const inputBg = document.getElementById('edit-profile-bg-input');
                const inputPic = document.getElementById('edit-profile-pic-input');

                if (inputBg && inputBg.files.length > 0) {
                    const bgFormData = new FormData();
                    bgFormData.append('file', inputBg.files[0]);
                    await axios.put(`${backendUrl}/usuarios/me/fundo`, bgFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }

                if (inputPic && inputPic.files.length > 0) {
                    const picFormData = new FormData();
                    picFormData.append('foto', inputPic.files[0]);
                    await axios.put(`${backendUrl}/usuarios/me/foto`, picFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }

                const usuarioDTO = {
                    nome: document.getElementById('edit-profile-name').value,
                    bio: document.getElementById('edit-profile-bio').value,
                    dataNascimento: document.getElementById('edit-profile-dob').value
                };

                const password = document.getElementById('edit-profile-password').value;
                if (password) {
                    usuarioDTO.senha = password;
                }

                const response = await axios.put(`${backendUrl}/usuarios/me`, usuarioDTO, {
                    headers: { 'Content-Type': 'application/json' }
                });

                const usuarioAtualizado = response.data;
                currentUser = usuarioAtualizado;
                profileUser = usuarioAtualizado;

                if (elements.profileName) elements.profileName.textContent = usuarioAtualizado.nome;
                if (elements.profileBio) elements.profileBio.textContent = usuarioAtualizado.bio || "Nenhuma bio informada.";

                if (elements.profileDob && usuarioAtualizado.dataNascimento) {
                    const dob = new Date(usuarioAtualizado.dataNascimento);
                    const userTimezoneOffset = dob.getTimezoneOffset() * 60000;
                    const adjustedDate = new Date(dob.getTime() + userTimezoneOffset);
                    elements.profileDob.textContent = new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
                }

                // --- CORREÇÃO PRINCIPAL (ATUALIZAÇÃO DE FOTO APÓS SALVAR) ---
                
                // 1. Determina a URL. Se vier vazia do back, usa default.
                let novaFoto = window.getAvatarUrl(usuarioAtualizado.urlFotoPerfil);
                if (!usuarioAtualizado.urlFotoPerfil || usuarioAtualizado.urlFotoPerfil.trim() === '') {
                    novaFoto = window.defaultAvatarUrl;
                }

                // 2. Função auxiliar para atualizar com handler de erro
                const updateImage = (imgElement) => {
                    if (imgElement) {
                        imgElement.src = novaFoto;
                        // Força a imagem default se a URL gerada estiver quebrada
                        imgElement.onerror = function() {
                            this.src = window.defaultAvatarUrl;
                        };
                    }
                };

                // 3. Atualiza todas as instâncias da foto na tela
                updateImage(elements.profilePicImg);
                updateImage(document.getElementById('sidebar-user-img'));
                updateImage(document.getElementById('topbar-user-img'));

                const bannerEl = document.getElementById('profile-banner');
                if (bannerEl && usuarioAtualizado.urlFotoFundo) {
                    bannerEl.style.backgroundImage = `url('${window.getAvatarUrl(usuarioAtualizado.urlFotoFundo)}')`;
                }

                window.showNotification('Perfil atualizado com sucesso!', 'success');
                document.getElementById('edit-profile-modal').style.display = 'none';

            } catch (error) {
                console.error("Erro update:", error);
                const msg = error.response?.data?.message || 'Erro ao salvar alterações.';
                window.showNotification(msg, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.classList.remove('btn-loading');
                saveBtn.innerHTML = originalBtnText;
            }
        });
    }

    window.openEditProfileModal = function() {
        if (!currentUser) return;

        document.getElementById('edit-profile-name').value = currentUser.nome;
        document.getElementById('edit-profile-bio').value = currentUser.bio || '';
        if (currentUser.dataNascimento) {
            document.getElementById('edit-profile-dob').value = currentUser.dataNascimento.split('T')[0];
        }

        const profilePicPreview = document.getElementById('edit-profile-pic-preview');
        if (profilePicPreview) {
            let photoUrl = window.getAvatarUrl(currentUser.urlFotoPerfil);
            
            // Força a imagem default explicitamente se não houver URL
            if (!currentUser.urlFotoPerfil || currentUser.urlFotoPerfil.trim() === '') {
                photoUrl = window.defaultAvatarUrl;
            }

            profilePicPreview.src = photoUrl;
            
            // Handler de segurança
            profilePicPreview.onerror = function() {
                this.src = window.defaultAvatarUrl;
            };
        }

        const bgPreviewImg = document.getElementById('bg-preview-img');
        const bgOverlayText = document.getElementById('cover-upload-text');

        if (currentUser.urlFotoFundo && !currentUser.urlFotoFundo.includes('default-background.jpg')) {
            bgPreviewImg.src = window.getAvatarUrl(currentUser.urlFotoFundo);
            bgPreviewImg.style.display = 'block';
            if (bgOverlayText) bgOverlayText.textContent = "Alterar Capa";
        } else {
            bgPreviewImg.src = "";
            bgPreviewImg.style.display = 'none';
            if (bgOverlayText) bgOverlayText.textContent = "Adicionar Capa";
        }

        document.getElementById('edit-profile-pic-input').value = '';
        document.getElementById('edit-profile-bg-input').value = '';
        document.getElementById('edit-profile-password').value = '';
        document.getElementById('edit-profile-password-confirm').value = '';

        document.getElementById('edit-profile-modal').style.display = 'flex';
    };

    async function fetchProfileFriends(userId) {
        try {
            const url = (userId === currentUser.id) ? `${backendUrl}/api/amizades/` : `${backendUrl}/api/amizades/usuario/${userId}`;
            const response = await axios.get(url);
            renderProfileFriends(response.data);
        } catch (error) {
            if (elements.profileFriendsList) elements.profileFriendsList.innerHTML = '<p class="empty-state">Não foi possível carregar amigos.</p>';
        }
    }
    function renderProfileFriends(friends) {
        if (!elements.profileFriendsList) return;
        if (elements.tabFriendsCount) elements.tabFriendsCount.textContent = friends.length;
        elements.profileFriendsList.innerHTML = '';
        if (friends.length === 0) { elements.profileFriendsList.innerHTML = '<p class="empty-state">Nenhum amigo encontrado.</p>'; return; }
        friends.forEach(friend => {
            const friendObj = friend.amigo || friend;
            const friendId = friendObj.id || friendObj.idUsuario;
            const friendName = friendObj.nome || friendObj.nomeUsuario;
            const friendAvatar = friendObj.fotoPerfil || friendObj.urlFotoPerfil || defaultAvatarUrl;
            const avatarUrl = friendAvatar.startsWith('http') ? friendAvatar : `${backendUrl}${friendAvatar.startsWith('/') ? '' : '/'}${friendAvatar}`;

            const card = document.createElement('a');
            card.href = `perfil.html?id=${friendId}`;
            card.className = 'profile-card-item';
            card.innerHTML = `<img src="${avatarUrl}" alt="${friendName}" class="profile-card-img" onerror="this.src='${defaultAvatarUrl}'"><div class="profile-card-title">${friendName}</div><div class="profile-card-subtitle">Amigo</div>`;
            elements.profileFriendsList.appendChild(card);
        });
    }
    async function fetchProfileProjects(userId) {
        try {
            const response = await axios.get(`${backendUrl}/projetos/usuario/${userId}`);
            renderProfileProjects(response.data);
        } catch (error) { renderProfileProjects([]); }
    }

    function renderProfileProjects(projects) {
        if (!elements.profileProjectsList) return;
        if (elements.tabProjectsCount) elements.tabProjectsCount.textContent = projects.length;
        elements.profileProjectsList.innerHTML = '';
        if (projects.length === 0) {
            elements.profileProjectsList.innerHTML = '<p class="empty-state">Nenhum projeto encontrado.</p>';
            return;
        }
        projects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'profile-card-item project-card';
            const imageUrl = proj.imagemUrl
                ? (proj.imagemUrl.startsWith('http') ? proj.imagemUrl : `${backendUrl}${proj.imagemUrl}`)
                : 'https://via.placeholder.com/600x400/161b22/ffffff?text=Projeto';
            const statusClass = (proj.status || '').toLowerCase().replace(' ', '');
            card.innerHTML = `
          <img src="${imageUrl}" alt="${proj.titulo}" class="profile-card-img">
          <div class="profile-card-title">${proj.titulo}</div>
          <div class="profile-card-subtitle">${proj.categoria || 'Sem categoria'}</div>
          <div class="profile-card-status">
            <span class="status-dot ${statusClass}"></span> ${proj.status || 'Em andamento'}
          </div>
      `;
            card.addEventListener('click', () => openModernProjectModal(proj));
            elements.profileProjectsList.appendChild(card);
        });
    }

    async function fetchUserPosts(targetUserId) {
        if (!elements.postsContainer) return;
        elements.postsContainer.innerHTML = "<div class='loading-spinner' style='margin: 2rem auto; display:block;'></div>";
        try {
            const response = await axios.get(`${backendUrl}/postagem/usuario/${targetUserId}`);
            elements.postsContainer.innerHTML = "";
            const userPosts = response.data;
            if (userPosts.length === 0) {
                elements.postsContainer.innerHTML = `
            <div class='empty-state' style='text-align: center; padding: 3rem;'>
                <i class="fas fa-newspaper" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhuma postagem publicada por este usuário.</p>
            </div>`;
                return;
            }
            const sortedPosts = userPosts.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            sortedPosts.forEach((post) => {
                const postElement = createProfilePostElement(post);
                elements.postsContainer.appendChild(postElement);
            });
        } catch (error) {
            elements.postsContainer.innerHTML = `
        <div class='empty-state' style='text-align: center; padding: 2rem;'>
            <p>Não foi possível carregar as postagens.</p>
            <button class="btn btn-secondary" onclick="window.location.reload()">Tentar novamente</button>
        </div>`;
        }
    }

    function createProfilePostElement(post) {
        const postElement = document.createElement("div");
        postElement.className = "post";
        postElement.id = `post-${post.id}`;
        const autorNome = post.nomeAutor || "Usuário";
        const autorAvatar = post.urlFotoAutor ? (post.urlFotoAutor.startsWith('http') ? post.urlFotoAutor : `${backendUrl}${post.urlFotoAutor}`) : defaultAvatarUrl;
        const dataFormatada = new Date(post.dataCriacao).toLocaleDateString('pt-BR');
        const isAuthor = currentUser && (String(post.autorId) === String(currentUser.id));

        let mediaHtml = "";
        if (post.urlsMidia && post.urlsMidia.length > 0) {
            if (post.urlsMidia.length > 2) { mediaHtml = renderFeedCarousel(post.urlsMidia, post.id); }
            else if (post.urlsMidia.length === 1) {
                const url = post.urlsMidia[0];
                const fullMediaUrl = url.startsWith("http") ? url : `${backendUrl}${url}`;
                const safeMediaArray = JSON.stringify(post.urlsMidia).replace(/"/g, '&quot;');
                if (url.match(/\.(mp4|webm)$/i)) { mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)"><video controls src="${fullMediaUrl}" style="max-width: 100%; border-radius: 8px;"></video></div>`; }
                else { mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)"><img src="${fullMediaUrl}" style="max-width: 100%; border-radius: 8px; cursor: pointer;"></div>`; }
            } else { mediaHtml = renderMediaGrid(post.urlsMidia); }
        }
        const rootComments = (post.comentarios || []).filter((c) => !c.parentId);
        let commentsHtml = "";
        if (typeof window.renderCommentWithReplies === 'function') {
            commentsHtml = rootComments.sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao)).map((comment) => window.renderCommentWithReplies(comment, post.comentarios, post)).join("");
        }
        let optionsMenu = "";
        if (isAuthor) {
            optionsMenu = `<div class="post-options"><button class="post-options-btn" onclick="event.stopPropagation(); window.openPostMenu(${post.id})"><i class="fas fa-ellipsis-h"></i></button><div class="options-menu" id="post-menu-${post.id}" onclick="event.stopPropagation();"><button onclick="window.openEditPostModal(${post.id})"><i class="fas fa-pen"></i> Editar</button><button class="danger" onclick="window.deletePost(${post.id})"><i class="fas fa-trash"></i> Excluir</button></div></div>`;
        }
        postElement.innerHTML = `<div class="post-header"><div class="post-author-details"><div class="post-author-avatar"><img src="${autorAvatar}" alt="${autorNome}" onerror="this.src='${defaultAvatarUrl}'"></div><div class="post-author-info"><strong>${autorNome}</strong><span class="timestamp">· ${dataFormatada}</span></div></div>${optionsMenu}</div><div class="post-content"><p>${post.conteudo}</p></div>${mediaHtml}<div class="post-actions"><button class="action-btn ${post.curtidoPeloUsuario ? "liked" : ""}" onclick="window.toggleLike(event, ${post.id}, null)"><i class="${post.curtidoPeloUsuario ? "fas" : "far"} fa-heart"></i> <span id="like-count-post-${post.id}">${post.totalCurtidas || 0}</span></button><button class="action-btn" onclick="window.toggleComments(${post.id})"><i class="far fa-comment"></i> <span>${post.comentarios?.length || 0}</span></button></div><div class="comments-section" id="comments-section-${post.id}" style="display: none;"><div class="comments-list">${commentsHtml}</div><div class="comment-form"><input type="text" id="comment-input-${post.id}" placeholder="Comentar..."><button onclick="window.sendComment(${post.id}, null)"><i class="fas fa-paper-plane"></i></button></div></div>`;
        if (post.urlsMidia && post.urlsMidia.length > 2) { setTimeout(() => setupCarouselEventListeners(postElement, post.id), 0); }
        return postElement;
    }

    function configureProfileActions(isMyProfile) {
        if (elements.editProfileBtnPage) { elements.editProfileBtnPage.style.display = isMyProfile ? "inline-block" : "none"; }
        if (!isMyProfile && currentUser && profileUser) {
            const profileActions = document.querySelector('.profile-actions');
            if (profileActions) {
                profileActions.innerHTML = '';
                const messageBtn = document.createElement('button');
                messageBtn.className = 'btn btn-primary';
                messageBtn.innerHTML = '<i class="fas fa-envelope"></i> Mensagem';
                messageBtn.onclick = () => { window.location.href = `mensagem.html?start_chat=${profileUser.id}`; };
                profileActions.appendChild(messageBtn);
                const friendBtn = document.createElement('button');
                friendBtn.className = 'btn btn-secondary';
                friendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                profileActions.appendChild(friendBtn);
                checkFriendshipStatus().then(status => {
                    switch (status) {
                        case 'AMIGOS': friendBtn.innerHTML = '<i class="fas fa-user-check"></i> Amigos'; friendBtn.onclick = () => removerAmizade(); break;
                        case 'SOLICITACAO_ENVIADA': friendBtn.innerHTML = '<i class="fas fa-clock"></i> Pendente'; friendBtn.disabled = true; break;
                        case 'SOLICITACAO_RECEBIDA': friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Aceitar'; friendBtn.onclick = () => window.location.href = 'amizades.html'; break;
                        default: friendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar'; friendBtn.onclick = () => enviarSolicitacaoAmizade();
                    }
                });
            }
        }
    }
    async function checkFriendshipStatus() {
        try { const response = await axios.get(`${backendUrl}/usuarios/buscar?nome=${profileUser.nome}`); const usuarioEncontrado = response.data.find(user => user.id === profileUser.id); return usuarioEncontrado ? usuarioEncontrado.statusAmizade : 'NENHUMA'; } catch (error) { return 'NENHUMA'; }
    }
    async function enviarSolicitacaoAmizade() {
        try { await axios.post(`${backendUrl}/api/amizades/solicitar/${profileUser.id}`); if (window.showNotification) window.showNotification('Solicitação enviada!', 'success'); configureProfileActions(false); } catch (error) { if (window.showNotification) window.showNotification('Erro ao enviar solicitação.', 'error'); }
    }
    async function removerAmizade() {
        if (confirm('Remover amizade?')) {
            try { const response = await axios.get(`${backendUrl}/api/amizades/`); const amizade = response.data.find(amigo => amigo.idUsuario === profileUser.id); if (amizade) { await axios.delete(`${backendUrl}/api/amizades/recusar/${amizade.id}`); if (window.showNotification) window.showNotification('Amizade removida.', 'success'); configureProfileActions(false); } } catch (error) { if (window.showNotification) window.showNotification('Erro ao remover amizade.', 'error'); }
        }
    }
    function setupEventListeners() {
        if (elements.editProfileBtnPage) { elements.editProfileBtnPage.addEventListener("click", () => { if (window.openEditProfileModal) window.openEditProfileModal(); }); }
        if (elements.mediaViewerClose) elements.mediaViewerClose.addEventListener('click', closeMediaViewer);
        if (elements.carouselPrev) elements.carouselPrev.addEventListener('click', prevMedia);
        if (elements.carouselNext) elements.carouselNext.addEventListener('click', nextMedia);
        document.addEventListener('keydown', (e) => { if (elements.mediaViewerModal && elements.mediaViewerModal.style.display === 'flex') { if (e.key === 'Escape') closeMediaViewer(); if (e.key === 'ArrowLeft') prevMedia(); if (e.key === 'ArrowRight') nextMedia(); } });
    }
    function setupCarouselModalEvents() { if (elements.mediaViewerModal) { elements.mediaViewerModal.addEventListener('click', (e) => { if (e.target === elements.mediaViewerModal) closeMediaViewer(); }); } }
    if (document.readyState === "complete" || document.readyState === "interactive") { init(); } else { window.addEventListener("load", init); }

    window.openModernProjectModal = (project) => {
        const imageUrl = project.imagemUrl
            ? (project.imagemUrl.startsWith('http') ? project.imagemUrl : `${backendUrl}${project.imagemUrl}`)
            : 'https://via.placeholder.com/800x400/161b22/ffffff?text=Capa+do+Projeto';
        const statusClass = (project.status || '').toLowerCase().replace(/\s+/g, '');
        const techsHtml = (project.tecnologias || [])
            .map(tech => `<span class="pm-tag">${tech}</span>`)
            .join('') || '<span class="pm-tag" style="font-style:italic; opacity:0.7">Nenhuma tecnologia listada</span>';
        const membersHtml = (project.membros || [])
            .map(membro => {
                const avatar = membro.usuarioFotoPerfil || membro.fotoPerfil;
                const avatarUrl = avatar
                    ? (avatar.startsWith('http') ? avatar : `${backendUrl}${avatar}`)
                    : defaultAvatarUrl;
                return `
                  <div class="pm-member">
                      <img src="${avatarUrl}" onerror="this.src='${defaultAvatarUrl}'">
                      <span>${membro.usuarioNome || membro.nome}</span>
                  </div>
              `;
            }).join('') || '<span style="color:var(--text-secondary)">Sem membros visíveis</span>';

        const modalHtml = `
          <div class="project-modal-overlay" id="dynamic-project-modal">
              <div class="project-modal-card">
                  <div class="pm-hero" style="background-image: url('${imageUrl}');">
                      <button class="pm-close-btn" onclick="document.getElementById('dynamic-project-modal').remove()"><i class="fas fa-times"></i></button>
                  </div>
                  <div class="pm-content">
                      <div class="pm-header"><span class="pm-status ${statusClass}">${project.status || 'Em Planejamento'}</span><h2 class="pm-title">${project.titulo}</h2></div>
                      <div class="pm-description">${project.descricao || "Este projeto não possui uma descrição detalhada."}</div>
                      <div class="pm-grid">
                          <div class="pm-info-item"><h4>Categoria</h4><span>${project.categoria || 'Geral'}</span></div>
                          <div class="pm-info-item"><h4>Privacidade</h4><span>${project.grupoPrivado ? '<i class="fas fa-lock"></i> Privado' : '<i class="fas fa-globe"></i> Público'}</span></div>
                          <div class="pm-info-item"><h4>Equipe</h4><span>${project.totalMembros || (project.membros?.length || 0)} Membros</span></div>
                      </div>
                      <div class="pm-section-title">Tecnologias Utilizadas</div><div class="pm-tags">${techsHtml}</div>
                      <div class="pm-section-title">Equipe do Projeto</div><div class="pm-members">${membersHtml}</div>
                  </div>
                  <div class="pm-footer"><a href="projeto-detalhe.html?id=${project.id}" class="pm-btn">Ver Detalhes Completos <i class="fas fa-arrow-right"></i></a></div>
              </div>
          </div>
      `;
        const existingModal = document.getElementById('dynamic-project-modal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        setTimeout(() => {
            const modalOverlay = document.getElementById('dynamic-project-modal');
            if (modalOverlay) {
                modalOverlay.addEventListener('click', (e) => {
                    if (e.target === modalOverlay) {
                        modalOverlay.remove();
                    }
                });
            }
        }, 100);
    };
});