import { useStore } from '@nanostores/react';
import { cartItemCount, openCart } from '../../stores/cart';

export default function CartTrigger() {
  const count = useStore(cartItemCount);

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative inline-flex items-center gap-2 h-10 px-3.5 py-2 text-[15px] font-medium text-slate-800 hover:text-slate-950 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0] rounded-full transition-all shrink-0"
      aria-label={`Warenkorb öffnen (${count} Artikel)`}
    >
      <svg
        className="w-5 h-5 text-slate-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      <span className="hidden sm:inline">Warenkorb</span>
      {count > 0 && (
        <span
          className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-[#0b57d0] rounded-full"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </button>
  );
}
