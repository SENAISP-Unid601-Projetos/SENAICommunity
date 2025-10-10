import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Ícones importados para uso no componente
import { faUserPlus, faPlus, faBullhorn } from '@fortawesome/free-solid-svg-icons';
import './Principal.css'; // Supondo que os estilos relevantes estão aqui

const RightSidebar = () => {
    return (
        <aside className="right-sidebar">
            {/* Widget: Buscando Colaboradores */}
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

            {/* Widget: Quem Seguir */}
            <div className="widget-card">
                <div className="widget-header">
                    <h3><FontAwesomeIcon icon={faUserPlus} /> Quem Seguir</h3>
                    <a href="#" className="see-all">Ver todos</a>
                </div>
                <div className="follow-list">
                    {/* Item de exemplo para seguir */}
                    <div className="follow-item">
                        <div className="follow-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="follow-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%' }}>
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Ana" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            </div>
                            <div className="follow-info">
                                <h4>Ana Silva</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Engenheira de Software</span>
                            </div>
                        </div>
                        <button className="follow-btn">
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;