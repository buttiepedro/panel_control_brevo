import React, { useState } from 'react';

export default function LoginOverlay({ onLogin, error, theme, onToggleTheme }) {
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin(password);
  }

  return (
    <div className="login-overlay">
      <form className="login-container" onSubmit={handleSubmit}>
        <div className="login-brand-badge">BIT · Control</div>
        <h2>Panel de Derivaciones</h2>
        <p>Ingresá la contraseña administrativa para acceder.</p>

        {error ? <div className="login-error">{error}</div> : null}

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          aria-label="Contraseña administrativa"
          autoComplete="current-password"
          autoFocus
        />

        <button type="submit" className="login-btn">Acceder</button>

        <button
          type="button"
          className="login-theme-btn"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        </button>
      </form>
    </div>
  );
}
