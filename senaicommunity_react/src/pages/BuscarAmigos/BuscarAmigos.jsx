import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import '../../pages/Principal/Principal.css';

const BuscarAmigos = ({ onLogout }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    
    const backendUrl = 'http://localhost:8080';

    // Usamos useCallback para evitar recriar a função de busca a cada renderização
    const searchUsers = useCallback(async (term) => {
        if (term.length < 3) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await axios.get(`${backendUrl}/usuarios/buscar`, { params: { nome: term } });
            setResults(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        document.title = 'Senai Community | Encontrar Pessoas';
        const token = localStorage.getItem('authToken');
        if (!token) {
            onLogout();
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        axios.get(`${backendUrl}/usuarios/me`)
            .then(res => setCurrentUser(res.data))
            .catch(() => onLogout())
            .finally(() => setIsLoading(false));

        // Debounce para a busca: só busca 300ms depois que o usuário para de digitar
        const delayDebounceFn = setTimeout(() => {
            searchUsers(searchTerm);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, onLogout, searchUsers]);
    
    const handleAddFriend = async (userId, index) => {
        try {
            await axios.post(`${backendUrl}/api/amizades/solicitar/${userId}`);
            // Atualiza o status do usuário na lista para 'Pendente'
            const newResults = [...results];
            newResults[index].statusAmizade = 'SOLICITACAO_ENVIADA';
            setResults(newResults);
        } catch (error) {
            console.error("Erro ao adicionar amigo:", error);
            alert("Não foi possível enviar a solicitação.");
        }
    };

    if (isLoading) {
        return <div>Carregando...</div>;
    }

    return (
        <>
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className="container">
                <Sidebar currentUser={currentUser} />
                <main className="main-content">
                    <div className="widget-card">
                        <h3 className="widget-title">Encontrar Pessoas na Comunidade</h3>
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input 
                                type="search" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Digite o nome de um aluno ou professor..."
                            />
                        </div>
                    </div>

                    <div className="search-results-container">
                        {isSearching ? <p>Buscando...</p> : results.map((user, index) => (
                            <div className="user-card" key={user.id}>
                                <div className="user-card-avatar">
                                    <img src={user.fotoPerfil || 'https://via.placeholder.com/60'} alt={`Foto de ${user.nome}`} />
                                    <div className={`status ${user.online ? 'online' : 'offline'}`}></div>
                                </div>
                                <div className="user-card-info">
                                    <h4>{user.nome}</h4>
                                    <p>{user.email}</p>
                                </div>
                                <div className="user-card-action">
                                    {user.statusAmizade === 'AMIGOS' && <button className="btn btn-secondary" disabled><FontAwesomeIcon icon={faCheck} /> Amigos</button>}
                                    {user.statusAmizade === 'SOLICITACAO_ENVIADA' && <button className="btn btn-secondary" disabled>Pendente</button>}
                                    {user.statusAmizade === 'SOLICITACAO_RECEBIDA' && <a href="/amizades" className="btn btn-primary">Responder</a>}
                                    {user.statusAmizade === 'NENHUMA' && <button className="btn btn-primary" onClick={() => handleAddFriend(user.id, index)}><FontAwesomeIcon icon={faUserPlus} /> Adicionar</button>}
                                </div>
                            </div>
                        ))}
                        {!isSearching && results.length === 0 && searchTerm.length > 2 && <p className="empty-state">Nenhum usuário encontrado.</p>}
                        {!isSearching && searchTerm.length <= 2 && <p className="empty-state">Digite pelo menos 3 caracteres.</p>}
                    </div>
                </main>
            </div>
        </>
    );
};

export default BuscarAmigos;