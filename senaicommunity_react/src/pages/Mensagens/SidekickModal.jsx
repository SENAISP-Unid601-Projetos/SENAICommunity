import React, { useState } from 'react';
import './SidekickModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faShareSquare } from '@fortawesome/free-solid-svg-icons';

const SidekickModal = ({ onSave, onClose }) => {
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const newUserMessage = { sender: 'user', text: userInput };
        setConversation(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        // Exemplo de como a integração real com a API da IA seria:
        /*
        try {
            const response = await axios.post('/api/ai/chat', { prompt: userInput });
            const aiResponse = { sender: 'ia', text: response.data.response };
            setConversation(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("Erro ao chamar a API da IA:", error);
            const errorResponse = { sender: 'ia', text: 'Desculpe, não consegui processar sua pergunta.' };
            setConversation(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
        */

        // Mantendo o mock para fins de demonstração da UI
        setTimeout(() => {
            const aiResponse = {
                sender: 'ia',
                text: `Esta é uma resposta simulada para: "${userInput}". A integração real com a API da IA viria aqui.`
            };
            setConversation(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };

    const handleShare = () => {
        if (conversation.length > 0) {
            onSave(conversation);
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="sidekick-modal">
                <div className="modal-header">
                    <h2>Assistente IA (Sidekick)</h2>
                    <button onClick={onClose} className="close-btn">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="sidekick-chat-area">
                        {conversation.map((msg, index) => (
                            <div key={index} className={`sidekick-message ${msg.sender}`}>
                                <p>{msg.text}</p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="sidekick-message ia">
                                <p className="typing-indicator">...</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                     <form onSubmit={handleSendMessage} className="sidekick-input-form">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Pergunte algo à IA..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading}>
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </form>
                    <button onClick={handleShare} className="share-btn" disabled={conversation.length === 0}>
                        <FontAwesomeIcon icon={faShareSquare} /> Subir conversa no Grupo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SidekickModal;
