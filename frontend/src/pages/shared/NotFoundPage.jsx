import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-green-100 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-orange-100 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />

      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-10 text-center anim-fade-in z-10">
        <div className="w-20 h-20 bg-green-50 text-green-700 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
          <Compass className="w-10 h-10" />
        </div>
        
        <h1 className="text-7xl font-black text-green-800 tracking-tighter mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          404
        </h1>
        <h2 className="text-xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Page Not Found
        </h2>
        
        <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
          The gate pass or portal you are looking for does not exist or has been moved.
        </p>
        
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 h-12 bg-green-800 hover:bg-green-900 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-green-900/20"
        >
          <Home className="w-5 h-5" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
