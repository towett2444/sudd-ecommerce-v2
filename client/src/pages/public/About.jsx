import { Link } from 'react-router-dom';

import {
  ArrowRight,
  Heart,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

import { aboutImage } from '../../data/images';

const About = () => {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-gray-100 py-16 sm:py-20 lg:py-28">
        <div className="grid items-end gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              About Sudd Shop
            </p>

            <h1 className="max-w-2xl text-4xl font-medium leading-[1.08] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Everyday style,
              <br />
              made simple.
            </h1>
          </div>

          <div className="lg:pb-2">
            <p className="max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
              Sudd Shop is built around a simple idea: shopping should be easy,
              reliable, and enjoyable. We bring together carefully selected
              fashion and everyday essentials in one simple shopping experience.
            </p>

            <Link
              to="/collection"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-gray-950"
            >
              Explore our collection
              <ArrowRight
                size={16}
                strokeWidth={1.8}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Visual */}
          <div className="relative flex min-h-[430px] items-end overflow-hidden bg-gray-100 sm:min-h-[520px]">
            <img
              src={aboutImage}
              alt="Inside the Sudd Shop store"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="relative z-10 p-8 text-white sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-sm">
                <ShoppingBag
                  size={24}
                  strokeWidth={1.4}
                  className="text-gray-800"
                />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                Sudd Shop
              </p>

              <p className="mt-2 max-w-xs text-xl font-medium leading-8 sm:text-2xl">
                Thoughtfully selected for everyday life.
              </p>
            </div>
          </div>

          {/* Story Content */}
          <div className="flex flex-col justify-center lg:px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              Our story
            </p>

            <h2 className="mt-4 max-w-lg text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">
              A better way to shop for the things you love.
            </h2>

            <div className="mt-7 max-w-lg space-y-5 text-sm leading-7 text-gray-500 sm:text-base">
              <p>
                We created Sudd Shop to make online shopping straightforward. No
                unnecessary complexity — just great products, clear prices, and
                an experience designed around the customer.
              </p>

              <p>
                From clothing and shoes to accessories and everyday essentials,
                our goal is to make it easier to discover products that fit your
                style and your life.
              </p>

              <p>
                As we grow, we remain focused on improving every part of the
                experience — from discovering a product to receiving your order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-y border-gray-100 py-12 sm:py-14">
        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4">
          <Stat value="Simple" label="Shopping experience" />

          <Stat value="Secure" label="Checkout" />

          <Stat value="Quality" label="Selected products" />

          <Stat value="Support" label="When you need us" />
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mb-12 max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
            What matters to us
          </p>

          <h2 className="mt-4 text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">
            Shopping built around you.
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-500">
            Everything we build at Sudd Shop starts with making the shopping
            experience simpler, more dependable, and more enjoyable.
          </p>
        </div>

        <div className="grid border-l border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard
            icon={Sparkles}
            title="Thoughtful selection"
            description="Products selected with everyday style, usefulness, and quality in mind."
          />

          <ValueCard
            icon={PackageCheck}
            title="Reliable service"
            description="Clear order information and a straightforward experience from checkout to delivery."
          />

          <ValueCard
            icon={ShieldCheck}
            title="Secure shopping"
            description="A shopping experience designed with security and customer confidence in mind."
          />

          <ValueCard
            icon={Heart}
            title="Customer first"
            description="We listen, improve, and build around what makes shopping easier for our customers."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mb-16 overflow-hidden bg-gray-950 px-6 py-14 text-white sm:px-10 sm:py-16 lg:mb-20 lg:px-16 lg:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              Discover Sudd Shop
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-tight sm:text-4xl">
              Find something you'll love.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-gray-400">
              Explore our latest products and discover everyday pieces selected
              for style, comfort, and simplicity.
            </p>
          </div>

          <Link
            to="/collection"
            className="group inline-flex w-fit items-center gap-3 bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-gray-100"
          >
            Shop collection
            <ArrowRight
              size={16}
              strokeWidth={1.8}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </main>
  );
};

const Stat = ({ value, label }) => {
  return (
    <div className="px-4 text-center sm:border-r sm:border-gray-200 sm:last:border-r-0">
      <p className="text-xl font-medium tracking-tight text-gray-950 sm:text-2xl">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">{label}</p>
    </div>
  );
};

const ValueCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="border-b border-r border-gray-200 p-6 sm:p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
        <Icon size={19} strokeWidth={1.6} className="text-gray-700" />
      </div>

      <h3 className="mt-8 text-base font-medium text-gray-950">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
};

export default About;
