import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './StatsCard.css'; // Vamos criar o CSS abaixo

const StatsCard = ({ userId }) => {
    const [stats, setStats] = useState({ conexoes: 0, projetos: 0 });

    useEffect(() => {
        if (userId) {
            // Busca as duas contagens simultaneamente
            Promise.all([
                axios.get(`http://localhost:8080/api/amizades/contagem/${userId}`),
                axios.get(`http://localhost:8080/projetos/participando/contagem/${userId}`)
            ])
            .then(([amizadesRes, projetosRes]) => {
                setStats({
                    conexoes: amizadesRes.data,
                    projetos: projetosRes.data
                });
            })
            .catch(err => console.error("Erro ao buscar estatísticas:", err));
        }
    }, [userId]);

    return (
        <div className="stats-card-container">
            <div className="stat-item">
                <span className="stat-label">Conexões</span>
                <span className="stat-number">{stats.conexoes}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <span className="stat-label">Projetos</span>
                <span className="stat-number">{stats.projetos}</span>
            </div>
        </div>
    );
};

export default StatsCard;