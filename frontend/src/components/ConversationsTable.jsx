import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { isPendingContact, isSameDay, wasDerivedOn } from '../lib/conversations';

function formatDate(value) {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

function timeAgo(value) {
  if (!value) return null;
  try {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  } catch {
    return null;
  }
}

function StatusBadge({ conversation }) {
  if (isPendingContact(conversation)) {
    return <span className="status-badge badge-pending">Derivada · Sin contactar</span>;
  }

  if (conversation.contactStatus === 'contacted') {
    return <span className="status-badge badge-contacted">Contactado</span>;
  }

  if (!conversation.isSilenced) {
    return <span className="status-badge badge-bot-active">En bot</span>;
  }

  return <span className="status-badge badge-manual">Asesor manual</span>;
}

export default function ConversationsTable({
  conversations,
  onToggleSilence,
  onMarkContacted,
  onDelete,
  loading,
  activeQuickFilter,
  onSelectQuickFilter,
  resetFiltersKey
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailConversation, setDetailConversation] = useState(null);
  const itemsPerPage = 12;

  const now = new Date();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeQuickFilter]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('all');
  }, [resetFiltersKey]);

  // Filtrado compuesto (buscador + filtro rápido de tarjetas + selector desplegable)
  const filteredAndSorted = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    let result = conversations.filter((conv) => {
      const matchesSearch =
        (conv.whatsappName && conv.whatsappName.toLowerCase().includes(normalizedSearch)) ||
        conv.phoneNumber.includes(searchTerm) ||
        (conv.derivationReason && conv.derivationReason.toLowerCase().includes(normalizedSearch)) ||
        (conv.lastUserMessage && conv.lastUserMessage.toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) return false;

      const pending = isPendingContact(conv);

      // 1. Filtro rápido de tarjetas
      if (activeQuickFilter === 'pending' && !pending) return false;
      if (activeQuickFilter === 'derived_today' && !wasDerivedOn(conv, now)) {
        return false;
      }
      if (activeQuickFilter === 'today' && !isSameDay(conv.lastMessageAt || conv.createdAt, now)) {
        return false;
      }

      // 2. Filtro selector manual
      if (statusFilter === 'pending' && !pending) return false;
      if (statusFilter === 'contacted' && conv.contactStatus !== 'contacted') return false;
      if (statusFilter === 'active' && conv.isSilenced) return false;
      if (statusFilter === 'silenced' && !conv.isSilenced) return false;

      return true;
    });

    // Ordenamiento inteligente: las pendientes de contacto siempre van primero si estamos en modo general
    result.sort((a, b) => {
      const aPending = isPendingContact(a);
      const bPending = isPendingContact(b);

      if (aPending !== bPending) {
        return aPending ? -1 : 1;
      }

      // Si ambas son pendientes, ordenar por fecha en que el bot derivó (las que más tiempo llevan esperando primero)
      if (aPending && bPending) {
        const dateA = new Date(a.botSilencedAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.botSilencedAt || b.updatedAt || 0).getTime();
        return dateA - dateB;
      }

      const dateA = new Date(a.lastMessageAt || 0).getTime();
      const dateB = new Date(b.lastMessageAt || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [conversations, searchTerm, statusFilter, activeQuickFilter, sortOrder, now]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const page = Math.min(currentPage, Math.max(1, totalPages));
  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, Math.max(1, totalPages)));
  }, [totalPages]);
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedItems = filteredAndSorted.slice(startIdx, startIdx + itemsPerPage);

  return (
    <section className="conversations-section">
      {/* Controles de búsqueda, filtros rápidos y orden */}
      <div className="table-controls elev">
        <div className="quick-filter-tabs">
          <button
            type="button"
            className={`tab-pill ${activeQuickFilter === 'pending' ? 'active alert-pill' : ''}`}
            onClick={() => {
              onSelectQuickFilter('pending');
              setCurrentPage(1);
            }}
          >
            Pendientes de contacto
          </button>
          <button
            type="button"
            className={`tab-pill ${activeQuickFilter === 'derived_today' ? 'active' : ''}`}
            onClick={() => {
              onSelectQuickFilter('derived_today');
              setCurrentPage(1);
            }}
          >
            Derivadas hoy
          </button>
          <button
            type="button"
            className={`tab-pill ${activeQuickFilter === 'today' ? 'active' : ''}`}
            onClick={() => {
              onSelectQuickFilter('today');
              setCurrentPage(1);
            }}
          >
            Todo hoy
          </button>
          <button
            type="button"
            className={`tab-pill ${activeQuickFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              onSelectQuickFilter('all');
              setCurrentPage(1);
            }}
          >
            Ver Todas
          </button>
        </div>

        <div className="search-and-select">
          <input
            type="text"
            placeholder="Buscar por contacto, mensaje o motivo..."
            aria-label="Buscar conversaciones"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="all">Estado: Todos</option>
            <option value="pending">Solo pendientes</option>
            <option value="contacted">Ya contactados</option>
            <option value="active">En bot (activas)</option>
            <option value="silenced">Silenciadas</option>
          </select>
          <button
            type="button"
            className="sort-btn"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            title={sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
          >
            {sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}
          </button>
        </div>

        <span className="result-count">
          {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {/* Tabla con Columna de Contexto / Resumen */}
      <div className="conversations-list elev">
        <div className="table-header dashboard-grid">
          <div className="col-contact">Contacto</div>
          <div className="col-context">Contexto / Consulta</div>
          <div className="col-date">Último Mensaje</div>
          <div className="col-status">Estado</div>
          <div className="col-link">Chat</div>
          <div className="col-actions">Acciones</div>
        </div>

        {loading ? (
          <div className="empty-card">Actualizando lista...</div>
        ) : paginatedItems.length > 0 ? (
          paginatedItems.map((conversation) => {
            const pending = isPendingContact(conversation);

            const waitTime = pending
              ? timeAgo(conversation.botSilencedAt || conversation.updatedAt)
              : null;

            return (
              <article
                key={conversation.phoneNumber}
                className={`conversation-item dashboard-grid ${
                  pending ? 'conversation-item-urgent' : ''
                }`}
              >
                <div className="col-contact">
                  <div className="contact-main">
                    <h3 className="contact-name">{conversation.whatsappName || 'Sin nombre'}</h3>
                    <p className="contact-phone">{conversation.phoneNumber}</p>
                  </div>
                  {waitTime && (
                    <span className="wait-time-badge" title="Tiempo esperando atención de un asesor">
                      Esperando {waitTime}
                    </span>
                  )}
                </div>

                <div className="col-context">
                  {conversation.derivationReason ? (
                    <div className="context-reason" title={conversation.derivationReason}>
                      <span className="tag-reason">Motivo:</span> {conversation.derivationReason}
                    </div>
                  ) : null}
                  {conversation.lastUserMessage ? (
                    <div className="context-last-msg" title={conversation.lastUserMessage}>
                      “{conversation.lastUserMessage}”
                    </div>
                  ) : !conversation.derivationReason ? (
                    <span className="empty-context">Sin mensaje registrado</span>
                  ) : null}
                  {(conversation.derivationReason || conversation.lastUserMessage) && (
                    <button
                      type="button"
                      className="context-detail-btn"
                      aria-haspopup="dialog"
                      aria-label={`Ver detalle de ${conversation.whatsappName || conversation.phoneNumber}`}
                      onClick={() => setDetailConversation(conversation)}
                    >
                      Ver detalle
                    </button>
                  )}
                </div>

                <div className="col-date">
                  <p className="date-main">{formatDate(conversation.lastMessageAt)}</p>
                  <span className="date-sub">{timeAgo(conversation.lastMessageAt)}</span>
                </div>

                <div className="col-status">
                  <StatusBadge conversation={conversation} />
                </div>

                <div className="col-link">
                  {conversation.hipervinculo_conversacion ? (
                    <a
                      href={conversation.hipervinculo_conversacion}
                      target="_blank"
                      rel="noreferrer"
                      className="conversation-link-btn"
                      title="Abrir chat en Brevo"
                    >
                      Abrir Brevo ↗
                    </a>
                  ) : (
                    <span className="empty-link">-</span>
                  )}
                </div>

                <div className="col-actions">
                  {pending && (
                    <button
                      type="button"
                      className="action-btn contacted-btn pulse-glow"
                      onClick={() => onMarkContacted(conversation)}
                      title="Confirmar que ya le escribiste al cliente"
                    >
                      ✓ Marcar Contactado
                    </button>
                  )}
                  <button
                    type="button"
                    className={`action-btn ${conversation.isSilenced ? 'unsilence' : 'silence'}`}
                    onClick={() => onToggleSilence(conversation)}
                  >
                    {conversation.isSilenced ? 'Reactivar Bot' : 'Silenciar'}
                  </button>
                  <button
                    type="button"
                    className="action-btn delete"
                    onClick={() => onDelete(conversation)}
                    title="Eliminar registro"
                  >
                    ✕
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="no-results">
            {activeQuickFilter === 'pending'
              ? '¡Excelente! No hay consultas derivadas pendientes de contactar.'
              : 'No se encontraron conversaciones con los filtros aplicados.'}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination elev">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Siguiente →
          </button>
        </div>
      )}
      {detailConversation && (
        <Modal
          title="Detalle de la conversación"
          className="conversation-detail-dialog"
          focusTitle
          onClose={() => setDetailConversation(null)}
        >
          <p className="detail-contact">
            <strong>{detailConversation.whatsappName || 'Sin nombre'}</strong>
            <span>{detailConversation.phoneNumber}</span>
          </p>
          <section className="detail-section" aria-labelledby="detail-reason-title">
            <h3 id="detail-reason-title">Motivo de derivación / resumen</h3>
            <p>{detailConversation.derivationReason || 'Sin motivo de derivación registrado.'}</p>
          </section>
          <section className="detail-section" aria-labelledby="detail-message-title">
            <h3 id="detail-message-title">Último mensaje del contacto</h3>
            <p>{detailConversation.lastUserMessage || 'Sin mensaje registrado.'}</p>
          </section>
          <div className="confirm-actions">
            <button type="button" className="header-btn" onClick={() => setDetailConversation(null)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
