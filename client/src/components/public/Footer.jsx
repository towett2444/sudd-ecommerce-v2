import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

import store from '../../config/store';
import { getCategories } from '../../services/shop.service';
import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then((d) => setCategories(d.categories || [])).catch(() => {});
  }, []);

  return (
    <footer className="mt-20 border-t border-gray-200 bg-white sm:mt-24">
      <div className="grid gap-12 py-14 sm:grid-cols-2 sm:py-16 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr] lg:gap-12">
        {/* Brand */}
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-7 text-gray-500">{store.description}</p>

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">We accept</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <PayBadge className="bg-[#00a651] text-white">M-PESA</PayBadge>
              <PayBadge className="border border-gray-200 text-[#1a1f71]">VISA</PayBadge>
              <PayBadge className="border border-gray-200 text-gray-800">Mastercard</PayBadge>
              <PayBadge className="border border-gray-200 text-gray-700">Cash on delivery</PayBadge>
            </div>
          </div>
        </div>

        <FooterColumn title="Shop">
          <FooterLink to="/collection">All products</FooterLink>
          {categories.slice(0, 6).map((c) => (
            <FooterLink key={c._id} to={`/collection?category=${encodeURIComponent(c.name)}`}>
              {c.name}
            </FooterLink>
          ))}
          <FooterLink to="/offers">Special offers</FooterLink>
        </FooterColumn>

        <FooterColumn title="Help">
          <FooterLink to="/account">My account</FooterLink>
          <FooterLink to="/orders">Track your order</FooterLink>
          <FooterLink to="/contact">Contact us</FooterLink>
          <FooterLink to="/about">About us</FooterLink>
          <span className="text-sm text-gray-500">Returns within {store.returnsDays} days</span>
        </FooterColumn>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-medium text-gray-950">Get in touch</h3>

          <div className="mt-5 space-y-4 text-sm text-gray-500">
            <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="flex items-start gap-3 hover:text-black">
              <Phone size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
              {store.phone}
            </a>
            <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 hover:text-black">
              <MessageCircle size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
              WhatsApp us
            </a>
            <a href={`mailto:${store.email}`} className="flex items-start gap-3 hover:text-black">
              <Mail size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
              {store.email}
            </a>
            <div className="flex items-start gap-3">
              <MapPin size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
              {store.address}
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
              {store.hours}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-200 py-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {currentYear} {store.name}. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href={store.social.instagram} target="_blank" rel="noreferrer" className="hover:text-black">Instagram</a>
          <a href={store.social.facebook} target="_blank" rel="noreferrer" className="hover:text-black">Facebook</a>
          <a href={store.social.tiktok} target="_blank" rel="noreferrer" className="hover:text-black">TikTok</a>
        </div>
      </div>
    </footer>
  );
};

const PayBadge = ({ children, className }) => (
  <span className={`inline-flex h-7 items-center rounded px-2.5 text-[11px] font-bold tracking-wide ${className}`}>{children}</span>
);

const FooterColumn = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-medium text-gray-950">{title}</h3>
    <div className="mt-5 flex flex-col items-start gap-3">{children}</div>
  </div>
);

const FooterLink = ({ to, children }) => (
  <Link to={to} className="text-sm text-gray-500 transition-colors duration-200 hover:text-black">
    {children}
  </Link>
);

export default Footer;
