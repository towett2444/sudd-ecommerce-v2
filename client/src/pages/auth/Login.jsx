import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

const Login = () => {
  const { register, login, authLoading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const switchMode = () => {
    setIsLogin((prev) => !prev);
    setShowPassword(false);

    setFormData({
      name: '',
      email: '',
      password: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = isLogin
      ? await login({
          email: formData.email,
          password: formData.password,
        })
      : await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

    if (result.success) {
      toast.success(result.message);

      setFormData({
        name: '',
        email: '',
        password: '',
      });

      // Go back to the page that asked for login, or to the dashboard for admins
      const redirectTo =
        location.state?.from ||
        (result.user?.role === 'ADMIN' ? '/dashboard' : '/');

      navigate(redirectTo, { replace: true });
    } else if (isLogin && result.message === 'Invalid email or password.') {
      // Accounts are stored per database, so an account from another PC won't exist here
      toast.error(
        'Invalid email or password. No account yet? Click "Create account" below.',
        { duration: 6000 },
      );
    } else {
      toast.error(result.message);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
            {isLogin
              ? 'Sign in to view your orders, manage your account and continue shopping.'
              : 'Create an account for faster checkout and easy order tracking.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {!isLogin && (
            <Input
              label="Full name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          )}

          <Input
            label="Email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-gray-600"
              >
                Password
              </label>

              {isLogin && (
                <Link
                  to="/contact"
                  className="text-xs text-gray-500 transition hover:text-black"
                  title="We'll help you reset it"
                >
                  Forgot password? Contact us
                </Link>
              )}
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  isLogin ? 'Enter your password' : 'Create a password'
                }
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={8}
                required
                className="h-12 w-full border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-0 flex h-full w-12 cursor-pointer items-center justify-center text-gray-400 transition hover:text-black"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.6} />
                ) : (
                  <Eye size={18} strokeWidth={1.6} />
                )}
              </button>
            </div>

            {!isLogin && (
              <p className="mt-2 text-xs text-gray-400">
                Use at least 8 characters.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={authLoading}
            className="group flex h-12 w-full cursor-pointer items-center justify-center gap-3 bg-black px-6 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authLoading
              ? isLogin
                ? 'Signing in...'
                : 'Creating account...'
              : isLogin
                ? 'Sign in'
                : 'Create account'}

            {!authLoading && (
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <p className="mt-7 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="cursor-pointer font-medium text-gray-950 underline underline-offset-4"
          >
            {isLogin ? 'Create account' : 'Sign in'}
          </button>
        </p>

        {/* Security */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <LockKeyhole size={13} strokeWidth={1.6} />
          Secure account access
        </div>
      </div>
    </main>
  );
};

const Input = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-medium text-gray-600"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-12 w-full border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-500"
      />
    </div>
  );
};

const GoogleIcon = () => {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.4l-3.24-2.51c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.11-1.32.32-1.92v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.52l3.35-2.6Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.97 2.97 14.7 2 12 2a10 10 0 0 0-8.96 5.48l3.35 2.6C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
  );
};

export default Login;
