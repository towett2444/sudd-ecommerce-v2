import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Package,
  PackagePlus,
  ShoppingBag,
  Tags,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

const DashboardSidebar = ({ open, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    {
      label: 'Overview',
      to: '/dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: 'Products',
      to: '/dashboard/list',
      icon: Package,
    },
    {
      label: 'Add product',
      to: '/dashboard/add',
      icon: PackagePlus,
    },
    { label: 'Stock', to: '/dashboard/stock', icon: Boxes },
    { label: 'Categories', to: '/dashboard/categories', icon: Tags },
    {
      label: 'Orders',
      to: '/dashboard/orders',
      icon: ShoppingBag,
    },
    { label: 'Customers', to: '/dashboard/customers', icon: Users },
    { label: 'Reviews', to: '/dashboard/reviews', icon: MessageSquareText },
    { label: 'Sales reports', to: '/dashboard/reports', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
      toast.success(result.message);

      onClose();
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:h-[calc(100vh-72px)] lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-[72px] items-center justify-between border-b border-gray-200 px-5 lg:hidden">
          <div>
            <p className="font-semibold text-gray-950">Sudd Shop</p>

            <p className="text-xs text-gray-400">Admin</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-500 transition hover:bg-gray-100 hover:text-black"
            aria-label="Close navigation"
          >
            <X size={20} strokeWidth={1.7} />
          </button>
        </div>

        <div className="flex h-full flex-col">
          {/* Navigation */}
          <nav className="flex-1 p-4">
            <p className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Management
            </p>

            <div className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 text-sm transition ${
                        isActive
                          ? 'bg-gray-950 font-medium text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={1.7} />

                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Bottom */}
          <div className="border-t border-gray-200 p-4">
            {/* Admin */}
            <div className="mb-3 px-3 py-2">
              <p className="text-sm font-medium text-gray-900">Administrator</p>

              <p className="mt-1 text-xs text-gray-400">Sudd Shop Admin</p>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
            >
              <LogOut size={18} strokeWidth={1.7} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
