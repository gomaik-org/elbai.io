import { useState, useEffect } from 'react';
import type { Product } from '../../types/shop';
import { addItemToCart, openCart } from '../../stores/cart';

interface StickyBuyBarProps {
  product: Product;
}

export default function StickyBuyBar({ product }: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past primary hero purchase area (~380px)
      if (window.scrollY > 380) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdd = () => {
    addItemToCart(
      {
        id: product.id,
        sku: product.sku,
        title: product.title,
        price_cents: product.price_cents,
        vat_percent: product.vat_percent ?? product.vat_rate ?? 19,
        image_url: product.image_url,
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  const isAvailable = (product.stock ?? product.stock_quantity ?? 0) > 0;

  const formattedPrice = (product.price_cents / 100).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });

  return (
    <aside
      id="sticky-buy-bar"
      aria-label="Schnellkaufleiste"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg px-4 py-3 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Product Info */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={product.image_url || '/images/placeholder.svg'}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0 hidden sm:block"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {product.sku}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-sans">
                {product.title}
              </h3>
            </div>
            <p className="text-[11px] hidden sm:block">
              {isAvailable ? (
                <span className="text-emerald-700 font-semibold">● Sofort lieferbar • Kauf auf Rechnung</span>
              ) : (
                <span className="text-rose-600 font-semibold">● Derzeit vergriffen</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Price & CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-sans">
              {formattedPrice}
            </span>
            <span className="text-[10px] text-slate-500 block -mt-1 hidden sm:block">
              inkl. {product.vat_percent ?? product.vat_rate ?? 19}% MwSt.
            </span>
          </div>

          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAdd}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 ${
              !isAvailable
                ? 'bg-slate-400'
                : added
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-[#0b57d0] hover:bg-[#0842a0]'
            }`}
            aria-label={`${product.title} in den Warenkorb legen`}
          >
            {!isAvailable ? (
              <span>Vergriffen</span>
            ) : added ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Hinzugefügt</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>In den Warenkorb</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
