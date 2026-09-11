import { useState } from 'react';
import type { Product } from '../../types/shop';
import { addItemToCart, openCart } from '../../stores/cart';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
      quantity
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  const stockCount = product.stock ?? product.stock_quantity ?? 0;
  const isAvailable = stockCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Google Store Rounded-Full Quantity Selector */}
        <div className={`inline-flex items-center rounded-full border border-slate-300 bg-slate-50/80 p-1 shadow-2xs ${!isAvailable ? 'opacity-40 pointer-events-none' : ''}`}>
          <label htmlFor={`quantity-${product.id}`} className="sr-only">
            Menge für {product.title}
          </label>
          <button
            type="button"
            disabled={!isAvailable || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-full inline-flex items-center justify-center text-base font-bold text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            aria-label="Menge verringern"
          >
            −
          </button>
          <input
            id={`quantity-${product.id}`}
            type="number"
            min={1}
            max={stockCount > 0 ? stockCount : 999}
            value={quantity}
            disabled={!isAvailable}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-10 border-0 bg-transparent text-center text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-0 disabled:text-slate-400"
          />
          <button
            type="button"
            disabled={!isAvailable || quantity >= stockCount}
            onClick={() => setQuantity((q) => q + 1)}
            className="h-9 w-9 rounded-full inline-flex items-center justify-center text-base font-bold text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            aria-label="Menge erhöhen"
          >
            +
          </button>
        </div>

        {/* Primary Google Store Pill CTA */}
        <button
          type="button"
          data-testid="pdp-add-to-cart-btn"
          disabled={!isAvailable}
          onClick={handleAdd}
          className={`flex-1 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 ${
            !isAvailable
              ? 'bg-slate-400'
              : added
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-[#0b57d0] hover:bg-[#0842a0]'
          }`}
        >
          {!isAvailable ? (
            <span>Derzeit nicht lieferbar</span>
          ) : added ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Hinzugefügt
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              In den Warenkorb
            </span>
          )}
        </button>
      </div>

      {/* Trust & Guarantee Pill Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-200/60 font-medium">
        <div className="flex items-center gap-2">
          <span className="text-[#3395d1] font-bold">✓</span> Schneller Direktversand
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#3395d1] font-bold">✓</span> Bequemer Kauf auf Rechnung
        </div>
      </div>
    </div>
  );
}
