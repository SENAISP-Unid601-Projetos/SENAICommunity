/* Layout da página de Eventos corrigido para 2 colunas */
.container {
  grid-template-columns: 280px 1fr;
  grid-template-areas: "sidebar main"; /* Define as áreas do grid */
}

/* Garante que não haja uma sidebar fantasma à direita */
.right-sidebar {
    display: none;
}

.main-content {
    grid-area: main; /* Associa o conteúdo principal à área 'main' */
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.eventos-header {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--card-radius);
  border: 1px solid var(--border-color);
}
.eventos-header h1 { color: var(--accent-primary); margin-bottom: 0.5rem; }
.eventos-header p { color: var(--text-secondary); }

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: var(--card-radius);
  border: 1px solid var(--border-color);
}
.filters-container select {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
}

.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.evento-card {
  background-color: var(--bg-secondary);
  border-radius: var(--card-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.evento-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow);
}

.evento-imagem {
  height: 160px;
  background-size: cover;
  background-position: center;
  position: relative;
  background-color: var(--bg-tertiary);
}
.evento-imagem::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
}

.evento-data {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(13, 17, 23, 0.8);
  color: white;
  border-radius: 6px;
  text-align: center;
  padding: 0.5rem;
  line-height: 1.1;
  border: 1px solid var(--border-color);
}
.evento-data span:first-child { font-size: 1.5rem; font-weight: 700; display: block; }
.evento-data span:last-child { font-size: 0.75rem; text-transform: uppercase; }

.evento-conteudo {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.evento-categoria {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-primary);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}
.evento-titulo {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  line-height: 1.4;
  flex-grow: 1;
}
.evento-detalhe {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}
.evento-detalhe i { width: 15px; text-align: center; }

.evento-card .rsvp-btn {
  width: 100%;
  background-color: var(--accent-primary);
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: var(--transition);
}
.evento-card .rsvp-btn:hover { background-color: var(--accent-secondary); }
.evento-card .rsvp-btn.confirmed { background-color: var(--success); }

/* Card "Meus Eventos" */
.meus-eventos-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--card-radius);
  padding: 1.5rem;
}
.meus-eventos-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}
#meus-eventos-lista {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}
#meus-eventos-lista .evento-confirmado-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background-color: var(--bg-tertiary);
}
#meus-eventos-lista .empty-message {
    color: var(--text-secondary);
    font-size: 0.875rem;
    padding: 1rem 0;
}
