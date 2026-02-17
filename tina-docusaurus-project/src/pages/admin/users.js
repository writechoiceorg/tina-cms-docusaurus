import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';

export default function AdminUsers(){
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(){
      setLoading(true);
      try{
        const token = localStorage.getItem('demo_jwt');
        const res = await fetch('http://127.0.0.1:4002/api/users', { headers: { authorization: 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to fetch users');
        const json = await res.json();
        setUsers(json);
      }catch(e){ setError(String(e)); }
      setLoading(false);
    }
    load();
  }, []);

  async function revokeSessions(username){
    try{
      const token = localStorage.getItem('demo_jwt');
      const res = await fetch('http://127.0.0.1:4002/api/admin/revoke-user-sessions', { method: 'POST', headers: { 'Content-Type':'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ username }) });
      if (!res.ok) throw new Error('Failed');
      alert('Revoked sessions for ' + username);
    }catch(e){ alert(String(e)); }
  }

  async function delUser(id){
    if (!confirm('Delete user?')) return;
    try{
      const token = localStorage.getItem('demo_jwt');
      const res = await fetch('http://127.0.0.1:4002/api/users/' + id, { method: 'DELETE', headers: { authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('Failed');
      setUsers(u => u.filter(x => x.id !== id));
    }catch(e){ alert(String(e)); }
  }

  if (loading) return (
    <Layout title="Admin - Users">
      <div style={{padding:32}}>Loading users...</div>
    </Layout>
  );

  return (
    <Layout title="Admin - Users">
      <div style={{padding:32}}>
        <h1>Admin — Users</h1>
        {error && <div style={{color:'red'}}>{error}</div>}
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{textAlign:'left',borderBottom:'1px solid #e5e7eb'}}>
              <th style={{padding:'8px'}}>ID</th>
              <th>Username</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                <td style={{padding:'8px'}}>{u.id}</td>
                <td>{u.username}</td>
                <td>{(u.roles || []).join(', ')}</td>
                <td>
                  <button onClick={() => revokeSessions(u.username)} style={{marginRight:8}}>Revoke sessions</button>
                  <button onClick={() => delUser(u.id)} style={{color:'red'}}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
