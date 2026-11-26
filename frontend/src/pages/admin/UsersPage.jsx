import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Edit2, Trash2, Shield, Loader2, Search, X } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const UsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'resident', is_active: true });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setForm({ username: user.username, email: user.email, password: '', role: user.role, is_active: user.is_active });
    } else {
      setEditingUser(null);
      setForm({ username: '', email: '', password: '', role: 'resident', is_active: true });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, { role: form.role, is_active: form.is_active, password: form.password });
        toast({ variant: 'success', title: 'User updated' });
      } else {
        if (!form.password) throw new Error('Password is required for new users');
        await api.post('/admin/users', form);
        toast({ variant: 'success', title: 'User created' });
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: err.response?.data?.message || err.message || 'Action failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast({ variant: 'success', title: 'User deleted' });
      fetchUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to delete user' });
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 anim-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Users className="w-6 h-6 text-success" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage residents, guards, and administrators.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border border-input rounded-lg text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-border">
              <tr>
                {['Username', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="6" className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 spin mx-auto mb-2"/> Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-muted transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{user.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                        ${user.role === 'admin' ? 'bg-info-bg text-info' : 
                          user.role === 'guard' ? 'bg-info-bg text-info' : 'bg-success-bg text-success'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${user.is_active ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenModal(user)} className="p-1 text-muted-foreground hover:text-info transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-1 text-muted-foreground hover:text-danger transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 anim-fade-in">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted">
              <h3 className="font-bold text-foreground">{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Username</label>
                <input 
                  type="text" 
                  value={form.username} 
                  onChange={e => setForm({...form, username: e.target.value})} 
                  disabled={!!editingUser}
                  className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  disabled={!!editingUser}
                  className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'} {editingUser ? '' : <span className="text-danger">*</span>}
                </label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                  className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" 
                  required={!editingUser} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Role</label>
                  <select 
                    value={form.role} 
                    onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="resident">Resident</option>
                    <option value="guard">Guard</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
                  <select 
                    value={form.is_active ? 'active' : 'inactive'} 
                    onChange={e => setForm({...form, is_active: e.target.value === 'active'})}
                    className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 spin"/>}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UsersPage;
