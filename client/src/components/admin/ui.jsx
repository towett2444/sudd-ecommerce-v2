// Small building blocks shared by the admin pages.
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export const PageHeader = ({ title, text, children }) => (
  <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-950">{title}</h1>
      {text && <p className="mt-1 text-sm text-gray-500">{text}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-2">{children}</div>}
  </div>
);

export const Card = ({ title, action, children, className = '' }) => (
  <section className={`border border-gray-200 bg-white ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const Stat = ({ label, value, hint, tone = '' }) => (
  <div className="border border-gray-200 bg-white p-5">
    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
    <p className={`mt-2 text-2xl font-semibold text-gray-950 ${tone}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

export const Btn = ({ variant = 'dark', className = '', ...props }) => {
  const styles = {
    dark: 'bg-gray-950 text-white hover:bg-gray-800',
    light: 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
    green: 'bg-green-700 text-white hover:bg-green-800',
  };
  return (
    <button type="button" {...props}
      className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} />
  );
};

export const Field = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
  </label>
);

export const Pager = ({ page, pages, total, onPage, label = 'results' }) => (
  <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
    <span>{total} {label}</span>
    {pages > 1 && (
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-200 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button>
        <span>{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-200 disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button>
      </div>
    )}
  </div>
);

// Right-hand slide-over panel for details (order, customer).
export const Drawer = ({ open, onClose, title, children }) => (
  <>
    <div onClick={onClose} className={`fixed inset-0 z-[80] bg-black/30 transition-opacity ${open ? 'visible opacity-100' : 'invisible opacity-0'}`} />
    <aside role="dialog" aria-modal="true" aria-label={title}
      className={`fixed inset-y-0 right-0 z-[90] flex w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
        <h2 className="font-semibold text-gray-950">{title}</h2>
        <button type="button" onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center hover:bg-gray-100" aria-label="Close"><X size={19} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{open && children}</div>
    </aside>
  </>
);

export const TableWrap = ({ children }) => <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">{children}</table></div>;
export const Th = ({ children, className = '' }) => <th className={`border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 ${className}`}>{children}</th>;
export const Td = ({ children, className = '' }) => <td className={`border-b border-gray-50 px-5 py-3 align-middle ${className}`}>{children}</td>;

export const Empty = ({ children }) => <p className="px-5 py-12 text-center text-sm text-gray-500">{children}</p>;

export const inputClass = 'h-10 w-full border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-500';
