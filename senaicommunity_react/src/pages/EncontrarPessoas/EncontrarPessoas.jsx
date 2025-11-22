// src/pages/EncontrarPessoas/EncontrarPessoas.jsx

// ... (Todos os seus imports React, axios, FontAwesomeIcon, etc. permanecem iguais)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; 
import './EncontrarPessoas.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCheck, faUserPlus, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { debounce } from 'lodash';
import { Link } from 'react-router-dom'; 
import Swal from 'sweetalert2'; 


const UserCard = ({ user, onAddFriend, currentUser }) => {
    const [statusAmizade, setStatusAmizade] = useState(user.statusAmizade);
    
    // 1. Estado para armazenar a URL da foto (que será buscada)
    const [fotoUrl, setFotoUrl] = useState(null); 

    // 2. Avatar padrão (local) para usar como fallback
    const defaultAvatar = 'http://localhost:8080/images/default-avatar.png';

    // 3. useEffect para buscar os dados COMPLETOS do usuário (igual a Perfil.jsx)
    useEffect(() => {
        // Define a foto padrão *enquanto* busca a foto real
        setFotoUrl(defaultAvatar); 
        
        const fetchFullUserData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return; // Não pode buscar sem token

            try {
                // 4. Busca o perfil COMPLETO do usuário, igual a página Perfil.jsx faz
                const response = await axios.get(`http://localhost:8080/usuarios/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const fullProfile = response.data;
                
                // 5. Lógica de foto do Perfil.jsx (que sabemos que funciona)
                if (fullProfile.urlFotoPerfil && fullProfile.urlFotoPerfil.startsWith('http')) {
                    setFotoUrl(fullProfile.urlFotoPerfil); // Cloudinary
                } else if (fullProfile.urlFotoPerfil) {
                    setFotoUrl(`http://localhost:8080${fullProfile.urlFotoPerfil}`); // Local
                } else {
                    setFotoUrl(defaultAvatar); // Se não tiver, usa o padrão
                }

            } catch (error) {
                console.error(`Erro ao buscar dados do usuário ${user.id}:`, error);
                setFotoUrl(defaultAvatar); // Em caso de erro, usa o padrão
            }
        };

        // Não buscamos o perfil do usuário logado (currentUser)
        // Apenas o perfil dos resultados da busca.
        if (user.id !== currentUser?.id) {
             fetchFullUserData();
        } else {
            // Se o usuário da busca for o próprio usuário logado,
            // podemos pegar a foto dele direto do 'currentUser' que já temos
             const fotoLogado = currentUser.urlFotoPerfil || currentUser.fotoPerfil;
             if (fotoLogado && fotoLogado.startsWith('http')) {
                 setFotoUrl(fotoLogado);
             } else if (fotoLogado) {
                 setFotoUrl(`http://localhost:8080${fotoLogado}`);
             } else {
                 setFotoUrl(defaultAvatar);
             }
        }

    }, [user.id, currentUser]); // <-- Dispara sempre que o user.id ou currentUser mudar

    const handleAddFriendClick = async () => {
        setStatusAmizade('SOLICITACAO_ENVIADA'); 
        await onAddFriend(user.id); 
    };

    const renderButton = () => {
        if (currentUser && user.id === currentUser.id) {
            return null; // Não mostra botão de "Conectar" no seu próprio perfil
        }

        switch (statusAmizade) {
            case 'AMIGOS':
                return <button className="btn btn-secondary disabled"><FontAwesomeIcon icon={faCheck} /> Conectados</button>;
            case 'SOLICITACAO_ENVIADA':
                return <button className="btn btn-secondary disabled"><FontAwesomeIcon icon={faClockRotateLeft} /> Pendente</button>;
            case 'SOLICITACO_RECEBIDA': // Cuidado! O seu original tinha "SOLICITACAO_RECEBIDA"
            case 'SOLICITACAO_RECEBIDA':
                return <Link to="/conexoes" className="btn btn-primary respond-link">Responder</Link>;
            case 'NENHUMA':
            default:
                return <button className="btn btn-primary add-friend-btn" onClick={handleAddFriendClick}><FontAwesomeIcon icon={faUserPlus} /> Conectar</button>;
        }
    };

    return (
     <article className="user-card">
         <Link to={`/perfil/${user.id}`} className="user-card-link">
             
             <div className="user-card-avatar">
                 <img 
                     src={fotoUrl} // ⬅️ Usa a URL do estado (que foi buscada)
                     alt={`Foto de ${user.nome}`} 
                     className="profile-pic"
                     // Se a URL buscada falhar, usa a padrão
                     onError={(e) => { 
                         e.target.onerror = null; 
                         e.target.src = defaultAvatar;
                     }}
                 />
             </div>

             <div className="user-card-info">
                 <h4>{user.nome}</h4>
                 <p>{user.email}</p>
             </div>
         </Link>
         <div className="user-card-action">
             {renderButton()}
         </div>
     </article>
    );
};
// --- FIM DO COMPONENTE UserCard ---



// --- COMPONENTE PRINCIPAL DA PÁGINA ---
// (O restante do arquivo não precisa de alterações)
const EncontrarPessoas = ({ onLogout }) => {
    // ... (todo o resto do seu componente EncontrarPessoas permanece igual) ...
    // ... (useState, useEffect, debouncedSearch, etc. estão corretos) ...
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); 
    const [message, setMessage] = useState('Comece a digitar para encontrar pessoas.');

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        document.title = 'Senai Community | Encontrar Pessoas';
        const token = localStorage.getItem('authToken');
        const fetchCurrentUser = async () => {
            if (!token) { 
             onLogout();
             return;
            }
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
                const response = await axios.get('http://localhost:8080/usuarios/me');
                setCurrentUser(response.data);
            } catch (error) {
                console.error("Erro ao buscar usuário atual:", error);
                 if (error.response?.status === 401 || error.response?.status === 403) {
                     onLogout(); 
                 }
            }
        };
        fetchCurrentUser();
    }, [onLogout]);

    const debouncedSearch = useCallback(debounce(async (query) => {
        if (query.length < 3) {
            setResults([]);
            if (query.length > 0) {
                setMessage('Digite pelo menos 3 caracteres.');
            } else {
                 setMessage('Comece a digitar para encontrar pessoas.');
            }
            setLoading(false); 
            return;
        }
        setLoading(true);
        setMessage(''); 
        try {
            const response = await axios.get(`http://localhost:8080/usuarios/buscar?nome=${query}`);
            setResults(response.data);
            if(response.data.length === 0) {
                setMessage('Nenhum usuário encontrado com esse nome.');
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setMessage('Erro ao buscar usuários. Tente novamente.');
            setResults([]); 
             if (error.response?.status === 401 || error.response?.status === 403) {
                 onLogout(); 
             }
        } finally {
            setLoading(false);
        }
    }, 500), [onLogout]); 

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        setLoading(true); 
        debouncedSearch(query);
    };

    const handleAddFriend = async (userId) => {
        try {
            await axios.post(`http://localhost:8080/api/amizades/solicitar/${userId}`);
            console.log("Solicitação enviada para:", userId);
        } catch (error) {
            console.error("Erro ao enviar solicitação:", error);
             Swal.fire('Erro', 'Não foi possível enviar a solicitação. Tente novamente.', 'error');
             const updatedResults = results.map(user => {
                 if (user.id === userId) {
                     return { ...user, statusAmizade: 'NENHUMA' }; 
                 }
                 return user;
             });
             setResults(updatedResults);
        }
    };

    return (
        <div>
            <Topbar 
                onLogout={onLogout} 
                currentUser={currentUser}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {isSidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <div className="container">
                <Sidebar 
                    currentUser={currentUser}
                    isOpen={isSidebarOpen}
                />
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
                                    currentUser={currentUser} 
                                />
                            ))
                        )}
                        {!loading && results.length === 0 && (
                            <p className="empty-state">{message}</p>
                        )}
                    </section>
                </main>
                 <RightSidebar /> 
            </div>
        </div>
    );
};

export default EncontrarPessoas;