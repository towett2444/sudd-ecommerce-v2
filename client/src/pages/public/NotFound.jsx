import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <main className="flex min-h-125 flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
        404
      </p>

      <h1 className="mt-4 text-3xl font-medium tracking-tight text-gray-950">
        Page not found
      </h1>

      <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500">
        The page you are looking for doesn't exist or isn't available yet.
      </p>

      <Link
        to="/"
        className="mt-7 inline-flex items-center gap-2 bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>
    </main>
  );
};

export default NotFound;
