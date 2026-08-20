'use client';

import React, { useState, useEffect, use } from 'react';
import CheckoutModal from '@/components/store/CheckoutModal';
import Link from 'next/link';
import type { Product } from '@/types';
import { addToCart } from '@/lib/cart';
import dynamic from 'next/dynamic';

const ImageViewer = dynamic(() => import('@/components/shared/ImageViewer'), { ssr: false });

/* ── Font tokens ── */
const DM   = "'DM Sans', system-ui, sans-serif";
const BODA = "'Bodoni Moda', Georgia, serif";

const LABEL: React.CSSProperties = { fontFamily: DM,   fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', lineHeight: '1.2' };
const BODY:  React.CSSProperties = { fontFamily: DM,   fontSize: '16px', fontWeight: 400, lineHeight: '1.5' };

function fmt(n: number) {
  return 'DZD ' + Number(n).toLocaleString('fr-DZ');
}



/* ─── Accordion Item ─── */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(209,197,182,0.3)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ ...LABEL, color: '#1a1c1a', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontFamily: DM, fontSize: '20px', color: '#4e453a', lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ ...BODY, fontSize: '14px', color: '#4e453a', paddingBottom: '20px', paddingLeft: '16px', borderLeft: '2px solid rgba(119,89,40,0.4)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [product, setProduct]   = useState<Product | null>(null);
  const [related, setRelated]   = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize]   = useState<string>('');

  const [activeImg, setActiveImg]     = useState(0);
  const [qty, setQty]                 = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [added, setAdded]             = useState(false);
  const [isFav, setIsFav]             = useState(false);
  const [viewerSrc, setViewerSrc]     = useState<string | null>(null);

  // Set default selections
  useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0) setSelectedColor(product.colors[0]);
      if (product.sizes && product.sizes.length > 0) setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  const currentVariant = product?.variants?.find(
    v => v.color === selectedColor && v.size === selectedSize
  );
  
  const isOOS = currentVariant ? currentVariant.stock === 0 : product?.stock === 0;
  const currentStock = currentVariant ? currentVariant.stock : (product?.stock || 0);
  const variantId = currentVariant ? currentVariant.id : undefined;

  /* Fetch product */
  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setProduct(data);
        setActiveImg(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  /* Fetch related products */
  useEffect(() => {
    if (!product) return;
    const catSlug = product.category?.slug;
    const url = catSlug ? `/api/products?category=${catSlug}&limit=5` : `/api/products?limit=5`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const others = (data.data || []).filter((p: Product) => p.id !== product.id).slice(0, 4);
        setRelated(others);
      })
      .catch(console.error);
  }, [product]);

  const handleAddToBag = () => {
    if (!product || isOOS) return;
    const img = product.images?.find(i => i.is_primary)?.url || product.images?.[0]?.url || '';
    addToCart({ 
      product_id: product.id, 
      variant_id: variantId,
      name: product.name, 
      price: Number(product.price), 
      image: img, 
      qty,
      color: selectedColor,
      size: selectedSize
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#775928] border-t-transparent rounded-full animate-spin mx-auto" />
          <p style={{ fontFamily: DM, fontSize: '14px', color: '#4e453a' }}>Chargement du produit…</p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 style={{ fontFamily: BODA, fontSize: '36px', color: '#1a1c1a' }}>Produit non trouvé</h1>
          <p style={{ ...BODY, color: '#4e453a' }}>Ce produit a peut-être été retiré ou n'est plus disponible.</p>
          <Link
            href="/products"
            style={{ ...LABEL, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffffff' }}
            className="inline-block bg-[#1a1c1a] px-10 py-4 hover:bg-[#775928] transition-colors"
          >
            Retour à la Collection
          </Link>
        </div>
      </div>
    );
  }

  const images = [...(product.images || [])]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.order - b.order;
    })
    .map(i => i.url);
  const orderTotal = fmt(Number(product.price) * qty);

  /* ── Right panel: product info (shared between mobile & desktop) ── */
  const InfoPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}>
          {[
            { label: 'Accueil',     href: '/' },
            { label: 'Collections', href: '/products' },
            { label: product.name,  href: '#', current: true },
          ].map((crumb, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {i > 0 && <span style={{ color: '#807569', fontSize: '12px' }}>›</span>}
              {crumb.current ? (
                <span style={{ ...LABEL, color: '#775928', textTransform: 'uppercase', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crumb.label}</span>
              ) : (
                <Link href={crumb.href} style={{ ...LABEL, color: '#4e453a', textTransform: 'uppercase' }} className="hover:text-[#775928] transition-colors">{crumb.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Title + price */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {product.category && (
          <span style={{ ...LABEL, color: '#775928', textTransform: 'uppercase' }}>{product.category.name}</span>
        )}
        <h1 style={{ fontFamily: BODA, fontSize: '36px', fontWeight: 500, lineHeight: '1.25', color: '#1a1c1a', margin: 0 }}>
          {product.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: DM, fontSize: '22px', fontWeight: 700, color: '#775928' }}>
            {fmt(product.price)}
          </span>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <p style={{ ...BODY, fontSize: '15px', color: '#4e453a', lineHeight: '1.7', margin: 0 }}>
          {product.description}
        </p>
      )}

      {/* Color swatches */}
      {product.colors && product.colors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ ...LABEL, textTransform: 'uppercase', color: '#4e453a' }}>Couleur</span>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{
                  ...LABEL,
                  padding: '8px 16px',
                  border: `1px solid ${selectedColor === c ? '#775928' : '#d1c5b6'}`,
                  color:  selectedColor === c ? '#775928' : '#4e453a',
                  background: selectedColor === c ? 'rgba(119,89,40,0.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size grid */}
      {product.sizes && product.sizes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ ...LABEL, textTransform: 'uppercase', color: '#4e453a' }}>Sélectionner la Taille</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {product.sizes.map((s) => {
              const active = selectedSize === s;
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  style={{
                    width: '48px', height: '48px',
                    border: `1px solid ${active ? '#775928' : '#d1c5b6'}`,
                    color:  active ? '#775928' : '#4e453a',
                    background: active ? 'rgba(119,89,40,0.08)' : 'transparent',
                    fontFamily: DM, fontSize: '12px', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock indicator */}
      {!isOOS ? (
        <p style={{ ...LABEL, fontSize: '11px', textTransform: 'uppercase', color: currentStock <= 5 ? '#775928' : '#4e453a', margin: 0 }}>
          {currentStock <= 5 ? `Il n'en reste que ${currentStock} en stock` : 'En Stock'}
        </p>
      ) : (
        <p style={{ ...LABEL, fontSize: '11px', textTransform: 'uppercase', color: '#ba1a1a', margin: 0 }}>Rupture de Stock pour cette sélection</p>
      )}

      {/* Quantity stepper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(209,197,182,0.3)', paddingTop: '20px' }}>
        <span style={{ ...LABEL, textTransform: 'uppercase', color: '#4e453a' }}>Quantité</span>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1c5b6', width: 'fit-content', height: '48px' }}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            style={{ ...BODY, color: '#4e453a', padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >−</button>
          <span style={{ ...BODY, color: '#1a1c1a', padding: '0 16px', minWidth: '2rem', textAlign: 'center', fontWeight: 700 }}>{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(currentStock, q + 1))}
            style={{ ...BODY, color: '#4e453a', padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >+</button>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={handleAddToBag}
          disabled={isOOS}
          style={{
            fontFamily: DM, fontSize: '14px', fontWeight: 700, letterSpacing: '0.2em',
            color: '#ffffff', textTransform: 'uppercase',
            background: added ? '#775928' : '#1a1c1a',
            height: '56px', width: '100%', border: 'none', cursor: 'pointer',
            transition: 'all 0.4s', opacity: isOOS ? 0.5 : 1,
          }}
          className="hover:bg-[#775928] active:scale-95 shadow-lg disabled:cursor-not-allowed"
        >
          {added ? '✓ Ajouté au Panier' : 'Ajouter au Panier'}
        </button>

        <button
          onClick={() => setCheckoutOpen(true)}
          disabled={isOOS}
          style={{
            fontFamily: DM, fontSize: '14px', fontWeight: 700, letterSpacing: '0.2em',
            color: '#775928', textTransform: 'uppercase',
            background: 'transparent', height: '56px', width: '100%',
            border: '1px solid #775928', cursor: 'pointer',
            transition: 'all 0.3s', opacity: isOOS ? 0.5 : 1,
          }}
          className="hover:bg-[#775928] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed"
        >
          Acheter Maintenant — Paiement à la Livraison
        </button>
      </div>

      {/* Accordion */}
      <div style={{ borderTop: '1px solid rgba(209,197,182,0.3)', marginTop: '8px' }}>
        <Accordion title="Détails & Coupe">
          <p>• Tissu de qualité supérieure, soigneusement confectionné</p>
          <p>• Silhouette à la coupe modeste et élégante</p>
          <p>• Fait main en Algérie</p>
        </Accordion>
        <Accordion title="Instructions d'Entretien">
          <p>• Lavage à la main ou nettoyage à sec recommandé</p>
          <p>• Repasser à basse température sur l'envers</p>
          <p>• Ne pas blanchir ni sécher en machine</p>
        </Accordion>
        <Accordion title="Livraison & Retours">
          <p>Paiement à la livraison dans les 48 wilayas. Livraison prévue sous 2 à 5 jours ouvrables.</p>
          <p style={{ marginTop: '8px' }}>Livraison gratuite pour les commandes de plus de 100 000 DZD.</p>
        </Accordion>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', background: '#faf9f6', color: '#1a1c1a', minHeight: '100vh' }}>
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={orderTotal}
        totalAmount={Number(product.price) * qty}
        orderItems={[{ product_id: product.id, variant_id: variantId, quantity: qty }]}
      />

      {/* Full-Screen Image Viewer */}
      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt={product.name}
          onClose={() => setViewerSrc(null)}
        />
      )}

      {/* ════════════════════════════════
          DESKTOP LAYOUT  (lg and above)
          Split: fluid gallery | 480px aside
         ════════════════════════════════ */}
      <main className="hidden lg:block max-w-[1280px] mx-auto px-16">

        {/* ── Hero split section ── */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '24px', paddingTop: '48px', paddingBottom: '48px' }}>

          {/* Left: 2-col image grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>

            {/* Large hero image — spans full height in col 1 */}
            <div
              style={{ gridColumn: '1', gridRow: '1', background: '#efeeeb', overflow: 'hidden', position: 'relative', height: '100%' }}
              className="group cursor-crosshair"
            >
              {images.length > 0 ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease-out', cursor: 'zoom-in' }}
                  className="group-hover:scale-105"
                  onClick={() => setViewerSrc(images[activeImg])}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Image</div>
              )}
              {/* Wishlist */}
              <button
                onClick={() => setIsFav(!isFav)}
                aria-label="Add to Wishlist"
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(250,249,246,0.85)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '50%', width: '44px', height: '44px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer',
                  color: isFav ? '#775928' : '#1a1c1a', zIndex: 10,
                  transition: 'color 0.2s',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? '#775928' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {/* Right col: 3 stacked thumbnails */}
            <div style={{ gridColumn: '2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map((offset) => {
                const imgIdx = offset; // index 1, 2, 3
                const src    = images[imgIdx] || images[0] || '';
                return (
                  <button
                    key={offset}
                    onClick={() => setActiveImg(imgIdx < images.length ? imgIdx : 0)}
                    style={{
                      width: '100%', aspectRatio: '3/4', overflow: 'hidden', background: '#efeeeb', position: 'relative',
                      border: `2px solid ${activeImg === imgIdx ? '#775928' : 'transparent'}`,
                      cursor: 'pointer', transition: 'border-color 0.2s', padding: 0, display: 'block',
                    }}
                    className="group"
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={`View ${offset + 1}`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                        className="group-hover:scale-105"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#efeeeb' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: sticky info panel */}
          <aside style={{ position: 'sticky', top: '128px', height: 'fit-content', paddingLeft: '16px' }}>
            {InfoPanel}
          </aside>
        </section>

        {/* ── Complete The Look / Related ── */}
        {related.length > 0 && (
          <section style={{ paddingTop: '80px', paddingBottom: '80px', borderTop: '1px solid rgba(209,197,182,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
              <div>
                <h2 style={{ fontFamily: BODA, fontSize: '32px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1c1a', margin: 0 }}>
                  Complétez le Look
                </h2>
                <div style={{ width: '64px', height: '2px', background: '#775928', marginTop: '12px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              {related.map((p) => {
                const img = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url || '';
                return (
                  <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }} className="group block relative overflow-hidden">
                    <div style={{ aspectRatio: '3/4', background: '#efeeeb', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                          className="group-hover:scale-105"
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Image</div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span style={{ background: '#fff', color: '#775928', padding: '10px 20px', fontFamily: DM, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
                          Ajout Rapide
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontFamily: BODA, fontSize: '18px', fontWeight: 500, color: '#1a1c1a', margin: '0 0 4px 0', transition: 'color 0.2s' }} className="group-hover:text-[#775928]">{p.name}</h3>
                      {p.category && <p style={{ ...BODY, fontSize: '13px', color: '#4e453a', margin: '0 0 4px 0' }}>{p.category.name}</p>}
                      <p style={{ fontFamily: DM, fontWeight: 700, color: '#775928', margin: 0 }}>{fmt(p.price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ════════════════════════════════
          MOBILE LAYOUT  (below lg)
         ════════════════════════════════ */}
      <main className="lg:hidden max-w-[640px] mx-auto pb-32">

        {/* Mobile: full-width hero image with horizontal thumbnail row below */}
        <div className="relative">
          {/* Main hero image */}
          <div style={{ width: '100%', aspectRatio: '3/4', background: '#efeeeb', overflow: 'hidden', position: 'relative' }} className="group">
            {images.length > 0 ? (
              <img
                src={images[activeImg]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s', cursor: 'zoom-in' }}
                className="group-hover:scale-105"
                onClick={() => setViewerSrc(images[activeImg])}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Image</div>
            )}
            <button
              onClick={() => setIsFav(!isFav)}
              aria-label="Add to Wishlist"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(250,249,246,0.85)', backdropFilter: 'blur(4px)',
                borderRadius: '50%', width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', zIndex: 10,
                color: isFav ? '#775928' : '#1a1c1a', transition: 'color 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? '#775928' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          {/* Horizontal thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '12px 20px', scrollbarWidth: 'none' }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: '72px', height: '88px', flexShrink: 0,
                    border: `2px solid ${activeImg === i ? '#775928' : 'transparent'}`,
                    overflow: 'hidden', cursor: 'pointer', padding: 0, background: '#efeeeb',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile: product info panel */}
        <div style={{ padding: '24px 20px' }}>
          {InfoPanel}
        </div>

        {/* Mobile: related products */}
        {related.length > 0 && (
          <section style={{ borderTop: '1px solid rgba(209,197,182,0.2)', padding: '40px 20px' }}>
            <h2 style={{ fontFamily: BODA, fontSize: '24px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1c1a', textAlign: 'center', marginBottom: '32px' }}>
              Vous Aimerez Aussi
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {related.slice(0, 4).map((p) => {
                const img = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url || '';
                return (
                  <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }} className="group block overflow-hidden">
                    <div style={{ aspectRatio: '3/4', background: '#efeeeb', overflow: 'hidden', marginBottom: '10px' }}>
                      {img ? (
                        <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="group-hover:scale-105" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#efeeeb' }} />
                      )}
                    </div>
                    <h3 style={{ fontFamily: BODA, fontSize: '14px', fontWeight: 500, color: '#1a1c1a', margin: '0 0 4px 0' }} className="group-hover:text-[#775928]">{p.name}</h3>
                    <p style={{ fontFamily: DM, fontSize: '13px', fontWeight: 700, color: '#775928', margin: 0 }}>{fmt(p.price)}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ── Fixed Mobile Action Bar ── */}
      <div className="fixed bottom-0 left-0 w-full z-40 lg:hidden flex items-center justify-between gap-3 px-4 py-3"
        style={{ background: 'rgba(26,28,26,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(209,197,182,0.2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: BODA, fontSize: '14px', color: '#ffffff', fontWeight: 500 }}>{product.name}</span>
          <span style={{ ...LABEL, fontSize: '11px', color: '#775928' }}>{fmt(product.price)}</span>
        </div>
        <button
          onClick={handleAddToBag}
          disabled={isOOS}
          style={{
            fontFamily: DM, fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em',
            color: '#ffffff', textTransform: 'uppercase',
            background: '#775928', padding: '12px 24px', border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'background 0.2s', opacity: isOOS ? 0.5 : 1,
          }}
          className="hover:bg-[#e8c086] hover:text-[#1a1c1a] disabled:cursor-not-allowed"
        >
          {added ? '✓ Ajouté' : 'Ajouter au Panier'}
        </button>
      </div>
    </div>
  );
}
