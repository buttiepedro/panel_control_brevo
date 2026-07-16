import React, { useState } from 'react';

export default function LoginOverlay({ onLogin, error }) {
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin(password);
  }

  return (
    <div className="login-overlay">
      <form className="login-container elev" onSubmit={handleSubmit}>
        <h2>Panel de Control</h2>
        <p>Ingresa la contrasena para acceder.</p>

        {error ? <div className="login-error">{error}</div> : null}

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contrasena"
          autoComplete="current-password"
        />

        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}
