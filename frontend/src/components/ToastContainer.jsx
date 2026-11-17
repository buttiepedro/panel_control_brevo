import React from 'react';

export default function ToastContainer({
  toasts, onDismiss, newDerivationCount, onDismissDerivations, onViewPending
}) {
  return (
    <div className="message-box" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`message ${toast.type}`}>
          <span>{toast.text}</span>
          <button type="button" className="toast-close" aria-label="Cerrar notificación" onClick={() => onDismiss(toast.id)}>
            ×
          </button>
        </div>
      ))}
      {newDerivationCount > 0 && (
        <div className="message info">
          <div>
            <strong>
              {newDerivationCount === 1 ? 'Nueva derivación del bot' : `${newDerivationCount} nuevas derivaciones del bot`}
            </strong>
            <p>Revisá las consultas derivadas y las que siguen pendientes.</p>
            <button type="button" className="header-btn" onClick={onViewPending}>Ver pendientes</button>
          </div>
          <button type="button" className="toast-close" aria-label="Cerrar aviso de derivaciones" onClick={onDismissDerivations}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
