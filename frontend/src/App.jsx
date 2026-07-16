import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ConversationsTable from './components/ConversationsTable';
import LoginOverlay from './components/LoginOverlay';
import ToastContainer from './components/ToastContainer';
import {
  fetchConversations,
  updateConversation,
  deleteConversation,
} from './lib/api';

const TOKEN_KEY = 'authToken';

function decodePassword(token) {
  if (!token) return '';
  try {
    return atob(token);
  } catch {
    return '';
  }
}

export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [toasts, setToasts] = useState([]);

  const password = useMemo(() => decodePassword(authToken), [authToken]);

  function pushToast(text, type = 'success') {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }

  async function loadData(currentPassword = password) {
    if (!currentPassword) return;
    setLoading(true);
    try {
      const list = await fetchConversations(currentPassword);
      setConversations(Array.isArray(list) ? list : []);
    } catch (error) {
      pushToast(error.message || 'No se pudo cargar conversaciones', 'error');
      if (error.message && error.message.toLowerCase().includes('contras')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  // Cargar datos iniciales cuando se autentica
  useEffect(() => {
    if (password) loadData(password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  // Actualizar automáticamente cada 4 segundos
  useEffect(() => {
    if (!password) return;

    const interval = setInterval(() => {
      loadData(password);
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  async function handleLogin(plainPassword) {
    if (!plainPassword) {
      setLoginError('Ingresa una contrasena.');
      return;
    }

    try {
      await fetchConversations(plainPassword);
      const token = btoa(plainPassword);
      localStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
      setLoginError('');
      pushToast('Sesion iniciada', 'success');
    } catch (error) {
      setLoginError(error.message || 'No se pudo iniciar sesion.');
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken('');
    setConversations([]);
    setActiveTab('dashboard');
  }

  async function handleToggleSilence(conversation) {
    const shouldSilence = !conversation.isSilenced;

    try {
      await updateConversation(
        conversation.phoneNumber,
        {
          isSilenced: shouldSilence,
          silencedBy: shouldSilence ? 'manual' : null,
        },
        password
      );
      pushToast(
        `Conversacion ${shouldSilence ? 'silenciada' : 'activada'} correctamente`,
        'success'
      );
      await loadData();
    } catch (error) {
      pushToast(error.message || 'No se pudo actualizar el estado', 'error');
    }
  }

  async function handleDelete(conversation) {
    const confirmed = window.confirm('Eliminar esta conversacion?');
    if (!confirmed) return;

    try {
      await deleteConversation(conversation.phoneNumber, password);
      pushToast('Conversacion eliminada', 'success');
      await loadData();
    } catch (error) {
      pushToast(error.message || 'No se pudo eliminar la conversacion', 'error');
    }
  }

  return (
    <div className="app-root" data-theme="dark">
      {!password ? (
        <LoginOverlay onLogin={handleLogin} error={loginError} />
      ) : (
        <div className="app-container">
          <main className="main-content">
            <Header onRefresh={() => loadData()} onLogout={handleLogout} />
            <div className="scroll-area">
              <StatsCards conversations={conversations} />
              <ConversationsTable
                conversations={conversations}
                onToggleSilence={handleToggleSilence}
                onDelete={handleDelete}
                loading={loading}
              />
            </div>
          </main>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
