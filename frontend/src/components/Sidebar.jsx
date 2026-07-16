import React from 'react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'conversations', label: 'Conversaciones' },
  { id: 'stats', label: 'Estadisticas' },
  { id: 'config', label: 'Configuracion' },
];

export default function Sidebar({ activeTab, onTabChange, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="dot" />
        <span>Panel Brevo</span>
      </div>

      <nav className="sidebar-menu">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="bot-status">
          <span className="indicator" />
          Sistema Activo
        </div>
        <button className="logout-btn" type="button" onClick={onLogout}>
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
