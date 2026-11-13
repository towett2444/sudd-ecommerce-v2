import { ExternalLink, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardNavbar = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-50 flex h-[72px] items-center border-b border-gray-200 bg-white">
      <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={20} strokeWidth={1.7} />
          </button>

          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight text-gray-950">
              Sudd Shop
            </span>

            <span className="hidden border-l border-gray-200 pl-3 text-xs text-gray-400 sm:block">
              Admin
            </span>
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-black"
          >
            <span className="hidden sm:inline">View store</span>

            <ExternalLink size={15} strokeWidth={1.7} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
