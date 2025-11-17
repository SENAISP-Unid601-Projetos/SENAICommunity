// CORREÇÃO: Função para normalizar dados de membros
function normalizeMemberData(member) {
    if (!member) return null;
    
    // Se o membro vem da estrutura antiga (alunos/professores)
    if (member.id && member.nome && !member.usuarioId) {
        return {
            id: member.id,
            usuarioId: member.id,
            nome: member.nome || 'Usuário',
            email: member.email,
            role: member.role || 'MEMBRO',
            urlFotoPerfil: member.fotoPerfil || member.urlFotoPerfil,
            status: member.status || 'offline'
        };
    }
    
    // Se o membro vem da nova estrutura (ProjetoMembro)
    return {
        id: member.id || member.usuarioId,
        usuarioId: member.usuarioId || member.id,
        nome: member.usuarioNome || member.nome || member.usuario?.nome || 'Usuário',
        email: member.usuarioEmail || member.email,
        role: member.role || member.funcao || 'MEMBRO',
        urlFotoPerfil: member.usuarioFotoPerfil || member.urlFotoPerfil,
        status: member.status || 'offline'
    };
}

// CORREÇÃO: Função para normalizar dados de mensagens
function normalizeMessageData(message) {
    if (!message) return null;
    
    return {
        id: message.id,
        conteudo: message.conteudo,
        dataEnvio: message.dataEnvio || message.dataCriacao,
        projetoId: message.projetoId || message.grupoId,
        autorId: message.autorId,
        nomeAutor: message.nomeAutor || 'Usuário',
        urlFotoAutor: message.urlFotoAutor,
        anexos: message.anexos || []
    };
}

// CORREÇÃO: Atualizar a função loadProjectMembers
async function loadProjectMembers() {
    try {
        // Buscar membros diretamente da API de membros do projeto
        const response = await axios.get(`${backendUrl}/projetos/${projectId}/membros`);
        projectMembers = response.data.map(normalizeMemberData);
        
        // Atualizar contadores
        updateMembersCount();
        
        // Renderizar lista de membros
        renderMembersList();
        
    } catch (error) {
        console.error("Erro ao carregar membros do projeto:", error);
        // Fallback: usar membros que vieram com o projeto
        if (currentProject && currentProject.membros) {
            projectMembers = currentProject.membros.map(normalizeMemberData);
            updateMembersCount();
            renderMembersList();
        }
    }
}

// CORREÇÃO: Atualizar a função checkUserRole
function checkUserRole() {
    if (!currentProject || !currentUser) {
        console.log("[DEBUG] currentProject ou currentUser não definidos");
        return;
    }
    
    // CORREÇÃO: Lógica mais robusta para determinar a role
    const currentMember = projectMembers.find(member => {
        const memberId = member.usuarioId || member.id;
        const currentUserId = currentUser.id;
        return memberId === currentUserId;
    });
    
    if (currentMember) {
        userRole = currentMember.role || currentMember.funcao || 'MEMBRO';
        console.log(`[DEBUG] Usuário é membro com role: ${userRole}`);
    } else if (currentProject.autorId === currentUser.id) {
        userRole = 'ADMIN';
        console.log(`[DEBUG] Usuário é autor do projeto: ${userRole}`);
    } else {
        userRole = 'MEMBRO';
        console.log(`[DEBUG] Usuário não é membro nem autor: ${userRole}`);
    }
    
    // CORREÇÃO: Mostrar/ocultar botões de administração
    const settingsBtn = document.getElementById('project-settings-btn');
    const addMemberBtn = document.getElementById('add-member-btn');
    
    const isAdminOrModerator = (userRole === 'ADMIN' || userRole === 'MODERADOR');
    
    if (settingsBtn) {
        settingsBtn.style.display = isAdminOrModerator ? 'block' : 'none';
        console.log(`[DEBUG] Settings button display: ${settingsBtn.style.display}`);
    }
    
    if (addMemberBtn) {
        addMemberBtn.style.display = isAdminOrModerator ? 'block' : 'none';
        console.log(`[DEBUG] Add member button display: ${addMemberBtn.style.display}`);
    }
    
    // CORREÇÃO: Forçar re-renderização da lista de membros para mostrar ações
    renderMembersList();
}

// Variáveis globais
let currentProject = null;
let projectMembers = [];
let projectMessages = [];
let currentUser = null;
let stompClient = null;
let projectId = null;
let userRole = null;
let selectedFiles = [];
const backendUrl = "http://localhost:8080";
const defaultAvatarUrl = "https://via.placeholder.com/150";

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializePage();
    setupEventListeners();
});

// Inicializar tema
function initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
    
    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }
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

// CORREÇÃO: Função para obter URL da imagem do projeto
function getProjectImageUrl(imagemUrl) {
    if (!imagemUrl) {
        return `${backendUrl}/images/default-project.jpg`;
    }
    
    if (imagemUrl.startsWith('http')) {
        return imagemUrl;
    }
    
    if (imagemUrl.startsWith('/')) {
        return `${backendUrl}${imagemUrl}`;
    }
    
    return `${backendUrl}/api/arquivos/${imagemUrl}`;
}

// CORREÇÃO: Função auxiliar para obter avatar do membro
function getMemberAvatarUrl(member) {
    if (!member) return defaultAvatarUrl;
    
    // Tenta diferentes propriedades que podem conter a URL da foto
    const fotoUrl = member.urlFotoPerfil || member.usuarioFotoPerfil || member.fotoPerfil;
    
    if (!fotoUrl) {
        return defaultAvatarUrl;
    }
    
    // Se já é uma URL completa, usa diretamente
    if (fotoUrl.startsWith('http')) {
        return fotoUrl;
    }
    
    // Se começa com /, adiciona ao backendUrl
    if (fotoUrl.startsWith('/')) {
        return `${backendUrl}${fotoUrl}`;
    }
    
    // Caso contrário, assume que é um nome de arquivo e constrói a URL
    return `${backendUrl}/api/arquivos/${fotoUrl}`;
}

// CORREÇÃO: Função similar para mensagens
function getMessageAvatarUrl(message) {
    if (!message) return defaultAvatarUrl;
    
    const fotoUrl = message.urlFotoAutor || message.fotoAutor;
    
    if (!fotoUrl) {
        return defaultAvatarUrl;
    }
    
    if (fotoUrl.startsWith('http')) {
        return fotoUrl;
    }
    
    if (fotoUrl.startsWith('/')) {
        return `${backendUrl}${fotoUrl}`;
    }
    
    return `${backendUrl}/api/arquivos/${fotoUrl}`;
}

// CORREÇÃO: Atualizar contadores de membros com lógica correta
function updateMembersCount() {
    const totalMembers = projectMembers.length;
    
    document.getElementById('members-count').textContent = totalMembers;
    document.getElementById('modal-members-count').textContent = `${totalMembers} membros`;
    
    // CORREÇÃO: Lógica melhorada para contar membros online
    const onlineMembers = projectMembers.filter(member => {
        const userEmail = member.email || member.usuarioEmail;
        // Usar o UserStatusService para verificar status online
        return userEmail && window.latestOnlineEmails && 
               window.latestOnlineEmails.includes(userEmail);
    }).length;
    
    document.getElementById('online-count').textContent = `${onlineMembers} membros online`;
}

// CORREÇÃO: Função para obter status online dos membros
async function fetchOnlineStatus() {
    try {
        const response = await axios.get(`${backendUrl}/usuarios/online`);
        window.latestOnlineEmails = response.data;
        updateMembersCount();
        renderMembersList();
    } catch (error) {
        console.error("Erro ao buscar status online:", error);
        // Fallback: marcar alguns como online para teste
        window.latestOnlineEmails = projectMembers.slice(0, 2).map(m => m.email || m.usuarioEmail).filter(Boolean);
        updateMembersCount();
        renderMembersList();
    }
}

// Inicializar a página
async function initializePage() {
    // Verificar autenticação
    const jwtToken = localStorage.getItem("token");
    if (!jwtToken) {
        window.location.href = "login.html";
        return;
    }
    
    // Configurar axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
    
    try {
        // Carregar usuário atual
        const userResponse = await axios.get(`${backendUrl}/usuarios/me`);
        currentUser = userResponse.data;
        
        // Obter ID do projeto da URL
        const urlParams = new URLSearchParams(window.location.search);
        projectId = urlParams.get('id');
        
        if (!projectId) {
            showNotification("ID do projeto não encontrado na URL", "error");
            return;
        }
        
        // Carregar dados do projeto
        await loadProjectData();
        
        // CORREÇÃO: Buscar status online dos usuários
        await fetchOnlineStatus();
        
        // Conectar ao WebSocket
        connectToWebSocket();
        
        // CORREÇÃO: Configurar polling para status online
        setInterval(fetchOnlineStatus, 30000); // Atualizar a cada 30 segundos
        
        // CORREÇÃO: Forçar verificação inicial de função
        setTimeout(() => {
            checkUserRole();
        }, 1000);
        
    } catch (error) {
        console.error("Erro na inicialização:", error);
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
        }
    }
}

// Carregar dados do projeto
async function loadProjectData() {
    try {
        const response = await axios.get(`${backendUrl}/projetos/${projectId}`);
        currentProject = response.data;
        
        // Atualizar a interface
        updateProjectInfo();
        
        // CORREÇÃO: Carregar imagem do projeto se existir
        const projectImage = document.getElementById('project-image');
        if (projectImage && currentProject.imagemUrl) {
            projectImage.src = getProjectImageUrl(currentProject.imagemUrl);
            projectImage.style.display = 'block';
        }
        
        // Carregar membros do projeto
        await loadProjectMembers();
        
        // Carregar mensagens do projeto
        await loadProjectMessages();
        
    } catch (error) {
        console.error("Erro ao carregar dados do projeto:", error);
        showNotification("Erro ao carregar dados do projeto", "error");
    }
}

// Atualizar informações do projeto na interface
function updateProjectInfo() {
    if (!currentProject) return;
    
    // Atualizar elementos com informações do projeto
    document.getElementById('project-name').textContent = currentProject.titulo;
    document.getElementById('chat-project-name').textContent = currentProject.titulo;
    document.getElementById('project-description').textContent = currentProject.descricao || "Sem descrição";
    document.getElementById('project-max-members').textContent = `Máx: ${currentProject.maxMembros || 10} membros`;
    document.getElementById('project-privacy').textContent = currentProject.grupoPrivado ? "Privado" : "Público";
    document.getElementById('project-category').textContent = currentProject.categoria || "Sem categoria";
    
    // Atualizar tecnologias
    const technologiesContainer = document.getElementById('project-technologies');
    technologiesContainer.innerHTML = '';
    if (currentProject.tecnologias && currentProject.tecnologias.length > 0) {
        currentProject.tecnologias.forEach(tech => {
            const techTag = document.createElement('span');
            techTag.className = 'tech-tag';
            techTag.textContent = tech;
            technologiesContainer.appendChild(techTag);
        });
    }
    
    // Atualizar modal
    document.getElementById('modal-project-name').textContent = currentProject.titulo;
    document.getElementById('modal-project-description').textContent = currentProject.descricao || "Sem descrição";
    document.getElementById('modal-project-privacy').textContent = currentProject.grupoPrivado ? "Privado" : "Público";
    
    // Verificar se o usuário atual é o administrador
    checkUserRole();
}

// Renderizar lista de membros
function renderMembersList() {
    const membersList = document.getElementById('members-list');
    const membersListModal = document.getElementById('members-list-modal');
    
    // Limpar listas
    membersList.innerHTML = '';
    membersListModal.innerHTML = '';
    
    if (projectMembers.length === 0) {
        membersList.innerHTML = '<p class="empty-state">Nenhum membro no projeto</p>';
        membersListModal.innerHTML = '<p class="empty-state">Nenhum membro no projeto</p>';
        return;
    }
    
    // Renderizar cada membro
    projectMembers.forEach(member => {
        const memberElement = createMemberElement(member);
        const memberModalElement = createMemberModalElement(member);
        
        membersList.appendChild(memberElement);
        membersListModal.appendChild(memberModalElement);
    });
}

// CORREÇÃO: Criar elemento de membro para a lista lateral
function createMemberElement(member) {
    const memberItem = document.createElement('div');
    memberItem.className = 'member-item';
    
    const memberAvatar = getMemberAvatarUrl(member);
    const userEmail = member.email || member.usuarioEmail;
    const isOnline = window.latestOnlineEmails && window.latestOnlineEmails.includes(userEmail);
    
    memberItem.innerHTML = `
        <div class="member-avatar">
            <img src="${memberAvatar}" alt="${member.nome}" onerror="this.src='${defaultAvatarUrl}'">
            <span class="member-status ${isOnline ? 'online' : 'offline'}"></span>
        </div>
        <div class="member-info">
            <div class="member-name">${member.nome}</div>
            <div class="member-role">${member.role || member.funcao || 'Membro'}</div>
        </div>
    `;
    
    return memberItem;
}

// CORREÇÃO: Criar elemento de membro para o modal
function createMemberModalElement(member) {
    const memberItem = document.createElement('div');
    memberItem.className = 'member-item-modal';
    
    const memberAvatar = getMemberAvatarUrl(member);
    const userEmail = member.email || member.usuarioEmail;
    const isOnline = window.latestOnlineEmails && window.latestOnlineEmails.includes(userEmail);
    
    memberItem.innerHTML = `
        <div class="member-avatar-modal">
            <img src="${memberAvatar}" alt="${member.nome}" onerror="this.src='${defaultAvatarUrl}'">
        </div>
        <div class="member-info-modal">
            <div class="member-name-modal">${member.nome}</div>
    `;
    
    // CORREÇÃO: Adicionar status online/offline
    memberItem.innerHTML += `
            <div class="member-role-modal">${member.role || member.funcao || 'Membro'} 
                <span class="member-status ${isOnline ? 'online' : 'offline'}" 
                      style="margin-left: 8px; display: inline-block; width: 8px; height: 8px; border-radius: 50%;"></span>
            </div>
        </div>
    `;
    
    // CORREÇÃO: Lógica melhorada para ações de administrador
    const isCurrentUser = (member.usuarioId === currentUser.id || member.id === currentUser.id);
    const isProjectOwner = currentProject.autorId === currentUser.id;
    
    console.log(`[DEBUG] Member: ${member.nome}, Current User: ${isCurrentUser}, Project Owner: ${isProjectOwner}, User Role: ${userRole}`);
    
    // CORREÇÃO: Mostrar ações apenas para admin/moderador e não para si mesmo
    if ((userRole === 'ADMIN' || userRole === 'MODERADOR') && !isCurrentUser) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'member-actions-modal';
        
        // CORREÇÃO: Apenas o dono do projeto pode alterar funções para ADMIN
        const canChangeRole = userRole === 'ADMIN' || (userRole === 'MODERADOR' && member.role !== 'ADMIN');
        
        actionsDiv.innerHTML = `
            <button class="member-action-btn btn-danger" onclick="expelMember(${member.usuarioId || member.id})" 
                    data-tooltip="Expulsar membro" title="Expulsar membro">
                <i class="fas fa-user-times"></i>
            </button>
        `;
        
        // CORREÇÃO: Adicionar botão de alterar função apenas se tiver permissão
        if (canChangeRole) {
            actionsDiv.innerHTML += `
                <button class="member-action-btn btn-secondary" onclick="changeMemberRole(${member.usuarioId || member.id})" 
                        data-tooltip="Alterar função" title="Alterar função">
                    <i class="fas fa-user-cog"></i>
                </button>
            `;
        }
        
        memberItem.appendChild(actionsDiv);
        console.log(`[DEBUG] Ações adicionadas para membro: ${member.nome}`);
    }
    
    return memberItem;
}

// Carregar mensagens do projeto
async function loadProjectMessages() {
    try {
        const response = await axios.get(`${backendUrl}/api/chat/grupo/${projectId}`);
        projectMessages = response.data;
        
        // Renderizar mensagens
        renderMessages();
        
    } catch (error) {
        console.error("Erro ao carregar mensagens do projeto:", error);
        document.getElementById('messages-container').innerHTML = '<p class="empty-state">Erro ao carregar mensagens</p>';
    }
}

// CORREÇÃO: Função para processar conteúdo da mensagem
function processMessageContent(content) {
    if (!content) return '';
    
    // Substituir quebras de linha por <br>
    let processedContent = content.replace(/\n/g, '<br>');
    
    // Compactar mensagens muito longas
    const maxLength = 500;
    if (content.length > maxLength) {
        const truncatedContent = content.substring(0, maxLength) + '...';
        const fullContent = content.replace(/\n/g, '<br>');
        
        return `
            <div class="message-truncated">
                <div class="truncated-content">${truncatedContent.replace(/\n/g, '<br>')}</div>
                <button class="show-more-btn" onclick="this.parentElement.innerHTML = '${fullContent.replace(/'/g, "\\'")}'">
                    Ver mais
                </button>
            </div>
        `;
    }
    
    return processedContent;
}

// Renderizar mensagens
function renderMessages() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';
    
    if (projectMessages.length === 0) {
        messagesContainer.innerHTML = '<p class="empty-state">Nenhuma mensagem no projeto</p>';
        return;
    }
    
    // Ordenar mensagens por data
    const sortedMessages = [...projectMessages].sort((a, b) => 
        new Date(a.dataEnvio || a.dataCriacao) - new Date(b.dataEnvio || b.dataCriacao)
    );
    
    // Renderizar cada mensagem
    sortedMessages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });
    
    // Rolar para a última mensagem
    scrollToBottom();
}

// CORREÇÃO: Função melhorada para criar elemento de mensagem
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.autorId === currentUser.id ? 'own' : ''}`;
    messageDiv.id = `message-${message.id}`;
    
    const messageAvatar = getMessageAvatarUrl(message);
    
    const messageTime = new Date(message.dataEnvio || message.dataCriacao).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const messageContent = processMessageContent(message.conteudo);
    
    // CORREÇÃO: Melhor tratamento de anexos
    let anexosHTML = '';
    if (message.anexos && message.anexos.length > 0) {
        anexosHTML = message.anexos.map(anexo => {
            // CORREÇÃO: Garantir URL absoluta
            let mediaUrl = anexo.url;
            if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('blob:')) {
                if (mediaUrl.startsWith('/')) {
                    mediaUrl = `${backendUrl}${mediaUrl}`;
                } else {
                    mediaUrl = `${backendUrl}/api/arquivos/${mediaUrl}`;
                }
            }
            
            const mediaType = anexo.type || detectMediaType(mediaUrl);
            
            if (mediaType === 'image') {
                return `
                <div class="message-file">
                    <img src="${mediaUrl}" alt="Imagem" 
                         onload="this.style.opacity='1'" 
                         onerror="this.style.display='none'; console.error('Erro ao carregar imagem: ${mediaUrl}')"
                         style="opacity:0; transition: opacity 0.3s; cursor: pointer; max-width: 300px; max-height: 300px;"
                         onclick="openMediaModal('${mediaUrl}', 'image')">
                </div>`;
            } else if (mediaType === 'video') {
                return `
                <div class="message-file">
                    <video controls src="${mediaUrl}" 
                           style="max-width: 300px; max-height: 300px;"
                           onerror="console.error('Erro ao carregar vídeo: ${mediaUrl}')">
                        Seu navegador não suporta o elemento de vídeo.
                    </video>
                </div>`;
            } else {
                const fileName = anexo.name || mediaUrl.split('/').pop() || 'Arquivo';
                return `
                <div class="message-file">
                    <a href="${mediaUrl}" target="_blank" class="message-file-document" download>
                        <i class="fas fa-file-download"></i>
                        <div class="message-file-info">
                            <div class="message-file-name">${fileName}</div>
                            <div class="message-file-size">${anexo.size ? formatFileSize(anexo.size) : 'Baixar arquivo'}</div>
                        </div>
                    </a>
                </div>`;
            }
        }).join('');
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <img src="${messageAvatar}" alt="${message.nomeAutor}" onerror="this.src='${defaultAvatarUrl}'">
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${message.nomeAutor}</span>
                <span class="message-time">${messageTime}</span>
            </div>
            ${messageContent ? `<div class="message-bubble">${messageContent}</div>` : ''}
            ${anexosHTML}
        </div>
    `;
    
    return messageDiv;
}

// CORREÇÃO: Função para detectar tipo de mídia pela URL
function detectMediaType(url) {
    if (!url) return 'unknown';
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    
    const lowerUrl = url.toLowerCase();
    
    for (const ext of imageExtensions) {
        if (lowerUrl.includes(ext)) return 'image';
    }
    
    for (const ext of videoExtensions) {
        if (lowerUrl.includes(ext)) return 'video';
    }
    
    return 'file';
}

// CORREÇÃO: Função para formatar tamanho do arquivo
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// CORREÇÃO: Modal melhorado para visualização de mídia
function openMediaModal(url, type) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'media-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        cursor: zoom-out;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'media-modal-content';
    modalContent.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        position: relative;
        background: transparent;
    `;
    
    if (type === 'image') {
        modalContent.innerHTML = `
            <img src="${url}" alt="Imagem" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        `;
    } else if (type === 'video') {
        modalContent.innerHTML = `
            <video controls autoplay style="max-width: 100%; max-height: 100%;">
                <source src="${url}" type="video/mp4">
                Seu navegador não suporta o elemento de vídeo.
            </video>
        `;
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.cssText = `
        position: absolute;
        top: -40px;
        right: 0;
        background: var(--danger);
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.onclick = () => modalOverlay.remove();
    
    modalContent.appendChild(closeBtn);
    modalOverlay.appendChild(modalContent);
    
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    };
    
    document.body.appendChild(modalOverlay);
    
    // Fechar com ESC
    const closeOnEsc = (e) => {
        if (e.key === 'Escape') {
            modalOverlay.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);
}

// Conectar ao WebSocket para mensagens em tempo real
function connectToWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    
    const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    };
    
    stompClient.connect(headers, (frame) => {
        console.log("Conectado ao WebSocket do projeto");
        
        // Inscrever-se para receber mensagens do grupo
        stompClient.subscribe(`/topic/grupo/${projectId}`, (message) => {
            const newMessage = JSON.parse(message.body);
            handleNewMessage(newMessage);
        });
        
        // Inscrever-se para receber erros
        stompClient.subscribe('/user/queue/errors', (message) => {
            showNotification(message.body, 'error');
        });
        
    }, (error) => {
        console.error("Erro na conexão WebSocket:", error);
        showNotification("Conexão em tempo real não disponível", "info");
    });
}

// Manipular nova mensagem recebida
function handleNewMessage(message) {
    // Adicionar à lista de mensagens
    projectMessages.push(message);
    
    // Renderizar a nova mensagem
    const messageElement = createMessageElement(message);
    document.getElementById('messages-container').appendChild(messageElement);
    
    // Rolar para a última mensagem
    scrollToBottom();
}

// Rolar para o final das mensagens
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// CORREÇÃO: Enviar mensagem com suporte a arquivos
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    const sendBtn = document.getElementById('send-btn');
    
    // Se não há texto e não há arquivos, não faz nada
    if (messageText === '' && selectedFiles.length === 0) return;
    
    // Desabilitar botão durante o envio
    sendBtn.disabled = true;

    try {
        let fileUrls = [];
        
        // CORREÇÃO: Fazer upload dos arquivos se houver
        if (selectedFiles.length > 0) {
            fileUrls = await uploadFiles(selectedFiles);
        }

        if (stompClient && stompClient.connected) {
            // Enviar mensagem via WebSocket
            const messageDTO = {
                conteudo: messageText,
                projetoId: parseInt(projectId),
                anexos: fileUrls // Adicionar URLs dos arquivos
            };
            
            stompClient.send(`/app/grupo/${projectId}`, {}, JSON.stringify(messageDTO));
            
            // Limpar campo de entrada e arquivos
            messageInput.value = '';
            clearSelectedFiles();
            
        } else {
            // Fallback: enviar via API REST
            showNotification("Enviando via API...", "info");
            
            const response = await axios.post(`${backendUrl}/api/mensagens/grupo/projeto/${projectId}`, {
                conteudo: messageText,
                anexos: fileUrls
            });
            
            if (response.data) {
                handleNewMessage(response.data);
            }
            
            messageInput.value = '';
            clearSelectedFiles();
        }
        
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        
        let errorMessage = "Erro ao enviar mensagem";
        if (error.response && error.response.data) {
            errorMessage = error.response.data;
        }
        
        showNotification(errorMessage, "error");
    } finally {
        // Reabilitar botão
        sendBtn.disabled = false;
    }
}

// CORREÇÃO: Função para fazer upload de arquivos
async function uploadFiles(files) {
    const uploadedUrls = [];
    
    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post(`${backendUrl}/api/arquivos/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data && response.data.url) {
                uploadedUrls.push({
                    url: response.data.url,
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
            }
        } catch (error) {
            console.error("Erro ao fazer upload do arquivo:", error);
            showNotification(`Erro ao enviar arquivo ${file.name}`, "error");
        }
    }
    
    return uploadedUrls;
}

// CORREÇÃO: Limpar arquivos selecionados
function clearSelectedFiles() {
    selectedFiles = [];
    const previewContainer = document.getElementById('file-preview-container');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}

// CORREÇÃO: Configurar botão de emoji
function setupEmojiPicker() {
    const emojiBtn = document.getElementById('emoji-btn');
    const messageInput = document.getElementById('message-input');
    
    if (emojiBtn && messageInput) {
        emojiBtn.addEventListener('click', function() {
            toggleEmojiPicker();
        });
    }
}

// CORREÇÃO: Alternar seletor de emoji
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    if (!emojiPicker) {
        createEmojiPicker();
        return;
    }
    
    if (emojiPicker.style.display === 'block') {
        emojiPicker.style.display = 'none';
    } else {
        emojiPicker.style.display = 'block';
        positionEmojiPicker();
    }
}

// CORREÇÃO: Criar seletor de emoji
function createEmojiPicker() {
    const emojiPicker = document.createElement('div');
    emojiPicker.id = 'emoji-picker';
    emojiPicker.className = 'emoji-picker';
    
    // Emojis mais comuns
    const emojis = ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥳', '🥺', '🤠', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😈', '👿', '👹', '👺'];
    
    emojiPicker.innerHTML = `
        <div class="emoji-picker-header">
            <span>Emojis</span>
            <button class="close-emoji-picker" onclick="toggleEmojiPicker()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="emoji-grid">
            ${emojis.map(emoji => `
                <span class="emoji-option" onclick="insertEmoji('${emoji}')">${emoji}</span>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(emojiPicker);
    positionEmojiPicker();
}

// CORREÇÃO: Posicionar seletor de emoji
function positionEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiBtn = document.getElementById('emoji-btn');
    const messageInput = document.getElementById('message-input');
    
    if (emojiPicker && emojiBtn && messageInput) {
        const rect = emojiBtn.getBoundingClientRect();
        const inputRect = messageInput.getBoundingClientRect();
        
        emojiPicker.style.position = 'fixed';
        emojiPicker.style.bottom = `${window.innerHeight - inputRect.top + 10}px`;
        emojiPicker.style.left = `${rect.left}px`;
        emojiPicker.style.zIndex = '1000';
    }
}

// CORREÇÃO: Inserir emoji no campo de mensagem
function insertEmoji(emoji) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;
        
        messageInput.value = text.substring(0, start) + emoji + text.substring(end);
        messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
        messageInput.focus();
        
        // Fechar o seletor de emoji
        toggleEmojiPicker();
    }
}

// Configurar ouvintes de eventos
function setupEventListeners() {
    // Envio de mensagem
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    sendBtn.addEventListener('click', sendMessage);
    
    // Anexar arquivo
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    
    attachFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Modal de informações do projeto
    const projectInfoBtn = document.getElementById('project-info-btn');
    const closeProjectInfoModal = document.getElementById('close-project-info-modal');
    const projectInfoModal = document.getElementById('project-info-modal');
    
    if (projectInfoBtn) {
        projectInfoBtn.addEventListener('click', function() {
            projectInfoModal.style.display = 'flex';
        });
    }
    
    if (closeProjectInfoModal) {
        closeProjectInfoModal.addEventListener('click', function() {
            projectInfoModal.style.display = 'none';
        });
    }
    
    // Fechar modal ao clicar fora
    if (projectInfoModal) {
        projectInfoModal.addEventListener('click', function(e) {
            if (e.target === projectInfoModal) {
                projectInfoModal.style.display = 'none';
            }
        });
    }
    
    // Modal de configurações do projeto
    const projectSettingsBtn = document.getElementById('project-settings-btn');
    const closeProjectSettingsModal = document.getElementById('close-project-settings-modal');
    const projectSettingsModal = document.getElementById('project-settings-modal');
    const cancelProjectSettingsBtn = document.getElementById('cancel-project-settings-btn');
    
    if (projectSettingsBtn) {
        projectSettingsBtn.addEventListener('click', function() {
            openProjectSettingsModal();
        });
    }
    
    if (closeProjectSettingsModal) {
        closeProjectSettingsModal.addEventListener('click', function() {
            projectSettingsModal.style.display = 'none';
        });
    }
    
    if (cancelProjectSettingsBtn) {
        cancelProjectSettingsBtn.addEventListener('click', function() {
            projectSettingsModal.style.display = 'none';
        });
    }
    
    // Fechar modal de configurações ao clicar fora
    if (projectSettingsModal) {
        projectSettingsModal.addEventListener('click', function(e) {
            if (e.target === projectSettingsModal) {
                projectSettingsModal.style.display = 'none';
            }
        });
    }
    
    // Formulário de configurações do projeto
    const projectSettingsForm = document.getElementById('project-settings-form');
    if (projectSettingsForm) {
        projectSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProjectSettings();
        });
    }
    
    // Buscar membros
    const searchMembersInput = document.getElementById('search-members');
    if (searchMembersInput) {
        searchMembersInput.addEventListener('input', filterMembers);
    }
    
    // Menu toggle para mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const membersSidebar = document.querySelector('.members-sidebar');
    
    if (menuToggle && membersSidebar) {
        menuToggle.addEventListener('click', function() {
            membersSidebar.classList.toggle('mobile-open');
        });
    }

    // CORREÇÃO: Configurar emoji picker
    setupEmojiPicker();

    // CORREÇÃO: Adicionar botão de adicionar membro se não existir
    setupAddMemberButton();
}

// CORREÇÃO: Configurar botão de adicionar membro
function setupAddMemberButton() {
    const membersHeader = document.querySelector('.members-header');
    if (membersHeader && !document.getElementById('add-member-btn')) {
        const addMemberBtn = document.createElement('button');
        addMemberBtn.id = 'add-member-btn';
        addMemberBtn.className = 'add-member-btn';
        addMemberBtn.innerHTML = '<i class="fas fa-user-plus"></i>';
        addMemberBtn.setAttribute('data-tooltip', 'Adicionar membro');
        addMemberBtn.style.display = 'none'; // Será mostrado apenas para admin/moderador
        
        addMemberBtn.addEventListener('click', function() {
            openAddMemberModal();
        });
        
        membersHeader.appendChild(addMemberBtn);
    }
}

// CORREÇÃO: Abrir modal para adicionar membro
function openAddMemberModal() {
    // Criar modal dinamicamente
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'add-member-modal';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'flex';
    
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Adicionar Membro ao Projeto</h3>
                <button class="close-modal" id="close-add-member-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="search-users-input" placeholder="Buscar usuários...">
                </div>
                <div class="users-search-results" id="users-search-results">
                    <p class="empty-state">Digite para buscar usuários</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Configurar eventos do modal
    const closeBtn = document.getElementById('close-add-member-modal');
    const searchInput = document.getElementById('search-users-input');
    
    closeBtn.addEventListener('click', function() {
        modalOverlay.remove();
    });
    
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    // Configurar busca de usuários
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = this.value.trim();
        
        if (searchTerm.length < 2) {
            document.getElementById('users-search-results').innerHTML = '<p class="empty-state">Digite pelo menos 2 caracteres</p>';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            await searchUsers(searchTerm);
        }, 500);
    });
}

// CORREÇÃO: Buscar usuários para adicionar ao projeto
async function searchUsers(searchTerm) {
    try {
        const response = await axios.get(`${backendUrl}/usuarios/buscar?nome=${encodeURIComponent(searchTerm)}`);
        const users = response.data;
        
        const resultsContainer = document.getElementById('users-search-results');
        resultsContainer.innerHTML = '';
        
        if (users.length === 0) {
            resultsContainer.innerHTML = '<p class="empty-state">Nenhum usuário encontrado</p>';
            return;
        }
        
        // Filtrar usuários que já são membros do projeto
        const existingMemberIds = projectMembers.map(member => member.usuarioId || member.id);
        const availableUsers = users.filter(user => !existingMemberIds.includes(user.id));
        
        if (availableUsers.length === 0) {
            resultsContainer.innerHTML = '<p class="empty-state">Todos os usuários encontrados já são membros do projeto</p>';
            return;
        }
        
        availableUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-search-result';
            
            const userAvatar = user.urlFotoPerfil ? 
                (user.urlFotoPerfil.startsWith('http') ? user.urlFotoPerfil : `${backendUrl}${user.urlFotoPerfil}`) :
                defaultAvatarUrl;
            
            userElement.innerHTML = `
                <div class="user-avatar">
                    <img src="${userAvatar}" alt="${user.nome}" onerror="this.src='${defaultAvatarUrl}'">
                </div>
                <div class="user-info">
                    <div class="user-name">${user.nome}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                <button class="btn btn-primary add-user-btn" onclick="inviteUserToProject(${user.id})">
                    Convidar
                </button>
            `;
            
            resultsContainer.appendChild(userElement);
        });
        
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        document.getElementById('users-search-results').innerHTML = '<p class="empty-state">Erro ao buscar usuários</p>';
    }
}

// CORREÇÃO: Convidar usuário para o projeto
async function inviteUserToProject(userId) {
    try {
        await axios.post(`${backendUrl}/projetos/${projectId}/convites`, null, {
            params: {
                usuarioConvidadoId: userId,
                usuarioConvidadorId: currentUser.id
            }
        });
        
        showNotification("Convite enviado com sucesso!", "success");
        
        // Fechar modal
        document.getElementById('add-member-modal')?.remove();
        
    } catch (error) {
        console.error("Erro ao enviar convite:", error);
        
        let errorMessage = "Erro ao enviar convite";
        if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data;
        }
        
        showNotification(errorMessage, "error");
    }
}

// Abrir modal de configurações do projeto
function openProjectSettingsModal() {
    if (!currentProject) return;
    
    const modal = document.getElementById('project-settings-modal');
    if (!modal) return;
    
    // Preencher formulário com dados atuais
    document.getElementById('edit-project-name').value = currentProject.titulo;
    document.getElementById('edit-project-description').value = currentProject.descricao || '';
    document.getElementById('edit-project-max-members').value = currentProject.maxMembros || 10;
    document.getElementById('edit-project-privacy').value = currentProject.grupoPrivado ? 'true' : 'false';
    document.getElementById('edit-project-category').value = currentProject.categoria || '';
    
    // Preencher tecnologias
    const technologiesInput = document.getElementById('edit-project-technologies');
    if (currentProject.tecnologias && currentProject.tecnologias.length > 0) {
        technologiesInput.value = currentProject.tecnologias.join(', ');
    } else {
        technologiesInput.value = '';
    }
    
    modal.style.display = 'flex';
}

// Atualizar configurações do projeto
async function updateProjectSettings() {
    if (!currentProject) return;
    
    try {
        const formData = new FormData();
        formData.append('titulo', document.getElementById('edit-project-name').value);
        formData.append('descricao', document.getElementById('edit-project-description').value);
        formData.append('maxMembros', document.getElementById('edit-project-max-members').value);
        formData.append('grupoPrivado', document.getElementById('edit-project-privacy').value);
        formData.append('categoria', document.getElementById('edit-project-category').value);
        
        // Processar tecnologias
        const technologiesInput = document.getElementById('edit-project-technologies').value;
        const technologies = technologiesInput.split(',').map(tech => tech.trim()).filter(tech => tech !== '');
        formData.append('tecnologias', JSON.stringify(technologies));
        
        // Adicionar ID do administrador
        formData.append('adminId', currentUser.id);
        
        // Enviar atualização
        await axios.put(`${backendUrl}/projetos/${projectId}/info`, formData);
        
        // Fechar modal
        document.getElementById('project-settings-modal').style.display = 'none';
        
        // Recarregar dados do projeto
        await loadProjectData();
        
        showNotification("Configurações do projeto atualizadas com sucesso", "success");
        
    } catch (error) {
        console.error("Erro ao atualizar configurações do projeto:", error);
        showNotification("Erro ao atualizar configurações do projeto", "error");
    }
}

// Filtrar membros na lista
function filterMembers() {
    const searchTerm = document.getElementById('search-members').value.toLowerCase();
    const memberItems = document.querySelectorAll('.member-item');
    
    memberItems.forEach(item => {
        const memberName = item.querySelector('.member-name').textContent.toLowerCase();
        const memberRole = item.querySelector('.member-role').textContent.toLowerCase();
        
        if (memberName.includes(searchTerm) || memberRole.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Manipular seleção de arquivo
function handleFileSelect(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('file-preview-container');
    
    // Limpar previews anteriores
    previewContainer.innerHTML = '';
    selectedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        selectedFiles.push(file);
        
        const filePreview = document.createElement('div');
        filePreview.className = 'file-preview-item';
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                filePreview.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-file-btn" data-file-index="${i}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Adicionar evento para remover arquivo
                filePreview.querySelector('.remove-file-btn').addEventListener('click', function() {
                    removeFileFromInput(i);
                    filePreview.remove();
                });
            };
            reader.readAsDataURL(file);
        } else {
            filePreview.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                </div>
                <button class="remove-file-btn" data-file-index="${i}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Adicionar evento para remover arquivo
            filePreview.querySelector('.remove-file-btn').addEventListener('click', function() {
                removeFileFromInput(i);
                filePreview.remove();
            });
        }
        
        previewContainer.appendChild(filePreview);
    }
    
    // Limpar input de arquivo
    event.target.value = '';
}

// Remover arquivo do input
function removeFileFromInput(index) {
    selectedFiles.splice(index, 1);
    updateFilePreview();
}

// Atualizar preview de arquivos
function updateFilePreview() {
    const previewContainer = document.getElementById('file-preview-container');
    previewContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const filePreview = document.createElement('div');
        filePreview.className = 'file-preview-item';
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                filePreview.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-file-btn" data-file-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                filePreview.querySelector('.remove-file-btn').addEventListener('click', function() {
                    removeFileFromInput(index);
                });
            };
            reader.readAsDataURL(file);
        } else {
            filePreview.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                </div>
                <button class="remove-file-btn" data-file-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            filePreview.querySelector('.remove-file-btn').addEventListener('click', function() {
                removeFileFromInput(index);
            });
        }
        
        previewContainer.appendChild(filePreview);
    });
}

// CORREÇÃO: Função para expulsar membro (melhorada)
async function expelMember(memberId) {
    if (!confirm("Tem certeza que deseja expulsar este membro do projeto?")) {
        return;
    }
    
    try {
        await axios.delete(`${backendUrl}/projetos/${projectId}/membros/${memberId}`, {
            params: {
                adminId: currentUser.id
            }
        });
        
        showNotification("Membro expulso do projeto com sucesso", "success");
        
        // Recarregar dados do projeto
        await loadProjectData();
        
    } catch (error) {
        console.error("Erro ao expulsar membro:", error);
        let errorMessage = "Erro ao expulsar membro do projeto";
        if (error.response?.data) {
            errorMessage = error.response.data;
        }
        showNotification(errorMessage, "error");
    }
}

// CORREÇÃO: Função para alterar função (melhorada)
async function changeMemberRole(memberId) {
    const currentMember = projectMembers.find(m => m.usuarioId === memberId || m.id === memberId);
    if (!currentMember) return;
    
    const currentRole = currentMember.role || currentMember.funcao || 'MEMBRO';
    const newRole = prompt(`Alterar função para ${currentMember.nome}:\n\nDigite ADMIN, MODERADOR ou MEMBRO:`, currentRole);
    
    if (!newRole || !['ADMIN', 'MODERADOR', 'MEMBRO'].includes(newRole.toUpperCase())) {
        showNotification("Função inválida. Use: ADMIN, MODERADOR ou MEMBRO", "error");
        return;
    }
    
    try {
        await axios.put(`${backendUrl}/projetos/${projectId}/membros/${memberId}/permissao`, null, {
            params: {
                role: newRole.toUpperCase(),
                adminId: currentUser.id
            }
        });
        
        showNotification("Função do membro alterada com sucesso", "success");
        
        // Recarregar dados do projeto
        await loadProjectData();
        
    } catch (error) {
        console.error("Erro ao alterar função do membro:", error);
        let errorMessage = "Erro ao alterar função do membro";
        if (error.response?.data) {
            errorMessage = error.response.data;
        }
        showNotification(errorMessage, "error");
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    const notificationCenter = document.querySelector('.notification-center');
    if (!notificationCenter) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationCenter.appendChild(notification);
    
    // Mostrar notificação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover notificação após 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Definir variáveis globais para acesso externo
window.backendUrl = backendUrl;
window.defaultAvatarUrl = defaultAvatarUrl;
window.showNotification = showNotification;
window.expelMember = expelMember;
window.changeMemberRole = changeMemberRole;
window.inviteUserToProject = inviteUserToProject;
window.openMediaModal = openMediaModal;