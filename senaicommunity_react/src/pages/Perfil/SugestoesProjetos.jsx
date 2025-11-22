import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SugestoesProjetos.css'; // Vamos criar este CSS

/**
 * Este componente busca TODOS os projetos e filtra (no frontend)
 * aqueles que o usuário (passado pela prop) já participa.
 */
const SugestoesProjetos = ({ projetosDoUsuario = [] }) => {
    const [sugestoes, setSugestoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSugestoes = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // 1. Criar um "Set" com os IDs dos projetos que o usuário já participa
                // (Assumindo que 'projetosDoUsuario' é a lista 'projetosMembros')
                const userProjectIds = new Set(
                    projetosDoUsuario.map(membro => membro.projeto.id)
                );

                // 2. Buscar TODOS os projetos do endpoint existente
                const response = await axios.get(`http://localhost:8080/projetos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // 3. Filtrar a lista no frontend
                const allProjects = response.data;
                const filteredSugestoes = allProjects
                    .filter(projeto => !userProjectIds.has(projeto.id)) // Exclui projetos que o usuário já tem
                    .slice(0, 5); // Limita a 5 sugestões

                setSugestoes(filteredSugestoes);
            } catch (error) {
                console.error("Erro ao buscar sugestões de projetos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSugestoes();
    }, [projetosDoUsuario]); // Re-executa se a lista de projetos do usuário mudar

    if (loading) {
        return <div className="sugestoes-widget">Carregando sugestões...</div>;
    }

    if (sugestoes.length === 0) {
        return null; // Não mostra nada se não houver sugestões
    }

    return (
        <div className="sugestoes-widget">
            <h3>Projetos para você</h3>
            {sugestoes.map(projeto => (
                <div key={projeto.id} className="sugestao-item">
                    <img src={projeto.fotoUrl || 'https://via.placeholder.com/150'} alt={projeto.nome} className="sugestao-avatar" />
                    <div className="sugestao-info">
                        <h4>{projeto.nome}</h4>
                        <p>{projeto.descricao ? projeto.descricao.substring(0, 40) + '...' : 'Sem descrição'}</p>
                    </div>
                    <Link to={`/projetos/${projeto.id}`} className="sugestao-botao">
                        Ver
                    </Link>
                </div>
            ))}
        </div>
    );
};

export default SugestoesProjetos;