import React, { useState } from 'react';
import './IaConversationDisplay.css';

const IaConversationDisplay = ({ conversationData, authorName }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!conversationData || conversationData.length === 0) {
        return null;
    }

    return (
        <div className="ia-conversation-container">
            <div className="ia-conversation-header">
                <p>
                    <strong>{authorName}</strong> compartilhou uma conversa com a IA.
                </p>
                <button onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Recolher' : 'Expandir'}
                </button>
            </div>
            {isExpanded && (
                <div className="ia-conversation-log">
                    {conversationData.map((msg, index) => (
                        <div key={index} className={`ia-log-message ${msg.sender}`}>
                            <strong>{msg.sender === 'user' ? 'Você' : 'IA'}:</strong>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IaConversationDisplay;
