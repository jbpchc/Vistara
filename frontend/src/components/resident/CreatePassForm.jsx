import { useState } from 'react';
import { QrCode, Loader2 } from 'lucide-react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import PassCard from './PassCard';

const CreatePassForm = () => {
  const { user } = useAuth();
  const property = user?.primary_property;

  const [form, setForm]   = useState({ guest_name: '', expected_date: '', purpose: '' });
  const [pass, setPass]   = useState(null);
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleChange = e => {
    setError('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.guest_name.trim()) { setError('Please enter the guest\'s full name.'); return; }
    if (!form.expected_date)     { setError('Please select the expected visit date.'); return; }
    if (!property?.id)           { setError('No property linked to your account.'); return; }

    setLoad(true);
    try {
      const res = await api.post('/qr/generate', {
        property_id:   property.id,
        guest_name:    form.guest_name.trim(),
        expected_date: form.expected_date,
        purpose:       form.purpose.trim() || 'Visit',
      });
      setPass(res.data.data);
      setForm({ guest_name: '', expected_date: '', purpose: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate pass. Please try again.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-green-800" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Create Gate Pass</h2>
            <p className="text-xs text-gray-400">Generate a QR pass for an expected visitor</p>
          </div>
        </div>

        {property && (
          <div className="mb-5 p-3 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-xs text-green-700 font-medium">Your Property</p>
            <p className="text-sm font-bold text-green-900">
              Block {property.block}, Lot {property.lot}
              {property.street ? ` — ${property.street}` : ''}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Guest Name */}
          <div>
            <label htmlFor="guest_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Guest Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="guest_name"
              name="guest_name"
              type="text"
              placeholder="e.g. Maria dela Cruz"
              value={form.guest_name}
              onChange={handleChange}
              disabled={loading}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent disabled:opacity-60 transition-shadow"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="expected_date" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Expected Visit Date <span className="text-red-500">*</span>
            </label>
            <input
              id="expected_date"
              name="expected_date"
              type="date"
              min={today}
              value={form.expected_date}
              onChange={handleChange}
              disabled={loading}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent disabled:opacity-60 transition-shadow"
            />
            <p className="text-xs text-gray-400 mt-1">The QR pass is valid only on this date.</p>
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Purpose of Visit
            </label>
            <input
              id="purpose"
              name="purpose"
              type="text"
              placeholder="e.g. Family Visit, Plumber, Delivery"
              value={form.purpose}
              onChange={handleChange}
              disabled={loading}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent disabled:opacity-60 transition-shadow"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            id="create-pass-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg text-sm font-bold text-white bg-green-800 hover:bg-green-900 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 spin" /> Generating…</>
              : <><QrCode className="w-4 h-4" /> Generate QR Pass</>
            }
          </button>
        </form>
      </div>

      {/* Pass Card */}
      {pass && <PassCard pass={pass} />}
    </div>
  );
};

export default CreatePassForm;
