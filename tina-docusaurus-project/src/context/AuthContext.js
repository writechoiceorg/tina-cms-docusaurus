// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

// Helper function to parse JWT from cookies
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

// Define the access rules. This could be fetched from an API in the future.
// Based on middleware.js and docusaurus.config.js
const ACCESS_RULES = {
  '/docs/beta': ['beta', 'admin'],
  '/docs/enterprise': ['enterprise', 'admin'],
  '/admin': ['admin'],
};

function hasAccess(roles, path) {
  for (const rulePath in ACCESS_RULES) {
    // Check if the path is the rule path or a subpath
    if (path.startsWith(rulePath)) {
      const requiredRoles = ACCESS_RULES[rulePath];
      // Check if user has at least one of the required roles
      return requiredRoles.some(requiredRole => roles.includes(requiredRole));
    }
  }
  // No specific rule found for this path, allow access for any authenticated user.
  // Public paths are not checked by this function, they are handled by the UI structure.
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
        const response = await fetch('http://localhost:4002/api/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const { user: userData } = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token is invalid or expired, clear cookie
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
    // Redirect to the external login page, preserving the current path
    const redirectUrl = window.location.href;
    window.location.href = `http://localhost:4002/login?next=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    const token = getCookie('demo_jwt');
    try {
      if (token) {
        await fetch('http://localhost:4002/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear user state and cookie regardless of server result
      setUser(null);
      setIsAuthenticated(false);
      document.cookie = 'demo_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      // Optional: redirect to home page after logout
      window.location.href = '/';
    }
  };

  const canAccessPath = (path) => {
    if (!path) return true; // Assume accessible if no path provided
    if (!isAuthenticated) return false;
    const userRoles = user?.roles || [];
    return hasAccess(userRoles, path);
  };
  
  // This is a more specific check for the navbar items which are not paths
  const canAccessSidebar = (sidebarId) => {
    if (!isAuthenticated) return false;
    const userRoles = user?.roles || [];
    if (sidebarId === 'testerSidebar') {
        return userRoles.includes('beta') || userRoles.includes('admin');
    }
    if (sidebarId === 'clientSidebar') {
        return userRoles.includes('enterprise') || userRoles.includes('admin');
    }
    // Default allow for other sidebars like 'publicSidebar'
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
