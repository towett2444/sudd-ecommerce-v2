import { Link, Outlet } from 'react-router-dom';

import { loginImage } from '../data/images';

// Login / sign-up pages: form on the left, picture on the right (large screens)
const AuthLayout = () => {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col">
        <div className="px-6 pt-6 sm:px-10">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-gray-950"
          >
            Sudd Shop
          </Link>
        </div>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={loginImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            Sudd Shop
          </p>

          <p className="mt-3 max-w-md text-3xl font-medium leading-tight tracking-tight">
            Everyday style, delivered to your door.
          </p>
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
