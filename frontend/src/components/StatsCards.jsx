import React from 'react';

export default function StatsCards({ conversations }) {
  const total = conversations.length;
  const active = conversations.filter((conversation) => !conversation.isSilenced).length;
  const silenced = conversations.filter((conversation) => conversation.isSilenced).length;

  return (
    <section className="stats">
      <article className="stat-card elev">
        <h3>Total de conversaciones</h3>
        <p className="number">{total}</p>
      </article>
      <article className="stat-card elev">
        <h3>Conversaciones activas</h3>
        <p className="number">{active}</p>
      </article>
      <article className="stat-card elev">
        <h3>Silenciadas</h3>
        <p className="number">{silenced}</p>
      </article>
    </section>
  );
}
