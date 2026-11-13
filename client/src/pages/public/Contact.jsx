import { Clock3, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();

    toast.success('Your message has been sent.');

    e.currentTarget.reset();
  };

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      <div className="grid items-stretch gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left Side */}
        <div className="flex flex-col justify-center">
          {/* Icon */}
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <Mail size={21} strokeWidth={1.7} className="text-gray-800" />
          </div>

          {/* Heading */}
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
            Get in touch
          </p>

          <h1 className="text-4xl font-medium tracking-tight text-gray-950 sm:text-5xl">
            Contact us
          </h1>

          <p className="mt-6 max-w-lg text-sm leading-7 text-gray-500 sm:text-base">
            Have a question about an order, product, delivery, or anything else?
            Our team is here to help make your Sudd Shop experience as smooth as
            possible.
          </p>

          {/* Contact Details */}
          <div className="mt-10 max-w-lg space-y-1">
            <ContactDetail
              icon={Mail}
              title="Email"
              value="support@suddshop.com"
            />

            <ContactDetail
              icon={Phone}
              title="Phone"
              value="+254 700 000 000"
            />

            <ContactDetail
              icon={MapPin}
              title="Location"
              value="Nakuru, Kenya"
            />

            <ContactDetail
              icon={Clock3}
              title="Support hours"
              value="Monday – Saturday, 8:00 AM – 6:00 PM"
            />
          </div>

          {/* Help Box */}
          <div className="mt-10 max-w-lg border-t border-gray-200 pt-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <MessageSquare
                  size={18}
                  strokeWidth={1.7}
                  className="text-gray-600"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Need help with an order?
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Include your order number in your message so we can assist you
                  faster.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="relative overflow-hidden rounded-3xl bg-gray-100 p-6 sm:p-8 lg:p-10">
          {/* Decorative Grid */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-52 w-52 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(to right, #d1d5db 1px, transparent 1px), linear-gradient(to bottom, #d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              maskImage:
                'linear-gradient(to bottom left, black, transparent 75%)',
              WebkitMaskImage:
                'linear-gradient(to bottom left, black, transparent 75%)',
            }}
          />

          <div className="relative z-10">
            <div className="mb-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                Send a message
              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-tight text-gray-950">
                How can we help?
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <FormField
                label="Full name"
                name="name"
                type="text"
                placeholder="John Doe"
              />

              {/* Email */}
              <FormField
                label="Email address"
                name="email"
                type="email"
                placeholder="john@example.com"
              />

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>

                <select
                  id="subject"
                  name="subject"
                  defaultValue=""
                  className="h-12 w-full border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-gray-500"
                  required
                >
                  <option value="" disabled>
                    Select a subject
                  </option>

                  <option value="order">Order enquiry</option>

                  <option value="delivery">Delivery</option>

                  <option value="product">Product question</option>

                  <option value="returns">Returns & refunds</option>

                  <option value="other">Other</option>
                </select>
              </div>

              {/* Order Number */}
              <div>
                <label
                  htmlFor="orderNumber"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Order number
                  <span className="ml-1 font-normal text-gray-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="orderNumber"
                  name="orderNumber"
                  type="text"
                  placeholder="e.g. ORD-1001"
                  className="h-12 w-full border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-500"
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us how we can help..."
                  className="w-full resize-none border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-500"
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center justify-center gap-2 bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Send message
                <Send size={16} strokeWidth={1.7} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

const ContactDetail = ({ icon: Icon, title, value }) => {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <Icon size={17} strokeWidth={1.7} className="text-gray-600" />
      </div>

      <div>
        <p className="text-xs text-gray-400">{title}</p>

        <p className="mt-0.5 text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const FormField = ({ label, name, type, placeholder }) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-12 w-full border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-500"
        required
      />
    </div>
  );
};

export default Contact;
