import ManualEntryForm from '@/components/guard/ManualEntryForm';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ManualEntryPage = () => (
  <div className="max-w-4xl mx-auto w-full pt-8 space-y-6 anim-fade-in">
    <div className="flex justify-start">
      <Link 
        to="/guard/dashboard" 
        className="flex items-center gap-2 px-4 py-2 bg-[#114D2D] hover:bg-[#1a5f39] text-white font-bold text-sm rounded-lg transition-all shadow-md active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /> Go To Dashboard
      </Link>
    </div>
    <ManualEntryForm />
  </div>
);
export default ManualEntryPage;
