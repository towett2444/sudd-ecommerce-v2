import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { heroSlides } from '../../data/images';

const SLIDE_DURATION = 6000;

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = heroSlides.length;

  const goTo = (index) => setCurrent((index + count) % count);

  // move to the next slide automatically
  useEffect(() => {
    if (paused) return undefined;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [paused, count, current]);

  return (
    <section
      className="relative h-[560px] overflow-hidden bg-gray-900 sm:h-[620px] lg:h-[680px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {heroSlides.map((slide, index) => {
        const active = index === current;

        return (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!active}
          >
            {/* Background picture */}
            <img
              src={slide.image}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${
                active ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Dark overlay so the text stays readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

            {/* Content */}
            <div className="relative flex h-full items-center px-6 sm:px-10 md:px-14 lg:px-20">
              <div
                className={`max-w-xl transition-all delay-200 duration-700 ${
                  active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
                  {slide.eyebrow}
                </p>

                <h1 className="text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>

                <p className="mt-6 max-w-md text-sm leading-7 text-white/80 sm:text-base">
                  {slide.text}
                </p>

                <Link
                  to={slide.to}
                  tabIndex={active ? 0 : -1}
                  className="group mt-8 inline-flex items-center gap-3 bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-gray-100"
                >
                  {slide.cta}
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrows */}
      <button
        type="button"
        onClick={() => goTo(current - 1)}
        className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30 sm:flex"
        aria-label="Previous slide"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        onClick={() => goTo(current + 1)}
        className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30 sm:flex"
        aria-label="Next slide"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => goTo(index)}
            className={`h-1.5 cursor-pointer rounded-full transition-all ${
              index === current ? 'w-8 bg-white' : 'w-3 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
