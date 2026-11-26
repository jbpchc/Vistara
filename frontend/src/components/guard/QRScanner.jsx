import { useState, useEffect, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine, KeyRound, Camera, CheckCircle2, XCircle,
  Loader2, ClipboardPaste, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '@/api/axios';

/* ─── Result Overlay ─────────────────────────────────────────────────────────── */
const ResultOverlay = ({ result, onReset }) => {
  const granted = result?.valid;

  // Auto-reset after 4 seconds for fast throughput
  useEffect(() => {
    const t = setTimeout(onReset, 4000);
    return () => clearTimeout(t);
  }, [onReset]);

  return (
    <div className={`flex flex-col items-center justify-center py-10 rounded-xl border-2 ${
      granted
        ? 'bg-g-ok-bg border-g-ok'
        : 'bg-g-danger-bg border-g-danger'
    }`}>
      {/* Icon */}
      {granted
        ? <CheckCircle2 className="w-20 h-20 text-g-ok" />
        : <XCircle      className="w-20 h-20 text-g-danger"   />
      }

      {/* Status */}
      <p className={`mt-3 text-3xl font-black tracking-wide ${granted ? 'text-g-ok' : 'text-g-danger'}`}>
        {granted ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
      </p>

      {/* Details */}
      {granted && result.data && (
        <div className="mt-4 w-full max-w-sm bg-g-surface border border-g-ok/40 rounded-xl px-5 py-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-g-text-2">Guest</span>
            <span className="font-bold text-g-text">{result.data.guest_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-g-text-2">Property</span>
            <span className="font-semibold text-g-text">Blk {result.data.block}, Lot {result.data.lot}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-g-text-2">Resident</span>
            <span className="font-semibold text-g-text">{result.data.resident_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-g-text-2">Date</span>
            <span className="font-semibold text-g-text">{result.data.expected_date}</span>
          </div>
        </div>
      )}

      {!granted && (
        <p className="mt-2 text-sm text-g-danger font-medium">
          {result?.message || 'Invalid or expired pass.'}
        </p>
      )}

      {/* Auto-reset bar */}
      <div className="mt-5 w-full max-w-sm">
        <div className={`h-1 rounded-full ${granted ? 'bg-g-ok-bg' : 'bg-g-danger-bg'} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${granted ? 'bg-g-ok' : 'bg-g-danger-solid'}`}
            style={{ animation: 'shrink 4s linear forwards' }}
          />
        </div>
        <p className="text-center text-xs text-g-text-2 mt-1.5">Auto-resetting in 4 seconds…</p>
      </div>

      <button
        onClick={onReset}
        className="mt-4 h-10 px-6 bg-g-accent hover:bg-g-accent/90 text-g-on-accent text-sm font-semibold rounded-lg transition-all"
      >
        <RefreshCw className="w-4 h-4 inline mr-2" />
        Scan Next
      </button>
    </div>
  );
};

/* ─── Confirm Overlay ───────────────────────────────────────────────────────── */
const ConfirmOverlay = ({ result, qr_token, onConfirm, onCancel }) => {
  const [entryMode, setEntryMode] = useState('vehicle'); // vehicle | walkin
  const [plateNumber, setPlateNumber] = useState('');
  const [guardNotes, setGuardNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm({
        is_walkin: entryMode === 'walkin',
        plate_number: entryMode === 'vehicle' ? plateNumber.trim() : '',
        notes: guardNotes.trim()
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-g-surface-2 border border-g-border rounded-xl p-5 space-y-5 anim-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-g-ok-bg rounded-full mb-2">
          <CheckCircle2 className="w-6 h-6 text-g-ok" />
        </div>
        <h3 className="font-bold text-g-text text-lg">Verify Guest Entry</h3>
        <p className="text-xs text-g-text-2 mt-0.5">QR Code is valid. Record arrival details below.</p>
      </div>

      {/* Guest Details */}
      <div className="bg-g-surface border border-g-border rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
        <div>
          <p className="text-xs text-g-text-2 font-medium">Guest Name</p>
          <p className="font-bold text-g-text truncate">{result.data.guest_name}</p>
        </div>
        <div>
          <p className="text-xs text-g-text-2 font-medium">Resident Host</p>
          <p className="font-semibold text-g-text truncate">{result.data.resident_name}</p>
        </div>
        <div>
          <p className="text-xs text-g-text-2 font-medium">Property Location</p>
          <p className="font-semibold text-g-text">Blk {result.data.block}, Lot {result.data.lot}</p>
        </div>
        <div>
          <p className="text-xs text-g-text-2 font-medium">Visit Purpose</p>
          <p className="font-semibold text-g-text italic truncate">"{result.data.purpose}"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Entry Mode Toggle */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-g-text-2 uppercase tracking-wider">Entry Mode</label>
          <div className="flex bg-g-surface-2 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => setEntryMode('vehicle')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                entryMode === 'vehicle' ? 'bg-g-accent text-g-on-accent shadow-sm' : 'text-g-text-2 hover:text-g-text'
              }`}
            >
              Vehicle
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('walkin')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                entryMode === 'walkin' ? 'bg-g-accent text-g-on-accent shadow-sm' : 'text-g-text-2 hover:text-g-text'
              }`}
            >
              Walk-in
            </button>
          </div>
        </div>

        {/* Plate Number (Conditional) */}
        {entryMode === 'vehicle' && (
          <div className="space-y-1.5 anim-fade-in">
            <label className="block text-xs font-bold text-g-text-2 uppercase tracking-wider">Plate Number <span className="text-g-danger">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. ABC 1234"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full h-10 px-3 border border-g-border-strong rounded-lg text-sm bg-g-surface focus:outline-none focus:ring-2 focus:ring-g-accent focus:border-transparent uppercase font-semibold font-mono"
            />
          </div>
        )}

        {/* Guard Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-g-text-2 uppercase tracking-wider">Guard Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. black sedan, plumber service"
            value={guardNotes}
            onChange={(e) => setGuardNotes(e.target.value)}
            className="w-full h-10 px-3 border border-g-border-strong rounded-lg text-sm bg-g-surface focus:outline-none focus:ring-2 focus:ring-g-accent focus:border-transparent"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 h-11 border border-g-border-strong rounded-lg text-sm font-semibold text-g-text-2 hover:bg-g-surface-2 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || (entryMode === 'vehicle' && !plateNumber.trim())}
            className="flex-1 h-11 bg-g-accent hover:bg-g-accent/90 text-g-on-accent text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 spin" /> Processing…</>
            ) : (
              'Confirm Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─── QR Scanner ─────────────────────────────────────────────────────────────── */
const QRScanner = () => {
  // "Enter code manually" on the console opens this page with ?manual=1
  const [tab, setTab]         = useState(() => (new URLSearchParams(window.location.search).get('manual') ? 'manual' : 'camera'));
  const [phase, setPhase]     = useState('idle'); // idle | scanning | validating | done
  const [result, setResult]   = useState(null);
  const [token, setToken]     = useState('');
  const [validating, setVal]  = useState(false);
  const [camKey, setCamKey]   = useState(0);
  const scannerRef = useRef(null);
  const lastScan   = useRef(0);

  const isDone = phase === 'done';

  // ── Validate a token ───────────────────────────────────────────────────────
  const validate = useCallback(async (qr_token) => {
    if (!qr_token?.trim()) return;
    setPhase('validating');
    try {
      const res = await api.post('/qr/validate', { qr_token: qr_token.trim(), check_only: true });
      if (res.data.success && res.data.valid) {
        setResult(res.data);
        setPhase('confirming');
      } else {
        setResult(res.data);
        setPhase('done');
      }
    } catch (err) {
      setResult({ valid: false, message: err.response?.data?.message || 'Validation failed.' });
      setPhase('done');
    }
  }, []);

  const handleFinalConfirm = async (confirmData) => {
    setPhase('validating');
    try {
      const res = await api.post('/qr/validate', {
        qr_token: token,
        check_only: false,
        plate_number: confirmData.plate_number,
        is_walkin: confirmData.is_walkin,
        notes: confirmData.notes
      });
      setResult(res.data);
    } catch (err) {
      setResult({ valid: false, message: err.response?.data?.message || 'Check-in failed.' });
    } finally {
      setPhase('done');
    }
  };

  const reset = useCallback(() => {
    setPhase('idle'); setResult(null); setToken('');
    if (tab === 'camera') setCamKey(k => k + 1);
  }, [tab]);

  // ── Camera scanner lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'camera' || isDone) return;

    let isMounted = true;
    const element = document.getElementById('qr-reader');
    if (!element) return;
    
    // Clear any leftover elements from previous renders
    element.innerHTML = '';

    let isRunning = false;
    const html5QrCode = new Html5Qrcode("qr-reader");

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 300 } },
          async (text) => {
            const now = Date.now();
            if (now - lastScan.current < 3000) return;
            lastScan.current = now;
            
            let tokenToSend = text;
            const match = text.match(/ID:\s*([A-Z0-9\-]+)/i);
            if (match && match[1]) {
              tokenToSend = match[1];
            }
            
            if (isRunning && html5QrCode) {
              try { html5QrCode.pause(); } catch (e) {}
            }
            setToken(tokenToSend);
            await validate(tokenToSend);
          },
          () => {} // Ignore parse errors
        );
        
        // If the component was unmounted while we were waiting for start() to finish
        if (!isMounted) {
          html5QrCode.stop().then(() => {
            try { html5QrCode.clear(); } catch(e) {}
          }).catch(()=>{});
          return;
        }

        isRunning = true;
        setPhase('scanning');
      } catch (err) {
        if (isMounted) console.error("Camera start error:", err);
      }
    };

    startScanner();
    
    return () => {
      isMounted = false;
      if (html5QrCode && isRunning) {
        html5QrCode.stop().then(() => {
          try { html5QrCode.clear(); } catch(e) {}
        }).catch(() => {});
      } else if (html5QrCode) {
        try { html5QrCode.clear(); } catch(e) {}
      }
    };
  }, [camKey, tab, isDone, validate]);

  const handleManual = async e => {
    e.preventDefault();
    if (!token.trim()) return;
    setVal(true);
    await validate(token.trim());
    setVal(false);
  };

  const handlePaste = async () => {
    try { setToken(await navigator.clipboard.readText()); } catch {}
  };

  const switchTab = t => { setTab(t); reset(); setCamKey(k => k + 1); };

  return (
    <>
      {/* Shrink animation keyframe injected once */}
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>

      <div className="max-w-2xl mx-auto space-y-4 anim-fade-in">
        <div className="bg-g-surface border border-g-border rounded-xl shadow-sm overflow-hidden">

          {/* ── Header ────────────────────────────────────────── */}
          <div className="px-5 py-4 border-b border-g-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-g-ok-bg rounded-lg flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-g-accent-ink" />
              </div>
              <div>
                <p className="font-bold text-g-text text-sm">QR Pass Validator</p>
                <p className="text-xs text-g-text-2">Scan or enter a pass token</p>
              </div>
            </div>
            {/* Status pill */}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              phase === 'scanning'   ? 'bg-g-info-bg text-g-info'   :
              phase === 'validating' ? 'bg-g-warn-bg text-g-warn' :
              result?.valid ? 'bg-g-ok-bg text-g-accent-ink' :
              result        ? 'bg-g-danger-bg text-g-danger'     :
              'bg-g-surface-2 text-g-text-2'
            }`}>
              {phase === 'scanning'   && '● Live'}
              {phase === 'validating' && '⏳ Checking…'}
              {phase === 'done' && result?.valid && '✅ Granted'}
              {phase === 'done' && !result?.valid && '❌ Denied'}
              {phase === 'idle' && '— Idle'}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* ── Tab Switch ──────────────────────────────────── */}
            <div className="flex bg-g-surface-2 rounded-lg p-1">
              {[
                { id: 'camera', Icon: Camera,   label: 'Camera Scan'   },
                { id: 'manual', Icon: KeyRound, label: 'Manual Token'  },
              ].map(({ id, Icon, label }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  onClick={() => switchTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    tab === id
                      ? 'bg-g-surface text-g-text shadow-sm'
                      : 'text-g-text-2 hover:text-g-text'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* ── Camera Tab ──────────────────────────────────── */}
            {tab === 'camera' && (
              <>
                {phase === 'confirming' ? (
                  <ConfirmOverlay 
                    result={result} 
                    qr_token={token} 
                    onConfirm={handleFinalConfirm} 
                    onCancel={reset} 
                  />
                ) : isDone ? (
                  <ResultOverlay result={result} onReset={reset} />
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-black min-h-[450px]">
                    <div id="qr-reader" className="w-full h-full" />
                    
                    {/* Targeting Brackets */}
                    {phase === 'scanning' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                         <div className="w-64 h-64 relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-g-surface rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-g-surface rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-g-surface rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-g-surface rounded-br-lg"></div>
                         </div>
                      </div>
                    )}

                    {phase === 'validating' && (
                      <div className="absolute inset-0 bg-g-surface/90 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-12 h-12 text-g-accent-ink spin" />
                        <p className="text-sm font-semibold text-g-text-2">Validating pass…</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Manual Tab ──────────────────────────────────── */}
            {/* NOTE: ConfirmOverlay and ResultOverlay are rendered OUTSIDE the form
                to prevent illegal nested <form> elements. The outer form only wraps
                the idle token-input phase. */}
            {tab === 'manual' && (
              <>
                {phase === 'confirming' ? (
                  <ConfirmOverlay
                    result={result}
                    qr_token={token}
                    onConfirm={handleFinalConfirm}
                    onCancel={reset}
                  />
                ) : isDone ? (
                  <ResultOverlay result={result} onReset={reset} />
                ) : (
                  <form onSubmit={handleManual} className="space-y-4">
                    <div>
                      <label htmlFor="qr-token-input" className="block text-sm font-semibold text-g-text mb-1.5">
                        QR Token / Pass ID
                      </label>
                      <p className="text-xs text-g-text-2 mb-2">Paste the JWT token from the resident's QR pass.</p>
                      <div className="flex gap-2">
                        <input
                          id="qr-token-input"
                          value={token}
                          onChange={e => setToken(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                          disabled={validating}
                          className="flex-1 h-10 px-3 border border-g-border-strong rounded-lg text-xs font-mono text-g-text bg-g-surface placeholder:text-g-text-2 focus:outline-none focus:ring-2 focus:ring-g-accent focus:border-transparent disabled:opacity-60"
                        />
                        <button
                          type="button"
                          id="paste-token-btn"
                          onClick={handlePaste}
                          title="Paste from clipboard"
                          className="w-10 h-10 border border-g-border-strong rounded-lg flex items-center justify-center text-g-text-2 hover:text-g-text hover:bg-g-surface-2 transition-all"
                        >
                          <ClipboardPaste className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Validate button */}
                    <button
                      id="validate-token-btn"
                      type="submit"
                      disabled={validating || !token.trim()}
                      className="w-full h-12 rounded-lg text-sm font-bold text-g-on-accent bg-g-accent hover:bg-g-accent/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {validating
                        ? <><Loader2 className="w-5 h-5 spin" /> Validating…</>
                        : <><ScanLine className="w-5 h-5" /> Validate Pass</>
                      }
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ── Reset (if done via camera tab) ──────────────── */}
            {isDone && tab === 'camera' && (
              <div className="pt-1" />
            )}
          </div>
        </div>

        {/* Tip box */}
        <div className="flex items-start gap-2.5 bg-g-info-bg border border-g-info/30 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-g-info shrink-0 mt-0.5" />
          <p className="text-xs text-g-info">
            <strong>Tip:</strong> Each QR pass is valid for one-time use only on its designated date.
            Passes auto-reset after 4 seconds for fast throughput.
          </p>
        </div>
      </div>
    </>
  );
};

export default QRScanner;
