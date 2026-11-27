import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Edit2, Trash2, Loader2, Search, X, Home, MapPin } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ResidentsPage = () => {
  const { toast } = useToast();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    username: '', email: '', password: '', 
    full_name: '', contact_number: '', is_active: true 
  });

  // Property Modal State
  const [isPropModalOpen, setPropModalOpen] = useState(false);
  const [activeResident, setActiveResident] = useState(null);
  const [propForm, setPropForm] = useState({ block: '', lot: '', street: '' });
  const [propSaving, setPropSaving] = useState(false);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/residents');
      setResidents(res.data.data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load residents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResidents(); }, []);

  // Keep activeResident in sync with the fetched list
  useEffect(() => {
    if (activeResident && residents.length > 0) {
      const updated = residents.find(r => r.id === activeResident.id);
      if (updated) setActiveResident(updated);
    }
  }, [residents]);

  const handleOpenModal = (resident = null) => {
    if (resident) {
      setEditingResident(resident);
      setForm({ 
        username: resident.User?.username || '', 
        email: resident.User?.email || '', 
        password: '', 
        full_name: resident.full_name, 
        contact_number: resident.contact_number || '', 
        is_active: resident.User?.is_active ?? true,
        enablePortal: !!resident.User
      });
    } else {
      setEditingResident(null);
      setForm({ username: '', email: '', password: '', full_name: '', contact_number: '', is_active: true, enablePortal: true });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingResident) {
        // Update Resident & User
        await api.put(`/admin/residents/${editingResident.id}`, { 
          full_name: form.full_name,
          contact_number: form.contact_number,
          username: form.enablePortal ? form.username : '',
          email: form.enablePortal ? form.email : '',
          password: form.enablePortal ? form.password : '',
          is_active: form.is_active 
        });
        toast({ variant: 'success', title: 'Resident updated' });
      } else {
        // Create Resident + User
        const payload = {
          full_name: form.full_name,
          contact_number: form.contact_number,
          username: form.enablePortal ? form.username : '',
          email: form.enablePortal ? form.email : '',
          password: form.enablePortal ? form.password : ''
        };
        if (form.enablePortal && !form.password) {
          throw new Error('Password is required when App Portal Access is enabled.');
        }
        await api.post('/admin/residents', payload);
        toast({ variant: 'success', title: 'Resident created successfully' });
      }
      setModalOpen(false);
      fetchResidents();
    } catch (err) {
      console.error('FRONTEND SAVE ERROR:', err);
      const msg = err.response?.data?.message || err.message || 'Action failed';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resident and their account?')) return;
    try {
      await api.delete(`/admin/residents/${id}`);
      toast({ variant: 'success', title: 'Resident deleted' });
      fetchResidents();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to delete resident' });
    }
  };

  const handleOpenPropModal = (resident) => {
    setActiveResident(resident);
    setPropForm({ block: '', lot: '', street: '' });
    setPropModalOpen(true);
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    setPropSaving(true);
    try {
      await api.post('/admin/properties', {
        ResidentId: activeResident.id,
        block: propForm.block,
        lot: propForm.lot,
        street: propForm.street
      });
      toast({ variant: 'success', title: 'Property assigned successfully' });
      setPropForm({ block: '', lot: '', street: '' });
      fetchResidents();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to assign property' });
    } finally {
      setPropSaving(false);
    }
  };

  const handleDeleteProperty = async (propId) => {
    if (!window.confirm('Remove this property?')) return;
    try {
      await api.delete(`/admin/properties/${propId}`);
      toast({ variant: 'success', title: 'Property removed' });
      fetchResidents();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to remove property' });
    }
  };

  const filteredResidents = residents.filter(r => 
    (r.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.User?.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.User?.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const uniqueStreets = [...new Set(residents.flatMap(r => r.Properties || []).map(p => p.street).filter(Boolean))].sort();

  return (
    <div className="space-y-6 anim-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Users className="w-6 h-6 text-success" /> Resident Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage homeowner profiles, contact info, and their app access.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Resident
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search residents by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border border-input rounded-lg text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm stack-table">
            <thead className="bg-card border-b border-border">
              <tr>
                {['ID', 'Full Name', 'Contact Info', 'App Login', 'Properties', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="7" className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 spin mx-auto mb-2"/> Loading...</td></tr>
              ) : filteredResidents.length === 0 ? (
                <tr><td colSpan="7" className="py-12 text-center text-muted-foreground">No residents found.</td></tr>
              ) : (
                filteredResidents.map(r => (
                  <tr key={r.id} className="hover:bg-muted transition-colors">
                    <td data-label="ID" className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.id}</td>
                    <td data-label="Full name" className="px-4 py-3 font-semibold text-foreground">{r.full_name}</td>
                    <td data-label="Contact" className="px-4 py-3 text-muted-foreground">{r.contact_number || '—'}</td>
                    <td data-label="App login" className="px-4 py-3 text-muted-foreground">
                      {r.User ? (
                        <div className="text-xs">
                          <p className="font-semibold">{r.User.username}</p>
                          <p className="text-muted-foreground">{r.User.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No App Access (Directory Only)</span>
                      )}
                    </td>
                    <td data-label="Properties" className="px-4 py-3 text-muted-foreground">
                      {r.Properties && r.Properties.length > 0 ? (
                        r.Properties.map(p => <div key={p.id} className="text-xs">Blk {p.block}, Lot {p.lot}</div>)
                      ) : (
                        <span className="text-xs text-warning">Unassigned</span>
                      )}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      {r.User ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${r.User.is_active ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                          {r.User.is_active ? 'Active' : 'Inactive'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info-bg text-info">
                          Directory Resident
                        </span>
                      )}
                    </td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenPropModal(r)} className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-success hover:bg-muted transition-colors" title="Manage Properties" aria-label="Manage Properties">
                          <Home className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenModal(r)} className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-info hover:bg-muted transition-colors" title="Edit" aria-label="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-muted transition-colors" title="Delete" aria-label="Delete">
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
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted shrink-0">
              <h3 className="font-bold text-foreground">{editingResident ? 'Edit Resident' : 'Create New Resident'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5">
              <form id="resident-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Resident Profile Info */}
                <div>
                  <h4 className="text-sm font-bold text-foreground border-b pb-2 mb-3">Resident Profile</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={form.full_name} 
                        onChange={e => setForm({...form, full_name: e.target.value})} 
                        className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Contact Number</label>
                      <input 
                        type="text" 
                        value={form.contact_number} 
                        onChange={e => setForm({...form, contact_number: e.target.value})} 
                        className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                      />
                    </div>
                  </div>
                </div>                 {/* App Account Info Toggle */}
                <div className="bg-muted border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">App Portal Access</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow this resident to log in to generate QR gate passes.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={form.enablePortal} 
                      onChange={e => setForm({...form, enablePortal: e.target.checked})} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-800"></div>
                  </label>
                </div>

                {/* App Account Info Details (Only if enabled) */}
                {form.enablePortal && (
                  <div className="border border-border rounded-xl p-4 bg-card space-y-4 anim-fade-in">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Username <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          value={form.username} 
                          onChange={e => setForm({...form, username: e.target.value})} 
                          className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Email Address <span className="text-danger">*</span></label>
                        <input 
                          type="email" 
                          value={form.email} 
                          onChange={e => setForm({...form, email: e.target.value})} 
                          className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                          required 
                        />
                      </div>
                    </div>
                    
                    {(!editingResident || !editingResident.User) ? (
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Password <span className="text-danger">*</span>
                        </label>
                        <input 
                          type="password" 
                          value={form.password} 
                          onChange={e => setForm({...form, password: e.target.value})} 
                          className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                          required={!editingResident || !editingResident.User} 
                        />
                      </div>
                    ) : (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground italic">
                          💡 To change or reset this resident's password, please use <span className="font-semibold text-muted-foreground">User Management</span>.
                        </p>
                      </div>
                    )}

                    {editingResident && (
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Account Status</label>
                        <select 
                          value={form.is_active ? 'active' : 'inactive'} 
                          onChange={e => setForm({...form, is_active: e.target.value === 'active'})}
                          className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

              </form>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted shrink-0">
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="resident-form"
                disabled={saving}
                className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 spin"/>}
                {editingResident ? 'Save Changes' : 'Create Resident'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Property Management Modal Overlay */}
      {isPropModalOpen && activeResident && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 anim-fade-in">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted shrink-0">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-success" />
                  Manage Properties
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Resident: <span className="font-semibold text-foreground">{activeResident.full_name}</span></p>
              </div>
              <button onClick={() => setPropModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 space-y-6">
              {/* Existing Properties List */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-3">Assigned Properties</h4>
                {(!activeResident.Properties || activeResident.Properties.length === 0) ? (
                  <div className="text-sm text-muted-foreground bg-muted border border-border rounded-lg p-4 text-center">
                    No properties assigned yet.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {activeResident.Properties.map(prop => (
                      <li key={prop.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-success-bg rounded-md flex items-center justify-center shrink-0">
                            <Home className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Block {prop.block}, Lot {prop.lot}</p>
                            {prop.street && <p className="text-xs text-muted-foreground">{prop.street}</p>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 text-danger hover:text-danger hover:bg-danger-bg rounded transition-colors"
                          title="Remove Property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add New Property Form */}
              <div className="bg-muted border border-border rounded-xl p-4">
                <h4 className="text-sm font-bold text-foreground mb-3">Add New Property</h4>
                <form id="property-form" onSubmit={handleAddProperty} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Block</label>
                      <input 
                        type="text" 
                        value={propForm.block} 
                        onChange={e => setPropForm({...propForm, block: e.target.value})} 
                        className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Lot</label>
                      <input 
                        type="text" 
                        value={propForm.lot} 
                        onChange={e => setPropForm({...propForm, lot: e.target.value})} 
                        className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Street (Optional)</label>
                    <input 
                      type="text" 
                      list="resident-streets-list"
                      value={propForm.street} 
                      onChange={e => setPropForm({...propForm, street: e.target.value})} 
                      placeholder="e.g. Maple Avenue"
                      className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring" 
                    />
                    <datalist id="resident-streets-list">
                      {uniqueStreets.map(street => (
                        <option key={street} value={street} />
                      ))}
                    </datalist>
                  </div>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted shrink-0">
              <button 
                type="button" 
                onClick={() => setPropModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Close
              </button>
              <button 
                type="submit" 
                form="property-form"
                disabled={propSaving || !propForm.block || !propForm.lot}
                className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {propSaving && <Loader2 className="w-4 h-4 spin"/>}
                <Plus className="w-4 h-4" /> Add Property
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ResidentsPage;
