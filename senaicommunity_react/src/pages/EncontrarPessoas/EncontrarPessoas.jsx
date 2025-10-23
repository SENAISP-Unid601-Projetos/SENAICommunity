// src/pages/EncontrarPessoas/EncontrarPessoas.jsx (NOVO DESIGN - CORRIGIDO NOVAMENTE)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; // Layout consistente
import './EncontrarPessoas.css'; // Carrega o NOVO CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ CORREÇÃO AQUI: Removido 'faLink' que não estava sendo usado.
import { faSearch, faCheck, faUserPlus, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { debounce } from 'lodash';
import { Link } from 'react-router-dom'; // Para linkar para o perfil
import Swal from 'sweetalert2'; // Importar Swal para mensagens de erro

// --- COMPONENTE UserCard MELHORADO ---
const UserCard = ({ user, onAddFriend, currentUser }) => {
    // Estado local para o status, permitindo atualização imediata na UI
    const [statusAmizade, setStatusAmizade] = useState(user.statusAmizade);

    // ✅ INTEGRAÇÃO: Constrói URL da foto
    const fotoUrl = user.fotoPerfil
        ? `http://localhost:8080${user.fotoPerfil}`
        : `https://i.pravatar.cc/80?u=${user.id}`;

    const handleAddFriendClick = async () => {
        setStatusAmizade('SOLICITACAO_ENVIADA'); // Atualiza UI imediatamente
        await onAddFriend(user.id); // Chama a função do pai para a API
    };

    // Função para cancelar (mantida comentada para futuro)
    // const handleCancelRequestClick = async () => {
    //     setStatusAmizade('NENHUMA');
    //     await onCancelRequest(user.idAmizade); // Precisaria buscar o id da amizade
    // };

    const renderButton = () => {
        // Não mostrar botão para o próprio usuário
        if (currentUser && user.id === currentUser.id) {
            return null;
        }

        switch (statusAmizade) {
            case 'AMIGOS':
                return <button className="btn btn-secondary disabled"><FontAwesomeIcon icon={faCheck} /> Conectados</button>;
            case 'SOLICITACAO_ENVIADA':
                // Adicionar botão de cancelar futuramente se necessário
                return <button className="btn btn-secondary disabled"><FontAwesomeIcon icon={faClockRotateLeft} /> Pendente</button>;
            case 'SOLICITACAO_RECEBIDA':
                // Leva para a página de conexões para responder
                return <Link to="/conexoes" className="btn btn-primary respond-link">Responder</Link>;
            case 'NENHUMA':
            default:
                return <button className="btn btn-primary add-friend-btn" onClick={handleAddFriendClick}><FontAwesomeIcon icon={faUserPlus} /> Conectar</button>;
        }
    };

    return (
        <article className="user-card">
            {/* Link para perfil futuro (ajustar rota se necessário) */}
            <Link to={`/perfil/${user.id}`} className="user-card-link">
                <div className="user-card-avatar">
                    <img src={fotoUrl} alt={`Foto de ${user.nome}`} />
                    {/* Status online pode ser adicionado se a API retornar */}
                    {/* <div className={`status ${user.online ? 'online' : 'offline'}`}></div> */}
                </div>
                <div className="user-card-info">
                    <h4>{user.nome}</h4>
                    <p>{user.email}</p>
                    {/* Adicionar curso/tipo futuramente */}
                </div>
            </Link>
            <div className="user-card-action">
                {renderButton()}
            </div>
        </article>
    );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const EncontrarPessoas = ({ onLogout }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // ✅ INTEGRAÇÃO
    const [message, setMessage] = useState('Comece a digitar para encontrar pessoas.');

    // ✅ INTEGRAÇÃO: Busca o usuário logado
    useEffect(() => {
        document.title = 'Senai Community | Encontrar Pessoas';
        const token = localStorage.getItem('authToken');
        const fetchCurrentUser = async () => {
            if (!token) { // Verifica se há token antes de fazer a chamada
              onLogout();
              return;
            }
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Define o header padrão
                const response = await axios.get('http://localhost:8080/usuarios/me');
                setCurrentUser(response.data);
            } catch (error) {
                console.error("Erro ao buscar usuário atual:", error);
                 if (error.response?.status === 401 || error.response?.status === 403) {
                     onLogout(); // Faz logout se token for inválido
                 }
            }
        };
        fetchCurrentUser();
    }, [onLogout]);

    // Função de busca com debounce (atraso para não sobrecarregar)
    const debouncedSearch = useCallback(debounce(async (query) => {
        if (query.length < 3) {
            setResults([]);
            if (query.length > 0) {
                setMessage('Digite pelo menos 3 caracteres.');
            } else {
                 setMessage('Comece a digitar para encontrar pessoas.');
            }
            setLoading(false); // Garante que loading seja falso
            return;
        }
        setLoading(true);
        setMessage(''); // Limpa mensagem enquanto busca
        try {
            // Token já está nos headers padrão do axios
            const response = await axios.get(`http://localhost:8080/usuarios/buscar?nome=${query}`);
            setResults(response.data);
            if(response.data.length === 0) {
                setMessage('Nenhum usuário encontrado com esse nome.');
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setMessage('Erro ao buscar usuários. Tente novamente.');
            setResults([]); // Limpa resultados em caso de erro
             if (error.response?.status === 401 || error.response?.status === 403) {
                onLogout(); // Faz logout se token for inválido durante a busca
             }
        } finally {
            setLoading(false);
        }
    }, 500), [onLogout]); // Adicionado onLogout como dependência

    // Atualiza o termo de busca e chama a busca com debounce
    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        setLoading(true); // Mostra loading imediatamente ao digitar
        debouncedSearch(query);
    };

    // ✅ INTEGRAÇÃO: Função para enviar solicitação de amizade
    const handleAddFriend = async (userId) => {
        try {
            // Token já está nos headers padrão do axios
            await axios.post(`http://localhost:8080/api/amizades/solicitar/${userId}`);
            // A UI já foi atualizada no UserCard, aqui só confirmamos a chamada
            console.log("Solicitação enviada para:", userId);
        } catch (error) {
            console.error("Erro ao enviar solicitação:", error);
            // Reverter a UI se a API falhar (opcional)
             Swal.fire('Erro', 'Não foi possível enviar a solicitação. Tente novamente.', 'error');
             // Para reverter UI, precisaríamos buscar novamente ou passar callback
             const updatedResults = results.map(user => {
                 if (user.id === userId) {
                     return { ...user, statusAmizade: 'NENHUMA' }; // Reverte o status localmente
                 }
                 return user;
             });
             setResults(updatedResults);
        }
    };

    // Função para cancelar solicitação (mantida comentada para futuro)
    // const handleCancelRequest = async (amizadeId) => { ... }

    return (
        <div>
            {/* Passa currentUser para Topbar e Sidebar */}
            <Topbar onLogout={onLogout} currentUser={currentUser}/>
            <div className="container">
                <Sidebar currentUser={currentUser}/>
                <main className="main-content">
                    <section className="widget-card search-header-card">
                        <h3 className="widget-title">Encontrar Pessoas na Comunidade</h3>
                        <div className="search-box">
                            <FontAwesomeIcon icon={faSearch} />
                            <input
                                type="search"
                                placeholder="Digite o nome de um aluno ou professor..."
                                value={searchTerm}
                                onChange={handleInputChange}
                            />
                        </div>
                    </section>

                    <section className="search-results-container">
                        {loading && <p className="loading-state">Buscando...</p>}
                        {!loading && results.length > 0 && (
                            results.map(user => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    onAddFriend={handleAddFriend}
                                    // onCancelRequest={handleCancelRequest}
                                    currentUser={currentUser} // Passa currentUser para o Card
                                />
                            ))
                        )}
                        {!loading && results.length === 0 && (
                            <p className="empty-state">{message}</p>
                        )}
                    </section>
                </main>
                 <RightSidebar /> {/* ✅ DESIGN: Adicionado para layout de 3 colunas */}
            </div>
        </div>
    );
};

export default EncontrarPessoas;