'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCart } from '@/lib/cart';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isOnProducts = pathname === '/products';

  useEffect(() => {
    const updateCount = () => {
      const cart = getCart();
      const count = cart.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(count);
    };

    updateCount();
    window.addEventListener('cart-updated', updateCount);
    return () => window.removeEventListener('cart-updated', updateCount);
  }, []);

  /* Focus input when search opens */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  /* Close search on route change */
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchOpen(false);
      return;
    }
    router.push(`/products?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const handleSearchIconClick = () => {
    if (isOnProducts) {
      /* Toggle inline search; the products page listens to the q param via URL */
      setSearchOpen((prev) => !prev);
    } else {
      /* From other pages, just open search overlay which redirects to /products */
      setSearchOpen((prev) => !prev);
    }
  };

  const navLinks = [
    { label: 'COLLECTIONS', href: '/products' },
    { label: 'NOUVEAUTÉS', href: '/products?badge=new' },
    { label: 'NOTRE HISTOIRE', href: '/about' },
  ];

  return (
    <header suppressHydrationWarning className="w-full top-0 sticky z-50 bg-[#faf9f6] border-b border-[#d1c5b6]/30">
      <div suppressHydrationWarning className="flex justify-between items-center h-20 px-5 md:px-16 max-w-[1280px] mx-auto gap-2">
        
        {/* Left Cluster */}
        <div suppressHydrationWarning className="flex items-center gap-4 md:gap-8 flex-1 md:flex-initial">
          {/* Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open Navigation Menu"
            className="cursor-pointer active:opacity-70 transition-all text-[#4e453a] hover:text-[#775928] flex items-center justify-center p-1"
          >
            <svg className="w-[18px] h-[14px]" viewBox="0 0 17 11" fill="none" stroke="currentColor">
              <path d="M0 1.5H17M0 5.5H17M0 9.5H17" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex gap-8 items-center h-full">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href === '/products' && pathname.startsWith('/products'));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`font-sans font-bold text-[12px] uppercase tracking-widest relative py-2 transition-colors duration-300 group ${
                    isActive ? 'text-[#775928]' : 'text-[#4e453a] hover:text-[#775928]'
                  }`}
                >
                  <span style={{ fontFamily: "'DM Sans', sans-serif" }}>{link.label}</span>
                  <span
                    className={`absolute bottom-0 left-0 h-[1.5px] bg-[#775928] transition-all duration-300 ease-out ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Brand Logo — Visible on Mobile & Desktop */}
        <Link
          href="/"
          style={{
            fontFamily: "'Bodoni Moda', Georgia, serif",
            fontWeight: '500',
            textTransform: 'uppercase',
            wordWrap: 'break-word',
          }}
          className="text-[#775928] text-[18px] sm:text-[24px] lg:text-[32px] tracking-[2px] sm:tracking-[4px] lg:tracking-[6.4px] whitespace-nowrap text-center"
        >
          OULLA COLLECTION
        </Link>

        {/* Right Section: Utility Buttons */}
        <div className="flex items-center justify-end gap-4 sm:gap-6 text-[#4e453a] flex-1 md:flex-initial">
          {/* Search Button */}
          <button
            onClick={handleSearchIconClick}
            aria-label={searchOpen ? 'Close Search' : 'Open Search'}
            className="cursor-pointer active:opacity-70 transition-all text-[#4e453a] hover:text-[#775928]"
          >
            {searchOpen ? (
              /* X icon */
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Search icon */
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>

          {/* Shopping Bag Button */}
          <Link
            href="/cart"
            aria-label="Shopping Bag"
            className="cursor-pointer active:opacity-70 transition-all text-[#4e453a] hover:text-[#775928] relative"
          >
            <svg className="w-[16px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#775928] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── Search Dropdown Bar ── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out border-b border-[#d1c5b6]/30 ${
          searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ background: '#faf9f6' }}
      >
        <form
          onSubmit={handleSearchSubmit}
          className="max-w-[1280px] mx-auto px-5 md:px-16 py-3 flex items-center gap-3"
        >
          <svg className="w-[16px] h-[16px] text-[#807569] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des produits par nom…"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 400,
              color: '#1a1c1a',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              flex: 1,
            }}
            className="placeholder:text-[#807569]"
          />
          <button
            type="submit"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#775928',
            }}
            className="hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#d1c5b6]/30 bg-[#faf9f6] px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block font-bold text-[14px] uppercase tracking-widest text-[#1a1c1a] hover:text-[#775928] py-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
