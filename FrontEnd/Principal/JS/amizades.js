document.addEventListener("DOMContentLoaded", () => {
    
    // -----------------------------------------------------------------
    // AGUARDA O SCRIPT PRINCIPAL
    // -----------------------------------------------------------------
    // Só executa a lógica da página DEPOIS que o principal.js
    // carregou o usuário, conectou o WebSocket e buscou os amigos.
    document.addEventListener('globalScriptsLoaded', (e) => {
        
        // --- SELEÇÃO DE ELEMENTOS (Específicos da Página) ---
        const elements = {
            receivedRequestsList: document.getElementById('received-requests-list'),
            sentRequestsList: document.getElementById('sent-requests-list'),
            friendsList: document.getElementById('friends-list'),
        };

        // -----------------------------------------------------------------
        // FUNÇÕES DE BUSCA DE DADOS (Específicas da Página)
        // -----------------------------------------------------------------

        /**
         * Busca apenas os pedidos de amizade RECEBIDOS.
         */
        async function fetchReceivedRequests() {
            if (!elements.receivedRequestsList) return;
            try {
                const response = await window.axios.get(`${window.backendUrl}/api/amizades/pendentes`);
                renderRequests(response.data, elements.receivedRequestsList, 'received');
            } catch (error) {
                console.error('Erro ao buscar pedidos recebidos:', error);
                elements.receivedRequestsList.innerHTML = `<p class="empty-state">Não foi possível carregar os pedidos.</p>`;
            }
        }

        /**
         * Busca apenas os pedidos de amizade ENVIADOS.
         */
        async function fetchSentRequests() {
            if (!elements.sentRequestsList) return;
            try {
                const response = await window.axios.get(`${window.backendUrl}/api/amizades/enviadas`);
                renderRequests(response.data, elements.sentRequestsList, 'sent');
            } catch (error) {
                console.error('Erro ao buscar pedidos enviados:', error);
                elements.sentRequestsList.innerHTML = `<p class="empty-state">Não foi possível carregar os pedidos.</p>`;
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DE RENDERIZAÇÃO (Específicas da Página)
        // -----------------------------------------------------------------

        /**
         * Renderiza os cards de pedidos (recebidos ou enviados).
         */
        function renderRequests(requests, container, type) {
            if (!container) return;
            container.innerHTML = '';
            if (requests.length === 0) {
                container.innerHTML = `<p class="empty-state">Nenhum pedido encontrado.</p>`;
                return;
            }

            requests.forEach(req => {
                const card = document.createElement('div');
                card.className = 'user-card';
                card.id = `${type}-card-${req.idAmizade}`;

                const data = new Date(req.dataSolicitacao).toLocaleDateString('pt-BR');
                const nome = (type === 'received') ? req.nomeSolicitante : req.nomeSolicitado;
                const fotoPath = (type === 'received') ? req.fotoPerfilSolicitante : req.fotoPerfilSolicitado;

                const fotoUrl = fotoPath ? `${window.backendUrl}/api/arquivos/${fotoPath}` : window.defaultAvatarUrl;

                let actionsHtml = '';
                if (type === 'received') {
                    actionsHtml = `
                        <button class="btn btn-primary" onclick="window.aceitar(${req.idAmizade})">Aceitar</button>
                        <button class="btn btn-secondary" onclick="window.recusar(${req.idAmizade})">Recusar</button>
                    `;
                } else { 
                    actionsHtml = `<button class="btn btn-danger" onclick="window.cancelar(${req.idAmizade})">Cancelar Pedido</button>`;
                }

                card.innerHTML = `
                    <div class="user-card-avatar">
                        <img src="${fotoUrl}" alt="Foto de ${nome}">
                    </div>
                    <div class="user-card-info">
                        <h4>${nome}</h4>
                        <p>Pedido enviado em: ${data}</p>
                    </div>
                    <div class="user-card-action">
                        ${actionsHtml}
                    </div>
                `;
                container.appendChild(card);
            });
        }

        /**
         * Renderiza a lista principal de amigos.
         * Esta função agora usa a lista global 'window.userFriends' carregada pelo principal.js
         */
        function renderFriends() {
            const container = elements.friendsList;
            if (!container) return;
            container.innerHTML = '';

            const friends = window.userFriends || [];

            if (friends.length === 0) {
                container.innerHTML = `<p class="empty-state">Você ainda não tem amigos.</p>`;
                return;
            }

            friends.forEach(friend => {
                const card = document.createElement('div');
                card.className = 'user-card';
                card.id = `friend-card-${friend.idAmizade}`;
                
                const fotoUrl = friend.fotoPerfil ? `${window.backendUrl}/api/arquivos/${friend.fotoPerfil}` : window.defaultAvatarUrl;
                
                const actionsHtml = `
                    <a href="mensagem.html?userEmail=${friend.email}" class="btn btn-primary"><i class="fas fa-comment-dots"></i> Mensagem</a>
                    <button class="btn btn-danger" onclick="window.removerAmizade(${friend.idAmizade})"><i class="fas fa-user-minus"></i> Remover</button>
                `;
                
                card.innerHTML = `
                    <div class="user-card-avatar">
                        <img src="${fotoUrl}" alt="Foto de ${friend.nome}">
                        <div class="status" data-user-email="${friend.email}"></div>
                    </div>
                    <div class="user-card-info">
                        <h4>${friend.nome}</h4>
                        <p>${friend.email}</p>
                    </div>
                    <div class="user-card-action">${actionsHtml}</div>
                `;
                container.appendChild(card);
            });
            if (typeof window.atualizarStatusDeAmigosNaUI === 'function') {
                window.atualizarStatusDeAmigosNaUI();
            }
        }

        // -----------------------------------------------------------------
        // FUNÇÕES DE AÇÃO (Expostas para o HTML)
        // -----------------------------------------------------------------
        window.aceitar = async (amizadeId) => {
            try {
                await window.axios.post(`${window.backendUrl}/api/amizades/aceitar/${amizadeId}`);
                window.showNotification('Amizade aceita!', 'success');
            } catch (err) { 
                console.error(err); 
                window.showNotification('Erro ao aceitar amizade.', 'error');
            }
        };

        window.recusar = async (amizadeId) => {
            try {
                await window.axios.delete(`${window.backendUrl}/api/amizades/recusar/${amizadeId}`);
            } catch (err) { 
                console.error(err); 
                window.showNotification('Erro ao recusar.', 'error');
            }
        };

        window.cancelar = async (amizadeId) => {
            try {
                await window.axios.delete(`${window.backendUrl}/api/amizades/recusar/${amizadeId}`);
            } catch (err) { 
                console.error(err); 
                window.showNotification('Erro ao cancelar pedido.', 'error');
            }
        };

        window.removerAmizade = async (amizadeId) => {
            if (confirm('Tem certeza que deseja remover esta amizade?')) {
                try {
                    await window.axios.delete(`${window.backendUrl}/api/amizades/recusar/${amizadeId}`);
                    window.showNotification('Amizade removida.', 'info');
                } catch (err) {
                    console.error('Erro ao remover amizade:', err);
                    window.showNotification('Erro ao remover amizade.', 'error');
                }
            }
        };

        // -----------------------------------------------------------------
        // INICIALIZAÇÃO DA PÁGINA E LISTENERS GLOBAIS
        // -----------------------------------------------------------------

        /**
         * Função unificada para carregar/recarregar os dados desta página.
         */
        function carregarDadosDaPagina() {
            fetchReceivedRequests();
            fetchSentRequests();
            renderFriends(); 
        }
        carregarDadosDaPagina();
        document.addEventListener('friendsListUpdated', () => {
            console.log("Página amizades.js ouviu o evento 'friendsListUpdated'!");
            carregarDadosDaPagina();
        });

    });
});