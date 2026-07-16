import React from 'react';

export default function Header({ onRefresh, onLogout }) {
  return (
    <header className="header">
      <h1>Panel de Control</h1>
      <div className="header-actions">
        <button type="button" className="header-btn" onClick={onRefresh}>
          Actualizar
        </button>
        <button type="button" className="header-btn danger" onClick={onLogout}>
          Cerrar sesion
        </button>
      </div>
    </header>
  );
}
