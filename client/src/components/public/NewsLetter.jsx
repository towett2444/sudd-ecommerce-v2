import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

import { newsletterBackground } from '../../data/images';

const NewsLetter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const onSubmitHandler = (e) => {
    e.preventDefault();

    // Temporary frontend behavior.
    // Connect this to the backend later.
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section className="relative mt-16 overflow-hidden sm:mt-20">
      <img
        src={newsletterBackground}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
          Stay in the loop
        </p>

        <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
          New styles, straight to your inbox.
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/80 sm:text-base">
          Be the first to discover new arrivals, special offers and updates from
          Sudd Shop.
        </p>

        {subscribed ? (
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 border border-white/30 bg-white/10 px-5 py-4 text-sm text-white backdrop-blur-sm">
            <Check size={17} strokeWidth={1.7} />
            Thanks for subscribing.
          </div>
        ) : (
          <form
            onSubmit={onSubmitHandler}
            className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:gap-0"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>

            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              required
              className="h-12 min-w-0 flex-1 border border-white bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />

            <button
              type="submit"
              className="group flex h-12 cursor-pointer items-center justify-center gap-2 bg-gray-950 px-6 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Subscribe
              <ArrowRight
                size={16}
                strokeWidth={1.7}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </form>
        )}

        <p className="mt-4 text-xs leading-5 text-white/60">
          By subscribing, you agree to receive marketing emails from Sudd Shop.
          You can unsubscribe at any time.
        </p>
      </div>
      </div>
    </section>
  );
};

export default NewsLetter;
