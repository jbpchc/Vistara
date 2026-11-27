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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Home className="w-6 h-6 text-success" /> Property Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage subdivision blocks, lots, and resident assignments.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search block, lot, or resident..."
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
                {['Block', 'Lot', 'Street', 'Household Members', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 spin mx-auto mb-2"/> Loading...</td></tr>
              ) : filteredGrouped.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-muted-foreground">No properties found.</td></tr>
              ) : (
                filteredGrouped.map(prop => (
                  <tr key={`${prop.block}-${prop.lot}-${prop.street}`} className="hover:bg-muted/60 transition-colors">
                    <td data-label="Block" className="px-4 py-4 font-semibold text-foreground">{prop.block}</td>
                    <td data-label="Lot" className="px-4 py-4 text-foreground">{prop.lot}</td>
                    <td data-label="Street" className="px-4 py-4 text-muted-foreground">{prop.street || '—'}</td>
                    <td data-label="Household" className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {prop.members.length > 0 ? (
                          prop.members.map((m, index) => (
                            <div 
                              key={m.id} 
                              className={`inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all hover:shadow-md
                                ${index === 0 ? 'bg-success-bg border-success/30 text-success' : 'bg-muted border-border text-foreground'}`}
                            >
                              <div className="flex flex-col">
                                <span>{m.full_name}</span>
                                <span className="text-[9px] text-muted-foreground font-normal">{index === 0 ? 'Primary Owner' : 'Household Member'}</span>
                              </div>
                              <div className="flex items-center gap-1 border-l border-border pl-1.5 ml-1 shrink-0">
                                <button 
                                  onClick={() => handleOpenModal({ id: m.property_id, ResidentId: m.id, block: prop.block, lot: prop.lot, street: prop.street, Resident: m })} 
                                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-info hover:bg-card rounded-lg transition-all"
                                  title="Edit Assignment" aria-label={`Edit ${m.full_name}'s assignment`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(m.property_id)} 
                                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-card rounded-lg transition-all"
                                  title="Remove Member" aria-label={`Remove ${m.full_name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-warning">No residents assigned</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Actions" className="px-4 py-4">
                      <button
                        onClick={() => handleAddMemberToHouse(prop)}
                        className="inline-flex items-center justify-center gap-1.5 h-10 px-3 bg-success-bg hover:bg-success-bg text-success text-xs font-bold rounded-lg border border-success/30 transition-all active:scale-95"
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
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted">
              <h3 className="font-bold text-foreground">{editingProp ? 'Edit Property' : 'Create New Property'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Block</label>
                  <input 
                    type="text" 
                    value={form.block} 
                    onChange={e => setForm({...form, block: e.target.value})} 
                    className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Lot</label>
                  <input 
                    type="text" 
                    value={form.lot} 
                    onChange={e => setForm({...form, lot: e.target.value})} 
                    className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Street (Optional)</label>
                <input 
                  type="text" 
                  list="streets-list"
                  value={form.street} 
                  onChange={e => setForm({...form, street: e.target.value})} 
                  placeholder="e.g. Maple Avenue"
                  className="w-full h-9 px-3 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" 
                />
                <datalist id="streets-list">
                  {uniqueStreets.map(street => (
                    <option key={street} value={street} />
                  ))}
                </datalist>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-foreground mb-1">Resident Assignment <span className="text-danger">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by resident name or email..."
                    value={residentSearch}
                    onChange={e => {
                      setResidentSearch(e.target.value);
                      setShowResDropdown(true);
                    }}
                    onFocus={() => setShowResDropdown(true)}
                    className="w-full h-9 pl-9 pr-3 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  {form.ResidentId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-success-bg border border-success/30 text-success text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm max-w-[200px] truncate">
                      <span className="truncate">Linked: {selectedResident?.full_name || 'Resident'}</span>
                      <button 
                        type="button" 
                        onClick={() => { 
                          setForm({ ...form, ResidentId: '' }); 
                          setResidentSearch(''); 
                        }} 
                        className="text-success hover:text-danger font-extrabold text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {showResDropdown && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border bg-card shadow-xl max-h-48 overflow-y-auto">
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
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted border-b border-border last:border-0 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-foreground text-xs sm:text-sm">{r.full_name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{r.User?.email}</p>
                          </div>
                          {parseInt(form.ResidentId, 10) === r.id && (
                            <span className="text-[10px] sm:text-xs font-bold bg-success-bg text-success px-2 py-0.5 rounded-full">Selected</span>
                          )}
                        </button>
                      ))}
                    {residents.filter(r => 
                      (r.full_name || '').toLowerCase().includes(residentSearch.toLowerCase()) ||
                      (r.User?.email || '').toLowerCase().includes(residentSearch.toLowerCase()) ||
                      (r.User?.username || '').toLowerCase().includes(residentSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-xs text-muted-foreground">No matching residents found.</div>
                    )}
                  </div>
                )}
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
                  disabled={saving || !form.ResidentId}
                  className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
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
