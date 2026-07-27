'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Product, Category } from '@/types';
import { addToCart } from '@/lib/cart';

/* ── Design tokens ── */
const DM_SANS = "'DM Sans', system-ui, sans-serif";
const BODONI  = "'Bodoni Moda', Georgia, serif";

const LABEL_SM: React.CSSProperties = {
  fontFamily: DM_SANS, fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', lineHeight: '1.2',
};
const BODY_MD: React.CSSProperties = {
  fontFamily: DM_SANS, fontSize: '16px', fontWeight: 400, lineHeight: '1.5',
};
const HEADLINE_MD: React.CSSProperties = {
  fontFamily: BODONI, fontSize: '20px', fontWeight: 500, lineHeight: '1.4',
};

function fmt(n: number) {
  return 'DZD ' + Number(n).toLocaleString('fr-DZ');
}

const PAGE_SIZE = 12;

const FABRIC_OPTIONS = ['Fine Silk', 'Premium Linen', 'Velvet'];
const COLOR_SWATCHES = [
  { label: 'Noir / Black', hex: '#1a1c1a' },
  { label: 'Light / Bone', hex: '#E5E2E1' },
  { label: 'Gold / Caramel', hex: '#B08D57' },
  { label: 'Blush / Rose', hex: '#70585B' },
  { label: 'Ivory / White', hex: '#FAF9F6' },
];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL'];

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Plus Récents',
  oldest: 'Plus Anciens',
  price_asc: 'Prix: Croissant',
  price_desc: 'Prix: Décroissant',
};

function ProductsInner() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const qParam = searchParams.get('q') || '';

  const [products, setProducts]       = useState<Product[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  
  /* Filter states */
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColor, setSelectedColor]     = useState<string>('');
  const [selectedSize, setSelectedSize]       = useState<string>('');
  
  /* Sort state */
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [favorites, setFavorites]     = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  /* Close sort dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Fetch categories once */
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.data || []))
      .catch(console.error);
  }, []);

  /* Fetch products whenever category or page changes */
  const fetchProducts = useCallback(async (cat: string, pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (cat && cat !== 'all') params.set('category', cat);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (append) {
        setProducts((prev) => [...prev, ...(data.data || [])]);
      } else {
        setProducts(data.data || []);
      }
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProducts(selectedCategory, 1);
  }, [selectedCategory, fetchProducts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(selectedCategory, next, true);
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
  };

  const toggleFabric = (fabric: string) => {
    setSelectedFabrics(prev =>
      prev.includes(fabric) ? prev.filter(f => f !== fabric) : [...prev, fabric]
    );
  };

  const toggleColor = (hex: string) => {
    setSelectedColor(prev => prev === hex ? '' : hex);
  };

  const toggleSize = (size: string) => {
    setSelectedSize(prev => prev === size ? '' : size);
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedFabrics([]);
    setSelectedColor('');
    setSelectedSize('');
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const img = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url || '';
    addToCart({ product_id: p.id, name: p.name, price: Number(p.price), image: img });
  };

  /* Client-side filter + search + sort */
  const filteredProducts = products
    .filter((p) => {
      /* Search by name */
      if (qParam) {
        const q = qParam.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }

      /* Fabric filter */
      if (selectedFabrics.length > 0) {
        const productFabric = (p.fabric || '').toLowerCase();
        const matchesFabric = selectedFabrics.some(f => {
          const fl = f.toLowerCase();
          if (fl.includes('silk') && productFabric.includes('silk')) return true;
          if (fl.includes('linen') && productFabric.includes('linen')) return true;
          if (fl.includes('velvet') && productFabric.includes('velvet')) return true;
          return productFabric.includes(fl);
        });
        if (!matchesFabric) return false;
      }

      /* Color filter */
      if (selectedColor) {
        if (!p.colors || p.colors.length === 0) return false;
        const matchesColor = p.colors.some(c => {
          const cl = c.toLowerCase();
          if (selectedColor === '#1a1c1a' && (cl.includes('black') || cl.includes('noir') || cl.includes('onyx') || cl.includes('charcoal'))) return true;
          if (selectedColor === '#E5E2E1' && (cl.includes('white') || cl.includes('grey') || cl.includes('bone') || cl.includes('off-white'))) return true;
          if (selectedColor === '#B08D57' && (cl.includes('gold') || cl.includes('caramel') || cl.includes('tan') || cl.includes('beige') || cl.includes('sand') || cl.includes('terracotta'))) return true;
          if (selectedColor === '#70585B' && (cl.includes('pink') || cl.includes('rose') || cl.includes('dusty') || cl.includes('burgundy'))) return true;
          if (selectedColor === '#FAF9F6' && (cl.includes('ivory') || cl.includes('pristine') || cl.includes('champagne') || cl.includes('rosewater') || cl.includes('nude'))) return true;
          return false;
        });
        if (!matchesColor) return false;
      }

      /* Size filter */
      if (selectedSize) {
        if (!p.sizes || p.sizes.length === 0) return false;
        const matchesSize = p.sizes.includes(selectedSize) || p.sizes.includes('One Size');
        if (!matchesSize) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_asc':
          return Number(a.price) - Number(b.price);
        case 'price_desc':
          return Number(b.price) - Number(a.price);
        default:
          return 0;
      }
    });

  return (
    <div className="w-full bg-[#faf9f6] text-[#1a1c1a] min-h-screen">
      
      {/* ── Sticky Mobile Sub-Header ── */}
      <div className="sticky top-20 z-30 bg-white border-b border-[#d1c5b6] h-[48px] flex items-center justify-between px-5 md:hidden">
        <button
          onClick={() => setIsFilterOpen(true)}
          style={{ ...LABEL_SM, color: '#4e453a', textTransform: 'uppercase' }}
          className="flex items-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          FILTRER {(selectedFabrics.length + (selectedColor ? 1 : 0) + (selectedSize ? 1 : 0)) > 0 && `(${selectedFabrics.length + (selectedColor ? 1 : 0) + (selectedSize ? 1 : 0)})`}
        </button>
        {/* Mobile Sort Button */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen(o => !o)}
            style={{ ...LABEL_SM, color: '#4e453a', textTransform: 'uppercase' }}
            className="flex items-center gap-2"
          >
            {SORT_LABELS[sortBy].toUpperCase().split(':')[0]}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="7 10 12 15 17 10" />
            </svg>
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#d1c5b6] shadow-lg z-50 min-w-[180px]">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setSortBy(key); setSortOpen(false); }}
                  style={{ ...BODY_MD, fontSize: '13px', color: sortBy === key ? '#775928' : '#1a1c1a' }}
                  className={`block w-full text-left px-4 py-3 hover:bg-[#faf9f6] transition-colors ${sortBy === key ? 'font-semibold' : ''}`}
                >
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-5 md:px-16 py-12 md:py-16">

        {/* ── Category Horizontal Pills Bar (MOBILE ONLY) ── */}
        <div
          className="flex gap-6 overflow-x-auto mb-10 pb-3 border-b border-[#d1c5b6]/20 md:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <button
            onClick={() => handleCategoryChange('all')}
            style={{
              ...LABEL_SM,
              color: selectedCategory === 'all' ? '#775928' : '#4e453a',
              textTransform: 'uppercase',
              borderBottom: selectedCategory === 'all' ? '2px solid #775928' : '2px solid transparent',
              paddingBottom: '8px',
              whiteSpace: 'nowrap',
            }}
            className="hover:text-[#775928] transition-colors"
          >
            Toutes
          </button>
          {categories.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                style={{
                  ...LABEL_SM,
                  color: active ? '#775928' : '#4e453a',
                  textTransform: 'uppercase',
                  borderBottom: active ? '2px solid #775928' : '2px solid transparent',
                  paddingBottom: '8px',
                  whiteSpace: 'nowrap',
                }}
                className="hover:text-[#775928] transition-colors"
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* ── DESKTOP Category Header (Centered) ── */}
        <section className="hidden md:block mb-16 text-center">
          {qParam ? (
            <h1
              style={{
                fontFamily: BODONI, fontSize: '48px',
                fontWeight: 600, lineHeight: '1.1', letterSpacing: '-0.02em',
              }}
              className="mb-4 text-[#1a1c1a]"
            >
              Résultats pour &ldquo;{qParam}&rdquo;
            </h1>
          ) : (
            <h1
              style={{
                fontFamily: BODONI, fontSize: '64px',
                fontWeight: 600, lineHeight: '1.1', letterSpacing: '-0.02em',
              }}
              className="mb-4 text-[#1a1c1a]"
            >
              Abayas &amp; Robes
            </h1>
          )}
          {!qParam && (
            <p style={{ ...BODY_MD, fontSize: '18px', color: '#4e453a', lineHeight: '1.6' }} className="max-w-2xl mx-auto opacity-80">
              Une sélection de silhouettes modestes modernes alliant héritage algérien et raffinement contemporain. Confectionnées dans les soies et lins les plus fins.
            </p>
          )}
        </section>

        {/* ── MOBILE Category Header ── */}
        <div className="md:hidden flex flex-col items-start mb-8 gap-3">
          <h1
            style={{
              fontFamily: BODONI, fontSize: '32px',
              fontWeight: 600, lineHeight: '1.2',
            }}
            className="text-[#1a1c1a]"
          >
            {qParam ? `"${qParam}"` : 'Abayas & Robes'}
          </h1>
          {!qParam && (
            <p style={{ ...BODY_MD, fontSize: '15px', color: '#4e453a', opacity: 0.8 }}>
              Une sélection de silhouettes modestes modernes alliant héritage algérien et raffinement contemporain.
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

          {/* ── DESKTOP Persistent Sidebar Filter ── */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-16">

              {/* 1. Categories */}
              <div>
                <h3 style={{ ...LABEL_SM, fontSize: '12px', color: '#4e453a' }} className="uppercase mb-6 font-semibold tracking-[0.1em]">
                  Catégories
                </h3>
                <ul className="space-y-4">
                  <li>
                    <button
                      onClick={() => handleCategoryChange('all')}
                      style={{ ...BODY_MD }}
                      className={`transition-colors text-left ${
                        selectedCategory === 'all'
                          ? 'text-[#775928] pb-1 border-b-2 border-[#b08d57] inline-block font-medium'
                          : 'text-[#4e453a] hover:text-[#775928]'
                      }`}
                    >
                      Toutes les Abayas
                    </button>
                  </li>
                  {categories.map((cat) => {
                    const active = selectedCategory === cat.slug;
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => handleCategoryChange(cat.slug)}
                          style={{ ...BODY_MD }}
                          className={`transition-colors text-left ${
                            active
                              ? 'text-[#775928] pb-1 border-b-2 border-[#b08d57] inline-block font-medium'
                              : 'text-[#4e453a] hover:text-[#775928]'
                          }`}
                        >
                          {cat.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 2. Fabric */}
              <div>
                <h3 style={{ ...LABEL_SM, fontSize: '12px', color: '#4e453a' }} className="uppercase mb-6 font-semibold tracking-[0.1em]">
                  Tissu
                </h3>
                <div className="space-y-3">
                  {FABRIC_OPTIONS.map((fabric) => (
                    <label key={fabric} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedFabrics.includes(fabric)}
                        onChange={() => toggleFabric(fabric)}
                        className="w-4 h-4 rounded border-[#d1c5b6] text-[#775928] focus:ring-[#775928]"
                      />
                      <span style={{ ...BODY_MD, color: '#4e453a' }} className="group-hover:text-[#775928] transition-colors">
                        {fabric}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Color Palette */}
              <div>
                <h3 style={{ ...LABEL_SM, fontSize: '12px', color: '#4e453a' }} className="uppercase mb-6 font-semibold tracking-[0.1em]">
                  Couleurs
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      title={swatch.label}
                      onClick={() => toggleColor(swatch.hex)}
                      style={{ backgroundColor: swatch.hex }}
                      className={`w-8 h-8 rounded-full border border-[#807569]/20 transition-all ${
                        selectedColor === swatch.hex
                          ? 'ring-1 ring-offset-2 ring-[#775928]'
                          : 'hover:ring-1 hover:ring-offset-2 hover:ring-[#775928]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 4. Size */}
              <div>
                <h3 style={{ ...LABEL_SM, fontSize: '12px', color: '#4e453a' }} className="uppercase mb-6 font-semibold tracking-[0.1em]">
                  Taille
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        style={LABEL_SM}
                        className={`px-4 py-2 border transition-colors ${
                          active
                            ? 'border-[#775928] text-[#775928] bg-[#775928]/5'
                            : 'border-[#d1c5b6] text-[#1a1c1a] hover:border-[#775928]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear filters if active */}
              {(selectedFabrics.length > 0 || selectedColor || selectedSize || selectedCategory !== 'all') && (
                <button
                  onClick={clearAllFilters}
                  style={{ ...LABEL_SM, textTransform: 'uppercase', color: '#775928' }}
                  className="border-b border-[#775928] pb-0.5 hover:opacity-75 transition-opacity"
                >
                  Effacer Tous les Filtres
                </button>
              )}

            </div>
          </aside>

          {/* ── Product Grid Canvas ── */}
          <div className="flex-grow">

            {/* Sort Bar (Desktop) */}
            <div className="hidden md:flex justify-between items-center mb-10 border-b border-[#d1c5b6]/20 pb-4">
              <p style={{ ...BODY_MD, color: '#4e453a' }}>
                <span className="font-bold text-[#1a1c1a]">{loading ? '…' : filteredProducts.length}</span> Produits trouvés
                {qParam && (
                  <span style={{ ...BODY_MD, fontSize: '14px', color: '#807569' }}> — recherche &ldquo;{qParam}&rdquo;</span>
                )}
              </p>
              {/* Sort Dropdown (Desktop) */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen(o => !o)}
                  style={{ ...LABEL_SM, color: '#1a1c1a', textTransform: 'uppercase' }}
                  className="flex items-center gap-2 hover:text-[#775928] transition-colors cursor-pointer"
                >
                  Trier par : {SORT_LABELS[sortBy]}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-[#d1c5b6] shadow-lg z-50 min-w-[200px]">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setSortBy(key); setSortOpen(false); }}
                        style={{ ...BODY_MD, fontSize: '14px', color: sortBy === key ? '#775928' : '#1a1c1a' }}
                        className={`block w-full text-left px-5 py-3 hover:bg-[#faf9f6] transition-colors ${sortBy === key ? 'font-semibold' : ''}`}
                      >
                        {SORT_LABELS[key]}
                        {sortBy === key && <span className="float-right text-[#775928]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Grid (4 columns on Desktop xl) */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-[#efeeeb] rounded mb-6" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ fontFamily: BODONI, fontSize: '24px', color: '#4e453a' }} className="mb-4">
                  {qParam ? `Aucun produit trouvé pour "${qParam}"` : 'Aucun produit ne correspond à vos filtres'}
                </p>
                <button
                  onClick={() => {
                    clearAllFilters();
                    if (qParam) window.history.pushState({}, '', '/products');
                  }}
                  style={{ ...LABEL_SM, color: '#775928', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                  className="border-b border-[#775928] pb-1"
                >
                  {qParam ? 'Voir Tous les Produits' : 'Effacer les Filtres'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
                {filteredProducts.map((product) => {
                  const primaryImg = product.images?.find(i => i.is_primary)?.url || product.images?.[0]?.url || '';
                  const idStr = String(product.id);
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group cursor-pointer flex flex-col justify-between"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#efeeeb] mb-6">
                        {primaryImg ? (
                          <img
                            src={primaryImg}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                        )}

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => toggleFavorite(idStr, e)}
                          className="absolute top-4 right-4 text-[#4e453a] hover:text-[#775928] transition-colors z-10 p-1"
                        >
                          <svg
                            width="20" height="20" viewBox="0 0 24 24"
                            fill={favorites.includes(idStr) ? '#775928' : 'none'}
                            stroke={favorites.includes(idStr) ? '#775928' : 'currentColor'}
                            strokeWidth="1.5"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

                        {/* Quick Add overlay */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                          <button
                            onClick={(e) => handleQuickAdd(product, e)}
                            style={{ fontFamily: DM_SANS, fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: '#ffffff', textTransform: 'uppercase' }}
                            className="w-full bg-[#1a1c1a] py-4 hover:bg-[#775928] transition-colors"
                          >
                            Ajout Rapide
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="text-center space-y-1 px-2">
                        <h3 style={{ ...HEADLINE_MD, color: '#1a1c1a' }} className="group-hover:text-[#775928] transition-colors">
                          {product.name}
                        </h3>
                        <p style={{ ...BODY_MD, fontSize: '14px', color: '#4e453a', opacity: 0.8 }}>
                          {product.fabric || product.category?.name || 'Signature Silk'}
                        </p>
                        <p style={{ ...BODY_MD, fontWeight: 700, color: '#775928', marginTop: '6px' }}>
                          {fmt(product.price)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {!loading && page < totalPages && (
              <div className="mt-24 flex justify-center items-center gap-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{ ...LABEL_SM, textTransform: 'uppercase', color: '#1a1c1a' }}
                  className="px-12 py-4 border-b border-[#1a1c1a] hover:text-[#775928] hover:border-[#775928] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? 'Chargement...' : 'Voir Plus'}
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ── Mobile Filter Bottom Sheet Modal ── */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <div
            onClick={() => setIsFilterOpen(false)}
            className="absolute inset-0 bg-[#1a1c1a]/40 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-full bg-[#faf9f6] rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#d1c5b6]/30">
              <h3 style={{ fontFamily: BODONI, fontSize: '24px', fontWeight: 500, color: '#1a1c1a' }}>
                Filtres
              </h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-[#4e453a] hover:text-[#775928] p-1 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Category */}
              <div className="space-y-4">
                <h4 style={{ ...LABEL_SM, color: '#4e453a', textTransform: 'uppercase' }}>Catégorie</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange('all')}
                    style={{ ...BODY_MD, color: selectedCategory === 'all' ? '#775928' : '#4e453a', fontWeight: selectedCategory === 'all' ? 600 : 400 }}
                    className="block w-full text-left py-1"
                  >
                    Toutes les Abayas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug)}
                      style={{ ...BODY_MD, color: selectedCategory === cat.slug ? '#775928' : '#4e453a', fontWeight: selectedCategory === cat.slug ? 600 : 400 }}
                      className="block w-full text-left py-1"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric */}
              <div className="space-y-4">
                <h4 style={{ ...LABEL_SM, color: '#4e453a', textTransform: 'uppercase' }}>Tissu</h4>
                <div className="space-y-3">
                  {FABRIC_OPTIONS.map((fabric) => (
                    <label key={fabric} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFabrics.includes(fabric)}
                        onChange={() => toggleFabric(fabric)}
                        className="w-4 h-4 rounded border-[#d1c5b6] text-[#775928] focus:ring-[#775928]"
                      />
                      <span style={{ ...BODY_MD, color: '#1a1c1a' }}>{fabric}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div className="space-y-4">
                <h4 style={{ ...LABEL_SM, color: '#4e453a', textTransform: 'uppercase' }}>Couleurs</h4>
                <div className="flex flex-wrap gap-3">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      onClick={() => toggleColor(swatch.hex)}
                      style={{ backgroundColor: swatch.hex }}
                      className={`w-8 h-8 rounded-full border border-[#807569]/30 transition-all ${
                        selectedColor === swatch.hex ? 'ring-2 ring-offset-2 ring-[#775928]' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="space-y-4">
                <h4 style={{ ...LABEL_SM, color: '#4e453a', textTransform: 'uppercase' }}>Taille</h4>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        style={LABEL_SM}
                        className={`px-4 py-2 border transition-colors ${
                          active
                            ? 'border-[#775928] text-[#775928] bg-[#775928]/10'
                            : 'border-[#d1c5b6] text-[#4e453a]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#d1c5b6]/30 flex gap-4 bg-[#faf9f6]">
              <button
                onClick={clearAllFilters}
                style={{ ...LABEL_SM, textTransform: 'uppercase' }}
                className="flex-1 py-4 border border-[#807569] text-[#1a1c1a] hover:border-[#775928] hover:text-[#775928] transition-colors"
              >
                Tout Effacer
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                style={{ ...LABEL_SM, textTransform: 'uppercase', color: '#ffffff' }}
                className="flex-[2] py-4 bg-[#1a1c1a] hover:bg-[#775928] transition-colors"
              >
                Appliquer les Filtres
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="w-full bg-[#faf9f6] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#775928] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductsInner />
    </Suspense>
  );
}
