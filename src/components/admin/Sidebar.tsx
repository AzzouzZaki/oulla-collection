'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';

const navLinks = [
  { 
    href: '/dashboard', 
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    )
  },
  { 
    href: '/dashboard/products', 
    label: 'Products',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
    )
  },
  { 
    href: '/dashboard/categories', 
    label: 'Categories',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    )
  },
  { 
    href: '/dashboard/orders', 
    label: 'Orders',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    )
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // best-effort
    } finally {
      router.push('/admin/login');
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-[#E5E7EB] hidden md:flex flex-col h-screen sticky top-0">
        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-[#E5E7EB]">
          <span className="text-sm font-semibold text-[#111827] tracking-tight">
            Oulla Collection
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {navLinks.map(({ href, label, icon }) => {
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center px-5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#6366F1] border-l-[3px] border-[#6366F1] pl-[17px]'
                        : 'text-[#6B7280] hover:text-[#111827] border-l-[3px] border-transparent pl-[17px]'
                    }`}
                  >
                    <span className="mr-3">{icon}</span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm font-medium text-[#6B7280] hover:text-[#EF4444] transition-colors py-2 px-3 rounded-[6px] hover:bg-red-50 flex items-center"
          >
            <svg className="mr-3" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] flex justify-around items-center h-16 px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navLinks.map(({ href, label, icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#6366F1]' : 'text-[#6B7280]'
              }`}
            >
              {icon}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
