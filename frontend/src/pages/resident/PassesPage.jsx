import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Plus, QrCode, CalendarCheck, Search, Loader2, X, 
  Edit2, Trash2, Shield, Calendar, MapPin, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import PassCard from '@/components/resident/PassCard';
import { Badge } from '@/components/ui/badge';

/* ── Status badge: dot + word + colour (WCAG 1.4.1) ─────────────────────────── */
const STATUS = {
  active:  { variant: 'success',     label: 'Active' },
  used:    { variant: 'neutral',     label: 'Used' },
  expired: { variant: 'destructive', label: 'Expired' },
};
const StatusBadge = ({ status }) => {
  const c = STATUS[status] || STATUS.expired;
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

/* ── Main Resident Dashboard ────────────────────────────────────────────────── */
const ResidentPasses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const property = user?.primary_property;

  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // active, used, expired

  // CRUD & Interaction States
  const [selectedPass, setSelectedPass] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Create / Edit Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ guest_name: '', expected_date: todayStr, purpose: '' });
  const [editForm, setEditForm] = useState({ guest_name: '', expected_date: '', purpose: '' });
  const [editingPassId, setEditingPassId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPasses();
  }, []);

  // "New visitor pass" (header, quick actions) lands here with #new-pass: focus the form.
  const location = useLocation();
  useEffect(() => {
    if (location.hash === '#new-pass') {
      const el = document.getElementById('new-pass');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el?.querySelector('input')?.focus({ preventScroll: true });
    }
  }, [location.hash]);

  const fetchPasses = async () => {
    try {
      const r = await api.get('/passes/my');
      setPasses(r.data.data || []);
    } catch (err) {
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (e, pass) => {
    e.stopPropagation(); // Avoid triggering open QR view
    setEditingPassId(pass.pass_id);
    setEditForm({
      guest_name: pass.guest_name,
      expected_date: pass.expected_date,
      purpose: pass.purpose || pass.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleCreatePass = async (e) => {
    e.preventDefault();
    if (!form.guest_name.trim()) return toast({ variant: 'destructive', description: 'Guest name is required.' });
    if (!form.expected_date) return toast({ variant: 'destructive', description: 'Expected date is required.' });
    if (!property?.id) return toast({ variant: 'destructive', description: 'No linked property found.' });

    setActionLoading(true);
    try {
      await api.post('/qr/generate', {
        property_id: property.id,
        guest_name: form.guest_name.trim(),
        expected_date: form.expected_date,
        purpose: form.purpose.trim() || 'Visit'
      });
      toast({ variant: 'success', title: 'Success', description: 'Gate pass generated successfully!' });
      setForm({ guest_name: '', expected_date: todayStr, purpose: '' });
      fetchPasses();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to generate gate pass.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPass = async (e) => {
    e.preventDefault();
    if (!editForm.guest_name.trim()) return toast({ variant: 'destructive', description: 'Guest name is required.' });
    if (!editForm.expected_date) return toast({ variant: 'destructive', description: 'Expected date is required.' });

    setActionLoading(true);
    try {
      await api.put(`/passes/${editingPassId}`, {
        guest_name: editForm.guest_name.trim(),
        expected_date: editForm.expected_date,
        purpose: editForm.purpose.trim()
      });
      toast({ variant: 'success', title: 'Pass Updated', description: 'Gate pass has been successfully updated!' });
      setIsEditOpen(false);
      fetchPasses();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to update gate pass.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPass = async (e, passId) => {
    e.stopPropagation(); // Stop click pass view
    if (!window.confirm('Are you sure you want to cancel this gate pass? It will instantly expire.')) return;

    try {
      await api.delete(`/passes/${passId}`);
      toast({ variant: 'success', title: 'Pass Cancelled', description: 'Gate pass expired successfully.' });
      fetchPasses();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to cancel gate pass.' });
    }
  };

  // Filter Logic
  const filteredPasses = passes.filter(p => {
    const matchesSearch = p.guest_name?.toLowerCase().includes(search.toLowerCase()) || 
                          p.pass_id?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && p.status === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 anim-fade-in px-2">
      
      <div className="pt-2">
        <h1 className="text-[40px] leading-tight font-semibold text-ink">Visitor passes</h1>
        <p className="mt-1 text-[15px] text-ink-muted">Create a pass for a guest, then share its QR code. Guards scan it at the gate.</p>
      </div>

      {/* ── Main Two-Column Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Left Column: Generate Gatepass Form ─────────────────────────────── */}
        <section id="new-pass" aria-labelledby="new-pass-title" className="scroll-mt-28 bg-surface-card border border-line rounded-card-home p-7 shadow-card lg:col-span-4 lg:sticky lg:top-28">
          <div className="mb-6">
            <h2 id="new-pass-title" className="text-2xl font-bold text-ink">New visitor pass</h2>
            <p className="text-[14px] text-ink-muted mt-1">Your guest shows the QR code at the gate.</p>
          </div>

          <form onSubmit={handleCreatePass} className="space-y-5">
            <div>
              <label htmlFor="np-guest" className="block text-[14px] font-semibold text-ink mb-1.5">
                Guest Full Name <span className="text-status-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="np-guest"
                type="text"
                required
                placeholder="e.g Maria De La Cruz"
                value={form.guest_name}
                onChange={e => setForm({...form, guest_name: e.target.value})}
                className="w-full h-11 px-3.5 bg-surface-card border border-input rounded-xl text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label htmlFor="np-date" className="block text-[14px] font-semibold text-ink mb-1.5">
                Expected Visit Date <span className="text-status-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="np-date"
                type="date"
                required
                min={todayStr}
                value={form.expected_date}
                onChange={e => setForm({...form, expected_date: e.target.value})}
                className="w-full h-11 px-3.5 bg-surface-card border border-input rounded-xl text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label htmlFor="np-purpose" className="block text-[14px] font-semibold text-ink mb-1.5">
                Purpose Of Visit <span className="text-status-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="np-purpose"
                type="text"
                required
                placeholder="e.g Delivery, Plumber, Visiting Relative"
                value={form.purpose}
                onChange={e => setForm({...form, purpose: e.target.value})}
                className="w-full h-11 px-3.5 bg-surface-card border border-input rounded-xl text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setForm({ guest_name: '', expected_date: todayStr, purpose: '' })}
                className="h-11 px-4 rounded-full text-[15px] font-semibold text-ink-muted hover:bg-surface-subtle hover:text-ink transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="h-11 px-6 bg-brand hover:bg-brand/90 text-brand-on text-[15px] font-semibold rounded-full transition-colors active:scale-95 disabled:opacity-60 flex items-center justify-center min-w-[140px]"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 spin" /> : 'Create pass'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Right Column: My Guest Passes List ──────────────────────────────── */}
        <section className="bg-surface-card border border-line rounded-card-home p-7 shadow-card lg:col-span-8">
          <div className="border-b border-line pb-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink">My visitor passes</h2>
              <p className="text-[14px] text-ink-muted mt-1">Tap a pass to show its QR code. Active passes can be edited or cancelled.</p>
            </div>
          </div>

          {/* Filters and Search toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            {/* Tabs Filter */}
            <div role="tablist" aria-label="Pass status" className="flex p-1 bg-surface-subtle rounded-full w-full sm:w-auto overflow-x-auto shrink-0 text-[14px]">
              {[
                { id: 'active', label: 'Active' },
                { id: 'used', label: 'Used' },
                { id: 'expired', label: 'Expired' },
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-10 px-4 rounded-full transition-colors text-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-home-bg text-home-ink font-bold'
                      : 'text-ink-muted hover:text-ink font-semibold'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <input
                type="text"
                placeholder="Search passes"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search passes by guest name or pass ID"
                className="w-full h-11 pl-4 pr-10 bg-surface-card border border-input rounded-full text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" aria-hidden="true" />
            </div>
          </div>

          {/* Pass List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-ink-muted">
              <Loader2 className="w-8 h-8 spin text-brand mb-2" />
              <p className="text-sm">Loading passes...</p>
            </div>
          ) : filteredPasses.length === 0 ? (
            <div className="py-20 text-center text-ink-muted space-y-3">
              <QrCode className="w-12 h-12 text-chart-muted mx-auto" aria-hidden="true" />
              <div>
                <p className="text-ink font-semibold">No passes here yet</p>
                <p className="text-[14px] text-ink-muted mt-1">Create a pass on the left, or switch tabs.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredPasses.map(pass => (
                <div 
                  key={pass.pass_id}
                  onClick={() => setSelectedPass(pass)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-surface-subtle transition-colors cursor-pointer group px-3 rounded-2xl"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-home-bg rounded-2xl flex items-center justify-center shrink-0">
                      <QrCode className="w-6 h-6 text-home-ink" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-ink text-[16px] truncate">{pass.guest_name}</p>
                        <StatusBadge status={pass.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[13px] text-ink-muted">
                        <span className="font-mono">{pass.pass_id?.slice(0, 8).toUpperCase()}</span>
                        <span>•</span>
                        <span>
                          {pass.expected_date
                            ? format(new Date(`${pass.expected_date}T12:00:00`), 'MMM d, yyyy')
                            : '—'}
                        </span>
                        <span>•</span>
                        <span>{pass.purpose || pass.notes || 'Visit'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end shrink-0 self-end sm:self-center">
                    {pass.status === 'active' && (
                      <>
                        <button
                          title="Edit Pass"
                          onClick={(e) => handleOpenEdit(e, pass)}
                          aria-label={`Edit pass for ${pass.guest_name}`}
                          className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-brand bg-surface-card hover:bg-brand-tint rounded-full transition-colors border border-line"
                        >
                          <Edit2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          title="Cancel Pass"
                          onClick={(e) => handleCancelPass(e, pass.pass_id)}
                          aria-label={`Cancel pass for ${pass.guest_name}`}
                          className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-status-danger bg-surface-card hover:bg-status-danger-bg rounded-full transition-colors border border-line"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedPass(pass); }}
                      aria-label={`Show QR code for ${pass.guest_name}`}
                      className="h-11 px-3 rounded-full text-[14px] font-bold text-brand hover:bg-brand-tint transition-colors ml-1 flex items-center gap-1"
                    >
                      Show QR &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── EDIT PASS MODAL ───────────────────────────────────────────────────── */}
      {isEditOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 anim-fade-in backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-pass-title" className="bg-surface-card rounded-card shadow-modal w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-home-bg text-home-ink flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="edit-pass-title" className="font-bold text-ink text-[18px]">Edit visitor pass</h3>
                  <p className="text-[13px] text-ink-muted">Change the guest, date or purpose</p>
                </div>
              </div>
              <button onClick={() => setIsEditOpen(false)} aria-label="Close" className="w-11 h-11 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-subtle">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPass} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label htmlFor="ep-guest" className="block text-[14px] font-semibold text-ink mb-1.5">Guest Full Name <span className="text-status-danger" aria-hidden="true">*</span></label>
                <input
                id="ep-guest"
                  type="text"
                  required
                  value={editForm.guest_name}
                  onChange={e => setEditForm({...editForm, guest_name: e.target.value})}
                  className="w-full h-11 px-3.5 bg-surface-card border border-input rounded-xl text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                />
              </div>

              <div>
                <label htmlFor="ep-date" className="block text-[14px] font-semibold text-ink mb-1.5">Expected Visit Date <span className="text-status-danger" aria-hidden="true">*</span></label>
                <input
                id="ep-date"
                  type="date"
                  required
                  min={todayStr}
                  value={editForm.expected_date}
                  onChange={e => setEditForm({...editForm, expected_date: e.target.value})}
                  className="w-full h-11 px-3.5 bg-surface-card border border-input rounded-xl text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                />
              </div>

              <div>
                <label htmlFor="ep-purpose" className="block text-[14px] font-semibold text-ink mb-1.5">Purpose of Visit</label>
                <input
                id="ep-purpose"
                  type="text"
                  value={editForm.purpose}
                  onChange={e => setEditForm({...editForm, purpose: e.target.value})}
                  className="w-full h-11 px-3.5 bg-surface-card border border-input rounded-xl text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="h-11 px-5 text-[15px] font-semibold text-ink-muted hover:bg-surface-subtle rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="h-11 px-6 bg-brand hover:bg-brand/90 text-brand-on text-[15px] font-semibold rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 spin" /> : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── PASS QR MODAL VIEW OVERLAY ───────────────────────────────────────── */}
      {selectedPass && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <PassCard pass={selectedPass} onClose={() => setSelectedPass(null)} />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ResidentPasses;
