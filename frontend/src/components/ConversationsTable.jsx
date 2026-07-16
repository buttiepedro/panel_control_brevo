import React, { useState, useMemo } from 'react';

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('es-AR');
  } catch {
    return '-';
  }
}

function StatusBadge({ conversation }) {
  if (!conversation.isSilenced) {
    return <span className="status-badge active">-</span>;
  }

  const isBot = conversation.silencedBy === 'bot';
  return (
    <span className={`status-badge ${isBot ? 'silenced-bot' : 'silenced-manual'}`}>
      {isBot ? 'Bot' : 'Asesor'}
    </span>
  );
}

export default function ConversationsTable({
  conversations,
  onToggleSilence,
  onDelete,
  loading,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar y ordenar
  const filteredAndSorted = useMemo(() => {
    let result = conversations.filter(
      (conv) =>
        (conv.whatsappName && conv.whatsappName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        conv.phoneNumber.includes(searchTerm)
    );

    result.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || 0);
      const dateB = new Date(b.lastMessageAt || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [conversations, searchTerm, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredAndSorted.slice(startIdx, startIdx + itemsPerPage);

  if (loading) {
    return <div className="empty-card elev">Cargando conversaciones...</div>;
  }

  if (!conversations.length) {
    return <div className="empty-card elev">No hay conversaciones aun.</div>;
  }

  return (
    <section className="conversations-section">
      {/* Controles de búsqueda y orden */}
      <div className="table-controls elev">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
        <button
          type="button"
          className="sort-btn"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          title={sortOrder === 'desc' ? 'Más nuevos primero' : 'Más antiguos primero'}
        >
          📅 {sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}
        </button>
        <span className="result-count">
          {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Tabla */}
      <div className="conversations-list elev">
        <div className="table-header">
          <div className="col-contact">Contacto</div>
          <div className="col-date">Última msg</div>
          <div className="col-status">Silenciado por</div>
          <div className="col-actions">Acciones</div>
        </div>
        {paginatedItems.length > 0 ? (
          paginatedItems.map((conversation) => (
            <article key={conversation.phoneNumber} className="conversation-item">
              <div className="col-contact">
                <h3>{conversation.whatsappName || 'Sin nombre'}</h3>
                <p>{conversation.phoneNumber}</p>
              </div>

              <div className="col-date">
                <p>{formatDate(conversation.lastMessageAt)}</p>
              </div>

              <div className="col-status">
                <StatusBadge conversation={conversation} />
              </div>

              <div className="col-actions">
                <button
                  type="button"
                  className={`action-btn ${conversation.isSilenced ? 'unsilence' : 'silence'}`}
                  onClick={() => onToggleSilence(conversation)}
                >
                  {conversation.isSilenced ? 'Activar' : 'Silenciar'}
                </button>
                <button
                  type="button"
                  className="action-btn delete"
                  onClick={() => onDelete(conversation)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="no-results">Sin resultados para "{searchTerm}"</div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination elev">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}
