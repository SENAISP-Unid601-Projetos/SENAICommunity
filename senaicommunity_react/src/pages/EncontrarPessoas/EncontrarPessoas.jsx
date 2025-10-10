// src/pages/EncontrarPessoas/EncontrarPessoas.jsx

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './EncontrarPessoas.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCheck, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { debounce } from 'lodash';

const UserCard = ({ user, onAddFriend }) => {
    const [status, setStatus] = useState(user.statusAmizade);

    const handleAddFriend = () => {
        onAddFriend(user.id);
        setStatus('SOLICITACAO_ENVIADA');
    };

    const renderButton = () => {
        switch (status) {
            case 'AMIGOS':
                return <button className="btn btn-secondary" disabled><FontAwesomeIcon icon={faCheck} /> Amigos</button>;
            case 'SOLICITACAO_ENVIADA':
                return <button className="btn btn-secondary" disabled>Pendente</button>;
            case 'SOLICITACAO_RECEBIDA':
                return <a href="/minhas-conexoes" className="btn btn-primary">Responder</a>;
            case 'NENHUMA':
            default:
                return <button className="btn btn-primary" onClick={handleAddFriend}><FontAwesomeIcon icon={faUserPlus} /> Adicionar</button>;
        }
    };

    return (
        <div className="user-card">
            <div className="user-card-avatar">
                <img src={`http://localhost:8080${user.fotoPerfil}`} alt={`Foto de ${user.nome}`} />
                <div className={`status ${user.online ? 'online' : 'offline'}`}></div>
            </div>
            <div className="user-card-info">
                <h4>{user.nome}</h4>
                <p>{user.email}</p>
            </div>
            <div className="user-card-action">
                {renderButton()}
            </div>
        </div>
    );
};

const EncontrarPessoas = ({ onLogout }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Comece a digitar para encontrar pessoas.');

    const debouncedSearch = useCallback(debounce(async (query) => {
        if (query.length < 3) {
            setResults([]);
            setMessage('Digite pelo menos 3 caracteres.');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`http://localhost:8080/usuarios/buscar?nome=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setResults(response.data);
            if(response.data.length === 0) {
                setMessage('Nenhum usuário encontrado.');
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setMessage('Erro ao buscar usuários. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, 500), []);

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        debouncedSearch(query);
    };

    const handleAddFriend = async (userId) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(`http://localhost:8080/api/amizades/solicitar/${userId}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Erro ao enviar solicitação de amizade:", error);
            // A UI já foi atualizada, pode-se adicionar um toast de erro aqui se desejar
        }
    };

    return (
        <div>
            <Topbar onLogout={onLogout} />
            <div className="container">
                <Sidebar />
                <main className="main-content">
                    <div className="widget-card">
                        <h3 className="widget-title">Encontrar Pessoas na Comunidade</h3>
                        <div className="search-box">
                            <FontAwesomeIcon icon={faSearch} />
                            <input type="search" placeholder="Digite o nome de um aluno ou professor..." onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="search-results-container">
                        {loading ? (
                            <p className="empty-state">Buscando...</p>
                        ) : results.length > 0 ? (
                            results.map(user => <UserCard key={user.id} user={user} onAddFriend={handleAddFriend} />)
                        ) : (
                            <p className="empty-state">{message}</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EncontrarPessoas;