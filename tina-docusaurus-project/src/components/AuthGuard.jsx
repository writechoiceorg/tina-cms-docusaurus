import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';

const ROLE_MAP = [
  { prefix: '/docs/beta', role: 'beta' },
  { prefix: '/docs/enterprise', role: 'enterprise' },
  { prefix: '/admin', role: 'admin' },
];

function requiredRoleFor(path) {
  for (const r of ROLE_MAP) {
    if (path === r.prefix || path.startsWith(r.prefix)) return r.role;
  }
  return null;
}

export default function AuthGuard({children}){
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check(){
      const path = location.pathname || '/';
      const role = requiredRoleFor(path);
      if (!role) return; // public
      setChecking(true);
      try{
        const token = localStorage.getItem('demo_jwt');
        if (!token) {
          window.location.href = `http://localhost:4002/login?next=${encodeURIComponent(window.location.href)}`;
          return;
        }
        const res = await fetch('http://127.0.0.1:4002/api/verify', { headers: { authorization: 'Bearer ' + token } });
        if (!res.ok) {
          window.location.href = `http://localhost:4002/login?next=${encodeURIComponent(window.location.href)}`;
          return;
        }
        const json = await res.json();
        const roles = json.user && json.user.roles ? json.user.roles : [];
        if (!roles.includes(role)) {
          // redirect to branded forbidden page
          window.location.pathname = '/forbidden';
        }
      }catch(e){
        window.location.href = `http://localhost:4002/login?next=${encodeURIComponent(window.location.href)}`;
      }finally{
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [location.pathname]);

  return children;
}
