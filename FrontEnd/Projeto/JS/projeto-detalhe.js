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
    if (!status) return 'Em planejamento';

    const statusMap = {
        'PLANEJAMENTO': 'Em planejamento',
        'EM_ANDAMENTO': 'Em progresso',
        'CONCLUIDO': 'Concluído',
        'Em planejamento': 'Em planejamento',
        'Em progresso': 'Em progresso',
        'Concluído': 'Concluído',
        'Concluido': 'Concluído'
    };

    return statusMap[status] || 'Em planejamento';
}

// CORREÇÃO: Função para normalizar status para o backend
function normalizeStatusForBackend(status) {
    if (!status) return 'Em planejamento';

    const statusMap = {
        'Em planejamento': 'Em planejamento',
        'Em progresso': 'Em progresso',
        'Concluído': 'Concluido',
        'Concluido': 'Concluido'
    };

    return statusMap[status] || 'Em planejamento';
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
        updateMobileInfo(); // NOVO: Atualizar info mobile

        // Renderizar lista de membros
        renderMembersList();

    } catch (error) {
        console.error("Erro ao carregar membros do projeto:", error);
        // Fallback: usar membros que vieram com o projeto
        if (currentProject && currentProject.membros) {
            projectMembers = currentProject.membros.map(normalizeMemberData);
            updateMembersCount();
            updateMobileInfo(); // NOVO: Atualizar info mobile
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
    const solicitacoesBtn = document.getElementById('solicitacoes-btn');
    const mobileSolicitacoesBtn = document.getElementById('mobile-solicitacoes-btn');
    const leaveProjectBtn = document.getElementById('leave-project-btn');
    const deleteProjectBtn = document.getElementById('delete-project-btn');
    const deleteProjectModalBtn = document.getElementById('delete-project-modal-btn');


    const isAdminOrModerator = (userRole === 'ADMIN' || userRole === 'MODERADOR');
    const isAdmin = (userRole === 'ADMIN');
    const isMember = (userRole === 'MEMBRO' || userRole === 'MODERADOR');

    if (settingsBtn) {
        settingsBtn.style.display = isAdminOrModerator ? 'block' : 'none';
        console.log(`[DEBUG] Settings button display: ${settingsBtn.style.display}`);
    }

    if (addMemberBtn) {
        addMemberBtn.style.display = isAdminOrModerator ? 'flex' : 'none'; // Use flex para centralizar o ícone
    }

    if (addMemberBtn) {
        addMemberBtn.style.display = isAdminOrModerator ? 'block' : 'none';
        console.log(`[DEBUG] Add member button display: ${addMemberBtn.style.display}`);
    }

    if (solicitacoesBtn) {
        solicitacoesBtn.style.display = isAdminOrModerator ? 'inline-flex' : 'none';
        console.log(`[DEBUG] Solicitações button display: ${solicitacoesBtn.style.display}`);
    }

    // NOVO: Atualizar botão mobile de solicitações
    if (mobileSolicitacoesBtn) {
        // No CSS mobile-header usa flex, então inline-flex ou flex funciona bem
        mobileSolicitacoesBtn.style.display = isAdminOrModerator ? 'inline-flex' : 'none';
    }

    // CORREÇÃO: Mostrar botão de sair para membros (não admin)
    if (leaveProjectBtn) {
        leaveProjectBtn.style.display = isMember ? 'block' : 'none';
        console.log(`[DEBUG] Leave project button display: ${leaveProjectBtn.style.display}`);
    }

    // CORREÇÃO: Mostrar botão de excluir apenas para admin
    if (deleteProjectBtn) {
        deleteProjectBtn.style.display = isAdmin ? 'block' : 'none';
        console.log(`[DEBUG] Delete project button display: ${deleteProjectBtn.style.display}`);
    }

    if (deleteProjectModalBtn) {
        deleteProjectModalBtn.style.display = isAdmin ? 'block' : 'none';
        console.log(`[DEBUG] Delete project modal button display: ${deleteProjectModalBtn.style.display}`);
    }

    // CORREÇÃO: Forçar re-renderização da lista de membros para mostrar ações
    renderMembersList();
}

// Variáveis globais
let currentPage = 0;
let totalPages = 0;
let isLoadingHistory = false; // Para evitar múltiplas chamadas ao rolar
const pageSize = 20; // Deve ser igual ao padrão do backend
let currentProject = null;
let projectMembers = [];
let projectMessages = [];
let currentUser = null;
let stompClient = null;
let projectId = null;
let userRole = null;
let selectedFiles = [];
const backendUrl = "https://senaicommunityapp.up.railway.app";
const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    initializeTheme();
    initializePage();
    setupEventListeners();
    setupMobileNavigation(); // NOVA FUNÇÃO PARA NAVEGAÇÃO MOBILE
});

// NOVA FUNÇÃO: Configurar navegação mobile
function setupMobileNavigation() {
    const menuToggle = document.querySelector('.menu-toggle.mobile-only');
    const sidebar = document.getElementById('members-sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const sidebarClose = document.getElementById('sidebar-close');

    if (menuToggle && sidebar && overlay && sidebarClose) {
        menuToggle.addEventListener('click', toggleMobileSidebar);
        sidebarClose.addEventListener('click', toggleMobileSidebar);
        overlay.addEventListener('click', toggleMobileSidebar);
    }
}

// NOVA FUNÇÃO: Alternar sidebar no mobile
function toggleMobileSidebar() {
    const sidebar = document.getElementById('members-sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (sidebar && overlay) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');

        // Impedir rolagem do body quando a sidebar estiver aberta
        if (sidebar.classList.contains('mobile-open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// NOVA FUNÇÃO: Atualizar informações para mobile
function updateMobileInfo() {
    if (!currentProject) return;

    document.getElementById('mobile-project-name').textContent = currentProject.titulo;

    // Atualizar contador online para mobile
    if (projectMembers && projectMembers.length > 0) {
        const onlineMembers = projectMembers.filter(isMemberOnline).length;
        document.getElementById('mobile-online-count').textContent = `${onlineMembers} online`;
    }
}

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
        updateMobileInfo(); // NOVO: Atualizar info mobile
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
            updateMobileInfo(); // NOVO: Atualizar info mobile
            renderMembersList();
        }
    }
}

// Função de segurança para validar acesso
function validateAccess() {
    if (!currentProject || !currentUser) return;

    const isAuthor = currentProject.autorId === currentUser.id;

    // Verifica na lista de membros carregada
    const isMember = projectMembers.some(m => {
        const id = m.usuarioId || m.id;
        return id === currentUser.id;
    });

    if (!isAuthor && !isMember) {
        alert("Acesso negado: Você precisa entrar neste projeto para visualizar os detalhes e o chat.");
        window.location.href = "projeto.html"; // Redireciona de volta
    }
}

function isMemberOnline(member) {
    // OTIMIZAÇÃO VISUAL: Se for o próprio usuário logado, sempre retorne true imediatamente
    // Isso remove a sensação de atraso para o próprio perfil
    if (currentUser && (member.id === currentUser.id || member.usuarioId === currentUser.id)) {
        return true;
    }

    // Se a lista global ainda não existe, ninguém está online
    if (!window.latestOnlineEmails || !Array.isArray(window.latestOnlineEmails)) return false;

    // Pega o email do membro
    const memberEmail = (member.email || member.usuarioEmail || "").toLowerCase();

    if (!memberEmail) return false;

    // Verifica se o email está na lista
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
        window.fetchOnlineStatusInterval = setInterval(fetchOnlineStatus, 30000); // Atualizar a cada 30 segundos

        // CORREÇÃO: Forçar verificação inicial de função
        setTimeout(() => {
            checkUserRole();
        }, 1000);

        // NOVO: Configurar melhorias mobile
        setupMobileModals();
        setupMobileMessageInput();
        setupMobilePerformance();

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

        validateAccess();

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

    const videoContainer = document.getElementById('project-video-container');
    const videoPlayer = document.getElementById('project-video-player');

    if (videoContainer && videoPlayer) {
        if (currentProject.videoDescricaoUrl) {
            // Verifica se é URL completa ou relativa
            let videoUrl = currentProject.videoDescricaoUrl;
            if (!videoUrl.startsWith('http')) {
                videoUrl = `${backendUrl}/api/arquivos/${videoUrl}`;
            }

            videoPlayer.src = videoUrl;
            videoContainer.style.display = 'block';
        } else {
            videoPlayer.pause();
            videoPlayer.src = "";
            videoContainer.style.display = 'none';
        }
    }

    // Atualizar modal
    document.getElementById('modal-project-name').textContent = currentProject.titulo;
    document.getElementById('modal-project-description').textContent = currentProject.descricao || "Sem descrição";
    document.getElementById('modal-project-privacy').textContent = currentProject.grupoPrivado ? "Privado" : "Público";

    // NOVO: Atualizar informações mobile
    updateMobileInfo();

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
    if (membersList) membersList.innerHTML = '';
    if (membersListModal) membersListModal.innerHTML = '';

    if (!projectMembers || projectMembers.length === 0) {
        if (membersList) membersList.innerHTML = '<p class="empty-state">Nenhum membro</p>';
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
        if (membersList) membersList.appendChild(memberElement);

        if (membersListModal) {
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

    // NOVO: Adicionar evento de clique para mobile
    if (window.innerWidth <= 768) {
        memberItem.style.cursor = 'pointer';
        memberItem.addEventListener('click', function () {
            // Fechar sidebar após um curto delay para feedback visual
            setTimeout(toggleMobileSidebar, 300);
        });
    }

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
// CORREÇÃO: Carregar mensagens iniciais (Página 0)
async function loadProjectMessages() {
    try {
        // Resetar variáveis
        currentPage = 0;
        projectMessages = []; 
        
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) messagesContainer.innerHTML = '';
        
        showLoading("Carregando mensagens...");

        // Nota: O backend deve retornar ordenado por data DESC (mais recentes primeiro)
        const response = await axios.get(`${backendUrl}/api/mensagens/grupo/projeto/${projectId}`, {
            params: {
                page: 0,
                size: pageSize
            }
        });

        const data = response.data;
        
        // O Spring Page retorna { content: [], totalPages: N, ... }
        // Se o backend retornar lista direta, usamos data, senão data.content
        const newMessages = data.content ? data.content : data;
        totalPages = data.totalPages || 1;

        // Normaliza e inverte para ordem cronológica (antigas no topo, novas embaixo)
        projectMessages = newMessages.map(normalizeMessageData).reverse();

        // Renderizar mensagens iniciais
        renderMessages(true); // true = scroll to bottom

    } catch (error) {
        console.error("Erro ao carregar mensagens do projeto:", error);
        document.getElementById('messages-container').innerHTML = '<p class="empty-state">Erro ao carregar mensagens</p>';
    } finally {
        hideLoading();
    }
}

// NOVO: Carregar mensagens antigas (Paginação)
async function loadMoreMessages() {
    if (isLoadingHistory || currentPage >= totalPages - 1) return;

    isLoadingHistory = true;
    const messagesContainer = document.getElementById('messages-container');
    
    // Guardar altura do scroll antes de carregar para manter a posição visual
    const previousHeight = messagesContainer.scrollHeight;
    const previousScrollTop = messagesContainer.scrollTop;

    // Mostrar indicador de loading no topo (opcional)
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'history-loading';
    loadingIndicator.innerHTML = '<div class="loading-spinner small"></div>';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.padding = '10px';
    messagesContainer.prepend(loadingIndicator);

    try {
        const nextPage = currentPage + 1;
        
        const response = await axios.get(`${backendUrl}/api/mensagens/grupo/projeto/${projectId}`, {
            params: {
                page: nextPage,
                size: pageSize
            }
        });

        const data = response.data;
        const newMessagesRaw = data.content ? data.content : data;
        
        if (newMessagesRaw.length > 0) {
            currentPage = nextPage; // Confirma a mudança de página
            
            // Normalizar e inverter (pois o backend manda DESC, queremos ASC na tela)
            const olderMessages = newMessagesRaw.map(normalizeMessageData).reverse();
            
            // Adicionar ao INÍCIO da lista global
            projectMessages = [...olderMessages, ...projectMessages];

            // Renderizar APENAS as novas mensagens antigas no topo
            loadingIndicator.remove(); // Remove o loader
            prependMessagesToUI(olderMessages);

            // Ajustar o scroll para o usuário não perder a posição
            // Nova altura - Altura antiga = Quanto o conteúdo cresceu para cima
            messagesContainer.scrollTop = messagesContainer.scrollHeight - previousHeight;
        } else {
            loadingIndicator.remove();
        }

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        if(loadingIndicator) loadingIndicator.remove();
        showNotification("Erro ao carregar mensagens antigas", "error");
    } finally {
        isLoadingHistory = false;
    }
}

function prependMessagesToUI(messages) {
    const messagesContainer = document.getElementById('messages-container');
    
    // Criar um fragmento para melhor performance
    const fragment = document.createDocumentFragment();

    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        if (messageElement) {
            fragment.appendChild(messageElement);
        }
    });

    // Inserir antes do primeiro filho atual
    messagesContainer.insertBefore(fragment, messagesContainer.firstChild);
    
    // Configurar eventos de hover nas novas mensagens
    setupMessageHover();
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

        // NOVO: Feedback visual melhor para mobile
        if (window.innerWidth <= 768) {
            button.style.opacity = '0.7';
        }
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;

        if (window.innerWidth <= 768) {
            button.style.opacity = '1';
        }
    }
}

// CORREÇÃO: Função MELHORADA para processar conteúdo da mensagem
function processMessageContent(content) {
    if (!content) return '';

    // Sanitizar conteúdo e manter quebras de linha
    let processedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

    // Limite de caracteres para truncar
    const maxLength = 350; // Aumentei um pouco para não cortar mensagens médias

    if (content.length > maxLength) {
        // Criar versão curta
        const truncatedText = content.substring(0, maxLength);
        const truncatedWithBreaks = truncatedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        return `
            <div class="message-text-wrapper">
                <span class="truncated-content">${truncatedWithBreaks}...</span>
                <span class="full-content" style="display: none;">${processedContent}</span>
                
                <button type="button" class="show-more-btn" onclick="expandMessage(this)">
                    <span>Ver mais</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        `;
    }

    // Retorna conteúdo normal se for pequeno
    return processedContent;
}

// CORREÇÃO: Função para expandir/recolher mensagem
function expandMessage(button) {
    // Encontrar o wrapper pai
    const wrapper = button.parentElement;
    const truncatedContent = wrapper.querySelector('.truncated-content');
    const fullContent = wrapper.querySelector('.full-content');
    const btnText = button.querySelector('span');
    const btnIcon = button.querySelector('i');

    if (truncatedContent && fullContent) {
        if (truncatedContent.style.display !== 'none') {
            // AÇÃO: EXPANDIR
            truncatedContent.style.display = 'none';
            fullContent.style.display = 'inline'; // ou block
            fullContent.style.animation = 'fadeIn 0.3s ease';

            // Atualizar botão
            btnText.textContent = 'Ver menos';
            button.classList.add('expanded'); // Para girar o ícone via CSS
        } else {
            // AÇÃO: RECOLHER
            truncatedContent.style.display = 'inline'; // ou block
            fullContent.style.display = 'none';

            // Atualizar botão
            btnText.textContent = 'Ver mais';
            button.classList.remove('expanded');
        }
    }
}

// Renderizar mensagens
// ATUALIZAÇÃO: Renderizar mensagens (simplificada)
function renderMessages(shouldScrollToBottom = false) {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';

    if (projectMessages.length === 0) {
        messagesContainer.innerHTML = '<p class="empty-state">Nenhuma mensagem no projeto</p>';
        return;
    }

    // Renderizar todas as mensagens atuais da memória
    projectMessages.forEach(message => {
        const messageElement = createMessageElement(message);
        if (messageElement) {
            messagesContainer.appendChild(messageElement);
        }
    });

    if (shouldScrollToBottom) {
        scrollToBottom();
    }
    
    setupMessageHover();
}

// CORREÇÃO: Função MELHORADA para criar elemento de mensagem
function createMessageElement(message) {
    if (!message) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.autorId === currentUser.id ? 'own' : ''}`;
    messageDiv.id = `message-${message.id}`;

    // CORREÇÃO: Estilo para prevenir quebra de layout
    messageDiv.style.cssText = `
        display: flex;
        gap: 0.5rem;
        max-width: ${window.innerWidth <= 768 ? '90%' : '75%'};
        width: fit-content;
        word-wrap: break-word;
        overflow-wrap: break-word;
        align-items: flex-start;
        margin-bottom: 0.5rem;
        position: relative;
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
            const safeMediaUrl = mediaUrl.replace(/'/g, "\\'").replace(/"/g, '&quot;');

            if (mediaType === 'image') {
                return `
                <div class="message-file" style="margin-top: 6px; max-width: 100%;">
                    <img src="${safeMediaUrl}" alt="Imagem" 
                         onload="this.style.opacity='1'" 
                         onerror="this.style.display='none'"
                         style="opacity:0; transition: opacity 0.3s; cursor: pointer; max-width: 100%; max-height: 200px; border-radius: 6px;"
                         onclick="openMediaModal('${safeMediaUrl}', 'image')">
                </div>`;
            } else if (mediaType === 'video') {
                return `
                <div class="message-file" style="margin-top: 6px; max-width: 100%;">
                    <video controls src="${safeMediaUrl}" 
                           style="max-width: 100%; max-height: 200px; border-radius: 6px;"
                           onerror="console.error('Erro ao carregar vídeo: ${safeMediaUrl}')">
                        Seu navegador não suporta o elemento de vídeo.
                    </video>
                </div>`;
            } else {
                const fileName = (anexo.name || mediaUrl.split('/').pop() || 'Arquivo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `
                <div class="message-file" style="margin-top: 6px; max-width: 100%;">
                    <a href="${safeMediaUrl}" target="_blank" class="message-file-document" download style="text-decoration: none; color: inherit; padding: 6px; font-size: 0.8rem;">
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
            <img src="${messageAvatar}" alt="${message.nomeAutor || 'Usuário'}" onerror="this.src='${defaultAvatarUrl}'" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
        </div>
        <div class="message-content" style="flex: 1; min-width: 0; max-width: 100%; position: relative;">
            <div class="message-header" style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.1rem;">
                <span class="message-sender" style="font-size: 0.8rem; font-weight: 600;">${message.nomeAutor || 'Usuário'}</span>
                <span class="message-time" style="font-size: 0.65rem; color: var(--text-secondary);">${messageTime}</span>
            </div>
            ${messageContent ? `
            <div class="message-bubble" style="
                padding: 0.5rem 0.75rem; 
                border-radius: 16px; 
                background-color: ${message.autorId === currentUser.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)'}; 
                color: ${message.autorId === currentUser.id ? 'white' : 'var(--text-primary)'};
                font-size: 0.875rem; 
                line-height: 1.3; 
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

// CORREÇÃO: Adicionar evento para mostrar ações ao passar o mouse
function setupMessageHover() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        // Usamos delegação de eventos para lidar com mensagens dinâmicas
        messagesContainer.addEventListener('mouseover', function (e) {
            const message = e.target.closest('.message');
            if (message) {
                const actions = message.querySelector('.message-actions');
                if (actions) {
                    actions.style.display = 'flex';
                }
            }
        });

        messagesContainer.addEventListener('mouseout', function (e) {
            const message = e.target.closest('.message');
            if (message && !message.matches(':hover')) {
                const actions = message.querySelector('.message-actions');
                if (actions) {
                    actions.style.display = 'none';
                }
            }
        });
    }
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
    stompClient.debug = null; // Desativa logs excessivos

    const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    };

    stompClient.connect(headers, (frame) => {
        console.log("Conectado ao WebSocket!");

        // CORREÇÃO: Força uma busca inicial de online assim que conecta
        fetchOnlineStatus();

        // Inscrever-se para mensagens do chat E EVENTOS DE SISTEMA
        stompClient.subscribe(`/topic/grupo/${projectId}`, (message) => {
            const newMessage = JSON.parse(message.body);

            // LÓGICA PARA EVENTOS DE SISTEMA (Atualização em Tempo Real)
            if (newMessage.tipo === 'projeto_atualizado') {
                console.log("Recebido evento de atualização do projeto");
                loadProjectData(); // Recarrega tudo (info + foto + status)
                return;
            }

            if (newMessage.tipo === 'membros_atualizados') {
                console.log("Recebido evento de atualização de membros");
                loadProjectMembers(); // Recarrega apenas a lista de membros e permissões
                return;
            }

            if (newMessage.tipo === 'projeto_removido') {
                alert("Este projeto foi excluído.");
                window.location.href = 'projeto.html';
                return;
            }

            // Se não for evento de sistema, é mensagem de chat normal
            if (!newMessage.tipo || newMessage.tipo === 'status') {
                // Verifica se não é uma mensagem duplicada (opcional, mas bom ter)
                if (!projectMessages.some(msg => msg.id === newMessage.id)) {
                    handleNewMessage(newMessage);
                }
            }
        });

        // Inscrever-se para Status Online GLOBAL
        stompClient.subscribe("/topic/status", (message) => {
            const onlineEmails = JSON.parse(message.body);
            window.latestOnlineEmails = onlineEmails;
            updateMembersCount();
            updateMobileInfo(); // NOVO: Atualizar info mobile
            renderMembersList();
        });

        // Inscrever-se para erros
        stompClient.subscribe('/user/queue/errors', (message) => {
            showNotification(message.body, 'error');
        });

    }, (error) => {
        console.error("Erro na conexão WebSocket:", error);
        // Tenta reconectar em 5 segundos
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
    // Normalizar a mensagem recebida do socket, se necessário
    const normalizedMsg = normalizeMessageData(message);

    // Evitar duplicatas
    if (projectMessages.some(m => m.id === normalizedMsg.id)) return;

    projectMessages.push(normalizedMsg);

    const messageElement = createMessageElement(normalizedMsg);
    if (messageElement) {
        document.getElementById('messages-container').appendChild(messageElement);
    }

    scrollToBottom();
    setupMessageHover(); // Reaplicar listeners de hover
}

// NOVO: Atualizar função de rolagem para mobile
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        // Suavizar rolagem no mobile
        const behavior = window.innerWidth <= 768 ? 'smooth' : 'auto';
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: behavior
        });
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
        <div class="modal-content" style="max-width: ${window.innerWidth <= 768 ? '90%' : '500px'};">
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

        // Fazer upload dos arquivos se houver
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
        emojiBtn.addEventListener('click', function () {
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
        <div class="modal-content" style="max-width: ${window.innerWidth <= 768 ? '90%' : '400px'};">
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
    // Listener para o botão de solicitações MOBILE
    const mobileSolicitacoesBtn = document.getElementById('mobile-solicitacoes-btn');
    if (mobileSolicitacoesBtn) {
        mobileSolicitacoesBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Previne comportamentos padrão
            console.log("Abrindo solicitações mobile...");
            openSolicitacoesModal();
        });
    }

    // Detectar scroll para carregar histórico
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.addEventListener('scroll', function() {
            // Se o scroll estiver próximo do topo (ex: 50px) e não estiver carregando
            if (this.scrollTop < 50 && !isLoadingHistory) {
                loadMoreMessages();
            }
        });
    }

    // Envio de mensagem
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    if (messageInput && sendBtn) {
        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        sendBtn.addEventListener('click', sendMessage);
    }

    const addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) {
        // Remove listeners antigos para evitar duplicidade (opcional, mas boa prática)
        const newBtn = addMemberBtn.cloneNode(true);
        addMemberBtn.parentNode.replaceChild(newBtn, addMemberBtn);

        newBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openAddMemberModal(); // Chama a função que já existe no seu código
        });
    }

    // Anexar arquivo
    const attachFileBtn = document.getElementById('attach-file-btn');
    const mobileAttachFileBtn = document.getElementById('mobile-attach-file-btn');
    const fileInput = document.getElementById('file-input');

    if (attachFileBtn && fileInput) {
        attachFileBtn.addEventListener('click', function () {
            fileInput.click();
        });
    }

    if (mobileAttachFileBtn && fileInput) {
        mobileAttachFileBtn.addEventListener('click', function () {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Modal de informações do projeto
    const projectInfoBtn = document.getElementById('project-info-btn');
    const closeProjectInfoModal = document.getElementById('close-project-info-modal');
    const projectInfoModal = document.getElementById('project-info-modal');

    if (projectInfoBtn) {
        projectInfoBtn.addEventListener('click', function () {
            projectInfoModal.style.display = 'flex';
        });
    }

    if (closeProjectInfoModal) {
        closeProjectInfoModal.addEventListener('click', function () {
            projectInfoModal.style.display = 'none';
        });
    }

    // Fechar modal ao clicar fora
    if (projectInfoModal) {
        projectInfoModal.addEventListener('click', function (e) {
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
        projectSettingsBtn.addEventListener('click', function () {
            openProjectSettingsModal();
        });
    }

    if (closeProjectSettingsModal) {
        closeProjectSettingsModal.addEventListener('click', function () {
            projectSettingsModal.style.display = 'none';
        });
    }

    if (cancelProjectSettingsBtn) {
        cancelProjectSettingsBtn.addEventListener('click', function () {
            projectSettingsModal.style.display = 'none';
        });
    }

    // Fechar modal de configurações ao clicar fora
    if (projectSettingsModal) {
        projectSettingsModal.addEventListener('click', function (e) {
            if (e.target === projectSettingsModal) {
                projectSettingsModal.style.display = 'none';
            }
        });
    }

    // Formulário de configurações do projeto
    const projectSettingsForm = document.getElementById('project-settings-form');
    if (projectSettingsForm) {
        projectSettingsForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await updateProjectSettings();
        });
    }

    // Buscar membros
    const searchMembersInput = document.getElementById('search-members');
    if (searchMembersInput) {
        searchMembersInput.addEventListener('input', filterMembers);
    }

    // CORREÇÃO: Configurar emoji picker
    setupEmojiPicker();

    // CORREÇÃO: Adicionar botão de adicionar membro se não existir
    setupAddMemberButton();

    // CORREÇÃO: Adicionar botão de solicitações se não existir
    setupSolicitacoesButton();

    // NOVO: Botão de sair do projeto
    const leaveProjectBtn = document.getElementById('leave-project-btn');
    if (leaveProjectBtn) {
        leaveProjectBtn.addEventListener('click', leaveProject);
    }

    // NOVO: Botão de excluir projeto (sidebar)
    const deleteProjectBtn = document.getElementById('delete-project-btn');
    if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener('click', deleteProject);
    }

    // NOVO: Botão de excluir projeto (modal)
    const deleteProjectModalBtn = document.getElementById('delete-project-modal-btn');
    if (deleteProjectModalBtn) {
        deleteProjectModalBtn.addEventListener('click', deleteProject);
    }

    // NOVO: Ajustar altura do chat no mobile
    function adjustChatHeight() {
        if (window.innerWidth <= 768) {
            const topbarHeight = document.querySelector('.topbar').offsetHeight;
            const mobileHeaderHeight = document.querySelector('.mobile-header').offsetHeight;
            const inputAreaHeight = document.querySelector('.message-input-area').offsetHeight;

            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                const availableHeight = window.innerHeight - topbarHeight - mobileHeaderHeight - inputAreaHeight - 20;
                messagesContainer.style.height = `${availableHeight}px`;
                messagesContainer.style.overflowY = 'auto';
            }
        }
    }

    // Ajustar altura inicial e em redimensionamentos
    adjustChatHeight();
    window.addEventListener('resize', adjustChatHeight);
}

// NOVA FUNÇÃO: Configurar modais para mobile
function setupMobileModals() {
    // Ajustar todos os modais para serem responsivos
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => {
        modal.style.maxWidth = '95%';
        modal.style.margin = '1rem';
    });

    // Ajustar altura máxima dos modais no mobile
    if (window.innerWidth <= 768) {
        const modalBodies = document.querySelectorAll('.modal-body');
        modalBodies.forEach(body => {
            body.style.maxHeight = '60vh';
            body.style.overflowY = 'auto';
        });
    }
}

// NOVA FUNÇÃO: Configurar input de mensagem para mobile
function setupMobileMessageInput() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    // Ajustar foco no input no mobile
    messageInput.addEventListener('focus', function () {
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    });

    // Prevenir zoom indesejado no iOS
    messageInput.addEventListener('touchstart', function () {
        this.style.fontSize = '16px';
    });
}

// NOVA FUNÇÃO: Otimizar performance no mobile
function setupMobilePerformance() {
    if (window.innerWidth <= 768) {
        // Reduzir polling no mobile para economizar bateria
        if (window.fetchOnlineStatusInterval) {
            clearInterval(window.fetchOnlineStatusInterval);
            window.fetchOnlineStatusInterval = setInterval(fetchOnlineStatus, 60000); // 1 minuto
        }
    }
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

        addMemberBtn.addEventListener('click', function () {
            openAddMemberModal();
        });

        membersHeader.appendChild(addMemberBtn);
    }
}

// CORREÇÃO: Configurar botão de solicitações
function setupSolicitacoesButton() {
    const chatActions = document.querySelector('.chat-actions');
    let solicitacoesBtn = document.getElementById('solicitacoes-btn');

    // 1. Se o botão NÃO existir no HTML, cria ele dinamicamente
    if (!solicitacoesBtn && chatActions) {
        solicitacoesBtn = document.createElement('button');
        solicitacoesBtn.id = 'solicitacoes-btn';
        solicitacoesBtn.className = 'action-btn';
        solicitacoesBtn.innerHTML = '<i class="fas fa-user-clock"></i>';
        solicitacoesBtn.setAttribute('data-tooltip', 'Solicitações de entrada');
        solicitacoesBtn.style.display = 'none'; // Começa invisível
        chatActions.appendChild(solicitacoesBtn);
    }


    if (solicitacoesBtn) {

        const newBtn = solicitacoesBtn.cloneNode(true);
        solicitacoesBtn.parentNode.replaceChild(newBtn, solicitacoesBtn);
        solicitacoesBtn = newBtn; // Atualiza a referência

        solicitacoesBtn.addEventListener('click', function () {
            console.log("Botão de solicitações clicado!"); // Debug para confirmar
            openSolicitacoesModal();
        });

        if (currentUser && currentProject) {
            checkUserRole();
        }
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

    closeBtn.addEventListener('click', function () {
        modalOverlay.remove();
    });

    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });

    // Configurar busca de usuários
    let searchTimeout;
    searchInput.addEventListener('input', function () {
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

        /* No arquivo projeto-detalhe.js, dentro da função searchUsers */

        availableUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-search-result';

            // --- CORREÇÃO AQUI: Lógica robusta para imagem do usuário ---
            let userAvatar = defaultAvatarUrl;

            // Verifica se existe alguma propriedade de foto
            const rawPhoto = user.urlFotoPerfil || user.fotoPerfil || user.foto;

            if (rawPhoto) {
                if (rawPhoto.startsWith('http')) {
                    userAvatar = rawPhoto;
                } else if (rawPhoto.startsWith('/')) {
                    userAvatar = `${backendUrl}${rawPhoto}`;
                } else {
                    // Se for apenas o nome do arquivo, adiciona o caminho da API
                    userAvatar = `${backendUrl}/api/arquivos/${rawPhoto}`;
                }
            }
            // -----------------------------------------------------------

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
        statusSelect.value = normalizeProjectStatus(currentProject.status);
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

    // LÓGICA DE VÍDEO
    const videoInput = document.getElementById('edit-project-video');
    const videoPreview = document.getElementById('edit-video-preview');
    const videoContainer = document.getElementById('edit-video-preview-container');
    const videoNameDisplay = document.getElementById('edit-video-name');

    // 1. Resetar input de arquivo
    if (videoInput) videoInput.value = '';

    // 2. Verificar se já existe vídeo no Backend para mostrar
    if (videoPreview && videoContainer) {
        if (currentProject.videoDescricaoUrl) {
            let videoUrl = currentProject.videoDescricaoUrl;
            // Ajustar URL se for relativa
            if (!videoUrl.startsWith('http')) {
                videoUrl = `${backendUrl}/api/arquivos/${videoUrl}`;
            }
            videoPreview.src = videoUrl;
            videoContainer.style.display = 'block';
            if (videoNameDisplay) videoNameDisplay.textContent = "Vídeo atual carregado";
        } else {
            videoPreview.src = "";
            videoContainer.style.display = 'none';
            if (videoNameDisplay) videoNameDisplay.textContent = "Nenhum vídeo configurado";
        }
    }

    // 3. Configurar o Listener de TROCA de arquivo (Preview instantâneo)
    if (videoInput) {
        // Clonar para remover listeners antigos e evitar duplicação
        const newVideoInput = videoInput.cloneNode(true);
        videoInput.parentNode.replaceChild(newVideoInput, videoInput);

        newVideoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];

            if (file) {
                // Usuário selecionou um novo vídeo -> Mostra o preview dele
                const fileUrl = URL.createObjectURL(file);
                videoPreview.src = fileUrl;
                videoContainer.style.display = 'block';
                videoPreview.load(); // Força carregamento da capa

                if (videoNameDisplay) videoNameDisplay.textContent = `Novo: ${file.name}`;
            } else {
                // Usuário cancelou a seleção -> Volta para o vídeo original (se houver) ou limpa
                if (currentProject.videoDescricaoUrl) {
                    let videoUrl = currentProject.videoDescricaoUrl;
                    if (!videoUrl.startsWith('http')) videoUrl = `${backendUrl}/api/arquivos/${videoUrl}`;

                    videoPreview.src = videoUrl;
                    videoContainer.style.display = 'block';
                    if (videoNameDisplay) videoNameDisplay.textContent = "Vídeo atual mantido";
                } else {
                    videoPreview.src = "";
                    videoContainer.style.display = 'none';
                    if (videoNameDisplay) videoNameDisplay.textContent = "Nenhum arquivo selecionado";
                }
            }
        });
    }

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

        // CORREÇÃO: Adicionar status normalizado para o backend
        const statusSelect = document.getElementById('edit-project-status');
        if (statusSelect) {
            formData.append('status', normalizeStatusForBackend(statusSelect.value));
        }

        // CORREÇÃO: Adicionar foto se houver uma nova
        const photoInput = document.getElementById('edit-project-photo');
        if (photoInput && photoInput.files[0]) {
            formData.append('foto', photoInput.files[0]);
        }

        const videoInput = document.getElementById('edit-project-video');
        const MAX_SIZE = 100 * 1024 * 1024; // 100MB

        if (videoInput && videoInput.files[0]) {
            // VALIDAÇÃO
            if (videoInput.files[0].size > MAX_SIZE) {
                window.showNotification("O vídeo selecionado excede o limite de 100MB.", "error");
                hideLoading(); // Importante esconder o loading que foi ativado no início
                return; // Cancela o envio
            }

            formData.append('videoDescricao', videoInput.files[0]);
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
        photoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                fileNameDisplay.textContent = file.name;

                // Mostrar preview da nova imagem
                const reader = new FileReader();
                reader.onload = function (e) {
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

    switch (status) {
        case 'Em planejamento':
            statusText = 'Em Planejamento';
            statusClass = 'status-planning';
            break;
        case 'Em progresso':
            statusText = 'Em Progresso';
            statusClass = 'status-progress';
            break;
        case 'Concluído':
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

// NOVA FUNÇÃO: Abrir modal de solicitações de entrada
function openSolicitacoesModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'solicitacoes-modal';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'flex';

    modalOverlay.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h3>Solicitações de Entrada</h3>
            <button class="close-modal" id="close-solicitacoes-modal">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body"> <div id="solicitacoes-list" class="solicitacoes-list">
                <p class="empty-state">Carregando solicitações...</p>
            </div>
        </div>
    </div>
`;

    document.body.appendChild(modalOverlay);

    // Configurar eventos do modal
    const closeBtn = document.getElementById('close-solicitacoes-modal');
    closeBtn.addEventListener('click', function () {
        modalOverlay.remove();
    });

    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });

    // Carregar solicitações
    loadSolicitacoes();
}


async function loadSolicitacoes() {
    try {
        const solicitacoesList = document.getElementById('solicitacoes-list');
        if (!solicitacoesList) return;

        solicitacoesList.innerHTML = '<div style="text-align:center"><div class="loading-spinner"></div></div>';

        const response = await axios.get(`${backendUrl}/projetos/${projectId}/solicitacoes?usuarioId=${currentUser.id}`);
        const solicitacoes = response.data;

        solicitacoesList.innerHTML = '';

        if (solicitacoes.length === 0) {
            solicitacoesList.innerHTML = '<p class="empty-state">Nenhuma solicitação pendente</p>';
            return;
        }

        solicitacoes.forEach(solicitacao => {
            const solicitacaoElement = document.createElement('div');
            solicitacaoElement.className = 'solicitacao-item';

            // Lógica de Avatar robusta (igual à usada nos membros)
            let userAvatar = defaultAvatarUrl;
            if (solicitacao.usuarioFoto) {
                if (solicitacao.usuarioFoto.startsWith('http')) {
                    userAvatar = solicitacao.usuarioFoto;
                } else {
                    // Garante que não duplique barras ou falte barras
                    const path = solicitacao.usuarioFoto.startsWith('/') ? solicitacao.usuarioFoto : `/${solicitacao.usuarioFoto}`;
                    userAvatar = `${backendUrl}/api/arquivos${path}`;
                    // Nota: Ajuste o caminho '/api/arquivos' conforme sua rota real de imagens se for diferente
                    if (solicitacao.usuarioFoto.startsWith('/images/')) {
                        userAvatar = `${backendUrl}${solicitacao.usuarioFoto}`;
                    }
                }
            }

            solicitacaoElement.innerHTML = `
                <div class="solicitacao-user">
                    <img src="${userAvatar}" alt="${solicitacao.usuarioNome}" onerror="this.src='${defaultAvatarUrl}'">
                    <div class="solicitacao-user-info">
                        <div class="solicitacao-user-name">${solicitacao.usuarioNome}</div>
                        <div class="solicitacao-user-email">${solicitacao.usuarioEmail}</div>
                        <div class="solicitacao-data">${new Date(solicitacao.dataSolicitacao).toLocaleString('pt-BR')}</div>
                    </div>
                </div>
                <div class="solicitacao-actions">
                    <button class="btn btn-primary" onclick="aceitarSolicitacao(${solicitacao.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Aceitar</button>
                    <button class="btn btn-danger" onclick="recusarSolicitacao(${solicitacao.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Recusar</button>
                </div>
            `;
            solicitacoesList.appendChild(solicitacaoElement);
        });

    } catch (error) {
        console.error("Erro ao carregar solicitações:", error);
        const list = document.getElementById('solicitacoes-list');
        if (list) list.innerHTML = '<p class="empty-state" style="color: var(--danger)">Erro ao carregar solicitações. Verifique se você tem permissão de administrador.</p>';
    }
}

// NOVA FUNÇÃO: Aceitar solicitação
async function aceitarSolicitacao(solicitacaoId) {
    try {
        showLoading("Aceitando solicitação...");

        await axios.post(`${backendUrl}/projetos/solicitacoes/${solicitacaoId}/aprovar?usuarioId=${currentUser.id}`);

        showNotification("Solicitação aceita com sucesso", "success");

        // Recarregar a lista de solicitações
        loadSolicitacoes();

        // Recarregar membros do projeto
        await loadProjectMembers();

    } catch (error) {
        console.error("Erro ao aceitar solicitação:", error);

        let errorMessage = "Erro ao aceitar solicitação";
        if (error.response && error.response.data) {
            errorMessage = error.response.data;
        }

        showNotification(errorMessage, "error");
    } finally {
        hideLoading();
    }
}

// NOVA FUNÇÃO: Recusar solicitação
async function recusarSolicitacao(solicitacaoId) {
    try {
        showLoading("Recusando solicitação...");

        await axios.post(`${backendUrl}/projetos/solicitacoes/${solicitacaoId}/recusar?usuarioId=${currentUser.id}`);

        showNotification("Solicitação recusada com sucesso", "success");

        // Recarregar a lista de solicitações
        loadSolicitacoes();

    } catch (error) {
        console.error("Erro ao recusar solicitação:", error);

        let errorMessage = "Erro ao recusar solicitação";
        if (error.response && error.response.data) {
            errorMessage = error.response.data;
        }

        showNotification(errorMessage, "error");
    } finally {
        hideLoading();
    }
}

// NOVA FUNÇÃO: Sair do projeto
async function leaveProject() {
    if (!confirm("Tem certeza que deseja sair deste projeto?")) {
        return;
    }

    try {
        showLoading("Saindo do projeto...");

        await axios.delete(`${backendUrl}/projetos/${projectId}/sair`, {
            params: {
                usuarioId: currentUser.id
            }
        });

        showNotification("Você saiu do projeto com sucesso", "success");

        // Redirecionar para a página de projetos
        setTimeout(() => {
            window.location.href = "projeto.html";
        }, 1500);

    } catch (error) {
        console.error("Erro ao sair do projeto:", error);

        let errorMessage = "Erro ao sair do projeto";
        if (error.response && error.response.data) {
            errorMessage = error.response.data;
        }

        showNotification(errorMessage, "error");
    } finally {
        hideLoading();
    }
}

// NOVA FUNÇÃO: Excluir projeto (apenas para admin)
async function deleteProject() {
    if (!confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e todos os membros serão removidos.")) {
        return;
    }

    try {
        showLoading("Excluindo projeto...");

        await axios.delete(`${backendUrl}/projetos/${projectId}/info`, {
            params: {
                adminId: currentUser.id
            }
        });

        showNotification("Projeto excluído com sucesso", "success");

        // Redirecionar para a página de projetos
        setTimeout(() => {
            window.location.href = "projeto.html";
        }, 1500);

    } catch (error) {
        console.error("Erro ao excluir projeto:", error);

        let errorMessage = "Erro ao excluir projeto";
        if (error.response && error.response.data) {
            errorMessage = error.response.data;
        }

        showNotification(errorMessage, "error");
    } finally {
        hideLoading();
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
            reader.onload = function (e) {
                filePreview.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-file-btn" data-file-index="${i}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                // Adicionar evento para remover arquivo
                filePreview.querySelector('.remove-file-btn').addEventListener('click', function () {
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
            filePreview.querySelector('.remove-file-btn').addEventListener('click', function () {
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
            reader.onload = function (e) {
                filePreview.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-file-btn" data-file-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                filePreview.querySelector('.remove-file-btn').addEventListener('click', function () {
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

            filePreview.querySelector('.remove-file-btn').addEventListener('click', function () {
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
window.aceitarSolicitacao = aceitarSolicitacao;
window.recusarSolicitacao = recusarSolicitacao;
window.leaveProject = leaveProject;
window.deleteProject = deleteProject;
window.toggleMobileSidebar = toggleMobileSidebar;