import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthButton() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout(); 
    // Limpa o cookie forçadamente
    document.cookie = "demo_jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Recarrega a página para limpar o estado do Docusaurus
    window.location.href = '/'; 
  };

  if (user) {
    const isAdmin = user.roles?.includes('admin');

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Painel visível apenas para Admins */}
        {isAdmin && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            borderRight: '1px solid var(--ifm-color-emphasis-300)', 
            paddingRight: '16px', 
            marginRight: '4px' 
          }}>
            <a className="button button--outline button--primary button--sm" href="/admin">
              CMS Editor
            </a>
            <a className="button button--outline button--primary button--sm" href="/admin/users">
              Manage Users
            </a>
          </div>
        )}
        
        {/* Perfil e Logout (Padrão para todos logados) */}
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: 'var(--ifm-font-color-base)',
          letterSpacing: '0.3px'
        }}>
          {user.username}
        </span>
        <button className="button button--secondary button--sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // Visão de quem não está logado
  return (
    <a className="button button--primary button--sm" href="http://localhost:4002/login?next=http://localhost:3000">
      Sign In
    </a>
  );
}