'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CheckoutModal from '@/components/store/CheckoutModal';
import { getCart, updateCartQty, removeFromCart, type CartItem } from '@/lib/cart';
import type { Product } from '@/types';

const DM_SANS  = "'DM Sans', system-ui, sans-serif";
const BODONI   = "'Bodoni Moda', Georgia, serif";

const LABEL_SM: React.CSSProperties = { fontFamily: DM_SANS, fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', lineHeight: '1.2' };
const BODY_MD:  React.CSSProperties = { fontFamily: DM_SANS, fontSize: '16px', fontWeight: 400, lineHeight: '1.5' };
const HEADLINE_SM: React.CSSProperties = { fontFamily: BODONI, fontSize: '20px', fontWeight: 500, lineHeight: '1.4' };

function fmt(n: number) {
  return 'DZD ' + n.toLocaleString('fr-DZ');
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);

  /* Sync from localStorage */
  const syncCart = () => setItems(getCart());

  useEffect(() => {
    syncCart();
    window.addEventListener('cart-updated', syncCart);
    return () => window.removeEventListener('cart-updated', syncCart);
  }, []);

  /* Fetch a few related / you-may-like products */
  useEffect(() => {
    fetch('/api/products?limit=4&page=1')
      .then((r) => r.json())
      .then((data) => setRelated(data.data?.slice(0, 4) || []))
      .catch(console.error);
  }, []);

  const handleUpdateQty = (product_id: number, delta: number) => {
    const item = items.find(i => i.product_id === product_id);
    if (!item) return;
    const newQty = Math.max(1, item.qty + delta);
    updateCartQty(product_id, newQty);
    syncCart();
  };

  const handleRemove = (product_id: number) => {
    removeFromCart(product_id);
    syncCart();
  };

  const subtotal     = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping     = subtotal >= 100000 ? 0 : 1200;
  const total        = subtotal + shipping;
  const totalFormatted = fmt(total);

  const orderItems = items.map(i => ({ product_id: i.product_id, quantity: i.qty }));

  return (
    <div className="w-full bg-[#faf9f6] text-[#1a1c1a] min-h-screen">
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={totalFormatted}
        totalAmount={total}
        orderItems={orderItems}
      />

      <main className="max-w-[1280px] mx-auto px-5 md:px-16 pt-8 md:pt-16 pb-32">

        {/* ── Page Header ── */}
        <header className="mb-8 md:mb-12">
          <h1
            style={{
              fontFamily: BODONI, fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 600, letterSpacing: '-0.02em', lineHeight: '1.1',
            }}
            className="mb-3 text-[#1a1c1a]"
          >
            Votre Panier
          </h1>
          <p style={{ ...BODY_MD, fontSize: '16px', color: '#5f5e5e' }}>
            {items.length} Article{items.length !== 1 ? 's' : ''} sélectionné{items.length !== 1 ? 's' : ''} pour votre collection.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* ── Left Column: Item List ── */}
          <section className="lg:col-span-8">
            <div className="border-t border-[#d1c5b6]/30">
              {items.length === 0 ? (
                <div className="py-20 text-center">
                  <p style={{ ...HEADLINE_SM, color: '#4e453a' }} className="mb-6">Votre panier est vide</p>
                  <Link
                    href="/products"
                    style={{ ...LABEL_SM, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffffff' }}
                    className="inline-block bg-[#1a1c1a] px-10 py-4 hover:bg-[#775928] transition-colors"
                  >
                    Découvrir la Collection
                  </Link>
                </div>
              ) : (
                items.map((item, i) => (
                  <div
                    key={item.product_id}
                    className={`flex flex-col sm:flex-row gap-6 sm:gap-8 py-8 ${
                      i < items.length - 1 ? 'border-b border-[#d1c5b6]/30' : ''
                    }`}
                  >
                    {/* Product Image */}
                    <Link href={`/products/${item.product_id}`} className="w-28 sm:w-48 flex-shrink-0 aspect-[3/4] bg-[#efeeeb] overflow-hidden rounded-sm block">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Link href={`/products/${item.product_id}`}>
                            <h3 style={{ ...HEADLINE_SM, fontSize: '20px', color: '#1a1c1a' }} className="mb-1 hover:text-[#775928] transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          {item.variant && (
                            <p style={{ ...LABEL_SM, color: '#5f5e5e', textTransform: 'uppercase' }} className="mb-4">
                              {item.variant}
                            </p>
                          )}
                        </div>
                        <p style={{ ...HEADLINE_SM, color: '#775928', fontSize: '20px' }}>
                          {fmt(item.price * item.qty)}
                        </p>
                      </div>

                      {/* Quantity & Delete Actions */}
                      <div className="flex justify-between items-center mt-6 sm:mt-8">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#d1c5b6] rounded-full px-2 py-1 gap-4">
                          <button
                            onClick={() => handleUpdateQty(item.product_id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-[#1a1c1a] hover:text-[#775928] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span style={{ ...LABEL_SM, fontSize: '13px' }} className="w-6 text-center">
                            {item.qty < 10 ? '0' + item.qty : item.qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.product_id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#1a1c1a] hover:text-[#775928] transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemove(item.product_id)}
                          style={{ ...LABEL_SM, textTransform: 'uppercase', color: '#4e453a' }}
                          className="flex items-center gap-1.5 hover:text-[#ba1a1a] transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Complete the Look Section ── */}
            {related.length > 0 && items.length > 0 && (
              <div className="mt-20">
                <h2 style={{ ...HEADLINE_SM, color: '#1a1c1a' }} className="mb-6">
                  Vous Aimerez Aussi
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  {related
                    .filter(p => !items.some(i => i.product_id === p.id))
                    .slice(0, 4)
                    .map((p) => {
                      const img = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url || '';
                      return (
                        <Link key={p.id} href={`/products/${p.id}`} className="group cursor-pointer block">
                          <div className="aspect-[3/4] overflow-hidden mb-3 relative bg-[#efeeeb]">
                            {img ? (
                              <img
                                src={img}
                                alt={p.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                            )}
                          </div>
                          <h4 style={{ ...BODY_MD, fontSize: '15px', color: '#1a1c1a' }} className="group-hover:text-[#775928] transition-colors">{p.name}</h4>
                          <p style={{ ...LABEL_SM, color: '#775928', textTransform: 'uppercase' }} className="mt-1">
                            DZD {Number(p.price).toLocaleString('fr-DZ')}
                          </p>
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}
          </section>

          {/* ── Right Column: Order Summary ── */}
          <aside className="lg:col-span-4 lg:sticky" style={{ top: '120px' }}>
            <div className="bg-[#f4f3f1] p-6 sm:p-10 border border-[#d1c5b6]/10 shadow-[0_20px_40px_rgba(26,26,26,0.02)]">
              <h2 style={{ ...HEADLINE_SM, color: '#1a1c1a' }} className="mb-6">Résumé</h2>

              {/* Line items */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span style={{ ...BODY_MD, color: '#4e453a' }}>Sous-total</span>
                  <span style={{ ...BODY_MD, color: '#1a1c1a' }}>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ ...BODY_MD, color: '#4e453a' }}>Frais de port estimés</span>
                  <span style={{ ...BODY_MD, color: shipping === 0 ? '#775928' : '#1a1c1a' }}>
                    {shipping === 0 ? 'Gratuit' : fmt(shipping)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-[#d1c5b6]/30 pt-5 mb-8">
                <div className="flex justify-between items-baseline">
                  <span style={{ ...HEADLINE_SM, color: '#1a1c1a' }}>Total</span>
                  <span style={{ ...HEADLINE_SM, color: '#775928', fontSize: '24px' }}>{fmt(total)}</span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="space-y-4">
                <button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={items.length === 0}
                  style={{ ...LABEL_SM, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#faf9f6' }}
                  className="w-full py-4 sm:py-5 bg-[#1a1c1a] hover:bg-[#775928] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Passer la Commande (Paiement à la Livraison)
                </button>
                <Link
                  href="/products"
                  style={{ ...LABEL_SM, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#775928', display: 'block', textAlign: 'center' }}
                  className="w-full py-4 sm:py-5 border border-[#775928] hover:bg-[#775928]/5 transition-all duration-300"
                >
                  Continuer vos Achats
                </Link>
              </div>

              {/* Shipping note */}
              <div className="mt-6 pt-6 border-t border-[#d1c5b6]/30">
                <p style={{ ...LABEL_SM, fontSize: '10px', color: '#5f5e5e', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>
                  Livraison gratuite pour les commandes de plus de 100 000 DZD
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 px-2 space-y-4">
              <div className="flex items-center gap-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#775928" strokeWidth="1.5" className="flex-shrink-0">
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <path d="M16 8h4l3 5v3h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <div className="flex-grow">
                  <p style={{ ...LABEL_SM, fontSize: '11px', textTransform: 'uppercase', color: '#1a1c1a' }}>Paiement à la Livraison</p>
                  <p style={{ fontFamily: DM_SANS, fontSize: '12px', color: '#5f5e5e' }}>Toutes les 48 Wilayas</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#775928" strokeWidth="1.5" className="flex-shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <div className="flex-grow">
                  <p style={{ ...LABEL_SM, fontSize: '11px', textTransform: 'uppercase', color: '#1a1c1a' }}>Authenticité Garantie</p>
                  <p style={{ fontFamily: DM_SANS, fontSize: '12px', color: '#5f5e5e' }}>Directement des Artisans</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Fixed Bottom Bar for Mobile ── */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-40 lg:hidden p-4 bg-[#faf9f6]/95 backdrop-blur-md border-t border-[#d1c5b6]/30 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span style={{ ...LABEL_SM, fontSize: '10px', color: '#5f5e5e', textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontFamily: BODONI, fontSize: '18px', fontWeight: 600, color: '#775928' }}>{totalFormatted}</span>
          </div>
          <button
            onClick={() => setCheckoutOpen(true)}
            style={{ ...LABEL_SM, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffffff' }}
            className="flex-1 max-w-[240px] py-3.5 bg-[#1a1c1a] hover:bg-[#775928] transition-colors text-center"
          >
            Commander (Paiement à la Livraison)
          </button>
        </div>
      )}

    </div>
  );
}
