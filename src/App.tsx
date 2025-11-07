import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';


import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import BoostPage from './pages/BoostPage';
import SuccessPage from './pages/SuccessPage';
import PublicProfilePage from './pages/PublicProfilePage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import AdminSallesPage from './pages/AdminSallesPage';
import { NotificationsProvider, Toasts } from './contexts/NotificationsContext';
import AdminProfilsPage from './pages/AdminProfilsPage';


// ---------- Utilitaires ----------
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Chargement…</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

// ---------- Header avec badge ----------
const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { newCount, hasNew, reset } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Quand on est sur /messages ou /chat/:id → on remet le compteur à zéro
  React.useEffect(() => {
    if (location.pathname.startsWith('/messages') || location.pathname.startsWith('/chat/')) {
      reset();
    }
  }, [location.pathname, reset]);

  const goMessages = () => {
    reset();
    navigate('/messages');
  };

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-bold text-xl text-blue-600">ParrainSport</Link>

        <nav className="ml-6 flex items-center gap-4 text-sm">
          <Link to="/" className="hover:underline">Accueil</Link>

          {/* Lien Messages avec badge */}
          <button
            onClick={goMessages}
            className="relative hover:underline"
            title="Messages"
          >
            Messages
            {hasNew && (
              <span
                className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center"
                aria-label={`${newCount} nouveaux messages`}
              >
                {newCount}
              </span>
            )}
          </button>

          <Link to="/profil" className="hover:underline">Mon profil</Link>
          <Link to="/boost" className="hover:underline">Booster</Link>
          <Link to="/admin/salles" className="hover:underline">Admin · Salles</Link>
        </nav>

        <div className="ml-auto">
          {user ? (
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm hover:opacity-90"
            >
              Déconnexion
            </button>
          ) : (
            <Link to="/" className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

// ---------- Shell ----------
const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
  path="/admin/salles"
  element={
    <ProtectedRoute>
      <AdminSallesPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/profils"
  element={
    <ProtectedRoute>
      <AdminProfilsPage />
    </ProtectedRoute>
  }
/>
          <Route
            path="/boost"
            element={
              <ProtectedRoute>
                <BoostPage />
              </ProtectedRoute>
            }
          />
          <Route path="/success" element={<SuccessPage />} />

          <Route path="/p/:userId" element={<PublicProfilePage />} />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/salles"
            element={
              <ProtectedRoute>
                <AdminSallesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500">
          © {new Date().getFullYear()} ParrainSport — Tous droits réservés
        </div>
      </footer>
    </div>
  );
};

// ---------- Root ----------
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <ScrollToTop />
          <AppShell />
          <Toasts />
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
