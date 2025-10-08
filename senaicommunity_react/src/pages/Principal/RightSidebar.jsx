import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ CORREÇÃO: Ícones corrigidos e tradução aplicada
import { faUserPlus, faPlus, faBullhorn } from '@fortawesome/free-solid-svg-icons'; 

const RightSidebar = () => {
    return (
        <aside className="right-sidebar">
            <div className="widget-card">
                <div className="widget-header">
                    <h3><FontAwesomeIcon icon={faBullhorn} /> Buscando Colaboradores</h3>
                </div>
                <ul className="lista-colaboracao" style={{listStyle: 'none', padding: 0}}>
                    <li>
                        <a href="#">
                            <strong>App de Gestão Financeira</strong>
                            <span>UX/UI Designer</span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <strong>Sistema de Irrigação Automatizado</strong>
                            <span>Eng. de Software (C++)</span>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="widget-card">
                <div className="widget-header">
                    <h3><FontAwesomeIcon icon={faUserPlus} /> Quem Seguir</h3>
                    <a href="#" className="see-all">Ver todos</a>
                </div>
                <div className="follow-list">
                    <div className="follow-item">
                        <div className="follow-item-left">
                            <div className="follow-avatar"><img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Ana"/></div>
                            <div className="follow-info">
                                <h4>Ana Silva</h4>
                                <span>Engenheira de Software</span>
                            </div>
                        </div>
                        <button className="follow-btn"><FontAwesomeIcon icon={faPlus} /></button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;