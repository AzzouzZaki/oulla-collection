'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { addToCart } from '@/lib/cart';

/* ── Font tokens ── */
const DM   = "'DM Sans', system-ui, sans-serif";
const BODA = "'Bodoni Moda', Georgia, serif";

const LABEL: React.CSSProperties = { fontFamily: DM,   fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em' };
const BODY:  React.CSSProperties = { fontFamily: DM,   fontSize: '16px', fontWeight: 400, lineHeight: '1.5' };
const HERO_IMAGE_URL = '/kaftan-hero.jpg';

/* ── Scroll reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref as React.RefObject<HTMLElement>;
}

const CATEGORY_CARDS = [
  { name: 'Hijabs',      span: 'md:col-span-2 md:row-span-2', height: 'h-[400px] md:h-auto',  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXmBATTe5b1rFipNY8Yy_iqD0dHlXjU4ssflbwo_X2L5ZBTP3eSP1cdHTQR-d_-7N45APVvzCNGCWn3H73F-n7b2UUvOfnC76YXDPfkB4Ie7VG05AsflUbklN3s6hTRdQfWGmGY0rYkemxw53apSh9QnfzJ37dM0556wysuRlQOaEEMOLyiAYP99y4C4ID4-xppQX_Vb_NMgMpLYtg_pgJaRc--F35A5C4IYE9SfmXwQTnqhsISOic', titleSize: 'text-[28px] md:text-[32px]', href: '/products?category=hijabs' },
  { name: 'Abayas',      span: 'md:col-span-2 md:row-span-1', height: 'h-[280px] md:h-auto',  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqT8mEcAzuftui1PD17QcEyXBT78cC0fKSHwoWnnteIXLgfNkiXiMSCJPMS4QsS3AZkbGYbtUL9Cd7Ca5ELaS7Leba-BzvpGt_6NKKvfvovlcbCyDHI_KsZkC_FTLbWLn3c8yRQx_tlOAyz-u_YicEYVeWg-oGIXWkC6JI4lzLEJhsq3AOwa8hde-4bcf7lg_UdguKBvhnn-6SFVve5ttLQKbVuUKjSGixz86eb91dWZuNztglczmm', titleSize: 'text-[22px] md:text-[24px]', href: '/products?category=abayas' },
  { name: 'Robes',       span: 'md:col-span-1 md:row-span-1', height: 'h-[280px] md:h-auto',  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5JNgaw-rxT60JtwiHyp00qKZmTqTlQ_Nvlx5d8i6JY89fnfBSGGpiiJSdmelPBTDyWXnQPTJXX-nAABgAbicu23NBlmwFElqSEhpDXoFLqlCrnhEcs1mcATQ4bREZklwYrn_ydSbSbW8Q0H3otYLmte1xpRe1S5dvSQ_GKTqZiz2Udm9GldaejmbCL3yHLr0nsvhkJwkR6IvAQ52d97J-pmZPpr5tU3f2ijvCyvQmHYd-Vr92JFFu', titleSize: 'text-[18px] md:text-[20px]', href: '/products?category=dresses' },
  { name: 'Sacs',        span: 'md:col-span-1 md:row-span-1', height: 'h-[280px] md:h-auto',  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBszi01H7cI26u2m9wA6BaaA2yC6rSh7w9rUKV4k08uhgjYZfQfzLgz86dbRGDj9ggPnTiXZHRNjrx1yRx-q1bDVcHi941ecbEfQSPYfOddRDqK9lol233wYw7-imVew6s_k-cFf32AwsRvWBgNqWYOR7yLv3WARj7JIgXKbEXFbFxGHEZhJrKKOyfUb6Fn3wVYUVfJsAH_ApKPw3RVS1ErFtXh5tC5CBW9qiCWkeFauLUSK_LPAu34', titleSize: 'text-[18px] md:text-[20px]', href: '/products?category=bags' },
];

const STORY_BLOCKS = [
  { label: '2025',          desc: 'Fondé à Alger' },
  { label: '100%',          desc: 'Matériaux éthiques' },
  { label: '58',            desc: 'Wilayas desservies' },
  { label: 'Artisanal',     desc: 'Fait main avec passion' },
];

/* ── Subcomponent: Reveal wrapper ── */
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return <section ref={ref} className={className}>{children}</section>;
}

export default function StoreHome() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories]   = useState<{ id: number; name: string; slug: string }[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/products?limit=4&page=1'),
          fetch('/api/categories'),
        ]);
        if (pRes.ok) {
          const json = await pRes.json();
          setNewArrivals(json.data || []);
        }
        if (cRes.ok) {
          const cJson = await cRes.json();
          setCategories(cJson.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch home page data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const primaryImg = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url || '';
    addToCart({
      product_id: p.id,
      name: p.name,
      price: Number(p.price),
      image: primaryImg,
    });
  };

  return (
    <div className="w-full overflow-hidden bg-[#faf9f6] text-[#1a1c1a]">

      {/* ══════════════════════════════════════════════
          HERO — Refined mobile 100dvh layout
      ══════════════════════════════════════════════ */}
      <section className="relative h-[100dvh] md:h-[85vh] min-h-[600px] w-full flex flex-col justify-end md:justify-center overflow-hidden">
        {/* Background image — full quality, fully visible figure */}
        <img
          src={HERO_IMAGE_URL}
          alt="Kaftan Oulla"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            /* Mobile: cover to avoid free space */
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
          className="block md:hidden"
        />
        <img
          src={HERO_IMAGE_URL}
          alt="Kaftan Oulla"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            /* Desktop: cover but anchored top-center so head is always in frame */
            objectFit: 'cover',
            objectPosition: 'center 15%',
          }}
          className="hidden md:block"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent md:bg-[#1a1c1a]/20" />

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-16 flex flex-col items-center md:items-start gap-4 md:gap-8 pb-8 md:pb-0">
          {/* Eyebrow */}
          <p
            style={{ ...LABEL, fontSize: '14px', letterSpacing: '0.15em', color: '#ffffff', textTransform: 'uppercase' }}
            className="text-center md:text-left"
          >
            Luxe Modeste Moderne
          </p>
          
          {/* Title */}
          <h1
            style={{ fontFamily: BODA, fontWeight: 500, color: '#ffffff', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
            className="text-[40px] md:text-[64px] text-center md:text-left"
          >
            L'Essence d'Oulla
          </h1>
          
          {/* Desktop Subtitle */}
          <p
            style={{ ...BODY, fontSize: '18px', color: 'rgba(255,255,255,0.88)', fontWeight: 300 }}
            className="hidden md:block max-w-xl text-left"
          >
            Élever l'élégance au quotidien avec des collections qui allient héritage traditionnel et esthétique éditoriale contemporaine.
          </p>

          {/* Desktop CTAs */}
          <div className="hidden md:flex gap-4 mt-2">
            <Link
              href="/products"
              style={{ ...LABEL, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#faf9f6' }}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1a1c1a] hover:bg-[#775928] transition-colors duration-300"
            >
              Découvrir la Collection
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/products"
              style={{ ...LABEL, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffffff' }}
              className="flex items-center justify-center px-8 py-4 border border-white/40 backdrop-blur-sm hover:bg-white hover:text-[#1a1c1a] transition-all duration-300"
            >
              Acheter ce Look
            </Link>
          </div>
        </div>

        {/* Mobile CTA Button */}
        <div className="relative z-10 md:hidden flex justify-center pb-12 w-full px-4">
          <Link
            href="/products"
            style={{ ...LABEL, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffffff' }}
            className="w-[80%] h-[48px] bg-[#1a1c1a] hover:bg-[#775928] transition-colors duration-300 flex items-center justify-center"
          >
            Découvrir la Collection
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          NEW ARRIVALS — horizontal scroll on mobile
      ══════════════════════════════════════════════ */}
      <Reveal className="py-24 md:py-32 px-5 md:px-16 max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-10 md:mb-12 border-b border-[#d1c5b6]/30 pb-4">
          <h2
            style={{ fontFamily: BODA, fontSize: 'clamp(24px,5vw,32px)', fontWeight: 500, color: '#775928', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Nouveautés
          </h2>
          <Link
            href="/products"
            style={{ ...LABEL, color: '#4e453a', textTransform: 'uppercase' }}
            className="flex items-center gap-1 group hover:text-[#775928] transition-colors"
          >
            Voir Tout
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {/* Scroll container */}
        <div
          className="flex gap-8 overflow-x-auto pb-8 snap-x md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[280px] md:min-w-0 animate-pulse space-y-4">
                <div className="aspect-[3/4] bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))
          ) : (
            newArrivals.map((p) => {
              const primaryImg = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url || '';
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="w-[80vw] min-w-[80vw] sm:w-[280px] sm:min-w-[280px] md:w-auto md:min-w-0 snap-center sm:snap-start group cursor-pointer flex-shrink-0 block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#efeeeb] mb-6">
                    {primaryImg ? (
                      <img
                        src={primaryImg}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    {/* Quick Add overlay */}
                    <div className="absolute inset-0 bg-[#faf9f6]/0 group-hover:bg-[#faf9f6]/20 transition-colors duration-300 flex items-center justify-center">
                      <button
                        onClick={(e) => handleQuickAdd(p, e)}
                        style={{ ...LABEL, textTransform: 'uppercase', color: '#775928' }}
                        className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 px-6 py-3 bg-[#faf9f6] border border-[#775928]/20 hover:border-[#775928]"
                      >
                        Ajout Rapide
                      </button>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 style={{ fontFamily: BODA, fontSize: '20px', fontWeight: 500, color: '#1a1c1a' }} className="mb-2 group-hover:text-[#775928] transition-colors">
                      {p.name}
                    </h3>
                    <p style={{ ...BODY, color: '#775928', fontWeight: 600 }}>
                      DZD {Number(p.price).toLocaleString('fr-DZ')}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════
          CURATED CATEGORIES — bento grid
      ══════════════════════════════════════════════ */}
      <section id="shop" className="bg-[#f4f3f1] py-24 md:py-32">
        <Reveal className="px-5 md:px-16 max-w-[1280px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2
              style={{ fontFamily: BODA, fontSize: 'clamp(24px,5vw,32px)', fontWeight: 500, color: '#1a1c1a', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              className="mb-4"
            >
              Catégories Sélectionnées
            </h2>
            <p style={{ ...BODY, color: '#4e453a' }} className="max-w-2xl mx-auto">
              Découvrez nos pièces minutieusement conçues, créées pour la femme moderne qui valorise à la fois la modestie et un style impeccable.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[800px]">
            {CATEGORY_CARDS.map((cat) => {
              const matched = categories.find(c => c.slug === cat.href.split('category=')[1] || c.name.toLowerCase() === cat.name.toLowerCase());
              const targetHref = matched ? `/products?category=${matched.slug}` : cat.href;
              const displayName = matched ? matched.name : cat.name;
              return (
                <Link
                  key={cat.name}
                  href={targetHref}
                  className={`${cat.span} relative group overflow-hidden block ${cat.height}`}
                >
                  <img
                    src={cat.image}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c1a]/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                    <h3
                      style={{ fontFamily: BODA, fontWeight: 500, color: '#ffffff', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                      className={`${cat.titleSize} mb-2`}
                    >
                      {displayName}
                    </h3>
                    <span
                      style={{ ...LABEL, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                      className="border-b border-white pb-0.5 group-hover:text-[#e8c086] group-hover:border-[#e8c086] transition-colors"
                    >
                      Acheter
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════
          BRAND STORY — editorial banner
      ══════════════════════════════════════════════ */}
      <Reveal className="py-24 md:py-32 px-5 md:px-16 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-8">
            <div>
              <span style={{ ...LABEL, color: '#775928', textTransform: 'uppercase' }} className="block mb-4">
                Notre Héritage
              </span>
              <h2
                style={{ fontFamily: BODA, fontSize: 'clamp(28px,5vw,48px)', fontWeight: 500, color: '#1a1c1a', lineHeight: 1.2 }}
              >
                Où l'Âme Algérienne Rencontre la Silhouette Moderne
              </h2>
            </div>
            <p style={{ ...BODY, fontSize: '18px', color: '#4e453a', lineHeight: 1.7 }}>
              Née à Alger, Oulla est une célébration de la femme modeste moderne — confiante, cultivée et authentique. Chaque tissu est choisi avec intention, chaque point est placé avec l'amour du métier.
            </p>
            <Link
              href="/products"
              style={{ ...LABEL, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#775928' }}
              className="inline-flex items-center gap-2 border-b border-[#775928] pb-1 hover:gap-4 transition-all"
            >
              Découvrir l'Histoire
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-6">
            {STORY_BLOCKS.map((b) => (
              <div key={b.label} className="bg-[#f4f3f1] p-8 flex flex-col gap-2">
                <span style={{ fontFamily: BODA, fontSize: '32px', fontWeight: 500, color: '#775928' }}>{b.label}</span>
                <span style={{ ...LABEL, color: '#4e453a', textTransform: 'uppercase' }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════
          NEWSLETTER BAND
      ══════════════════════════════════════════════ */}
      <section className="bg-[#1a1c1a] py-20 px-5 md:px-16">
        <div className="max-w-[1280px] mx-auto text-center space-y-8">
          <h2
            style={{ fontFamily: BODA, fontSize: 'clamp(24px,4vw,40px)', fontWeight: 500, color: '#faf9f6', letterSpacing: '0.05em' }}
          >
            Rejoignez l'Univers Oulla
          </h2>
          <p style={{ ...BODY, color: 'rgba(250,249,246,0.7)' }} className="max-w-md mx-auto">
            Soyez le premier informé des nouvelles collections, des lancements exclusifs et des histoires éditoriales.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              required
              style={{ ...BODY, color: '#faf9f6', backgroundColor: 'transparent' }}
              className="flex-1 border border-[#d1c5b6]/30 px-5 py-4 focus:outline-none focus:border-[#775928] placeholder:text-[#faf9f6]/30 sm:border-r-0"
            />
            <button
              type="submit"
              style={{ ...LABEL, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1a1c1a' }}
              className="bg-[#775928] hover:bg-[#e8c086] px-8 py-4 transition-colors duration-300 whitespace-nowrap"
            >
              S'abonner
            </button>
          </form>
          <p style={{ fontFamily: DM, fontSize: '10px', color: 'rgba(250,249,246,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Pas de spam. Désabonnement à tout moment.
          </p>
        </div>
      </section>

    </div>
  );
}
