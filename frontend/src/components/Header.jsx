import React from 'react';

export default function Header({ onRefresh, onLogout, theme, onToggleTheme }) {
  const handleDashboardClick = () => {
    window.open('https://dashboard-frontend.rx65fd.easypanel.host/', '_blank');
  };

  return (
    <header className="header">
      <div className="header-title-box">
        <div className="brand-badge">GM promociones · Brevo</div>
        <h1>Panel de Derivaciones</h1>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="header-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo papel cálido' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? 'Claro' : 'Oscuro'}
        </button>
        <button type="button" className="header-btn" onClick={handleDashboardClick}>
          Dashboard ↗
        </button>
        <button type="button" className="header-btn" onClick={onRefresh}>
          Actualizar
        </button>
        <button type="button" className="header-btn danger" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
