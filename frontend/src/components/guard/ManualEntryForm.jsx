import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Home, User, Phone, CheckCircle2, Loader2, X, ClipboardSignature } from 'lucide-react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import WalkinWaiting from '@/components/guard/WalkinWaiting';

const ManualEntryForm = () => {
  const { toast } = useToast();

  // ─── Search State ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // ─── Auto-filled Form State ───────────────────────────────────────────────────
  const [selected, setSelected] = useState(null); 
  const [form, setForm] = useState({
    visitor_name: '',
    id_type: 'Drivers License',
    other_id: '',
    purpose: '',
    vehicle_plate: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, setRequest] = useState(null); // pending walk-in approval

  const debouncedQuery = useDebounce(searchQuery, 350);

  useEffect(() => {
    if (debouncedQuery.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/properties/search?q=${encodeURIComponent(debouncedQuery.trim())}`, {
          signal: controller.signal,
        });
        setSearchResults(response.data.data || []);
        setShowDropdown(true);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProperty = useCallback((property) => {
    setSelected(property);
    setSearchQuery(`Block ${property.block} Lot ${property.lot} — ${property.resident_name}`);
    setShowDropdown(false);
    setSearchResults([]);
  }, []);

  const handleClearSelection = () => {
    setSelected(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selected) {
      toast({ variant: 'destructive', title: 'Property Required', description: 'Please search and select a Block/Lot first.' });
      return;
    }
    if (!form.visitor_name.trim()) {
      toast({ variant: 'destructive', title: 'Visitor Name Required', description: 'Please enter the visitor\'s name.' });
      return;
    }

    const finalId = form.id_type === 'Other' ? form.other_id : form.id_type;

    setIsSubmitting(true);
    try {
      // Ask the resident first (Figma G04 → G05). The guard admits once they approve.
      const r = await api.post('/walkins', {
        property_id: selected.property_id,
        visitor_name: form.visitor_name.trim(),
        visitor_id: finalId,
        purpose: form.purpose.trim(),
        vehicle_plate: form.vehicle_plate.trim(),
        notes: form.notes.trim(),
      });
      setRequest(r.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send the request. Please try again.';
      toast({ variant: 'destructive', title: 'Request failed', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (request) {
    return (
      <WalkinWaiting
        request={request}
        onDone={() => {
          setRequest(null);
          setForm({ visitor_name: '', id_type: 'Drivers License', other_id: '', purpose: '', vehicle_plate: '', notes: '' });
          handleClearSelection();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-g-warn-bg flex items-center justify-center">
              <ClipboardSignature className="w-5 h-5 text-g-warn" />
            </div>
            <div>
              <CardTitle className="text-xl font-display text-g-text">Manual Visitor Entry</CardTitle>
              <CardDescription>Search for a resident's property and log visitor details.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} id="manual-entry-form" className="space-y-6" noValidate>

            {/* ── Predictive Property Search ─────────────────────────────── */}
            <div className="space-y-2" ref={searchRef}>
              <Label htmlFor="property-search" className="font-medium text-g-text">
                Property Search <span className="text-g-danger">*</span>
              </Label>
              <p className="text-xs text-g-text-2">Type Block number, Lot number, or Resident Name</p>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-g-text-2">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </div>
                <Input
                  id="property-search"
                  type="text"
                  placeholder="e.g. Block 5, Lot 12, or Juan dela Cruz"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selected) setSelected(null); 
                  }}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className="pl-10 pr-10 border-g-border-strong focus-visible:ring-green-700"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-g-text-2 hover:text-g-text transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 rounded-xl border bg-g-surface shadow-xl max-h-72 overflow-y-auto animate-fade-in">
                    {searchResults.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-g-text-2">
                        No properties found. Try a different search term.
                      </div>
                    ) : (
                      searchResults.map((prop) => (
                        <button
                          key={prop.property_id}
                          type="button"
                          onClick={() => handleSelectProperty(prop)}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-g-surface-2 transition-colors border-b border-g-border last:border-0"
                        >
                          <div className="w-8 h-8 rounded-lg bg-g-ok-bg flex items-center justify-center shrink-0 mt-0.5">
                            <Home className="w-4 h-4 text-g-ok" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-g-text">
                              Block {prop.block}, Lot {prop.lot}
                              {prop.street && <span className="text-g-text-2 font-normal"> — {prop.street}</span>}
                            </p>
                            <p className="text-xs text-g-text-2 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3" />
                              {prop.resident_name}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Auto-filled Resident Info ─────────────────── */}
            {selected && (
              <div className="rounded-xl border border-g-ok/40 bg-g-ok-bg p-4 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-g-accent-ink">
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="text-sm font-semibold">Property Selected</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-g-text-2 text-xs">Block / Lot</p>
                    <p className="font-semibold text-g-text">Block {selected.block}, Lot {selected.lot}</p>
                  </div>
                  <div>
                    <p className="text-g-text-2 text-xs">Resident</p>
                    <p className="font-semibold text-g-text">{selected.resident_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Visitor Details ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitor_name" className="text-g-text">Visitor Name <span className="text-g-danger">*</span></Label>
                <Input
                  id="visitor_name"
                  name="visitor_name"
                  type="text"
                  placeholder="Full name of visitor"
                  value={form.visitor_name}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                  className="border-g-border-strong focus-visible:ring-green-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="id_type" className="text-g-text">Valid ID Type</Label>
                <select
                  id="id_type"
                  name="id_type"
                  value={form.id_type}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 border border-g-border-strong rounded-md text-sm bg-g-surface focus:outline-none focus:ring-2 focus:ring-g-accent"
                >
                  <option value="Drivers License">Driver's License</option>
                  <option value="Passport">Passport</option>
                  <option value="UMID">UMID</option>
                  <option value="National ID">National ID</option>
                  <option value="Plate Number">Plate Number Only</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
              </div>

              {form.id_type === 'Other' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="other_id" className="text-g-text">Specify Other ID</Label>
                  <Input
                    id="other_id"
                    name="other_id"
                    type="text"
                    placeholder="E.g., Company ID, Student ID"
                    value={form.other_id}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    className="border-g-border-strong focus-visible:ring-green-700"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-g-text">Purpose of Visit</Label>
                <Input
                  id="purpose"
                  name="purpose"
                  type="text"
                  placeholder="e.g. Social visit, Delivery"
                  value={form.purpose}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                  className="border-g-border-strong focus-visible:ring-green-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_plate" className="text-g-text">Vehicle Plate (Optional)</Label>
                <Input
                  id="vehicle_plate"
                  name="vehicle_plate"
                  type="text"
                  placeholder="e.g. ABC 1234"
                  value={form.vehicle_plate}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                  className="border-g-border-strong focus-visible:ring-green-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-g-text">Guard Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Additional observations (optional)…"
                value={form.notes}
                onChange={handleFormChange}
                disabled={isSubmitting}
                className={cn(
                  'flex w-full rounded-md border border-g-border-strong bg-g-surface px-3 py-2 text-sm',
                  'placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700',
                  'disabled:opacity-50 resize-none transition-all'
                )}
              />
            </div>

            {/* Submit */}
            <button
              id="manual-entry-submit-btn"
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 bg-g-accent hover:bg-g-accent/90 text-g-on-accent font-bold rounded-full transition-all active:scale-[0.98] disabled:opacity-50"
              disabled={isSubmitting || !selected}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Sending request…</>
              ) : (
                <><ClipboardSignature className="w-5 h-5" /> Ask resident to approve</>
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualEntryForm;
