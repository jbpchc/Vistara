import ManualEntryForm from '@/components/guard/ManualEntryForm';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ManualEntryPage = () => (
  <div className="max-w-4xl mx-auto w-full pt-8 space-y-6 anim-fade-in">
    <div className="flex items-center gap-5">
      <Link
        to="/guard/dashboard"
        className="inline-flex items-center gap-2 h-12 px-5 rounded-full border border-g-border bg-g-surface text-g-text text-[15px] font-semibold hover:border-g-accent"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to console
      </Link>
      <h1 className="text-[28px] font-semibold text-g-text">Walk-in visitor</h1>
    </div>
    <div className="rounded-card bg-g-surface border border-g-border p-5">
      <ManualEntryForm />
    </div>
  </div>
);
export default ManualEntryPage;
