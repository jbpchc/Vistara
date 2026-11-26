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
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Users className="w-6 h-6 text-green-800" /> Resident Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage homeowner profiles, contact info, and their app access.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Resident
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search residents by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                {['ID', 'Full Name', 'Contact Info', 'App Login', 'Properties', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 spin mx-auto mb-2"/> Loading...</td></tr>
              ) : filteredResidents.length === 0 ? (
                <tr><td colSpan="7" className="py-12 text-center text-gray-400">No residents found.</td></tr>
              ) : (
                filteredResidents.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.contact_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.User ? (
                        <div className="text-xs">
                          <p className="font-semibold">{r.User.username}</p>
                          <p className="text-gray-400">{r.User.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No App Access (Directory Only)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.Properties && r.Properties.length > 0 ? (
                        r.Properties.map(p => <div key={p.id} className="text-xs">Blk {p.block}, Lot {p.lot}</div>)
                      ) : (
                        <span className="text-xs text-orange-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.User ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${r.User.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.User.is_active ? 'Active' : 'Inactive'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-750">
                          Directory Resident
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenPropModal(r)} className="p-1 text-gray-400 hover:text-green-600 transition-colors" title="Manage Properties">
                          <Home className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenModal(r)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-800">{editingResident ? 'Edit Resident' : 'Create New Resident'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5">
              <form id="resident-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Resident Profile Info */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Resident Profile</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={form.full_name} 
                        onChange={e => setForm({...form, full_name: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Number</label>
                      <input 
                        type="text" 
                        value={form.contact_number} 
                        onChange={e => setForm({...form, contact_number: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
                      />
                    </div>
                  </div>
                </div>                 {/* App Account Info Toggle */}
                <div className="bg-gray-55 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">App Portal Access</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Allow this resident to log in to generate QR gate passes.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={form.enablePortal} 
                      onChange={e => setForm({...form, enablePortal: e.target.checked})} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-800"></div>
                  </label>
                </div>

                {/* App Account Info Details (Only if enabled) */}
                {form.enablePortal && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4 anim-fade-in">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Account Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={form.username} 
                          onChange={e => setForm({...form, username: e.target.value})} 
                          className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                        <input 
                          type="email" 
                          value={form.email} 
                          onChange={e => setForm({...form, email: e.target.value})} 
                          className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
                          required 
                        />
                      </div>
                    </div>
                    
                    {(!editingResident || !editingResident.User) ? (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="password" 
                          value={form.password} 
                          onChange={e => setForm({...form, password: e.target.value})} 
                          className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
                          required={!editingResident || !editingResident.User} 
                        />
                      </div>
                    ) : (
                      <div className="pt-1">
                        <p className="text-xs text-gray-400 italic">
                          💡 To change or reset this resident's password, please use <span className="font-semibold text-gray-600">User Management</span>.
                        </p>
                      </div>
                    )}

                    {editingResident && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
                        <select 
                          value={form.is_active ? 'active' : 'inactive'} 
                          onChange={e => setForm({...form, is_active: e.target.value === 'active'})}
                          className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700"
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

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 shrink-0">
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="resident-form"
                disabled={saving}
                className="px-4 py-2 text-sm font-bold text-white bg-green-800 hover:bg-green-900 rounded-lg transition-all flex items-center gap-2"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-700" />
                  Manage Properties
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Resident: <span className="font-semibold text-gray-700">{activeResident.full_name}</span></p>
              </div>
              <button onClick={() => setPropModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 space-y-6">
              {/* Existing Properties List */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3">Assigned Properties</h4>
                {(!activeResident.Properties || activeResident.Properties.length === 0) ? (
                  <div className="text-sm text-gray-400 bg-gray-50 border border-gray-100 rounded-lg p-4 text-center">
                    No properties assigned yet.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {activeResident.Properties.map(prop => (
                      <li key={prop.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center shrink-0">
                            <Home className="w-4 h-4 text-green-700" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Block {prop.block}, Lot {prop.lot}</p>
                            {prop.street && <p className="text-xs text-gray-500">{prop.street}</p>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Add New Property</h4>
                <form id="property-form" onSubmit={handleAddProperty} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Block</label>
                      <input 
                        type="text" 
                        value={propForm.block} 
                        onChange={e => setPropForm({...propForm, block: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Lot</label>
                      <input 
                        type="text" 
                        value={propForm.lot} 
                        onChange={e => setPropForm({...propForm, lot: e.target.value})} 
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Street (Optional)</label>
                    <input 
                      type="text" 
                      list="resident-streets-list"
                      value={propForm.street} 
                      onChange={e => setPropForm({...propForm, street: e.target.value})} 
                      placeholder="e.g. Maple Avenue"
                      className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-700" 
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

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 shrink-0">
              <button 
                type="button" 
                onClick={() => setPropModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button 
                type="submit" 
                form="property-form"
                disabled={propSaving || !propForm.block || !propForm.lot}
                className="px-4 py-2 text-sm font-bold text-white bg-green-800 hover:bg-green-900 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
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
