import React from 'react';
import DocSidebarItems from '@theme-original/DocSidebarItems';
import { useAuth } from '@site/src/context/AuthContext';

// Função que varre a Sidebar e deleta o que o usuário não pode ver
function filterSidebarItems(items, roles) {
  if (!items) return [];
  const isAdmin = roles.includes('admin');

  return items
    .filter((item) => {
      // Regras de bloqueio baseado no link (href)
      if (item.href) {
        if (item.href.startsWith('/docs/beta') && !roles.includes('beta') && !isAdmin) {
          return false;
        }
        if (item.href.startsWith('/docs/enterprise') && !roles.includes('enterprise') && !isAdmin) {
          return false;
        }
      }
      return true; // Mantém os outros links
    })
    .map((item) => {
      // Se for uma pasta/categoria, aplica o filtro dentro dos filhos dela também
      if (item.type === 'category') {
        return { ...item, items: filterSidebarItems(item.items, roles) };
      }
      return item;
    });
}

export default function DocSidebarItemsWrapper(props) {
  const { user } = useAuth();
  const roles = user?.roles || [];

  // Filtra as propriedades antes de passar pro Docusaurus
  const safeItems = filterSidebarItems(props.items, roles);

  return <DocSidebarItems {...props} items={safeItems} />;
}