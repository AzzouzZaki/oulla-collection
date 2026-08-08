'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getCart, clearCart } from '@/lib/cart';

const DM   = "'DM Sans', system-ui, sans-serif";
const BODA = "'Bodoni Moda', Georgia, serif";

const LABEL: React.CSSProperties = { fontFamily: DM, fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', lineHeight: '1.2' };
const BODY:  React.CSSProperties = { fontFamily: DM, fontSize: '16px', fontWeight: 400, lineHeight: '1.5' };

interface Props {
  open: boolean;
  onClose: () => void;
  total: string;
  totalAmount: number;
  orderItems?: { product_id: number; quantity: number }[];
}



export default function CheckoutModal({ open, onClose, total, totalAmount, orderItems }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [wilayas, setWilayas] = useState<{wilaya_id:number, wilaya_name:string}[]>([]);
  const [wilayasLoading, setWilayasLoading] = useState(true);
  const [wilayasError, setWilayasError] = useState(false);
  const [selectedWilayaId, setSelectedWilayaId] = useState<number | ''>('');
  const [fees, setFees] = useState<{home:number, desk:number|null} | null>(null);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState(false);

  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  const [stopDesks, setStopDesks] = useState<string[]>([]);
  const [desksLoading, setDesksLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_instagram: '',
    address_line: '',
    city: '',
    wilaya: '',
    notes: '',
  });

  /* Lock body scroll while modal is open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Close on Escape key */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setWilayasLoading(true);
    setWilayasError(false);
    fetch('/api/wilayas')
      .then(r => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then(data => {
        setWilayas(data);
      })
      .catch(e => {
        console.error(e);
        setWilayasError(true);
      })
      .finally(() => {
        setWilayasLoading(false);
      });
  }, [open]);

  const handleWilayaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedWilayaId('');
      setFormData({ ...formData, wilaya: '' });
      setFees(null);
      setFeesError(false);
      return;
    }

    const wId = parseInt(val, 10);
    setSelectedWilayaId(wId);
    
    const wObj = wilayas.find(w => w.wilaya_id === wId);
    if (wObj) {
      setFormData({ ...formData, wilaya: wObj.wilaya_name });
    }

    setFeesLoading(true);
    setFees(null);
    setFeesError(false);

    try {
      const res = await fetch(`/api/shipping-fees?wilaya_id=${wId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setFees(data);
      
      if (data.desk !== null) {
        setDesksLoading(true);
        setDeliveryType('home');
        fetch(`/api/communes?wilaya_id=${wId}`)
          .then(r => r.ok ? r.json() : [])
          .then(desks => {
            setStopDesks(desks);
            if (desks.length === 1) {
              setFormData(prev => ({ ...prev, city: desks[0] }));
            } else {
              setFormData(prev => ({ ...prev, city: '' }));
            }
          })
          .catch(console.error)
          .finally(() => setDesksLoading(false));
      } else {
        setDeliveryType('home');
        setStopDesks([]);
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } catch (err) {
      setFeesError(true);
    } finally {
      setFeesLoading(false);
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // Determine items
      let itemsToOrder = orderItems;
      if (!itemsToOrder || itemsToOrder.length === 0) {
        const cart = getCart();
        itemsToOrder = cart.map((c) => ({
          product_id: c.product_id,
          quantity: c.qty,
        }));
      }

      if (!itemsToOrder || itemsToOrder.length === 0) {
        setErrorMsg('Votre panier est vide');
        setLoading(false);
        return;
      }

      const fullAddress = `${formData.address_line}${formData.city ? ', ' + formData.city : ''}`;

      const payload = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: fullAddress,
        wilaya: formData.wilaya,
        customer_instagram: formData.customer_instagram || null,
        notes: formData.notes || null,
        items: itemsToOrder,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec de la commande');
      }

      clearCart();
      setSubmitted(true);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Un problème est survenu lors de la validation de votre commande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-[#281800]/60 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative w-full max-w-[500px] bg-[#faf9f6] shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#4e453a] hover:text-[#775928] transition-colors z-10"
          aria-label="Close"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-8 md:p-10 max-h-[90vh] overflow-y-auto">

          {submitted ? (
            /* ── Success state ── */
            <div className="py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#775928]/10 flex items-center justify-center mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#775928" strokeWidth="1.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontFamily: BODA, fontSize: '28px', fontWeight: 500, color: '#1a1c1a' }}>
                Commande Passée
              </h2>
              <p style={{ ...BODY, color: '#4e453a' }}>
                Merci pour votre commande ! Votre demande a été enregistrée. Notre équipe vous contactera sous peu pour confirmation.
              </p>
              <button
                onClick={onClose}
                style={{ ...LABEL, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffffff' }}
                className="w-full h-14 bg-[#1a1c1a] hover:bg-[#775928] transition-all duration-300"
              >
                Continuer vos Achats
              </button>
            </div>
          ) : (
            <>
              {/* ── Title ── */}
              <h2
                style={{ fontFamily: BODA, fontSize: '28px', fontWeight: 500, color: '#1a1c1a', textAlign: 'center' }}
                className="mb-8"
              >
                Commander (Paiement à la Livraison)
              </h2>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Contact Details ── */}
                <div className="space-y-4">
                  <p style={{ ...LABEL, textTransform: 'uppercase', color: '#5f5e5e' }}
                    className="border-b border-[#d1c5b6]/40 pb-2">
                    Coordonnées
                  </p>
                  
                  <div className="space-y-1">
                    <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Nom Complet *</label>
                    <input
                      type="text"
                      required
                      placeholder="Entrez votre nom complet"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      style={{ ...BODY, color: '#1a1c1a' }}
                      className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Numéro de Téléphone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="ex: 0555123456"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      style={{ ...BODY, color: '#1a1c1a' }}
                      className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Compte Instagram (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="@nomdutilisateur"
                      value={formData.customer_instagram}
                      onChange={(e) => setFormData({ ...formData, customer_instagram: e.target.value })}
                      style={{ ...BODY, color: '#1a1c1a' }}
                      className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>
                </div>

                {/* ── Shipping Address ── */}
                <div className="space-y-4 pt-2">
                  <p style={{ ...LABEL, textTransform: 'uppercase', color: '#5f5e5e' }}
                    className="border-b border-[#d1c5b6]/40 pb-2">
                    Adresse de Livraison
                  </p>

                  {/* Wilaya select */}
                  <div className="space-y-1">
                    <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Wilaya *</label>
                    {wilayasLoading ? (
                      <div className="w-full h-[50px] border border-[#d1c5b6] bg-[#efeeeb] animate-pulse"></div>
                    ) : wilayasError ? (
                      <div className="w-full text-xs text-[#ba1a1a] py-2">Impossible de charger les wilayas</div>
                    ) : (
                      <select
                        required
                        value={selectedWilayaId}
                        onChange={handleWilayaChange}
                        style={{ ...BODY, color: '#1a1c1a' }}
                        className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                      >
                        <option value="">Sélectionner…</option>
                        {wilayas.map((w) => (
                          <option key={w.wilaya_id} value={w.wilaya_id}>{w.wilaya_name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Loading / Error for fees */}
                  {(feesLoading || feesError) && (
                    <div className="mt-2 pl-3 border-l-2 border-[#d1c5b6] space-y-1">
                      {feesLoading && (
                        <div style={{ fontFamily: DM, fontSize: '13px', fontStyle: 'italic', color: '#5f5e5e' }}>
                          Calcul des frais...
                        </div>
                      )}
                      {feesError && (
                        <div style={{ fontFamily: DM, fontSize: '12px', color: '#ba1a1a' }}>
                          Impossible de récupérer les frais de livraison
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Type Choice (only if desk is available) */}
                  {fees && !feesLoading && !feesError && fees.desk !== null && (
                    <div className="space-y-2 mt-4">
                      <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Mode de Livraison *</label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className={`border ${deliveryType === 'home' ? 'border-[#775928] bg-[#775928]/5' : 'border-[#d1c5b6] opacity-70'} flex items-center justify-center py-3 cursor-pointer transition-colors`}>
                          <input type="radio" name="deliveryType" value="home" checked={deliveryType === 'home'} onChange={() => setDeliveryType('home')} className="hidden" />
                          <div className="text-center">
                            <div style={{ ...LABEL, color: deliveryType === 'home' ? '#775928' : '#4e453a' }}>À Domicile</div>
                            <div style={{ fontFamily: DM, fontSize: '13px', color: '#1a1c1a' }}>{fees.home} DZD</div>
                          </div>
                        </label>
                        <label className={`border ${deliveryType === 'desk' ? 'border-[#775928] bg-[#775928]/5' : 'border-[#d1c5b6] opacity-70'} flex items-center justify-center py-3 cursor-pointer transition-colors`}>
                          <input type="radio" name="deliveryType" value="desk" checked={deliveryType === 'desk'} onChange={() => setDeliveryType('desk')} className="hidden" />
                          <div className="text-center">
                            <div style={{ ...LABEL, color: deliveryType === 'desk' ? '#775928' : '#4e453a' }}>Point Relais</div>
                            <div style={{ fontFamily: DM, fontSize: '13px', color: '#1a1c1a' }}>{fees.desk} DZD</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Delivery Type Choice fallback (only home available) */}
                  {fees && !feesLoading && !feesError && fees.desk === null && (
                     <div className="mt-2 pl-3 border-l-2 border-[#775928] space-y-1">
                        <div style={{ fontFamily: DM, fontSize: '14px', color: '#4e453a', lineHeight: '1.4' }}>
                          Livraison à domicile : <span style={{ fontWeight: 700, color: '#1a1c1a' }}>{fees.home} DZD</span>
                        </div>
                     </div>
                  )}

                  {/* Conditional Address Fields */}
                  {deliveryType === 'home' ? (
                    <>
                      <div className="space-y-1 mt-4">
                        <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Adresse Complète *</label>
                        <input
                          type="text"
                          required
                          placeholder="Numéro et nom de rue"
                          value={formData.address_line}
                          onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                          style={{ ...BODY, color: '#1a1c1a' }}
                          className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Ville / Commune</label>
                        <input
                          type="text"
                          placeholder="Nom de la ville"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          style={{ ...BODY, color: '#1a1c1a' }}
                          className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1 mt-4">
                      <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Point Relais (Stop Desk) *</label>
                      {desksLoading ? (
                        <div className="w-full h-[50px] border border-[#d1c5b6] bg-[#efeeeb] animate-pulse"></div>
                      ) : stopDesks.length === 1 ? (
                        <div className="w-full border border-[#d1c5b6] bg-[#f4f3f1] px-4 py-3" style={{ ...BODY, color: '#1a1c1a' }}>
                          {stopDesks[0]} (Sélectionné automatiquement)
                        </div>
                      ) : (
                        <select
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          style={{ ...BODY, color: '#1a1c1a' }}
                          className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                        >
                          <option value="">Sélectionner un point relais…</option>
                          {stopDesks.map(desk => (
                            <option key={desk} value={desk}>{desk}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label style={{ ...LABEL, fontSize: '13px', color: '#4e453a' }}>Notes de Livraison (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="Instructions spéciales pour la livraison"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{ ...BODY, color: '#1a1c1a' }}
                      className="w-full border border-[#d1c5b6] bg-transparent px-4 py-3 focus:border-[#775928] focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>
                </div>

                {/* ── Order total recap ── */}
                {(() => {
                  const shippingFee = fees && !feesLoading && !feesError
                    ? (deliveryType === 'desk' && fees.desk !== null ? fees.desk : fees.home)
                    : null;
                  const grandTotal = shippingFee !== null ? totalAmount + shippingFee : null;
                  return (
                    <div className="bg-[#f4f3f1] px-6 py-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span style={{ ...BODY, fontSize: '14px', color: '#5f5e5e' }}>Sous-total</span>
                        <span style={{ fontFamily: BODA, fontSize: '16px', fontWeight: 500, color: '#1a1c1a' }}>
                          {total}
                        </span>
                      </div>
                      {shippingFee !== null && (
                        <div className="flex justify-between items-center">
                          <span style={{ ...BODY, fontSize: '14px', color: '#5f5e5e' }}>
                            Livraison ({deliveryType === 'desk' ? 'Point Relais' : 'À Domicile'})
                          </span>
                          <span style={{ fontFamily: BODA, fontSize: '16px', fontWeight: 500, color: '#1a1c1a' }}>
                            {shippingFee.toLocaleString('fr-DZ')} DZD
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-[#d1c5b6] pt-2 mt-2">
                        <span style={{ ...LABEL, color: '#4e453a', textTransform: 'uppercase' }}>Total à Payer</span>
                        <span style={{ fontFamily: BODA, fontSize: '20px', fontWeight: 500, color: '#775928' }}>
                          {grandTotal !== null
                            ? `DZD ${grandTotal.toLocaleString('fr-DZ')}`
                            : total}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Submit ── */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ fontFamily: DM, fontSize: '14px', fontWeight: 700, letterSpacing: '0.2em', color: '#ffffff', textTransform: 'uppercase' }}
                  className="w-full h-14 bg-[#1a1c1a] hover:bg-[#775928] transition-all duration-300 active:scale-[0.98] mt-2 disabled:opacity-50"
                >
                  {loading ? 'Commande en cours...' : 'Valider la Commande'}
                </button>

                <p style={{ ...LABEL, fontSize: '10px', color: '#5f5e5e', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Paiement à la livraison dans toutes les 48 wilayas
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
