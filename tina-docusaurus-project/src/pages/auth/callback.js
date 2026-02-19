import React, {useEffect} from 'react';
import Layout from '@theme/Layout';

function parseQuery() {
  const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  if (!q) return {};
  return { token: q.get('token'), next: q.get('next') || '/' };
}

export default function AuthCallback(){
  useEffect(() => {
    const { token, next } = parseQuery();
    if (token) {
      // set cookie for this domain so server-side middleware receives it
      try {
        document.cookie = 'demo_jwt=' + encodeURIComponent(token) + '; path=/; max-age=' + (8*3600) + '; SameSite=Lax';
      } catch (e) {}
      // also store in localStorage for client-side guard
      try { localStorage.setItem('demo_jwt', token); } catch (e) {}
      // redirect to original destination
      window.location.href = next;
    } else {
      // nothing to do
      window.location.href = '/';
    }
  }, []);

  return (
    <Layout title="Authenticating...">
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>Authenticating...</div>
    </Layout>
  );
}
