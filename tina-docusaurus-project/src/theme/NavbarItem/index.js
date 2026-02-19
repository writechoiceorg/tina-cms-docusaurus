import React from 'react';
import NavbarItem from '@theme-original/NavbarItem';
import { useAuth } from '@site/src/context/AuthContext'; // Ajuste o path se necessário

export default function NavbarItemWrapper(props) {
  const { user } = useAuth(); // Assume que seu context exporta o usuário atual
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin');

  // Lógica de restrição para a Navbar
  // Se o item for a sidebar "Beta" e o user NÃO tiver a role "beta" (nem admin)
  if (props.sidebarId === 'testerSidebar' && !roles.includes('beta') && !isAdmin) {
    return null; // Oculta o item da navbar
  }

  // Se o item for a sidebar "Enterprise" e o user NÃO tiver a role "enterprise" (nem admin)
  if (props.sidebarId === 'clientSidebar' && !roles.includes('enterprise') && !isAdmin) {
    return null; // Oculta o item da navbar
  }

  // Renderiza normalmente para o restante
  return <NavbarItem {...props} />;
}