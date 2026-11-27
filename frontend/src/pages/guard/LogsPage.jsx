import { useEffect, useState } from 'react';
import { format, startOfMonth, isSameDay } from 'date-fns';
import { Search, RefreshCw, Loader2, ArrowLeft, ChevronLeft, ChevronRight, Calendar, Download, CheckCircle2, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';

const StatusBadge = ({ status }) => {
  const cfg = {
    active:     { bg: 'bg-success-bg',  text: 'text-success',  label: 'ACTIVE'  },
    checked_in: { bg: 'bg-success',text: 'text-primary-foreground',      label: 'INSIDE'  },
    used:       { bg: 'bg-info-bg',   text: 'text-info',   label: 'EXITED'  },
    expired:    { bg: 'bg-danger-bg',    text: 'text-danger',    label: 'EXPIRED' },
    manual:     { bg: 'bg-warning-bg', text: 'text-warning', label: 'MANUAL'  },
  };
  const c = cfg[status] || cfg.expired;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

// Legacy fallback: parse old encoded notes blobs from before the schema refactor.
// New rows will have dedicated columns; this handles historical data during migration.
const parseNotes = (log) => {
  // If dedicated columns already exist, use them directly
  if (log.purpose || log.proof_of_id || log.plate_number || log.guard_notes) {
    return {
      purpose:     log.purpose     || '',
      proof_of_id: log.proof_of_id || '',
      plate_number: log.plate_number || '',
      notes:       log.guard_notes  || log.notes || ''
    };
  }
  // Fall back to parsing old encoded blob in notes column
  const result = { purpose: '', proof_of_id: '', plate_number: '', notes: log.notes || '' };
  if (!log.notes) return result;
  if (log.notes.includes('|')) {
    const parts = log.notes.split('|').map(p => p.trim());
    parts.forEach(part => {
      if (part.startsWith('ID:'))       result.proof_of_id  = part.substring(3).trim();
      else if (part.startsWith('Purpose:'))  result.purpose      = part.substring(8).trim();
      else if (part.startsWith('Vehicle:'))  result.plate_number = part.substring(8).trim();
      else result.notes = part;
    });
  } else {
    result.purpose = log.notes;
    result.notes = '';
  }
  return result;
};

const LogsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'used,checked_in';

  const [logs, setLogs]         = useState([]);
  const [loading, setLoad]      = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTP]     = useState(1);
  const [total, setTotal]       = useState(0);
  const [sortOrder, setSort]    = useState('desc');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  // "Inside" and "Gate log" are the same page with different filters: follow the URL when it changes.
  useEffect(() => { setStatusFilter(initialStatus); setPage(1); }, [initialStatus]);
  const insideView = statusFilter === 'checked_in';
  // Exit flow: two-step inline confirmation (no native dialogs)
  const [exitConfirmId, setExitConfirmId] = useState(null); // pass_id pending confirm
  const [exitingId, setExitingId]         = useState(null); // pass_id currently in flight
  const [exitError, setExitError]         = useState(null); // { id, msg }

  const backLink = user?.role === 'admin' ? '/admin/dashboard' : '/guard/dashboard';

  const isToday = isSameDay(selectedDate, new Date());
  const isFirstOfMonth = isSameDay(selectedDate, startOfMonth(new Date()));

  const handlePrevDay = () => {
    if (isFirstOfMonth) return;
    setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; });
    setPage(1);
  };

  const handleNextDay = () => {
    if (isToday) return;
    setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; });
    setPage(1);
  };

  const fetch = async (p = page, q = search, s = sortOrder, d = selectedDate) => {
    setLoad(true);
    try {
      const formattedDate = format(d, 'yyyy-MM-dd');
      // Fetch both checked_in and used visitors for the logs by default, or specific status
      // Inside view lists everyone still inside, whatever day they entered.
      const params = new URLSearchParams({ page: p, limit: 20, sort: s, status: statusFilter });
      if (!insideView) params.append('date', formattedDate);
      params.append('_t', new Date().getTime()); // Cache buster
      if (q.trim()) params.append('search', q.trim());
      const res = await api.get(`/logs?${params}`);
      setLogs(res.data.data || []);
      setTP(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch { setLogs([]); }
    finally { setLoad(false); }
  };

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetch(1, search, sortOrder, selectedDate);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  useEffect(() => { fetch(); }, [page, selectedDate, sortOrder, statusFilter]); // eslint-disable-line

  const handleSearch = e => { e.preventDefault(); };

  // Step 1: guard clicks Exit → show inline confirm
  const handleExitRequest = (pass_id) => {
    setExitConfirmId(pass_id);
    setExitError(null);
  };

  // Step 2: guard clicks Confirm → fire API
  const handleExitConfirm = async (pass_id) => {
    setExitingId(pass_id);
    setExitConfirmId(null);
    setExitError(null);
    try {
      const response = await api.post('/qr/exit', { pass_id });
      if (response.data.success) {
        fetch(); // refresh the log table
      } else {
        setExitError({ id: pass_id, msg: response.data.message || 'Exit failed.' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Network error.';
      setExitError({ id: pass_id, msg });
      console.error('[EXIT]', err);
    } finally {
      setExitingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const params = new URLSearchParams({ limit: 10000, sort: sortOrder, date: formattedDate, status: 'used' });
      if (search.trim()) params.append('search', search.trim());
      
      const res = await api.get(`/logs?${params}`);
      const exportData = res.data.data || [];
      
      if (exportData.length === 0) {
        alert('No data to export for this date.');
        return;
      }

      const headers = ['Guest Name', 'Property (Block & Lot)', 'Resident Name', 'Purpose', 'Proof of ID', 'Plate Number', 'Status', 'Guard', 'Time Scanned', 'Guard Notes'];
      
      const rows = exportData.map(log => {
        const parsed = parseNotes(log);
        return [
          `"${(log.guest_name || '').replace(/"/g, '""')}"`,
          `"Blk ${log.Property?.block || ''}, Lot ${log.Property?.lot || ''}"`,
          `"${(log.Property?.Resident?.full_name || '').replace(/"/g, '""')}"`,
          `"${(parsed.purpose || '').replace(/"/g, '""')}"`,
          `"${(parsed.proof_of_id || '').replace(/"/g, '""')}"`,
          `"${(parsed.plate_number || '').replace(/"/g, '""')}"`,
          `"${log.status.toUpperCase()}"`,
          `"${(log.ScannedBy?.username || '').replace(/"/g, '""')}"`,
          `"${log.scanned_at ? format(new Date(log.scanned_at), 'MM/dd/yyyy hh:mm a') : (log.createdAt ? format(new Date(log.createdAt), 'MM/dd/yyyy hh:mm a') : '')}"`,
          `"${(parsed.notes || '').replace(/"/g, '""')}"`
        ];
      });
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GateLogs_${formattedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export logs.');
    }
  };

  // Shared by the table (tablet/desktop) and the card list (phones).
  const renderExit = (log) => (
    log.exited_at ? (
                          <span className="text-muted-foreground">{format(new Date(log.exited_at), 'MM/dd hh:mm a')}</span>
                        ) : log.status === 'checked_in' ? (
                          user?.role !== 'admin' ? (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {exitingId === log.pass_id ? (
                                // Loading state
                                <span className="flex items-center gap-1 text-muted-foreground h-8">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Exiting…
                                </span>
                              ) : exitConfirmId === log.pass_id ? (
                                // Inline confirm state
                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                  <button
                                    onClick={() => handleExitConfirm(log.pass_id)}
                                    className="flex items-center gap-1 px-2 py-1 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-lg hover:bg-destructive/90 transition-colors h-11 px-3 text-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Confirm
                                  </button>
                                  <button
                                    onClick={() => setExitConfirmId(null)}
                                    className="flex items-center gap-1 px-2 py-1 bg-muted text-foreground text-[11px] font-bold rounded-lg hover:bg-muted transition-colors h-11 px-3 text-xs"
                                  >
                                    <X className="w-3 h-3" /> Cancel
                                  </button>
                                </div>
                              ) : (
                                // Default Exit button
                                <button
                                  onClick={() => handleExitRequest(log.pass_id)}
                                  className="px-3 py-1 bg-destructive text-destructive-foreground font-sans text-xs font-semibold rounded-lg hover:bg-destructive/90 transition-colors active:scale-95 h-11 px-4 flex items-center justify-center"
                                >
                                  Exit
                                </button>
                              )}
                              {/* Inline error for this row */}
                              {exitError?.id === log.pass_id && (
                                <span className="text-danger text-[10px] font-medium">{exitError.msg}</span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-danger-bg text-danger border border-danger/30">
                              Inside
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
  );

  return (
    <div className="max-w-7xl mx-auto w-full pt-8 space-y-6 anim-fade-in">
      {/* Back Button (Hidden for Admin) */}
      {user?.role !== 'admin' && (
        <div className="flex justify-start">
          <Link 
            to={backLink} 
            className="inline-flex items-center gap-2 h-12 px-5 rounded-full border border-border bg-card text-foreground text-[15px] font-semibold hover:border-ring"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to console
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-[32px] font-semibold text-foreground">
              {insideView ? 'Currently inside' : 'Gate log'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {insideView ? `${total} visitor${total === 1 ? '' : 's'} inside now · log their exit when they leave` : `${total} record${total === 1 ? '' : 's'} for this day · read-only`}
            </p>
          </div>
        </div>
        
        {/* Date Navigator (not needed for the inside view) */}
        <div className={`${insideView ? 'hidden' : 'flex'} items-center bg-card border border-border rounded-lg shadow-sm`}>
          <button 
            onClick={handlePrevDay}
            disabled={isFirstOfMonth}
            aria-label="Previous day"
            className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 border-r border-border"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 flex items-center gap-2 text-sm font-semibold text-foreground min-w-[160px] justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {isToday ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
          </div>
          <button 
            onClick={handleNextDay}
            disabled={isToday}
            aria-label="Next day"
            className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 border-l border-border"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            title="Download logs as Excel/CSV"
            className="flex items-center gap-2 h-9 px-4 border border-success/30 rounded-lg text-sm font-medium text-success bg-success-bg hover:bg-success-bg transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            id="refresh-logs-btn"
            onClick={() => fetch()}
            disabled={loading}
            className="flex items-center gap-2 h-9 px-4 border border-input rounded-lg text-sm font-medium text-foreground bg-card hover:bg-muted transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative basis-full sm:basis-auto sm:flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="logs-search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by visitor name…"
            className="w-full h-11 pl-9 pr-3 border border-input rounded-lg text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={e => {
            const val = e.target.value;
            setStatusFilter(val);
            setPage(1);
          }}
          className="flex-1 sm:flex-none min-w-0 h-11 px-3 border border-input rounded-xl text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="used,checked_in">All Entries</option>
          <option value="checked_in">Inside Now</option>
          <option value="used">Exited</option>
        </select>
        <select
          aria-label="Sort order"
          value={sortOrder}
          onChange={e => {
            const val = e.target.value;
            setSort(val);
            setPage(1);
          }}
          className="flex-1 sm:flex-none min-w-0 h-11 px-3 border border-input rounded-xl text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </form>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 spin mr-2" /> Loading logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No log entries found.</div>
        ) : (
          <>
          <ul className="min-[1360px]:hidden grid md:grid-cols-2 divide-y md:divide-y-0 divide-border md:gap-px md:bg-border">
            {logs.map((log) => {
              const parsed = parseNotes(log);
              const tin = log.scanned_at || log.createdAt;
              return (
                <li key={log.id} className="p-4 space-y-2 bg-card md:odd:last:col-span-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{log.guest_name}</p>
                      <p className="text-sm text-muted-foreground">{log.Property ? `Blk ${log.Property.block}, Lot ${log.Property.lot}` : '—'}{log.Property?.Resident?.full_name ? ` · ${log.Property.Resident.full_name}` : ''}</p>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Purpose</dt><dd className="text-foreground">{parsed.purpose || '—'}</dd>
                    <dt className="text-muted-foreground">Time in</dt><dd className="font-mono text-foreground">{tin ? format(new Date(tin), 'MM/dd hh:mm a') : '—'}</dd>
                    {parsed.plate_number && <><dt className="text-muted-foreground">Plate</dt><dd className="font-mono text-foreground">{parsed.plate_number}</dd></>}
                    {log.exited_at && <><dt className="text-muted-foreground">Time out</dt><dd className="font-mono text-foreground">{format(new Date(log.exited_at), 'MM/dd hh:mm a')}</dd></>}
                    {parsed.notes && <><dt className="text-muted-foreground">Notes</dt><dd className="italic text-muted-foreground">{parsed.notes}</dd></>}
                  </dl>
                  {!log.exited_at && <div className="text-xs">{renderExit(log)}</div>}
                </li>
              );
            })}
          </ul>
          <div className="hidden min-[1360px]:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {['Guest / Visitor', 'Property', 'Resident', 'Purpose', 'Proof of ID', 'Plate Number', 'Status', 'Guard', 'Time In', 'Time Out', 'Notes'].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider ${
                      h === 'Time Out' ? 'w-[180px] min-w-[180px]' : 
                      h === 'Notes' ? 'w-full' : ''
                    }`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => {
                  const parsed = parseNotes(log);
                  return (
                    <tr key={log.id} className="hover:bg-muted transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{log.guest_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.Property ? `Blk ${log.Property.block}, Lot ${log.Property.lot}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.Property?.Resident?.full_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium text-xs">{parsed.purpose || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{parsed.proof_of_id || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{parsed.plate_number || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{log.ScannedBy?.username || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                        {log.scanned_at
                          ? format(new Date(log.scanned_at), 'MM/dd hh:mm a')
                          : log.createdAt
                          ? format(new Date(log.createdAt), 'MM/dd hh:mm a')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono w-[180px] min-w-[180px]">
                        {renderExit(log)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs italic max-w-xs truncate" title={parsed.notes}>
                        {parsed.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              id="logs-prev-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium text-foreground bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              id="logs-next-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium text-foreground bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
