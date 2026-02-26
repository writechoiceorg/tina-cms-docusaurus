import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

const ACCESS_RULES = {
  '/docs/beta': ['beta', 'admin'],
  '/docs/enterprise': ['enterprise', 'admin'],
  '/admin': ['admin'],
};

function hasAccess(roles, path) {
  for (const rulePath in ACCESS_RULES) {
    if (path.startsWith(rulePath)) {
      const requiredRoles = ACCESS_RULES[rulePath];
      return requiredRoles.some(requiredRole => roles.includes(requiredRole));
    }
  }
  return true;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      const token = getCookie('demo_jwt');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // CORRIGIDO: Caminho relativo
        const response = await fetch('/api/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const { user: userData } = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          document.cookie = 'demo_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
      } finally {
        setLoading(false);
      }
    }
    verifyUser();
  }, []);

  const login = () => {
    const redirectUrl = window.location.href;
    // CORRIGIDO: Caminho relativo para login
    window.location.href = `/login?next=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    const token = getCookie('demo_jwt');
    try {
      if (token) {
        // CORRIGIDO: Caminho relativo
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      document.cookie = 'demo_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/';
    }
  };

  const canAccessPath = (path) => {
    if (!path) return true;
    if (!isAuthenticated) return false;
    const userRoles = user?.roles || [];
    return hasAccess(userRoles, path);
  };
  
  const canAccessSidebar = (sidebarId) => {
    if (!isAuthenticated) return false;
    const userRoles = user?.roles || [];
    if (sidebarId === 'testerSidebar') {
        return userRoles.includes('beta') || userRoles.includes('admin');
    }
    if (sidebarId === 'clientSidebar') {
        return userRoles.includes('enterprise') || userRoles.includes('admin');
    }
    return true;
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    canAccessPath,
    canAccessSidebar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}