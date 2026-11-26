import { useState, useEffect } from 'react';
import { QrCode, CalendarCheck, Search, Loader2, ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/api/axios';
import { format } from 'date-fns';
import PassCard from '@/components/resident/PassCard';

const StatusBadge = ({ status }) => {
  const cfg = {
    active:  { bg: 'bg-green-100',  text: 'text-green-800',  label: 'ACTIVE'  },
    used:    { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'USED'    },
    expired: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'EXPIRED' },
  };
  const c = cfg[status] || cfg.expired;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

const ManagePassesPage = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPass, setSelectedPass] = useState(null);

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/passes/my');
      setPasses(res.data.data || []);
    } catch {
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = passes.filter(p => 
    p.guest_name.toLowerCase().includes(search.toLowerCase()) ||
    p.pass_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 anim-fade-in max-w-4xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/resident/dashboard" className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">Manage Passes</h1>
          <p className="text-sm text-gray-400">View and download your generated QR gate passes</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by guest name or pass ID..."
            className="w-full h-10 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-700 transition-all"
          />
        </div>
        <Link 
          to="/resident/create-pass"
          className="h-10 px-4 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shrink-0"
        >
          Create New Pass
        </Link>
      </div>

      {/* Pass Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-8 h-8 spin mb-2" />
          <p>Loading passes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No passes found.</p>
          <p className="text-sm mt-1">Try adjusting your search or create a new pass.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(pass => (
            <div 
              key={pass.pass_id} 
              onClick={() => setSelectedPass(pass)}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.98] flex flex-col h-full group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 text-green-700 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                  <QrCode className="w-6 h-6" />
                </div>
                <StatusBadge status={pass.status} />
              </div>
              
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Guest</p>
                <p className="font-bold text-gray-800 text-lg leading-tight mb-3 line-clamp-2">{pass.guest_name}</p>
                
                <div className="space-y-1.5 mt-auto">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarCheck className="w-4 h-4 text-gray-400" />
                    <span>
                      {pass.expected_date
                        ? new Date(`${pass.expected_date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">ID: {pass.pass_id?.slice(0, 8).toUpperCase()}</span>
                <span className="text-sm font-semibold text-green-700 group-hover:text-green-800">View QR &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay for PassCard */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm anim-fade-in">
          <div className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPass(null)}
              className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors no-print"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* We reuse the PassCard component! */}
            <PassCard pass={selectedPass} />
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagePassesPage;
