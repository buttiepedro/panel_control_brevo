import React from 'react';

export default function Header({ onRefresh, onLogout }) {
  const handleDashboardClick = () => {
    window.open('https://dashboard-frontend.rx65fd.easypanel.host/', '_blank');
  };

  return (
    <header className="header">
      <h1>Panel de Control</h1>
      <div className="header-actions">
        <button type="button" className="header-btn" onClick={handleDashboardClick}>
          📊 Dashboard
        </button>
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
