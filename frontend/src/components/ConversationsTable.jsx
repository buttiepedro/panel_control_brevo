import React from 'react';

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('es-AR');
  } catch {
    return '-';
  }
}

function StatusBadge({ conversation }) {
  if (!conversation.isSilenced) {
    return <span className="status-badge active">Activo</span>;
  }

  const isBot = conversation.silencedBy === 'bot';
  return (
    <span className={`status-badge ${isBot ? 'silenced-bot' : 'silenced-manual'}`}>
      {isBot ? 'Silenciado por bot' : 'Silenciado manual'}
    </span>
  );
}

export default function ConversationsTable({
  conversations,
  onToggleSilence,
  onDelete,
  loading,
}) {
  if (loading) {
    return <div className="empty-card elev">Cargando conversaciones...</div>;
  }

  if (!conversations.length) {
    return <div className="empty-card elev">No hay conversaciones aun.</div>;
  }

  return (
    <section className="conversations-list elev">
      <div className="table-header">
        <div>Contacto</div>
        <div>Estado</div>
        <div>Acciones</div>
      </div>
      {conversations.map((conversation) => (
        <article key={conversation.phoneNumber} className="conversation-item">
          <div className="conversation-info">
            <h3>{conversation.whatsappName || 'Sin nombre'}</h3>
            <p>{conversation.phoneNumber}</p>
            <p className="conversation-date">{formatDate(conversation.lastMessageAt)}</p>
          </div>

          <div className="conversation-status">
            <StatusBadge conversation={conversation} />
          </div>

          <div className="conversation-actions">
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
      ))}
    </section>
  );
}
