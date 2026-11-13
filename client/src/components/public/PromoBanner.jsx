import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

import { promoBanner } from '../../data/images';

const PromoBanner = () => {
  return (
    <section className="relative overflow-hidden">
      <img
        src={promoBanner}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/55" />

      <div className="relative px-6 py-16 text-center text-white sm:px-10 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/70">
          This season
        </p>

        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-medium tracking-tight sm:text-5xl">
          Fresh styles for every occasion
        </h2>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
          Discover new pieces every week, delivered anywhere in Kenya.
        </p>

        <Link
          to="/collection"
          className="group mt-8 inline-flex items-center gap-3 bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-gray-100"
        >
          Explore the collection
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 border-t border-white/20 pt-8 text-sm sm:grid-cols-3">
          <Perk icon={Truck} text="Free delivery over KSh 10,000" />
          <Perk icon={RotateCcw} text="Easy 7-day returns" />
          <Perk icon={ShieldCheck} text="Pay with M-Pesa, card or cash" />
        </div>
      </div>
    </section>
  );
};

const Perk = ({ icon: Icon, text }) => (
  <div className="flex items-center justify-center gap-2 text-white/85">
    <Icon size={18} strokeWidth={1.6} />
    {text}
  </div>
);

export default PromoBanner;
