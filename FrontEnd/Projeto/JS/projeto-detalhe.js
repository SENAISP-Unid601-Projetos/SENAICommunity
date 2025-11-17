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

// CORREÇÃO: Função para normalizar status do projeto
function normalizeProjectStatus(status) {
    if (!status) return 'PLANEJAMENTO';
    
    const statusMap = {
        'PLANEJAMENTO': 'PLANEJAMENTO',
        'EM_ANDAMENTO': 'EM_ANDAMENTO',
        'CONCLUIDO': 'CONCLUIDO',
        'Em planejamento': 'PLANEJAMENTO',
        'Em progresso': 'EM_ANDAMENTO', 
        'Concluído': 'CONCLUIDO'
    };
    
    return statusMap[status] || 'PLANEJAMENTO';
}

// CORREÇÃO: Atualizar a função loadProjectMembers
async function loadProjectMembers() {
    try {
        showLoading("Carregando membros...");
        
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
    } finally {
        hideLoading();
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
const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;

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

// CORREÇÃO: Função melhorada para obter status online
async function fetchOnlineStatus() {
    try {
        const response = await axios.get(`${backendUrl}/usuarios/online`);
        window.latestOnlineEmails = response.data;
        updateMembersCount();
        renderMembersList();
        
        // Atualizar também os membros no modal se estiver aberto
        const membersListModal = document.getElementById('members-list-modal');
        if (membersListModal && membersListModal.innerHTML !== '') {
            renderMembersList();
        }
    } catch (error) {
        console.error("Erro ao buscar status online:", error);
        // Fallback: marcar alguns como online para teste
        if (projectMembers && projectMembers.length > 0) {
            window.latestOnlineEmails = projectMembers
                .slice(0, Math.min(2, projectMembers.length))
                .map(m => m.email || m.usuarioEmail)
                .filter(Boolean);
            updateMembersCount();
            renderMembersList();
        }
    }
}

function isMemberOnline(member) {
    // Se a lista global ainda não existe, ninguém está online
    if (!window.latestOnlineEmails || !Array.isArray(window.latestOnlineEmails)) return false;
    
    // Pega o email do membro (tenta várias propriedades possíveis)
    const memberEmail = (member.email || member.usuarioEmail || "").toLowerCase();
    
    if (!memberEmail) return false;

    // Verifica se o email está na lista (normalizando a lista também para garantir)
    return window.latestOnlineEmails.some(email => email.toLowerCase() === memberEmail);
}

function updateMembersCount() {
    if (!projectMembers || projectMembers.length === 0) {
        document.getElementById('members-count').textContent = '0';
        document.getElementById('modal-members-count').textContent = '0 membros';
        document.getElementById('online-count').textContent = '0 membros online';
        return;
    }

    const totalMembers = projectMembers.length;
    const onlineMembers = projectMembers.filter(isMemberOnline).length;

    document.getElementById('members-count').textContent = totalMembers;
    document.getElementById('modal-members-count').textContent = `${totalMembers} membros`;
    document.getElementById('online-count').textContent = `${onlineMembers} membros online`;
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
        showLoading("Carregando projeto...");
        
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
    } finally {
        hideLoading();
    }
}

// CORREÇÃO: Atualizar informações do projeto na interface
function updateProjectInfo() {
    if (!currentProject) return;
    
    // Atualizar elementos com informações do projeto
    document.getElementById('project-name').textContent = currentProject.titulo;
    document.getElementById('chat-project-name').textContent = currentProject.titulo;
    document.getElementById('project-description').textContent = currentProject.descricao || "Sem descrição";
    document.getElementById('project-max-members').textContent = `Máx: ${currentProject.maxMembros || 10} membros`;
    document.getElementById('project-privacy').textContent = currentProject.grupoPrivado ? "Privado" : "Público";
    document.getElementById('project-category').textContent = currentProject.categoria || "Sem categoria";
    
    // CORREÇÃO: Atualizar nome do líder no modal
    const leaderName = currentProject.autorNome || 'Líder não encontrado';
    document.getElementById('modal-project-leader').textContent = `Líder: ${leaderName}`;
    
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
    
    // Atualizar indicador de status
    updateProjectStatusIndicator();
    
    // Verificar se o usuário atual é o administrador
    checkUserRole();
}

// Renderizar lista de membros
function renderMembersList() {
    const membersList = document.getElementById('members-list');
    const membersListModal = document.getElementById('members-list-modal');
    
    // Limpar listas
    if(membersList) membersList.innerHTML = '';
    if(membersListModal) membersListModal.innerHTML = '';
    
    if (!projectMembers || projectMembers.length === 0) {
        if(membersList) membersList.innerHTML = '<p class="empty-state">Nenhum membro</p>';
        return;
    }
    
    // Ordenar: Online primeiro, depois alfabético
    const sortedMembers = [...projectMembers].sort((a, b) => {
        const aOnline = isMemberOnline(a);
        const bOnline = isMemberOnline(b);
        
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return (a.nome || "").localeCompare(b.nome || "");
    });
    
    // Renderizar
    sortedMembers.forEach(member => {
        const memberElement = createMemberElement(member);
        if(membersList) membersList.appendChild(memberElement);
        
        if(membersListModal) {
            const memberModalElement = createMemberModalElement(member);
            membersListModal.appendChild(memberModalElement);
        }
    });
}

// CORREÇÃO: Criar elemento de membro para a lista lateral
function createMemberElement(member) {
    const memberItem = document.createElement('div');
    memberItem.className = 'member-item';
    
    const memberAvatar = getMemberAvatarUrl(member);
    const isOnline = isMemberOnline(member);
    
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
    const isOnline = isMemberOnline(member);
    
    memberItem.innerHTML = `
        <div class="member-avatar-modal">
            <img src="${memberAvatar}" alt="${member.nome}" onerror="this.src='${defaultAvatarUrl}'">
        </div>
        <div class="member-info-modal">
            <div class="member-name-modal">${member.nome}</div>
            <div class="member-role-modal">
                ${member.role || member.funcao || 'Membro'} 
                <span class="member-status ${isOnline ? 'online' : 'offline'}" 
                      style="margin-left: 8px; display: inline-block; width: 8px; height: 8px; border-radius: 50%;"></span>
                ${isOnline ? '<span style="color: var(--online); font-size: 0.7rem; margin-left: 4px;">Online</span>' : ''}
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
        showLoading("Carregando mensagens...");
        
        const response = await axios.get(`${backendUrl}/api/mensagens/grupo/projeto/${projectId}`);
        projectMessages = response.data;
        
        // Renderizar mensagens
        renderMessages();
        
    } catch (error) {
        console.error("Erro ao carregar mensagens do projeto:", error);
        document.getElementById('messages-container').innerHTML = '<p class="empty-state">Erro ao carregar mensagens</p>';
    } finally {
        hideLoading();
    }
}

// CORREÇÃO: Função para mostrar/ocultar loading
function showLoading(message = "Carregando...") {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.id = 'global-loading';
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center;">
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const loadingOverlay = document.getElementById('global-loading');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// CORREÇÃO: Função para mostrar loading em botões
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('btn-loading');
        button.disabled = true;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
    }
}

// CORREÇÃO: Função MELHORADA para processar conteúdo da mensagem - CORRIGIDA
function processMessageContent(content) {
    if (!content) return '';
    
    // CORREÇÃO: Substituir quebras de linha por <br> e sanitizar conteúdo
    let processedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    
    // CORREÇÃO: Compactar mensagens muito longas com limite menor
    const maxLength = 300; // Reduzido para melhor visualização
    if (content.length > maxLength) {
        const truncatedContent = content.substring(0, maxLength) + '...';
        const truncatedWithBreaks = truncatedContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        
        const fullContent = processedContent;
        
        // CORREÇÃO: Usar template string corretamente escapada
        return `
            <div class="message-truncated">
                <div class="truncated-content">${truncatedWithBreaks}</div>
                <button type="button" class="show-more-btn" onclick="expandMessage(this)">Ver mais</button>
                <div class="full-content" style="display: none;">${fullContent}</div>
            </div>
        `;
    }
    
    return processedContent;
}

// CORREÇÃO: Função para expandir mensagem - CORRIGIDA
function expandMessage(button) {
    const messageContainer = button.parentElement;
    const truncatedContent = messageContainer.querySelector('.truncated-content');
    const fullContent = messageContainer.querySelector('.full-content');
    
    if (truncatedContent && fullContent) {
        truncatedContent.style.display = 'none';
        fullContent.style.display = 'block';
        button.style.display = 'none';
        
        // CORREÇÃO: Ajustar layout após expandir
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    }
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
        if (messageElement) {
            messagesContainer.appendChild(messageElement);
        }
    });
    
    // Rolar para a última mensagem
    scrollToBottom();
}

// CORREÇÃO: Função MELHORADA para criar elemento de mensagem - CORRIGIDA
function createMessageElement(message) {
    if (!message) return null;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.autorId === currentUser.id ? 'own' : ''}`;
    messageDiv.id = `message-${message.id}`;
    
    // CORREÇÃO: Estilo para prevenir quebra de layout
    messageDiv.style.cssText = `
        display: flex;
        gap: 0.75rem;
        max-width: 85%;
        width: fit-content;
        word-wrap: break-word;
        overflow-wrap: break-word;
        align-items: flex-start;
    `;
    
    if (message.autorId === currentUser.id) {
        messageDiv.style.alignSelf = 'flex-end';
        messageDiv.style.flexDirection = 'row-reverse';
    }
    
    const messageAvatar = getMessageAvatarUrl(message);
    const messageTime = new Date(message.dataEnvio || message.dataCriacao).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const messageContent = processMessageContent(message.conteudo);
    
    // CORREÇÃO: Ações da mensagem (editar/excluir) apenas para o autor
    let messageActions = '';
    if (message.autorId === currentUser.id) {
        messageActions = `
            <div class="message-actions">
                <button class="message-action-btn" onclick="editMessage(${message.id})" 
                        data-tooltip="Editar mensagem" title="Editar mensagem">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="message-action-btn" onclick="deleteMessage(${message.id})" 
                        data-tooltip="Excluir mensagem" title="Excluir mensagem">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    // CORREÇÃO: Melhor tratamento de anexos
    let anexosHTML = '';
    if (message.anexos && message.anexos.length > 0) {
        anexosHTML = message.anexos.map(anexo => {
            let mediaUrl = anexo.url;
            if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('blob:')) {
                if (mediaUrl.startsWith('/')) {
                    mediaUrl = `${backendUrl}${mediaUrl}`;
                } else {
                    mediaUrl = `${backendUrl}/api/arquivos/${mediaUrl}`;
                }
            }
            
            const mediaType = anexo.type || detectMediaType(mediaUrl);
            
            // CORREÇÃO: Sanitizar URLs para prevenir quebra de layout
            const safeMediaUrl = mediaUrl.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            if (mediaType === 'image') {
                return `
                <div class="message-file" style="margin-top: 8px; max-width: 100%;">
                    <img src="${safeMediaUrl}" alt="Imagem" 
                         onload="this.style.opacity='1'" 
                         onerror="this.style.display='none'"
                         style="opacity:0; transition: opacity 0.3s; cursor: pointer; max-width: 100%; max-height: 300px; border-radius: 8px;"
                         onclick="openMediaModal('${safeMediaUrl}', 'image')">
                </div>`;
            } else if (mediaType === 'video') {
                return `
                <div class="message-file" style="margin-top: 8px; max-width: 100%;">
                    <video controls src="${safeMediaUrl}" 
                           style="max-width: 100%; max-height: 300px; border-radius: 8px;"
                           onerror="console.error('Erro ao carregar vídeo: ${safeMediaUrl}')">
                        Seu navegador não suporta o elemento de vídeo.
                    </video>
                </div>`;
            } else {
                const fileName = (anexo.name || mediaUrl.split('/').pop() || 'Arquivo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `
                <div class="message-file" style="margin-top: 8px; max-width: 100%;">
                    <a href="${safeMediaUrl}" target="_blank" class="message-file-document" download style="text-decoration: none; color: inherit;">
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
        <div class="message-avatar" style="flex-shrink: 0;">
            <img src="${messageAvatar}" alt="${message.nomeAutor || 'Usuário'}" onerror="this.src='${defaultAvatarUrl}'" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
        </div>
        <div class="message-content" style="flex: 1; min-width: 0; max-width: 100%;">
            <div class="message-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="message-sender" style="font-size: 0.85rem; font-weight: 600;">${message.nomeAutor || 'Usuário'}</span>
                <span class="message-time" style="font-size: 0.7rem; color: var(--text-secondary);">${messageTime}</span>
            </div>
            ${messageContent ? `
            <div class="message-bubble" style="
                padding: 0.75rem 1rem; 
                border-radius: 18px; 
                background-color: ${message.autorId === currentUser.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)'}; 
                color: ${message.autorId === currentUser.id ? 'white' : 'var(--text-primary)'};
                font-size: 0.9rem; 
                line-height: 1.4; 
                word-wrap: break-word; 
                overflow-wrap: break-word; 
                max-width: 100%;
                word-break: break-word;
                white-space: pre-wrap;
                display: inline-block;
            ">${messageContent}</div>` : ''}
            ${anexosHTML}
            ${messageActions}
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

// CORREÇÃO: Conectar ao WebSocket para mensagens em tempo real
function connectToWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    
    const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    };
    
    stompClient.connect(headers, (frame) => {
        console.log("Conectado ao WebSocket!");
        
        // Inscrever-se para mensagens do chat
        stompClient.subscribe(`/topic/grupo/${projectId}`, (message) => {
            const newMessage = JSON.parse(message.body);
            // Se não for atualização de status (chat normal)
            if (!newMessage.tipo || newMessage.tipo !== 'status') {
                handleNewMessage(newMessage);
            }
        });
        
        // Inscrever-se para Status Online GLOBAL
        stompClient.subscribe("/topic/status", (message) => {
            const onlineEmails = JSON.parse(message.body);
            window.latestOnlineEmails = onlineEmails;
            updateMembersCount();
            renderMembersList();
        });
        
        // Inscrever-se para erros
        stompClient.subscribe('/user/queue/errors', (message) => {
            showNotification(message.body, 'error');
        });
        
    }, (error) => {
        console.error("Erro na conexão WebSocket:", error);
        setTimeout(connectToWebSocket, 5000);
    });
}

// CORREÇÃO: Função para atualizar mensagem existente
function updateExistingMessage(updatedMessage) {
    const messageIndex = projectMessages.findIndex(m => m.id === updatedMessage.id);
    if (messageIndex !== -1) {
        projectMessages[messageIndex] = updatedMessage;
        
        const messageElement = document.getElementById(`message-${updatedMessage.id}`);
        if (messageElement) {
            const newMessageElement = createMessageElement(updatedMessage);
            messageElement.replaceWith(newMessageElement);
        }
    }
}

// CORREÇÃO: Função para remover mensagem da UI
function removeMessageFromUI(messageId) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
        messageElement.remove();
    }
    
    projectMessages = projectMessages.filter(msg => msg.id !== messageId);
}

// Manipular nova mensagem recebida
function handleNewMessage(message) {
    // Adicionar à lista de mensagens
    projectMessages.push(message);
    
    // Renderizar a nova mensagem
    const messageElement = createMessageElement(message);
    if (messageElement) {
        document.getElementById('messages-container').appendChild(messageElement);
    }
    
    // Rolar para a última mensagem
    scrollToBottom();
}

// Rolar para o final das mensagens
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// CORREÇÃO: Função melhorada para editar mensagem
async function editMessage(messageId) {
    const message = projectMessages.find(m => m.id === messageId);
    if (!message) return;
    
    // Criar modal de edição
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    modalOverlay.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Editar Mensagem</h3>
                <button class="close-modal" id="close-edit-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="edit-message-content">Mensagem:</label>
                    <textarea id="edit-message-content" rows="6" style="width: 100%; resize: vertical; font-family: inherit;">${message.conteudo || ''}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-edit-message">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="save-edit-message">Salvar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Configurar eventos
    const closeBtn = document.getElementById('close-edit-modal');
    const cancelBtn = document.getElementById('cancel-edit-message');
    const saveBtn = document.getElementById('save-edit-message');
    const textarea = document.getElementById('edit-message-content');
    
    const closeModal = () => modalOverlay.remove();
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    saveBtn.addEventListener('click', async () => {
        const newContent = textarea.value.trim();
        
        if (newContent === message.conteudo) {
            closeModal();
            return;
        }
        
        if (!newContent) {
            showNotification("A mensagem não pode estar vazia", "error");
            return;
        }
        
        try {
            setButtonLoading(saveBtn, true);
            
            await axios.put(`${backendUrl}/api/mensagens/grupo/${messageId}`, {
                conteudo: newContent
            });
            
            showNotification("Mensagem editada com sucesso", "success");
            closeModal();
            
            // Recarregar mensagens para refletir a edição
            await loadProjectMessages();
            
        } catch (error) {
            console.error("Erro ao editar mensagem:", error);
            showNotification("Erro ao editar mensagem", "error");
        } finally {
            setButtonLoading(saveBtn, false);
        }
    });
    
    // Fechar modal ao clicar fora
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Focar no textarea e selecionar todo o conteúdo
    textarea.focus();
    textarea.select();
}

// CORREÇÃO: Função melhorada para excluir mensagem
async function deleteMessage(messageId) {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) {
        return;
    }
    
    try {
        showLoading("Excluindo mensagem...");
        
        await axios.delete(`${backendUrl}/api/mensagens/grupo/${messageId}`);
        
        showNotification("Mensagem excluída com sucesso", "success");
        
        // Remover a mensagem da interface
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.remove();
        }
        
        // Remover da lista de mensagens
        projectMessages = projectMessages.filter(msg => msg.id !== messageId);
        
    } catch (error) {
        console.error("Erro ao excluir mensagem:", error);
        showNotification("Erro ao excluir mensagem", "error");
    } finally {
        hideLoading();
    }
}

// CORREÇÃO: Enviar mensagem com suporte a arquivos e loading
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    const sendBtn = document.getElementById('send-btn');
    
    // Se não há texto e não há arquivos, não faz nada
    if (messageText === '' && selectedFiles.length === 0) return;
    
    // Desabilitar botão durante o envio
    setButtonLoading(sendBtn, true);

    try {
        let fileUrls = [];
        
        // CORREÇÃO: Fazer upload dos arquivos se houver
        if (selectedFiles.length > 0) {
            showLoading("Enviando arquivos...");
            fileUrls = await uploadFiles(selectedFiles);
            hideLoading();
        }

        if (stompClient && stompClient.connected) {
            // Enviar mensagem via WebSocket
            const messageDTO = {
                conteudo: messageText,
                projetoId: parseInt(projectId),
                anexos: fileUrls
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
        setButtonLoading(sendBtn, false);
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

// CORREÇÃO: Função melhorada para alterar função com modal
async function changeMemberRole(memberId) {
    const currentMember = projectMembers.find(m => m.usuarioId === memberId || m.id === memberId);
    if (!currentMember) return;
    
    const currentRole = currentMember.role || currentMember.funcao || 'MEMBRO';
    
    // Criar modal para seleção de função
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    modalOverlay.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Alterar Função do Membro</h3>
                <button class="close-modal" id="close-role-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Alterar função para <strong>${currentMember.nome}</strong>:</p>
                <div class="form-group">
                    <label for="role-select">Nova Função:</label>
                    <select id="role-select" class="role-select">
                        <option value="MEMBRO" ${currentRole === 'MEMBRO' ? 'selected' : ''}>Membro</option>
                        <option value="MODERADOR" ${currentRole === 'MODERADOR' ? 'selected' : ''}>Moderador</option>
                        <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>
                <div class="role-descriptions">
                    <div class="role-info">
                        <strong>Membro:</strong> Pode enviar mensagens e visualizar conteúdo
                    </div>
                    <div class="role-info">
                        <strong>Moderador:</strong> Pode gerenciar membros (exceto administradores)
                    </div>
                    <div class="role-info">
                        <strong>Administrador:</strong> Todas as permissões incluindo configurações do projeto
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-role-change">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="confirm-role-change">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Configurar eventos
    const closeBtn = document.getElementById('close-role-modal');
    const cancelBtn = document.getElementById('cancel-role-change');
    const confirmBtn = document.getElementById('confirm-role-change');
    
    const closeModal = () => modalOverlay.remove();
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', async () => {
        const newRole = document.getElementById('role-select').value;
        
        try {
            setButtonLoading(confirmBtn, true);
            
            await axios.put(`${backendUrl}/projetos/${projectId}/membros/${memberId}/permissao`, null, {
                params: {
                    role: newRole,
                    adminId: currentUser.id
                }
            });
            
            showNotification("Função do membro alterada com sucesso", "success");
            closeModal();
            
            // Recarregar dados do projeto
            await loadProjectData();
            
        } catch (error) {
            console.error("Erro ao alterar função do membro:", error);
            let errorMessage = "Erro ao alterar função do membro";
            if (error.response?.data) {
                errorMessage = error.response.data;
            }
            showNotification(errorMessage, "error");
        } finally {
            setButtonLoading(confirmBtn, false);
        }
    });
    
    // Fechar modal ao clicar fora
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
}

// Configurar ouvintes de eventos
function setupEventListeners() {
    // Envio de mensagem
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (messageInput && sendBtn) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Anexar arquivo
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    
    if (attachFileBtn && fileInput) {
        attachFileBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileSelect);
    }
    
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
        addMemberBtn.style.display = 'none';
        
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
        showLoading("Buscando usuários...");
        
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
    } finally {
        hideLoading();
    }
}

// CORREÇÃO: Convidar usuário para o projeto
async function inviteUserToProject(userId) {
    try {
        showLoading("Enviando convite...");
        
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
    } finally {
        hideLoading();
    }
}

// CORREÇÃO: Abrir modal de configurações com campos preenchidos corretamente
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
    
    // CORREÇÃO: Preencher status do projeto corretamente
    const statusSelect = document.getElementById('edit-project-status');
    if (statusSelect) {
        // Mapear status do backend para as opções do frontend
        const statusMapping = {
            'PLANEJAMENTO': 'PLANEJAMENTO',
            'EM_ANDAMENTO': 'EM_ANDAMENTO', 
            'CONCLUIDO': 'CONCLUIDO',
            'Em planejamento': 'PLANEJAMENTO',
            'Em progresso': 'EM_ANDAMENTO',
            'Concluído': 'CONCLUIDO'
        };
        
        const currentStatus = currentProject.status || 'PLANEJAMENTO';
        statusSelect.value = statusMapping[currentStatus] || 'PLANEJAMENTO';
    }
    
    // Preencher tecnologias
    const technologiesInput = document.getElementById('edit-project-technologies');
    if (currentProject.tecnologias && currentProject.tecnologias.length > 0) {
        technologiesInput.value = currentProject.tecnologias.join(', ');
    } else {
        technologiesInput.value = '';
    }
    
    // CORREÇÃO: Limpar input de foto ao abrir o modal
    const photoInput = document.getElementById('edit-project-photo');
    if (photoInput) {
        photoInput.value = '';
    }
    
    // CORREÇÃO: Configurar input de foto
    setupPhotoInput();
    
    modal.style.display = 'flex';
}

// CORREÇÃO: Atualizar configurações do projeto incluindo status e foto
async function updateProjectSettings() {
    if (!currentProject) return;
    
    try {
        showLoading("Atualizando projeto...");
        
        const formData = new FormData();
        formData.append('titulo', document.getElementById('edit-project-name').value);
        formData.append('descricao', document.getElementById('edit-project-description').value);
        formData.append('maxMembros', document.getElementById('edit-project-max-members').value);
        formData.append('grupoPrivado', document.getElementById('edit-project-privacy').value);
        formData.append('categoria', document.getElementById('edit-project-category').value);
        
        // NOVO: Adicionar status ao formulário
        const statusSelect = document.getElementById('edit-project-status');
        if (statusSelect) {
            formData.append('status', statusSelect.value);
        }
        
        // NOVO: Adicionar foto se houver uma nova
        const photoInput = document.getElementById('edit-project-photo');
        if (photoInput && photoInput.files[0]) {
            formData.append('foto', photoInput.files[0]);
        }
        
        // Processar tecnologias
        const technologiesInput = document.getElementById('edit-project-technologies').value;
        const technologies = technologiesInput.split(',').map(tech => tech.trim()).filter(tech => tech !== '');
        formData.append('tecnologias', JSON.stringify(technologies));
        
        // Adicionar ID do administrador
        formData.append('adminId', currentUser.id);
        
        // Enviar atualização - CORREÇÃO: Usar FormData e multipart
        await axios.put(`${backendUrl}/projetos/${projectId}/info`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        // Fechar modal
        document.getElementById('project-settings-modal').style.display = 'none';
        
        // Recarregar dados do projeto
        await loadProjectData();
        
        showNotification("Configurações do projeto atualizadas com sucesso", "success");
        
    } catch (error) {
        console.error("Erro ao atualizar configurações do projeto:", error);
        
        let errorMessage = "Erro ao atualizar configurações do projeto";
        if (error.response && error.response.data) {
            errorMessage = error.response.data;
        }
        
        showNotification(errorMessage, "error");
    } finally {
        hideLoading();
    }
}

// CORREÇÃO: Configurar input de foto no modal de configurações
function setupPhotoInput() {
    const photoInput = document.getElementById('edit-project-photo');
    const fileNameDisplay = document.getElementById('file-name');
    const currentPhotoPreview = document.getElementById('current-project-photo');
    
    if (photoInput && fileNameDisplay && currentPhotoPreview) {
        // Mostrar foto atual
        if (currentProject && currentProject.imagemUrl) {
            currentPhotoPreview.src = getProjectImageUrl(currentProject.imagemUrl);
            currentPhotoPreview.style.display = 'block';
        } else {
            currentPhotoPreview.style.display = 'none';
        }
        
        // Configurar evento de mudança no input de arquivo
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                fileNameDisplay.textContent = file.name;
                
                // Mostrar preview da nova imagem
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentPhotoPreview.src = e.target.result;
                    currentPhotoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
                // Restaurar foto original se cancelar
                if (currentProject && currentProject.imagemUrl) {
                    currentPhotoPreview.src = getProjectImageUrl(currentProject.imagemUrl);
                } else {
                    currentPhotoPreview.style.display = 'none';
                }
            }
        });
    }
}

// CORREÇÃO: Atualizar indicador de status no header
function updateProjectStatusIndicator() {
    if (!currentProject) return;
    
    const statusElement = document.getElementById('project-status');
    if (!statusElement) return;
    
    const status = normalizeProjectStatus(currentProject.status);
    let statusText = '';
    let statusClass = '';
    
    switch(status) {
        case 'PLANEJAMENTO':
            statusText = 'Em Planejamento';
            statusClass = 'status-planning';
            break;
        case 'EM_ANDAMENTO':
            statusText = 'Em Andamento';
            statusClass = 'status-progress';
            break;
        case 'CONCLUIDO':
            statusText = 'Concluído';
            statusClass = 'status-completed';
            break;
        default:
            statusText = status;
            statusClass = 'status-planning';
    }
    
    statusElement.textContent = statusText;
    statusElement.className = `project-status ${statusClass}`;
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
        showLoading("Expulsando membro...");
        
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
    } finally {
        hideLoading();
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
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;
window.isMemberOnline = isMemberOnline;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.setButtonLoading = setButtonLoading;
window.expandMessage = expandMessage;