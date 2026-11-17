import React, { useRef, useState } from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ conversation, onConfirm, onCancel }) {
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');

    try {
      await onConfirm(conversation);
    } catch (error) {
      setError(error.message || 'No se pudo eliminar la conversación. Intentá nuevamente.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="¿Eliminar conversación?"
      describedBy="confirm-description"
      onClose={() => {
        if (!submittingRef.current) onCancel();
      }}
    >
      <p id="confirm-description">
        Vas a eliminar el registro de <strong>{conversation.whatsappName || conversation.phoneNumber}</strong>.
        {' '}Esta acción no se puede deshacer.
      </p>
      {error && <p className="confirm-error" role="alert">{error}</p>}
      <div className="confirm-actions" aria-busy={submitting}>
        <button type="button" className="header-btn" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="button" className="confirm-delete-btn" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Eliminando…' : 'Eliminar conversación'}
        </button>
      </div>
    </Modal>
  );
}
