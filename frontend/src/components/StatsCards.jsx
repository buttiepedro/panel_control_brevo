import React from 'react';
import { isPendingContact, isSameDay, wasDerivedOn } from '../lib/conversations';

export default function StatsCards({ conversations, activeQuickFilter, onSelectQuickFilter }) {
  const now = new Date();

  // Pendientes de contacto (derivados por bot que aún no fueron contactados)
  const pendingContact = conversations.filter(isPendingContact).length;

  const derivedToday = conversations.filter((c) => wasDerivedOn(c, now)).length;

  // Consultas de hoy (mensajes o creados hoy)
  const todayTotal = conversations.filter(
    (c) => isSameDay(c.lastMessageAt || c.createdAt, now)
  ).length;

  // Total acumulado
  const total = conversations.length;

  return (
    <section className="stats-dashboard">
      <button
        type="button"
        className={`stat-card stat-alert clickable ${activeQuickFilter === 'pending' ? 'active' : ''}`}
        onClick={() => onSelectQuickFilter('pending')}
        title="Ver consultas derivadas que esperan ser contactadas"
        aria-pressed={activeQuickFilter === 'pending'}
      >
        <div className="stat-header">
          <span className="stat-indicator pulse-red" />
          <span>Pendientes de contacto</span>
        </div>
        <span className="number danger">{pendingContact}</span>
        <span className="stat-sub">Derivadas sin contactar</span>
      </button>

      <button
        type="button"
        className={`stat-card stat-today-derived clickable ${activeQuickFilter === 'derived_today' ? 'active' : ''}`}
        onClick={() => onSelectQuickFilter('derived_today')}
        title="Ver todas las derivaciones ocurridas hoy"
        aria-pressed={activeQuickFilter === 'derived_today'}
      >
        <div className="stat-header">
          <span className="stat-indicator indicator-warn" />
          <span>Derivadas hoy</span>
        </div>
        <span className="number warn">{derivedToday}</span>
        <span className="stat-sub">Pasadas por el bot hoy</span>
      </button>

      <button
        type="button"
        className={`stat-card stat-today clickable ${activeQuickFilter === 'today' ? 'active' : ''}`}
        onClick={() => onSelectQuickFilter('today')}
        title="Ver todas las conversaciones activas hoy"
        aria-pressed={activeQuickFilter === 'today'}
      >
        <div className="stat-header">
          <span className="stat-indicator indicator-cyan" />
          <span>Consultas de hoy</span>
        </div>
        <span className="number cyan">{todayTotal}</span>
        <span className="stat-sub">Total entrantes del día</span>
      </button>

      <button
        type="button"
        className={`stat-card stat-total clickable ${activeQuickFilter === 'all' ? 'active' : ''}`}
        onClick={() => onSelectQuickFilter('all')}
        title="Ver historial completo"
        aria-pressed={activeQuickFilter === 'all'}
      >
        <div className="stat-header">
          <span className="stat-indicator indicator-neutral" />
          <span>Total histórico</span>
        </div>
        <span className="number neutral">{total}</span>
        <span className="stat-sub">Base total de contactos</span>
      </button>
    </section>
  );
}
