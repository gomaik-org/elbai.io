import { useState, useRef, useEffect } from 'react';
import rawProducts from '../../data/products.json';
import { searchProducts } from '../../utils/search';
import { formatPriceEur } from '../../stores/cart';
import type { Product } from '../../types/shop';

const products = rawProducts as unknown as Product[];

interface InstantSearchProps {
  placeholder?: string;
  isMobileDrawer?: boolean;
}

export default function InstantSearch({
  placeholder = 'Artikel, Stempel, Lineatur suchen... (z.B. "Prima", "ST-01")',
  isMobileDrawer = false,
}: InstantSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recompute search results when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const matches = searchProducts(query, products, 8);
    setResults(matches);
    setIsOpen(true);
    setSelectedIndex(-1);
  }, [query]);

  // Global keyboard shortcut: '/' or 'Cmd+K' / 'Ctrl+K' focuses search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        window.location.href = `/products/${results[selectedIndex].slug}`;
      } else if (results.length > 0) {
        // Natural UX: pressing Enter directly opens the first best match
        window.location.href = `/products/${results[0].slug}`;
      } else if (query.trim()) {
        // If no instant match, go to catalog with search query
        window.location.href = `/catalog?q=${encodeURIComponent(query.trim())}`;
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${isMobileDrawer ? 'w-full' : 'w-full max-w-xs lg:max-w-sm'}`}>
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-4 w-4 text-[#3395d1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="instant-search-dropdown"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full rounded-full border border-slate-200 bg-slate-100/80 py-2 pl-9 pr-12 text-xs sm:text-sm font-normal text-slate-800 placeholder-slate-400 transition-all hover:bg-slate-100 hover:border-slate-300 focus:border-[#3395d1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3395d1]/20"
        />

        {/* Keyboard shortcut badge (desktop only) */}
        {!isMobileDrawer && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <kbd className="hidden sm:inline-flex items-center rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-600 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        )}

        {/* Clear query button when query exists */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-8 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="Suche zurücksetzen"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Live Dropdown Results */}
      {isOpen && (
        <div
          id="instant-search-dropdown"
          role="listbox"
          className="absolute left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur-md transition-all"
        >
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              Keine Artikel für &bdquo;<span className="font-semibold text-gray-700">{query}</span>&ldquo; gefunden.
            </div>
          ) : (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {results.length} Suchtreffer
              </div>
              <ul className="space-y-1">
                {results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <li
                      key={item.id}
                      id={`search-item-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <a
                        href={`/products/${item.slug}`}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white p-0.5">
                          <img
                            src={item.image_url || '/images/placeholder.svg'}
                            alt={item.title}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                            }}
                          />
                        </div>

                        {/* Title & SKU */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-900">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
                              Art. {item.sku}
                            </span>
                            {(item.stock_quantity ?? item.stock ?? 0) > 0 ? (
                              <span className="text-[10px] font-medium text-green-700">Lieferbar</span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-600">Auf Anfrage</span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-gray-900 block">
                            {formatPriceEur(item.price_cents)}
                          </span>
                          <span className="text-[9px] text-gray-400 block">
                            inkl. {(item as any).vat_percent ?? (item as any).vat_rate ?? 19}% MwSt.
                          </span>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-2 border-t border-gray-100 pt-2 px-3 flex items-center justify-between text-[10px] text-gray-400">
                <span>&uarr;&darr; navigieren, &crarr; auswählen</span>
                <a href="/catalog" className="text-blue-600 hover:underline font-medium">
                  Gesamtkatalog &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
