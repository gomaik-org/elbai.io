import { useState } from 'react';
import type { Product } from '../../types/shop';
import { addItemToCart, openCart } from '../../stores/cart';

interface QuickAddToCartProps {
  product: Product;
}

export default function QuickAddToCart({ product }: QuickAddToCartProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
    setTimeout(() => setAdded(false), 1800);
    openCart();
  };

  const isAvailable = (product.stock ?? product.stock_quantity ?? 0) > 0;

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={handleAdd}
      aria-label={
        !isAvailable
          ? `${product.title} (Derzeit vergriffen)`
          : `${product.title} in den Warenkorb legen`
      }
      title={
        !isAvailable
          ? `${product.title} (Derzeit vergriffen)`
          : `${product.title} in den Warenkorb legen`
      }
      className={`relative z-10 inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all shadow-2xs border focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:ring-offset-1 shrink-0 ${
        !isAvailable
          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
          : added
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 scale-105 shadow-xs cursor-pointer'
          : 'bg-slate-100/90 hover:bg-slate-200/90 border-slate-300/80 text-slate-700 hover:text-[#0b57d0] hover:border-[#0b57d0]/50 active:scale-95 cursor-pointer'
      }`}
    >
      {added ? (
        <svg className="w-5 h-5 text-emerald-600 animate-in zoom-in-50 duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2zM12 7v4m-2-2h4"
          />
        </svg>
      )}
    </button>
  );
}
