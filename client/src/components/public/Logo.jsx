import { Link } from 'react-router-dom';

import store from '../../config/store';

// Store logo: a shopping-bag mark with an "S", plus the business name.
export const LogoMark = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
    <rect width="32" height="32" rx="8" fill="#0a0a0a" />
    <path d="M10.5 11.5V10a5.5 5.5 0 0 1 11 0v1.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M19.4 16.1c-.5-1.2-1.8-2-3.4-2-1.9 0-3.3 1-3.3 2.5 0 3.3 7 1.9 7 5.3 0 1.6-1.5 2.7-3.6 2.7-1.8 0-3.2-.9-3.7-2.2"
      fill="none"
      stroke="#fff"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const Logo = ({ to = '/', onClick, compact = false, className = '' }) => (
  <Link to={to} onClick={onClick} className={`flex shrink-0 items-center gap-2.5 ${className}`} aria-label={`${store.name} home`}>
    <LogoMark size={compact ? 28 : 32} />
    <span className={`font-semibold tracking-tight text-gray-950 ${compact ? 'text-lg' : 'text-xl sm:text-[22px]'}`}>
      {store.name}
    </span>
  </Link>
);

export default Logo;
