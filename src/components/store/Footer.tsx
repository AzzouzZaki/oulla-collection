import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#faf9f6] text-[#1a1c1a] pt-20 pb-12 border-t border-[#d1c5b6]/30">
      <div className="max-w-7xl mx-auto px-8 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 pb-20 border-b border-[#d1c5b6]/30">
        {/* Brand Column */}
        <div suppressHydrationWarning className="flex flex-col space-y-4">
          <Link href="/" className="flex flex-col items-start">
            <span className="font-serif text-2xl font-semibold tracking-[0.2em] uppercase text-[#775928]">
              OULLA
            </span>
          </Link>
          <p className="text-sm text-[#4e453a] font-sans leading-relaxed pt-2">
            Élever la mode modeste à travers le prisme de l'héritage algérien et du minimalisme moderne.
          </p>
        </div>

        {/* Collections */}
        <div suppressHydrationWarning className="flex flex-col space-y-4">
          <h4 className="text-xs uppercase tracking-widest font-bold text-[#1a1c1a] mb-2 font-sans">Collections</h4>
          <ul className="space-y-4">
            <li>
              <Link href="/products?category=abayas" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                La Série Héritage
              </Link>
            </li>
            <li>
              <Link href="/products?category=dresses" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                Modeste Moderne
              </Link>
            </li>
            <li>
              <Link href="/products?category=accessories" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                Accessoires
              </Link>
            </li>
            <li>
              <Link href="/products?category=limited" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                Éditions Limitées
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div suppressHydrationWarning className="flex flex-col space-y-4">
          <h4 className="text-xs uppercase tracking-widest font-bold text-[#1a1c1a] mb-2 font-sans">Entreprise</h4>
          <ul className="space-y-4">
            <li>
              <Link href="/about" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                Notre Histoire
              </Link>
            </li>
            <li>
              <Link href="/studio" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                Studio Artisanal
              </Link>
            </li>
            <li>
              <Link href="/sustainability" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                Durabilité
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Follow */}
        <div suppressHydrationWarning className="flex flex-col space-y-4">
          <h4 className="text-xs uppercase tracking-widest font-bold text-[#1a1c1a] mb-2 font-sans">Suivez-nous</h4>
          <div className="flex gap-6">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
              Instagram
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
              Pinterest
            </a>
            <a href="https://vogue.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#4e453a] hover:text-[#775928] transition-colors">
              Vogue Runway
            </a>
          </div>
        </div>
      </div>

      {/* Copyright Sub-footer */}
      <div suppressHydrationWarning className="max-w-7xl mx-auto px-8 lg:px-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-[#4e453a]/60 uppercase tracking-[0.15em] font-sans">
        <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Oulla Collection. Tous droits réservés.</p>
      </div>
    </footer>

  );
}


