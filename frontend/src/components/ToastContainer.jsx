import React from 'react';

export default function ToastContainer({ toasts }) {
  return (
    <div className="message-box" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`message ${toast.type}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
