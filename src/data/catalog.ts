import type { Category, Product } from '../types/shop';
import rawCategories from './categories.json';
import rawProducts from './products.json';
import rawCategoryOrders from './categoryOrders.json';

const categoryOrders: Record<string, string[]> = rawCategoryOrders;

/**
 * Authoritative sorting orders from https://secure.elbi.de
 * - Best-selling / pedagogical progression for Schreibhefte (Schwung -> Klasse 1 -> Lehrgänge -> Schönschrift)
 * - Top-selling Stempelsets & Motivstempel first
 */
export const SCHREIBHEFTE_CANONICAL_ORDER: string[] = [
  'H4',   // Schwungübungen mit Elbi
  'H44',  // Elbi Schwungheft Klasse 1
  'H31',  // Mein erstes Elbi Schreibheft Klasse 1
  'H10',  // Elbi-Zahlenübungsheft von 1 bis 10
  'H12',  // Elbi Schreiblehrgang Druckschrift
  'H2',   // Elbi Schreiblehrgang Lateinische Ausgangsschrift
  'H5',   // Elbi Schreiblehrgang Vereinfachte Ausgangsschrift
  'H3',   // Mit Elbi Schreiben lernen Klasse 1
  'H25',  // Elbi Schönschreibheft und Geschichten Klasse 1/2
  'H26',  // Elbi Schönschreibheft und Geschichten Klasse 2
  'H27',  // Elbi Schönschreibheft und Geschichten Klasse 3
  'H28',  // Elbi Schönschreibheft und Geschichten Klasse 4
];

export const STEMPEL_CANONICAL_ORDER: string[] = [
  'S88',   // Stempelset 4 x Smileys (Bestseller #1)
  'S90',   // Smiley Gesamtset 6 Smileys und 1 Erfolgsstempel
  'K10',   // Leistungssteigerung Sonne/Wolke 6 Stempel
  'K1',    // 4 x Titelstempel
  'K5',    // 4 x Hausaufgabenstempel
  'K11',   // 4 Spezialstempel
  'K16',   // 4 Textstempel Elternkontakt
  'K7',    // 4 x Englischstempel
  'K62/1', // Daumenstempel
  'K11/6', // Stempel Sonne, strahlend
  'K1/6',  // Stempel Rechenkönig
  'K17/1', // Stempel Stern strahlend
  'K17/3', // Stempel Stift lachend
  'K12/1', // Lehrer Motivstempel superstark
  'K12/2', // Schildkröte: schneller arbeiten
  'K15/1', // Stempel kleine Fortschritte
  'K15/3', // Stempel gute Mitarbeit
  'K16/1', // Unterschrift der Eltern!
  'K16/4', // Nachgesehen ohne auf Rechtschreibfehler zu achten
  'K246',  // Stempel Rechenkönigin
  'K3/1',  // Stempel sehr schön
  'K42/2', // Stempel unleserlich
  'K51/2', // Stempel toll angestrengt
  'K52/5', // leider nicht fertig geworden
  'K53/1', // Lehrer Motivstempel ganz toll
  'K6/11', // Arbeitsmaterial unvollständig
  'K6/8',  // Heftführung unordentlich
  'K7/2',  // Stempel toll angestrengt
  'K7/3',  // Stempel sehr fleißig
  'K9/2',  // Hausaufgabe nicht gemacht
  'K9/3',  // Hausaufgabe unvollständig
  'K40/2', // Stempel Good job
  'K40/5', // Have you learned your vokabulary?
  'S89/3', // Erfolgsstempel 6 Smileys
  'S88/5', // Erfolgsstempel
];

function getProductSortRank(product: Product): number {
  if (typeof product.sort_order === 'number' && product.sort_order < 1000) {
    return product.sort_order;
  }

  const heftIndex = SCHREIBHEFTE_CANONICAL_ORDER.indexOf(product.sku);
  if (heftIndex !== -1) return heftIndex;

  const stempelIndex = STEMPEL_CANONICAL_ORDER.indexOf(product.sku);
  if (stempelIndex !== -1) return 100 + stempelIndex;

  if (typeof product.sort_order === 'number') return product.sort_order;
  return 2000;
}

export function sortProductsCanonical(items: Product[]): Product[] {
  return [...items].sort((a, b) => {
    const rankA = getProductSortRank(a);
    const rankB = getProductSortRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return a.title.localeCompare(b.title, 'de');
  });
}

export const categories: Category[] = rawCategories as unknown as Category[];
export const products: Product[] = sortProductsCanonical(rawProducts as unknown as Product[]);

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  const filtered = products.filter(
    (p) => p.category_slug === categorySlug || p.category_slugs?.includes(categorySlug),
  );

  const specificOrder = categoryOrders[categorySlug];
  if (specificOrder) {
    return [...filtered].sort((a, b) => {
      const idxA = specificOrder.indexOf(a.sku);
      const idxB = specificOrder.indexOf(b.sku);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.title.localeCompare(b.title, 'de');
    });
  }

  return sortProductsCanonical(filtered);
}

