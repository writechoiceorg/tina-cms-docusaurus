import React, {useEffect, useState} from 'react';
import AuthGuard from '../components/AuthGuard';

function HeaderControls(){
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    try{
      const t = localStorage.getItem('demo_jwt');
      setLogged(!!t);
    }catch(e){ setLogged(false); }
    // listen for storage changes (other tabs)
    function onStorage(e){ if (e.key === 'demo_jwt') setLogged(!!e.newValue); }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!logged) return null;

  return (
    <div style={{position:'fixed',right:12,top:8,zIndex:9999}}>
      <a href="/logout" style={{background:'#0ea5a4',color:'#fff',padding:'8px 12px',borderRadius:8,textDecoration:'none',fontWeight:600}}>Sign out</a>
    </div>
  );
}

export default function Root({children}){
  return (
    <AuthGuard>
      <HeaderControls />
      {children}
    </AuthGuard>
  );
}
