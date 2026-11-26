import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Home, Plus, Edit2, Trash2, Loader2, Search, X } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/use-toast';

const PropertiesPage = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProp, setEditingProp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ResidentId: '', block: '', lot: '', street: '' });

  // Searchable Resident states
  const [residentSearch, setResidentSearch] = useState('');
  const [showResDropdown, setShowResDropdown] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, resRes] = await Promise.all([
        api.get('/admin/properties'),
        api.get('/admin/residents') // Fetch full resident profile and database ResidentId
      ]);
      setProperties(propRes.data.data || []);
      setResidents(resRes.data.data || []);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (prop = null) => {
    if (prop) {
      setEditingProp(prop);
      setForm({ ResidentId: prop.ResidentId, block: prop.block, lot: prop.lot, street: prop.street || '' });
      setResidentSearch(prop.Resident?.full_name || '');
    } else {
      setEditingProp(null);
      setForm({ ResidentId: '', block: '', lot: '', street: '' });
      setResidentSearch('');
    }
    setShowResDropdown(false);
    setModalOpen(true);
  };

  const handleAddMemberToHouse = (prop) => {
    setEditingProp(null);
    setForm({ ResidentId: '', block: prop.block, lot: prop.lot, street: prop.street || '' });
    setResidentSearch('');
    setShowResDropdown(false);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProp) {
        await api.put(`/admin/properties/${editingProp.id}`, form);
        toast({ variant: 'success', title: 'Property updated' });
      } else {
        await api.post('/admin/properties', form);
        toast({ variant: 'success', title: 'Property created' });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast({ variant: 'destructive', title: err.response?.data?.message || err.message || 'Action failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.delete(`/admin/properties/${id}`);
      toast({ variant: 'success', title: 'Property deleted' });
      fetchData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to delete property' });
    }
  };

  // Group properties by physical address (Block + Lot + Street)
  const groupedProperties = [];
  const groups = {};

  properties.forEach(p => {
    const key = `${p.block.trim().toLowerCase()}||${p.lot.trim().toLowerCase()}||${(p.street || '').trim().toLowerCase()}`;
    if (!groups[key]) {
      groups[key] = {
        block: p.block,
        lot: p.lot,
        street: p.street,
        members: []
      };
      groupedProperties.push(groups[key]);
    }
    
    if (p.Resident) {
      groups[key].members.push({
        id: p.Resident.id,
        property_id: p.id,
        full_name: p.Resident.full_name,
        username: p.Resident.User?.username,
        email: p.Resident.User?.email
      });
    }
  });

  const filteredGrouped = groupedProperties.filter(p => 
    p.block.toLowerCase().includes(search.toLowerCase()) || 
    p.lot.toLowerCase().includes(search.toLowerCase()) ||
    (p.street || '').toLowerCase().includes(search.toLowerCase()) ||
    p.members.some(m => 
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.username || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const uniqueStreets = [...new Set(properties.map(p => p.street).filter(Boolean))].sort();
  const selectedResident = residents.find(r => r.id === parseInt(form.ResidentId, 10));

  return (
    <div className="space-y-6 anim-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Home className="w-6 h-6 text-green-800" /> Property Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage subdivision blocks, lots, and resident assignments.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search block, lot, or resident..."
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
                {['Block', 'Lot', 'Street', 'Household Members', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 spin mx-auto mb-2"/> Loading...</td></tr>
              ) : filteredGrouped.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-gray-400">No properties found.</td></tr>
              ) : (
                filteredGrouped.map(prop => (
                  <tr key={`${prop.block}-${prop.lot}-${prop.street}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-gray-800">{prop.block}</td>
                    <td className="px-4 py-4 text-gray-800">{prop.lot}</td>
                    <td className="px-4 py-4 text-gray-500">{prop.street || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {prop.members.length > 0 ? (
                          prop.members.map((m, index) => (
                            <div 
                              key={m.id} 
                              className={`inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all hover:shadow-md
                                ${index === 0 ? 'bg-green-50/70 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                              <div className="flex flex-col">
                                <span>{m.full_name}</span>
                                <span className="text-[9px] text-gray-400 font-normal">{index === 0 ? 'Primary Owner' : 'Household Member'}</span>
                              </div>
                              <div className="flex items-center gap-1 border-l border-gray-200/80 pl-1.5 ml-1 shrink-0">
                                <button 
                                  onClick={() => handleOpenModal({ id: m.property_id, ResidentId: m.id, block: prop.block, lot: prop.lot, street: prop.street, Resident: m })} 
                                  className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition-all"
                                  title="Edit Assignment"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(m.property_id)} 
                                  className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-all"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-orange-400">No residents assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleAddMemberToHouse(prop)}
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 bg-green-50 hover:bg-green-100 text-green-800 text-xs font-bold rounded-lg border border-green-200 transition-all active:scale-95"
                        title="Add Member to Household"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Member
                      </button>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">{editingProp ? 'Edit Property' : 'Create New Property'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Block</label>
                  <input 
                    type="text" 
                    value={form.block} 
                    onChange={e => setForm({...form, block: e.target.value})} 
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lot</label>
                  <input 
                    type="text" 
                    value={form.lot} 
                    onChange={e => setForm({...form, lot: e.target.value})} 
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street (Optional)</label>
                <input 
                  type="text" 
                  list="streets-list"
                  value={form.street} 
                  onChange={e => setForm({...form, street: e.target.value})} 
                  placeholder="e.g. Maple Avenue"
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700" 
                />
                <datalist id="streets-list">
                  {uniqueStreets.map(street => (
                    <option key={street} value={street} />
                  ))}
                </datalist>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Resident Assignment <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by resident name or email..."
                    value={residentSearch}
                    onChange={e => {
                      setResidentSearch(e.target.value);
                      setShowResDropdown(true);
                    }}
                    onFocus={() => setShowResDropdown(true)}
                    className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  />
                  {form.ResidentId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-50 border border-green-200 text-green-800 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm max-w-[200px] truncate">
                      <span className="truncate">Linked: {selectedResident?.full_name || 'Resident'}</span>
                      <button 
                        type="button" 
                        onClick={() => { 
                          setForm({ ...form, ResidentId: '' }); 
                          setResidentSearch(''); 
                        }} 
                        className="text-green-800 hover:text-red-600 font-extrabold text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {showResDropdown && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border bg-white shadow-xl max-h-48 overflow-y-auto">
                    {residents
                      .filter(r => 
                        (r.full_name || '').toLowerCase().includes(residentSearch.toLowerCase()) ||
                        (r.User?.email || '').toLowerCase().includes(residentSearch.toLowerCase()) ||
                        (r.User?.username || '').toLowerCase().includes(residentSearch.toLowerCase())
                      )
                      .map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, ResidentId: r.id });
                            setResidentSearch(r.full_name);
                            setShowResDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-gray-800 text-xs sm:text-sm">{r.full_name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400">{r.User?.email}</p>
                          </div>
                          {parseInt(form.ResidentId, 10) === r.id && (
                            <span className="text-[10px] sm:text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Selected</span>
                          )}
                        </button>
                      ))}
                    {residents.filter(r => 
                      (r.full_name || '').toLowerCase().includes(residentSearch.toLowerCase()) ||
                      (r.User?.email || '').toLowerCase().includes(residentSearch.toLowerCase()) ||
                      (r.User?.username || '').toLowerCase().includes(residentSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-xs text-gray-400">No matching residents found.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving || !form.ResidentId}
                  className="px-4 py-2 text-sm font-bold text-white bg-green-800 hover:bg-green-900 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 spin"/>}
                  {editingProp ? 'Save Changes' : 'Create Property'}
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

export default PropertiesPage;
