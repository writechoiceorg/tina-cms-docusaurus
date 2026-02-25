import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form Control (Create / Edit)
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: null, username: '', password: '', roles: '' });

  // Robust token fetcher (tries Cookie first, then LocalStorage)
  const getToken = () => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;)\s*demo_jwt=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return typeof localStorage !== 'undefined' ? localStorage.getItem('demo_jwt') : null;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // CORRIGIDO: Caminho relativo
      const res = await fetch('/api/users', {
        headers: { authorization: 'Bearer ' + getToken() }
      });
      if (!res.ok) throw new Error('Failed to load users. Please verify your administrator privileges.');
      const json = await res.json();
      setUsers(json);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  async function revokeSessions(username) {
    if (!confirm(`Are you sure you want to revoke all active sessions for "${username}"?`)) return;
    try {
      // CORRIGIDO: Caminho relativo
      const res = await fetch('/api/admin/revoke-user-sessions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          authorization: 'Bearer ' + getToken() 
        },
        body: JSON.stringify({ username })
      });
      if (!res.ok) throw new Error('Failed to revoke user sessions.');
      alert(`Sessions successfully revoked for ${username}. The user will be required to authenticate again.`);
    } catch (e) { alert(String(e)); }
  }

  async function delUser(id) {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    try {
      // CORRIGIDO: Caminho relativo
      const res = await fetch('/api/users/' + id, {
        method: 'DELETE',
        headers: { authorization: 'Bearer ' + getToken() }
      });
      if (!res.ok) throw new Error('Failed to delete user.');
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e) { alert(String(e)); }
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    try {
      const isNew = formData.id === 'new';
      // CORRIGIDO: Caminho relativo
      const url = isNew ? '/api/users' : `/api/users/${formData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const rolesArray = formData.roles.split(',').map(r => r.trim()).filter(Boolean);

      const payload = {
        roles: rolesArray,
      };
      
      if (formData.username && isNew) payload.username = formData.username;
      if (formData.password) payload.password = formData.password;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          authorization: 'Bearer ' + getToken() 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save user data.');
      }

      setShowForm(false);
      fetchUsers(); 
    } catch (e) {
      alert(String(e));
    }
  }

  function openCreateForm() {
    setFormData({ id: 'new', username: '', password: '', roles: 'beta' });
    setShowForm(true);
  }

  function openEditForm(user) {
    setFormData({ 
      id: user.id, 
      username: user.username, 
      password: '', 
      roles: (user.roles || []).join(', ') 
    });
    setShowForm(true);
  }

  if (loading) return <Layout title="User Management"><div style={{ padding: 32 }}>Loading data...</div></Layout>;

  return (
    <Layout title="User Management">
      <div style={{ padding: 32, maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>User Management</h1>
          <button className="button button--primary" onClick={openCreateForm}>
            Add User
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--ifm-color-danger)', marginBottom: '20px', padding: '12px', border: '1px solid var(--ifm-color-danger-light)', borderRadius: '4px', backgroundColor: 'var(--ifm-color-danger-contrast-background)' }}>
            {error}
          </div>
        )}

        {showForm && (
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>
              {formData.id === 'new' ? 'Create New User' : `Edit User: ${formData.username}`}
            </h3>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formData.id === 'new' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Username</label>
                  <input required type="text" className="navbar__search-input" style={{ width: '100%', padding: '8px 12px' }}
                    value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Password</label>
                <input type="password" placeholder={formData.id === 'new' ? '' : 'Leave blank to keep current password'} className="navbar__search-input" style={{ width: '100%', padding: '8px 12px' }}
                  required={formData.id === 'new'} 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Roles</label>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-emphasis-600)', marginTop: 0, marginBottom: '8px' }}>
                  Comma-separated values (e.g., admin, beta, enterprise)
                </p>
                <input type="text" className="navbar__search-input" style={{ width: '100%', padding: '8px 12px' }}
                  value={formData.roles} onChange={e => setFormData({...formData, roles: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="button button--primary">Save Changes</button>
                <button type="button" className="button button--secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--ifm-color-emphasis-300)', color: 'var(--ifm-color-emphasis-700)' }}>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>Username</th>
              <th style={{ padding: '12px 8px', fontWeight: 600 }}>Roles</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                <td style={{ padding: '12px 8px', color: 'var(--ifm-color-emphasis-600)' }}>{u.id}</td>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>{u.username}</td>
                <td style={{ padding: '12px 8px' }}>
                  {(u.roles || []).map(r => (
                    <span key={r} style={{ background: 'var(--ifm-color-emphasis-200)', color: 'var(--ifm-font-color-base)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '6px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {r}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button className="button button--secondary button--sm" onClick={() => openEditForm(u)}>Edit</button>
                    <button className="button button--secondary button--sm" onClick={() => revokeSessions(u.username)}>Revoke</button>
                    <button className="button button--danger button--sm" onClick={() => delUser(u.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}