import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { refLine } from '@/lib/passCode';
import { Download, Share2, X, Pin } from 'lucide-react';

const PassCard = ({ pass, onClose }) => {
  const cardRef = useRef(null);
  if (!pass) return null;

  const rawDate = pass.expected_date || '';
  const formattedDate = rawDate
    ? new Date(`${rawDate}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const qrPayload = `GuardTrack
ID: ${pass.pass_id?.slice(0, 8).toUpperCase()}
Guest: ${pass.guest_name}
Dest: Blk ${pass.block || pass.Property?.block} Lot ${pass.lot || pass.Property?.lot}
Date: ${formattedDate}
Purpose: ${pass.purpose || pass.notes || 'Visit'}
${refLine({ pass_id: pass.pass_id, expected_date: pass.expected_date, property_id: pass.PropertyId ?? pass.Property?.id, guest_name: pass.guest_name })}`;

  const handleDownload = () => {
    const canvas = cardRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `pass-${pass.pass_id?.slice(0, 8)}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const handleShare = async () => {
    const text = `Camella GuardTrack Gate Pass\nGuest: ${pass.guest_name}\nDate: ${formattedDate}\nPass ID: ${pass.pass_id}`;
    if (navigator.share) {
      await navigator.share({ title: 'Gate Pass', text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert('Pass details copied to clipboard.');
    }
  };

  return (
    <div ref={cardRef} className="bg-card rounded-2xl shadow-2xl overflow-hidden p-8 relative">
      
      {/* ── Close Button (if provided) ────────────────────────────────────────── */}
      {onClose && (
        <button 
          onClick={onClose}
          aria-label="Close pass"
          className="absolute top-5 right-5 w-11 h-11 bg-muted hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors no-print"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* ── Title ───────────────────────────────────────────────────────────── */}
      <h2 className="text-[22px] font-black text-success tracking-wide uppercase mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Guest Gatepass
      </h2>

      {/* ── Middle Section: QR + Details ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start gap-8">
        
        {/* Left: QR Code Box */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="border-[1.5px] border-foreground p-1 bg-white rounded-sm">
            <QRCodeCanvas
              value={qrPayload}
              title={`QR code for ${pass.guest_name}'s visitor pass`}
              role="img"
              aria-label={`QR code for ${pass.guest_name}'s visitor pass`}
              size={200}
              level="M"
              marginSize={2}
            />
          </div>
          <p className="text-[11px] font-bold text-muted-foreground mt-3 tracking-widest uppercase">
            {pass.pass_id?.slice(0, 8)}
          </p>
        </div>

        {/* Right: Text Details */}
        <div className="flex-1 space-y-5 pt-1">
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">
              Guest Name
            </p>
            <p className="font-extrabold text-foreground text-xl tracking-tight leading-none">
              {pass.guest_name}
            </p>
          </div>
          
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">
              Visit Date
            </p>
            <p className="font-extrabold text-foreground text-base tracking-tight leading-none">
              {formattedDate}
            </p>
          </div>

          <div>
            <span className="inline-block text-[11px] font-black text-success bg-success-bg px-3 py-1 rounded-full tracking-wider uppercase">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer Info ─────────────────────────────────────────────────────── */}
      <div className="mt-8 mb-8 flex items-start gap-3">
        <Pin className="w-5 h-5 text-success shrink-0 fill-primary rotate-45" />
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          Present this QR Code to the guard at the gate. Valid for <strong className="text-muted-foreground">one-time use</strong> on <strong className="text-muted-foreground">{formattedDate}</strong> only.
        </p>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 no-print">
        <button
          id="download-qr-btn"
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-black tracking-wide rounded-sm transition-all shadow-sm active:scale-[0.98] uppercase"
        >
          <Download className="w-4 h-4" /> Download
        </button>
        <button
          id="share-pass-btn"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 h-11 bg-warning hover:bg-warning/90 text-primary-foreground text-[13px] font-black tracking-wide rounded-sm transition-all shadow-sm active:scale-[0.98] uppercase"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

    </div>
  );
};

export default PassCard;
