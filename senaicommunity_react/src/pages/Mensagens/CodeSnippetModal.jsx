// senaicommunity_react/src/pages/Mensagens/CodeSnippetModal.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './CodeSnippetModal.css';

const CodeSnippetModal = ({ onSave, onClose }) => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');

    const handleSave = () => {
        if (code.trim()) {
            onSave(code, language);
            onClose();
        }
    };

    const supportedLanguages = ['javascript', 'java', 'sql', 'python', 'csharp', 'css', 'html'];

    return (
        <div className="modal-overlay">
            <div className="modal-content code-snippet-modal">
                <header className="modal-header">
                    <h3>Enviar Trecho de Código</h3>
                    <button onClick={onClose} className="modal-close-btn">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </header>
                <div className="modal-body">
                    <div className="language-selector">
                        <label htmlFor="language">Linguagem:</label>
                        <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                            {supportedLanguages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                    <textarea
                        className="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Cole seu código aqui..."
                    />
                    <div className="code-preview">
                        <h4>Preview:</h4>
                        <SyntaxHighlighter language={language} style={coldarkDark} showLineNumbers>
                            {code || "// O preview do seu código aparecerá aqui"}
                        </SyntaxHighlighter>
                    </div>
                </div>
                <footer className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={!code.trim()}>Enviar</button>
                </footer>
            </div>
        </div>
    );
};

export default CodeSnippetModal;
