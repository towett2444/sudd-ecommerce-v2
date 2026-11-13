import { Star } from 'lucide-react';

// Read-only star rating (supports halves visually by rounding to nearest whole star).
export const Stars = ({ value = 0, size = 14, className = '' }) => (
  <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        strokeWidth={1.5}
        fill={n <= Math.round(value) ? 'currentColor' : 'none'}
        className={n <= Math.round(value) ? 'text-amber-500' : 'text-gray-300'}
      />
    ))}
  </span>
);

// Clickable star picker for the review form.
export const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
        onClick={() => onChange(n)}
        className="cursor-pointer p-0.5"
      >
        <Star size={26} strokeWidth={1.4} fill={n <= value ? 'currentColor' : 'none'} className={n <= value ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'} />
      </button>
    ))}
  </div>
);

export default Stars;
