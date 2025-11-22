// senaicommunity_react/src/pages/Mensagens/ScheduleMeetingModal.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './ScheduleMeetingModal.css';

const ScheduleMeetingModal = ({ onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [dateTime, setDateTime] = useState('');

    const handleSave = () => {
        if (title.trim() && dateTime) {
            onSave(title, dateTime);
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content schedule-meeting-modal">
                <header className="modal-header">
                    <h3>Agendar Reunião</h3>
                    <button onClick={onClose} className="modal-close-btn">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </header>
                <div className="modal-body">
                    <input
                        type="text"
                        className="meeting-title-input"
                        placeholder="Título da Reunião"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <input
                        type="datetime-local"
                        className="meeting-datetime-input"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                    />
                </div>
                <footer className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={!title.trim() || !dateTime}>
                        Agendar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;
