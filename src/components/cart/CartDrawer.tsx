import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  cartItems,
  cartShippingCents,
  cartSubtotalCents,
  cartTotalCents,
  cartVat7Cents,
  cartVat19Cents,
  cartVatCents,
  closeCart,
  formatPriceEur,
  isCartOpen,
  removeItemFromCart,
  updateItemQuantity,
} from '../../stores/cart';

export default function CartDrawer() {
  const isOpen = useStore(isCartOpen);
  const items = useStore(cartItems);
  const subtotalCents = useStore(cartSubtotalCents);
  const vatCents = useStore(cartVatCents);
  const vat7Cents = useStore(cartVat7Cents);
  const vat19Cents = useStore(cartVat19Cents);
  const shippingCents = useStore(cartShippingCents);
  const totalCents = useStore(cartTotalCents);

  const itemList = Object.values(items);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="cart-drawer-dialog"
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity backdrop-blur-xs"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 id="cart-title" className="text-lg font-bold text-gray-900">
              Warenkorb ({itemList.length})
            </h2>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Warenkorb schließen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {itemList.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-900">Ihr Warenkorb ist noch leer.</p>
                <p className="mt-1 text-xs text-gray-500">Stöbern Sie durch unser Sortiment und finden Sie hochwertige Lehrmaterialien.</p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Weiter einkaufen
                </button>
              </div>
            ) : (
              itemList.map((item) => (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-16 h-16 rounded object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                      ELBI
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500">Art.-Nr.: {item.sku}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {formatPriceEur(item.price_cents * item.quantity)}
                    </p>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100"
                        aria-label={`Menge für ${item.title} verringern`}
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold text-gray-800 px-1">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100"
                        aria-label={`Menge für ${item.title} erhöhen`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItemFromCart(item.id)}
                        className="text-xs text-red-600 hover:underline ml-auto"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary & Checkout CTA */}
          {itemList.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-3 bg-gray-50">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Zwischensumme</span>
                <span>{formatPriceEur(subtotalCents)}</span>
              </div>
              {vat7Cents > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Darin enthaltene MwSt. (7%)</span>
                  <span>{formatPriceEur(vat7Cents)}</span>
                </div>
              )}
              {vat19Cents > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Darin enthaltene MwSt. (19%)</span>
                  <span>{formatPriceEur(vat19Cents)}</span>
                </div>
              )}
              {vat7Cents === 0 && vat19Cents === 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Darin enthaltene MwSt.</span>
                  <span>{formatPriceEur(vatCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-600">
                <span>Versandkosten</span>
                <span>{shippingCents === 0 ? 'Kostenlos' : formatPriceEur(shippingCents)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Gesamtsumme</span>
                <span>{formatPriceEur(totalCents)}</span>
              </div>

              {subtotalCents < 1000 && (
                <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200/80 flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold block">Mindestbestellmenge 10,00 €</span>
                    <span className="text-[11px] text-amber-800">
                      Unsere Mindestbestellmenge im Webshop beträgt 10,00 € Warenwert (zzgl. Versandkosten).
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                {subtotalCents < 1000 ? (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center rounded-md bg-gray-300 px-4 py-3 text-xs sm:text-sm font-bold text-gray-600 shadow-sm cursor-not-allowed"
                  >
                    Mindestbestellmenge 10,00 €
                  </button>
                ) : (
                  <a
                    href="/checkout"
                    onClick={closeCart}
                    className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                  >
                    Zur Kasse
                  </a>
                )}
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                Mindestbestellmenge 10,00 € Warenwert &bull; Kauf auf Rechnung
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
