import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import useCart from '../../hooks/useCart';
import useWishlist from '../../hooks/useWishlist';
import Logo from './Logo';

// Search box used in the header (desktop) and the drop-down search row (mobile).
const SearchBox = ({ autoFocus = false, onDone, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(() => new URLSearchParams(location.search).get('q') || '');

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/collection?q=${encodeURIComponent(q)}` : '/collection');
    onDone?.();
  };

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <Search size={17} strokeWidth={1.7} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products, brands, categories…"
        aria-label="Search products"
        autoFocus={autoFocus}
        className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
      />
    </form>
  );
};

const Navbar = () => {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const accountRef = useRef(null);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/collection' },
    { name: 'Offers', path: '/offers' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
      toast.success(result.message);

      setAccountOpen(false);
      setMenuOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="flex h-18 items-center justify-between gap-4">
          {/* Brand */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `group relative py-6 text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? 'text-gray-950'
                          : 'text-gray-500 hover:text-gray-950'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {link.name}

                        <span
                          className={`absolute bottom-4 left-0 h-[1.5px] bg-gray-950 transition-all duration-300 ${
                            isActive ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Search (desktop) */}
          <SearchBox className="hidden max-w-sm flex-1 md:block" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search (mobile) */}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 md:hidden"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X size={20} strokeWidth={1.8} /> : <Search size={20} strokeWidth={1.8} />}
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 hover:text-black"
              aria-label="Wishlist"
            >
              <Heart size={20} strokeWidth={1.8} />

              {wishlistCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-medium text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account - Desktop */}
            <div ref={accountRef} className="relative hidden sm:block">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((prev) => !prev)}
                    className={`flex h-10 items-center justify-center gap-1 rounded-full px-2 text-gray-700 transition hover:bg-gray-100 hover:text-black ${
                      accountOpen ? 'bg-gray-100 text-black' : ''
                    }`}
                    aria-label="Account menu"
                    aria-expanded={accountOpen}
                  >
                    <UserRound size={20} strokeWidth={1.8} />

                    <ChevronDown
                      size={13}
                      strokeWidth={1.8}
                      className={`transition-transform duration-200 ${
                        accountOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Account Dropdown */}
                  <div
                    className={`absolute right-0 top-full z-50 pt-3 transition-all duration-200 ${
                      accountOpen
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible -translate-y-1 opacity-0'
                    }`}
                  >
                    <div className="w-64 border border-gray-100 bg-white p-2 shadow-lg shadow-black/5">
                      {/* User */}
                      <div className="border-b border-gray-100 px-3 py-3">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {user.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-2">
                        {user.role === 'ADMIN' && (
                          <DropdownLink
                            to="/dashboard"
                            icon={LayoutDashboard}
                            onClick={() => setAccountOpen(false)}
                          >
                            Admin dashboard
                          </DropdownLink>
                        )}

                        <DropdownLink
                          to="/account"
                          icon={Settings}
                          onClick={() => setAccountOpen(false)}
                        >
                          My account
                        </DropdownLink>

                        <DropdownLink
                          to="/orders"
                          icon={Package}
                          onClick={() => setAccountOpen(false)}
                        >
                          My orders
                        </DropdownLink>

                        <DropdownLink
                          to="/wishlist"
                          icon={Heart}
                          onClick={() => setAccountOpen(false)}
                        >
                          Wishlist
                        </DropdownLink>
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-600 transition hover:bg-gray-50 hover:text-black"
                        >
                          <LogOut size={17} strokeWidth={1.7} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 hover:text-black"
                  aria-label="Sign in"
                >
                  <UserRound size={20} strokeWidth={1.8} />
                </Link>
              )}
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 hover:text-black"
              aria-label="Cart"
            >
              <ShoppingBag size={21} strokeWidth={1.8} />

              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-medium text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={23} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Search row (mobile) */}
        {searchOpen && (
          <div className="pb-3 md:hidden">
            <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        )}
      </header>

      {/* Mobile Backdrop */}
      <div
        onClick={closeMobileMenu}
        className={`fixed inset-0 z-60 bg-black/30 backdrop-blur-[2px] transition-all duration-300 lg:hidden ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      />

      {/* Mobile Menu */}
      <aside
        className={`fixed right-0 top-0 z-70 h-dvh w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-[72px] items-center justify-between border-b border-gray-100 px-5">
          <Logo compact onClick={closeMobileMenu} />

          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex h-[calc(100%-72px)] flex-col overflow-y-auto">
          {/* Navigation */}
          <nav className="p-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-4 py-3.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-gray-100 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`
                  }
                >
                  <span>{link.name}</span>

                  <ChevronRight
                    size={17}
                    strokeWidth={1.8}
                    className="text-gray-400"
                  />
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Mobile Account Section */}
          <div className="mt-auto border-t border-gray-100 p-4">
            {user ? (
              <>
                {/* User */}
                <div className="mb-3 px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-gray-400">
                    {user.email}
                  </p>
                </div>

                {user.role === 'ADMIN' && (
                  <MobileAccountLink
                    to="/dashboard"
                    icon={LayoutDashboard}
                    onClick={closeMobileMenu}
                  >
                    Admin dashboard
                  </MobileAccountLink>
                )}

                <MobileAccountLink
                  to="/account"
                  icon={Settings}
                  onClick={closeMobileMenu}
                >
                  My account
                </MobileAccountLink>

                <MobileAccountLink
                  to="/orders"
                  icon={Package}
                  onClick={closeMobileMenu}
                >
                  My orders
                </MobileAccountLink>

                <MobileAccountLink
                  to="/wishlist"
                  icon={Heart}
                  onClick={closeMobileMenu}
                >
                  Wishlist
                </MobileAccountLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
                >
                  <LogOut size={18} strokeWidth={1.7} />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="flex items-center justify-between rounded-lg px-4 py-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
              >
                <div className="flex items-center gap-3">
                  <UserRound size={19} strokeWidth={1.8} />
                  Sign in
                </div>

                <ChevronRight
                  size={17}
                  strokeWidth={1.8}
                  className="text-gray-400"
                />
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

const DropdownLink = ({ to, icon: Icon, children, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-black"
    >
      <Icon size={17} strokeWidth={1.7} />
      {children}
    </Link>
  );
};

const MobileAccountLink = ({ to, icon: Icon, children, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between rounded-lg px-4 py-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={1.7} />
        {children}
      </div>

      <ChevronRight size={17} strokeWidth={1.8} className="text-gray-400" />
    </Link>
  );
};

export default Navbar;
