import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ConversationsTable from './components/ConversationsTable';
import LoginOverlay from './components/LoginOverlay';
import ToastContainer from './components/ToastContainer';
import ConfirmDialog from './components/ConfirmDialog';
import { findNewDerivations } from './lib/conversations';
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
  const [loadError, setLoadError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [newDerivationCount, setNewDerivationCount] = useState(0);
  const [pendingViewKey, setPendingViewKey] = useState(0);
  const snapshotRef = useRef(null);
  const requestRef = useRef(0);
  const [loginError, setLoginError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [quickFilter, setQuickFilter] = useState('pending'); // Por defecto 'pending' para que vean primero los derivados urgentes

  const [theme, setTheme] = useState(localStorage.getItem('bit-theme') || 'light');

  const password = useMemo(() => decodePassword(authToken), [authToken]);

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('bit-theme', nextTheme);
  }

  function pushToast(text, type = 'success') {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }

  async function loadData(currentPassword = password, silent = false) {
    if (!currentPassword) return;
    const requestId = ++requestRef.current;
    if (!silent) setLoading(true);
    try {
      const list = await fetchConversations(currentPassword);
      if (requestId !== requestRef.current) return;
      if (!Array.isArray(list)) throw new Error('El servidor devolvió una lista de conversaciones inválida.');
      if (snapshotRef.current) {
        const newItems = findNewDerivations(snapshotRef.current, list);
        if (newItems.length) setNewDerivationCount((count) => count + newItems.length);
      }
      snapshotRef.current = list;
      setConversations(list);
      setHasLoaded(true);
      setLoadError('');
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setLoadError(error.message || 'No se pudieron actualizar las conversaciones.');
      if (!silent) {
        pushToast(error.message || 'No se pudo cargar conversaciones', 'error');
      }
      if (error.message && error.message.toLowerCase().includes('contras')) {
        handleLogout();
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (password) {
      loadData(password);
      // Auto-refresco cada 25 segundos para atrapar derivaciones nuevas en tiempo real
      const timer = setInterval(() => {
        loadData(password, true);
      }, 25000);
      return () => {
        clearInterval(timer);
        requestRef.current += 1;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  async function handleLogin(plainPassword) {
    if (!plainPassword) {
      setLoginError('Ingresa una contraseña.');
      return;
    }

    try {
      await fetchConversations(plainPassword);
      const token = btoa(plainPassword);
      localStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
      setLoginError('');
      pushToast('Sesión iniciada', 'success');
    } catch (error) {
      setLoginError(error.message || 'No se pudo iniciar sesión.');
    }
  }

  function handleLogout() {
    requestRef.current += 1;
    snapshotRef.current = null;
    setLoadError('');
    setHasLoaded(false);
    setLoading(false);
    setNewDerivationCount(0);
    setDeleteTarget(null);
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
          silencedBy: shouldSilence ? 'manual' : null
        },
        password
      );
      pushToast(
        `Conversación ${shouldSilence ? 'silenciada' : 'reactivada para bot'} correctamente`,
        'success'
      );
      await loadData();
    } catch (error) {
      pushToast(error.message || 'No se pudo actualizar el estado', 'error');
    }
  }

  async function handleDelete(conversation) {
    await deleteConversation(conversation.phoneNumber, password);
    setDeleteTarget(null);
    pushToast('Conversación eliminada', 'success');
    await loadData();
  }

  async function handleMarkContacted(conversation) {
    try {
      await updateConversation(
        conversation.phoneNumber,
        {
          contactStatus: 'contacted',
          isSilenced: true,
          silencedBy: 'manual'
        },
        password
      );
      pushToast('✓ Marcada como contactada por asesor', 'success');
      await loadData();
    } catch (error) {
      pushToast(error.message || 'No se pudo marcar como contactado', 'error');
    }
  }

  return (
    <div className="app-root" data-theme={theme}>
      {!password ? (
        <LoginOverlay onLogin={handleLogin} error={loginError} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <div className="app-container">
          <main className="main-content">
            <Header onRefresh={() => loadData()} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
            <div className="scroll-area">
              {loadError && (
                <div className="refresh-error" role="alert">
                  <div>
                    <strong>No se pudo actualizar el panel.</strong>
                    <p>{loadError} {hasLoaded && 'Los datos visibles pueden estar desactualizados.'}</p>
                  </div>
                  <button type="button" className="header-btn" onClick={() => loadData()} disabled={loading}>
                    Reintentar
                  </button>
                </div>
              )}
              {(!loadError || hasLoaded) && (
                <>
                  <StatsCards
                    conversations={conversations}
                    activeQuickFilter={quickFilter}
                    onSelectQuickFilter={setQuickFilter}
                  />
                  <ConversationsTable
                    conversations={conversations}
                    onToggleSilence={handleToggleSilence}
                    onMarkContacted={handleMarkContacted}
                    onDelete={setDeleteTarget}
                    loading={loading}
                    activeQuickFilter={quickFilter}
                    resetFiltersKey={pendingViewKey}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      )}

      {password && deleteTarget && (
        <ConfirmDialog
          conversation={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((items) => items.filter((toast) => toast.id !== id))}
        newDerivationCount={newDerivationCount}
        onDismissDerivations={() => setNewDerivationCount(0)}
        onViewPending={() => {
          setQuickFilter('pending');
          setPendingViewKey((key) => key + 1);
          setNewDerivationCount(0);
        }}
      />
    </div>
  );
}
