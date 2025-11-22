// senaicommunity_react/src/pages/Mensagens/PollModal.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import './PollModal.css';

const PollModal = ({ onSave, onClose }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleSave = () => {
        if (question.trim() && options.every(opt => opt.trim())) {
            onSave(question, options);
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content poll-modal">
                <header className="modal-header">
                    <h3>Criar Enquete</h3>
                    <button onClick={onClose} className="modal-close-btn">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </header>
                <div className="modal-body">
                    <input
                        type="text"
                        className="poll-question-input"
                        placeholder="Qual é a sua pergunta?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                    <div className="poll-options">
                        {options.map((option, index) => (
                            <div key={index} className="poll-option">
                                <input
                                    type="text"
                                    placeholder={`Opção ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <button onClick={() => removeOption(index)} className="remove-option-btn">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button onClick={addOption} className="add-option-btn">
                        <FontAwesomeIcon icon={faPlus} /> Adicionar Opção
                    </button>
                </div>
                <footer className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={!question.trim() || options.some(opt => !opt.trim())}>
                        Criar Enquete
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PollModal;
