import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  sku: string;
  title: string;
  slug: string;
  short_desc?: string;
  long_desc?: string;
  price_cents: number;
  currency: string;
  stock: number;
  sort_order?: number;
  is_active: number;
  vat_percent?: number;
  vat_rate?: number;
  main_image_url?: string;
  gallery_images?: string[];
}

interface OrderItem {
  id: string;
  sku: string;
  title: string;
  price_cents: number;
  quantity: number;
  subtotal_cents: number;
}

interface Order {
  id: string;
  order_nr: string;
  customer_email: string;
  status: string;
  total_cents: number;
  shipping_cents: number;
  tax_cents: number;
  subtotal_cents: number;
  payment_method: string;
  shipping_address_json: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inlinePriceMap, setInlinePriceMap] = useState<Record<string, string>>({});
  const [savingPriceSku, setSavingPriceSku] = useState<string | null>(null);
  const [updatingVatSku, setUpdatingVatSku] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [newImageInput, setNewImageInput] = useState('');
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState('');

  // Sorting state for products
  const [sortField, setSortField] = useState<'sku' | 'title' | 'price' | 'stock' | 'status' | 'sort_order'>('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [inlineStockMap, setInlineStockMap] = useState<Record<string, string>>({});
  const [savingStockSku, setSavingStockSku] = useState<string | null>(null);
  const [inlineSortOrderMap, setInlineSortOrderMap] = useState<Record<string, string>>({});
  const [savingSortOrderSku, setSavingSortOrderSku] = useState<string | null>(null);

  // Initialize token from localStorage & prefill dev password only in dev environments
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('elbi_admin_token');
      if (savedToken) {
        setAdminToken(savedToken);
      }
      const host = window.location.hostname;
      const isDev = host === 'localhost' || host === '127.0.0.1' || host === 'dev.elbi.de' || host.endsWith('.pages.dev');
      if (isDev) {
        setAdminPasswordInput('elbi-admin-2026!');
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!adminPasswordInput.trim()) {
      setAuthError('Bitte das Administrator-Passwort eingeben.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPasswordInput.trim(),
          turnstile_token: '1x00000000000000000000AA',
        }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('elbi_admin_token', data.token);
        }
        setAdminPasswordInput('');
      } else {
        setAuthError(data.error || 'Ungültiges Administrator-Passwort.');
      }
    } catch {
      setAuthError('Verbindungsfehler beim Anmelden. Bitte erneut versuchen.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('elbi_admin_token');
    }
    setProducts([]);
    setOrders([]);
  };

  const getAuthHeaders = (): Record<string, string> => {
    return {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    };
  };

  const fetchProducts = async () => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        handleAdminLogout();
        setAuthError('Sitzung abgelaufen oder ungültig. Bitte erneut anmelden.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        setFeedback(data.error || 'Fehler beim Laden der Produkte aus der D1-Datenbank.');
      }
    } catch (e: any) {
      console.error(e);
      setFeedback(e.message || 'Netzwerkfehler beim Laden der Produkte.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (orderStatusFilter !== 'all') params.set('status', orderStatusFilter);
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        handleAdminLogout();
        setAuthError('Sitzung abgelaufen oder ungültig. Bitte erneut anmelden.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of both products and orders when authenticated
  useEffect(() => {
    if (!adminToken) return;
    fetchProducts();
    fetchOrders();
  }, [adminToken]);

  // Refetch when filters or search change
  useEffect(() => {
    if (!adminToken) return;
    if (tab === 'products') {
      fetchProducts();
    }
  }, [adminToken, search, statusFilter]);

  useEffect(() => {
    if (!adminToken) return;
    if (tab === 'orders') {
      fetchOrders();
    }
  }, [adminToken, orderStatusFilter]);

  const toggleProductStatus = async (product: Product) => {
    const nextStatus = product.is_active === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/products/${product.sku}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.sku === product.sku ? { ...p, is_active: nextStatus } : p))
        );
        showFeedback(`Status für '${product.title}' geändert auf: ${nextStatus === 1 ? 'Online' : 'Offline'}`);
      }
    } catch (e) {
      showFeedback('Fehler beim Aktualisieren');
    }
  };

  const updateProductVat = async (product: Product, newRate: number) => {
    if (newRate !== 7 && newRate !== 19) return;
    setUpdatingVatSku(product.sku);
    try {
      const res = await fetch(`/api/admin/products/${product.sku}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ vat_percent: newRate }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.sku === product.sku
              ? { ...p, vat_percent: newRate, vat_rate: newRate }
              : p
          )
        );
        showFeedback(`MwSt.-Satz für '${product.sku}' auf ${newRate}% geändert`);
      } else {
        showFeedback('Fehler beim Ändern des MwSt.-Satzes');
      }
    } catch (e) {
      showFeedback('Netzwerkfehler beim Ändern des MwSt.-Satzes');
    } finally {
      setUpdatingVatSku(null);
    }
  };

  const saveQuickPrice = async (p: Product) => {
    const rawVal = inlinePriceMap[p.sku];
    if (rawVal === undefined) return;
    const normalized = rawVal.replace(',', '.').trim();
    const parsedEur = parseFloat(normalized);
    if (isNaN(parsedEur) || parsedEur < 0) {
      showFeedback('Bitte einen gültigen Preis eingeben');
      return;
    }
    const newCents = Math.round(parsedEur * 100);
    setSavingPriceSku(p.sku);
    try {
      const res = await fetch(`/api/admin/products/${p.sku}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ price_cents: newCents }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((item) => (item.sku === p.sku ? { ...item, price_cents: newCents } : item))
        );
        // Clear dirty price state for this SKU
        setInlinePriceMap((prev) => {
          const next = { ...prev };
          delete next[p.sku];
          return next;
        });
        showFeedback(`Preis für ${p.sku} auf ${(newCents / 100).toFixed(2).replace('.', ',')} € aktualisiert!`);
      } else {
        showFeedback('Fehler beim Speichern des Preises');
      }
    } catch (e) {
      showFeedback('Netzwerkfehler beim Preisspeichern');
    } finally {
      setSavingPriceSku(null);
    }
  };

  const saveQuickStock = async (p: Product) => {
    const rawVal = inlineStockMap[p.sku];
    if (rawVal === undefined) return;
    const parsedStock = parseInt(rawVal.trim(), 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      showFeedback('Bitte einen gültigen Lagerbestand (ganze Zahl >= 0) eingeben');
      return;
    }
    setSavingStockSku(p.sku);
    try {
      const res = await fetch(`/api/admin/products/${p.sku}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stock: parsedStock }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((item) => (item.sku === p.sku ? { ...item, stock: parsedStock } : item))
        );
        setInlineStockMap((prev) => {
          const next = { ...prev };
          delete next[p.sku];
          return next;
        });
        showFeedback(`Lagerbestand für '${p.sku}' auf ${parsedStock} aktualisiert`);
      } else {
        showFeedback('Fehler beim Speichern des Lagerbestands');
      }
    } catch {
      showFeedback('Netzwerkfehler beim Speichern des Lagerbestands');
    } finally {
      setSavingStockSku(null);
    }
  };

  const saveQuickSortOrder = async (p: Product) => {
    const rawVal = inlineSortOrderMap[p.sku];
    if (rawVal === undefined) return;
    const parsedOrder = parseInt(rawVal.trim(), 10);
    if (isNaN(parsedOrder)) {
      showFeedback('Bitte eine gültige Reihenfolge-Nummer (ganze Zahl) eingeben');
      return;
    }
    setSavingSortOrderSku(p.sku);
    try {
      const res = await fetch(`/api/admin/products/${p.sku}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sort_order: parsedOrder }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((item) => (item.sku === p.sku ? { ...item, sort_order: parsedOrder } : item))
        );
        setInlineSortOrderMap((prev) => {
          const next = { ...prev };
          delete next[p.sku];
          return next;
        });
        showFeedback(`Anzeige-Reihenfolge für '${p.sku}' auf ${parsedOrder} geändert`);
      } else {
        showFeedback('Fehler beim Speichern der Reihenfolge');
      }
    } catch {
      showFeedback('Netzwerkfehler beim Speichern der Reihenfolge');
    } finally {
      setSavingSortOrderSku(null);
    }
  };

  const toggleSort = (field: 'sku' | 'title' | 'price' | 'stock' | 'status' | 'sort_order') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let result = 0;
    if (sortField === 'sort_order') {
      result = (a.sort_order ?? 1000) - (b.sort_order ?? 1000);
      if (result === 0) {
        result = a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' });
      }
    } else if (sortField === 'sku') {
      result = a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortField === 'title') {
      result = a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortField === 'price') {
      result = a.price_cents - b.price_cents;
    } else if (sortField === 'stock') {
      result = (a.stock ?? 0) - (b.stock ?? 0);
    } else if (sortField === 'status') {
      result = (b.is_active ?? 0) - (a.is_active ?? 0);
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const saveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${editingProduct.sku}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editingProduct.title,
          short_desc: editingProduct.short_desc,
          long_desc: editingProduct.long_desc,
          price_cents: Math.round(editingProduct.price_cents),
          vat_percent: editingProduct.vat_percent !== undefined ? Number(editingProduct.vat_percent) : 19,
          stock: editingProduct.stock !== undefined ? Number(editingProduct.stock) : 0,
          sort_order: editingProduct.sort_order !== undefined ? Number(editingProduct.sort_order) : 1000,
          main_image_url: editingProduct.main_image_url,
          gallery_images: editingProduct.gallery_images || [],
          is_active: editingProduct.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.sku === editingProduct.sku ? data.data : p))
        );
        setEditingProduct(null);
        setNewImageInput('');
        setEditingImageIdx(null);
        showFeedback('Produkt erfolgreich aktualisiert!');
      }
    } catch (e) {
      showFeedback('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // Image Management Helpers for Editing Product
  const handleSetMainImage = (url: string) => {
    if (!editingProduct) return;
    const currentMain = editingProduct.main_image_url || '';
    const currentGallery = editingProduct.gallery_images || [];

    // Remove the new main from gallery, and push the old main into gallery if not empty
    const newGallery = currentGallery.filter((img) => img !== url);
    if (currentMain && currentMain !== url && !newGallery.includes(currentMain)) {
      newGallery.unshift(currentMain);
    }

    setEditingProduct({
      ...editingProduct,
      main_image_url: url,
      gallery_images: newGallery,
    });
  };

  const handleDeleteImage = (urlToDelete: string, isMain: boolean) => {
    if (!editingProduct) return;
    if (isMain) {
      const currentGallery = editingProduct.gallery_images || [];
      if (currentGallery.length > 0) {
        const nextMain = currentGallery[0];
        const restGallery = currentGallery.slice(1);
        setEditingProduct({
          ...editingProduct,
          main_image_url: nextMain,
          gallery_images: restGallery,
        });
      } else {
        setEditingProduct({
          ...editingProduct,
          main_image_url: '',
        });
      }
    } else {
      const updatedGallery = (editingProduct.gallery_images || []).filter((img) => img !== urlToDelete);
      setEditingProduct({
        ...editingProduct,
        gallery_images: updatedGallery,
      });
    }
  };

  const handleAddNewImage = () => {
    if (!editingProduct || !newImageInput.trim()) return;
    const trimmed = newImageInput.trim();
    if (!editingProduct.main_image_url) {
      // If no main image exists, make this the main image
      setEditingProduct({
        ...editingProduct,
        main_image_url: trimmed,
      });
    } else {
      const currentGallery = editingProduct.gallery_images || [];
      if (!currentGallery.includes(trimmed)) {
        setEditingProduct({
          ...editingProduct,
          gallery_images: [...currentGallery, trimmed],
        });
      }
    }
    setNewImageInput('');
  };

  const handleSaveEditedImage = (oldUrl: string, isMain: boolean) => {
    if (!editingProduct || !editingImageUrl.trim()) return;
    const newUrl = editingImageUrl.trim();
    if (isMain) {
      setEditingProduct({
        ...editingProduct,
        main_image_url: newUrl,
      });
    } else {
      const updatedGallery = (editingProduct.gallery_images || []).map((img) =>
        img === oldUrl ? newUrl : img
      );
      setEditingProduct({
        ...editingProduct,
        gallery_images: updatedGallery,
      });
    }
    setEditingImageIdx(null);
    setEditingImageUrl('');
  };

  const deleteProductConfirmed = async (product: Product) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.sku)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        if (data.deactivated) {
          setProducts((prev) =>
            prev.map((p) => (p.sku === product.sku ? { ...p, is_active: 0 } : p))
          );
          if (editingProduct?.sku === product.sku) {
            setEditingProduct((prev) => (prev ? { ...prev, is_active: 0 } : null));
          }
        } else {
          setProducts((prev) => prev.filter((p) => p.sku !== product.sku));
          if (editingProduct?.sku === product.sku) {
            setEditingProduct(null);
          }
        }
        setDeletingProduct(null);
        showFeedback(data.message || `Artikel ${product.sku} wurde erfolgreich bearbeitet.`);
      } else {
        showFeedback(data.error || 'Fehler beim Löschen des Artikels');
      }
    } catch (e) {
      showFeedback('Netzwerkfehler beim Löschen des Artikels');
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
        showFeedback(`Bestellstatus aktualisiert auf: ${status}`);
      }
    } catch (e) {
      showFeedback('Fehler beim Aktualisieren des Status');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  };

  const parseAddr = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  };

  // Helper to determine the best image source:
  // 1. If explicit URL starting with http or /, use it
  // 2. Otherwise map to /images/products/{sku-folder}/main.jpg or fallback to SVG placeholder
  const getProductImageSrc = (p: Product) => {
    if (p.main_image_url && (p.main_image_url.startsWith('http') || p.main_image_url.startsWith('/'))) {
      return p.main_image_url;
    }
    const cleanSku = p.sku.toLowerCase().replace('/', '-').replace(/[^a-z0-9-]/g, '');
    return `/images/products/${cleanSku}/main.jpg`;
  };

  // If not authenticated, render the secure Admin Login Gate
  if (!adminToken) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-[#0b57d0] rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xs">
              🔒
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ELBI Verlag Admin-Bereich
            </h1>
            <p className="text-sm text-slate-500">
              Geschützter Bereich für Inhaber & Versandabwicklung.
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-medium flex items-center gap-3 animate-in fade-in">
              <span className="text-base">⚠️</span>
              <p>{authError}</p>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Administrator-Passwort
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Passwort eingeben..."
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white transition-all"
              />
              <p className="mt-1 text-xs text-slate-500">
                💡 <span className="font-medium text-slate-700">Test-Modus (Dev):</span> Passwort ist bereits vorausgefüllt (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">elbi-admin-2026!</code>). Einfach auf Anmelden klicken.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-[#0b57d0] hover:bg-[#0842a0] active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Wird autorisiert...</span>
                </>
              ) : (
                'Anmelden & Freischalten'
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            ELBI Verlag © {new Date().getFullYear()} – Geschützt durch Edge HMAC Tokens
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0b57d0] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Geschäftsleitung & Versand
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Angemeldet
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            ELBI Verlag – Shop & Bestell-Verwaltung
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Produkte steuern (Online/Offline, Preise, Kurz- & Langbeschreibungen) und neue Bestellungen für den Versand abwickeln.
          </p>
        </div>

        {/* Tab Controls & Logout */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-center">
            <button
              type="button"
              onClick={() => setTab('products')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === 'products'
                  ? 'bg-white text-[#0b57d0] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📦 Produkte ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === 'orders'
                  ? 'bg-white text-[#0b57d0] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🚚 Bestellungen ({orders.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdminLogout}
            title="Abmelden"
            className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-2xl text-xs font-bold transition-all border border-slate-200 hover:border-red-200 cursor-pointer flex items-center gap-1.5"
          >
            <span>Abmelden</span>
            <span>🚪</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <span>✓ {feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">×</button>
        </div>
      )}

      {/* Tab: Products */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-full sm:w-96 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Suche nach SKU, Titel oder Heft..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
              {search && (
                <button onClick={() => { setSearch(''); fetchProducts(); }} className="text-xs text-slate-400">
                  Löschen
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-semibold text-slate-500">Sortierung:</span>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [f, o] = e.target.value.split('-') as [any, any];
                  setSortField(f);
                  setSortOrder(o);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="sort_order-asc">Reihenfolge (1 zuerst)</option>
                <option value="sort_order-desc">Reihenfolge (höchste zuerst)</option>
                <option value="sku-asc">SKU (A-Z)</option>
                <option value="sku-desc">SKU (Z-A)</option>
                <option value="title-asc">Titel (A-Z)</option>
                <option value="title-desc">Titel (Z-A)</option>
                <option value="price-asc">Preis (aufsteigend)</option>
                <option value="price-desc">Preis (absteigend)</option>
                <option value="stock-asc">Lager (knapp zuerst)</option>
                <option value="stock-desc">Lager (viel zuerst)</option>
                <option value="status-asc">Status (Online zuerst)</option>
              </select>

              <span className="text-xs font-semibold text-slate-500 ml-1">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Alle Produkte</option>
                <option value="active">Nur Online</option>
                <option value="inactive">Nur Offline</option>
              </select>
              <button
                onClick={fetchProducts}
                className="px-3 py-1.5 bg-blue-50 text-[#0b57d0] hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Aktualisieren
              </button>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => toggleSort('sku')}
                      title="Klicken zum Sortieren nach SKU"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Bild & SKU</span>
                        {sortField === 'sku' && (
                          <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => toggleSort('title')}
                      title="Klicken zum Sortieren nach Titel"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Titel & Kurzbeschreibung</span>
                        {sortField === 'title' && (
                          <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => toggleSort('price')}
                      title="Klicken zum Sortieren nach Preis"
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span>Preis</span>
                        {sortField === 'price' && (
                          <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => toggleSort('stock')}
                      title="Klicken zum Sortieren nach Lagerbestand"
                    >
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span>Lager</span>
                        {sortField === 'stock' && (
                          <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">MwSt.</th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => toggleSort('status')}
                      title="Klicken zum Sortieren nach Status"
                    >
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span>Status</span>
                        {sortField === 'status' && (
                          <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => toggleSort('sort_order')}
                      title="Klicken zum Sortieren nach Shop-Reihenfolge"
                    >
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span>Reihenfolge</span>
                        {sortField === 'sort_order' && (
                          <span className="text-blue-600 font-bold">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedProducts.map((p) => {
                    const imgSrc = getProductImageSrc(p);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                              <img
                                src={imgSrc}
                                alt={p.title}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  // Fallback to placeholder if not found
                                  (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                              {p.sku}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-lg">
                          <div className="font-bold text-slate-900">{p.title}</div>
                          {p.short_desc && (
                            <div className="text-xs text-slate-600 line-clamp-1 mt-0.5">{p.short_desc}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <div className="relative w-24">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  inlinePriceMap[p.sku] !== undefined
                                    ? inlinePriceMap[p.sku]
                                    : (p.price_cents / 100).toFixed(2).replace('.', ',')
                                }
                                onChange={(e) =>
                                  setInlinePriceMap({
                                    ...inlinePriceMap,
                                    [p.sku]: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    saveQuickPrice(p);
                                  }
                                }}
                                className={`w-full text-right font-extrabold text-sm py-1.5 px-2 rounded-xl border transition-all ${
                                  inlinePriceMap[p.sku] !== undefined
                                    ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-200'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500'
                                }`}
                              />
                              <span className="absolute right-2 top-1.5 pointer-events-none text-xs font-bold text-slate-400">
                                €
                              </span>
                            </div>

                            {inlinePriceMap[p.sku] !== undefined && (
                              <button
                                type="button"
                                onClick={() => saveQuickPrice(p)}
                                disabled={savingPriceSku === p.sku}
                                className="px-2.5 py-1.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                title="Preis speichern (oder Enter drücken)"
                              >
                                {savingPriceSku === p.sku ? '...' : 'Speichern'}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={
                                inlineStockMap[p.sku] !== undefined
                                  ? inlineStockMap[p.sku]
                                  : (p.stock ?? 0)
                              }
                              onChange={(e) =>
                                setInlineStockMap({
                                  ...inlineStockMap,
                                  [p.sku]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveQuickStock(p);
                                }
                              }}
                              className={`w-18 text-center font-bold text-xs py-1.5 px-2 rounded-xl border transition-all ${
                                inlineStockMap[p.sku] !== undefined
                                  ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-200'
                                  : (p.stock ?? 0) <= 5
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500'
                              }`}
                              title={(p.stock ?? 0) <= 5 ? 'Niedriger Lagerbestand! (<= 5)' : 'Lagerbestand'}
                            />
                            {inlineStockMap[p.sku] !== undefined && (
                              <button
                                type="button"
                                onClick={() => saveQuickStock(p)}
                                disabled={savingStockSku === p.sku}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                                title="Bestand speichern"
                              >
                                {savingStockSku === p.sku ? '...' : '✓'}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <select
                              value={p.vat_percent ?? p.vat_rate ?? 19}
                              onChange={(e) => updateProductVat(p, parseInt(e.target.value, 10))}
                              disabled={updatingVatSku === p.sku}
                              className={`text-xs font-bold py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer ${
                                (p.vat_percent ?? p.vat_rate ?? 19) === 7
                                  ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                                  : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                              } ${updatingVatSku === p.sku ? 'opacity-50 cursor-wait' : ''}`}
                              title="Mehrwertsteuersatz (7% oder 19%)"
                            >
                              <option value={7}>7%</option>
                              <option value={19}>19%</option>
                            </select>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleProductStatus(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                              p.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Klicken zum Umschalten"
                          >
                            <span className={`w-2 h-2 rounded-full ${p.is_active === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {p.is_active === 1 ? 'Online (Aktiv)' : 'Offline (Inaktiv)'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              value={
                                inlineSortOrderMap[p.sku] !== undefined
                                  ? inlineSortOrderMap[p.sku]
                                  : (p.sort_order ?? 1000)
                              }
                              onChange={(e) =>
                                setInlineSortOrderMap({
                                  ...inlineSortOrderMap,
                                  [p.sku]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveQuickSortOrder(p);
                                }
                              }}
                              className={`w-18 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-xl border transition-all ${
                                inlineSortOrderMap[p.sku] !== undefined
                                  ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-200'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500'
                              }`}
                              title="Reihenfolge im Shop (kleinere Zahlen wie 1, 2, 3 werden zuerst angezeigt)"
                            />
                            {inlineSortOrderMap[p.sku] !== undefined && (
                              <button
                                type="button"
                                onClick={() => saveQuickSortOrder(p)}
                                disabled={savingSortOrderSku === p.sku}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                                title="Reihenfolge speichern (Enter)"
                              >
                                {savingSortOrderSku === p.sku ? '...' : '✓'}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Artikel löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Orders & Fulfillment for Sender */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Versand- & Packstation</h2>
              <p className="text-xs text-slate-500">Alle eingegangenen Kundenbestellungen mit Lieferanschrift und Packliste</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status-Filter:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Alle Bestellungen</option>
                <option value="pending">Offen (Pending)</option>
                <option value="processing">In Bearbeitung</option>
                <option value="shipped">Versendet</option>
              </select>
              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 bg-blue-50 text-[#0b57d0] hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Aktualisieren
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders.map((o) => {
              const addr = parseAddr(o.shipping_address_json);
              return (
                <div key={o.id} className="print-packing-slip bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row gap-6 justify-between">
                  {/* Left: Order Info & Address */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                        {o.order_nr}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(o.created_at).toLocaleString('de-DE')}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        o.status === 'shipped' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-sm">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Lieferadresse & Empfänger:
                      </span>
                      <div className="font-bold text-slate-900">
                        {addr.company && <div className="text-blue-900 font-extrabold">{addr.company}</div>}
                        {addr.first_name} {addr.last_name}
                      </div>
                      <div className="text-slate-700">{addr.street} {addr.street_nr}</div>
                      <div className="text-slate-700">{addr.zip} {addr.city} ({addr.country || 'Deutschland'})</div>
                      <div className="text-xs text-slate-500 mt-1">E-Mail: {o.customer_email}</div>
                      {o.notes && (
                        <div className="mt-2 text-xs font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          Hinweis: {o.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Items to Pack & Action */}
                  <div className="w-full md:w-96 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Zu packende Artikel:
                      </span>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 divide-y divide-slate-200 text-sm">
                        {o.items?.map((it) => (
                          <div key={it.id} className="py-2 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-blue-700 mr-2">{it.quantity}x</span>
                              <span className="font-bold text-slate-800">{it.title}</span>
                              <span className="block text-[11px] font-mono text-slate-500">Art.-Nr.: {it.sku}</span>
                            </div>
                            <span className="font-semibold text-slate-700 text-xs shrink-0">
                              {formatPrice(it.subtotal_cents)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 block">Gesamt:</span>
                        <span className="text-lg font-black text-slate-900">{formatPrice(o.total_cents)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          🖨️ Drucken
                        </button>
                        {o.status !== 'shipped' ? (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(o.id, 'shipped')}
                            className="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            ✓ Als versendet markieren
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(o.id, 'processing')}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Zurücksetzen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {editingProduct.sku}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Produkt bearbeiten</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveProductEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produkt-Titel</label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kurzbeschreibung</label>
                <input
                  type="text"
                  value={editingProduct.short_desc || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short_desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ausführliche Beschreibung (Langbeschreibung)</label>
                <textarea
                  rows={6}
                  value={editingProduct.long_desc || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, long_desc: e.target.value })}
                  placeholder="Vollständige Produktbeschreibung für Kunden..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-500 leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Verkaufspreis (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(editingProduct.price_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lagerbestand</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: Math.max(0, parseInt(e.target.value || '0', 10)),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reihenfolge (Rang)</label>
                  <input
                    type="number"
                    value={editingProduct.sort_order ?? 1000}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        sort_order: parseInt(e.target.value || '1000', 10),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-blue-500"
                    title="Kleinere Zahlen (z.B. 1, 2, 3) werden vor größeren Zahlen im Shop angezeigt"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status im Shop</label>
                  <select
                    value={editingProduct.is_active}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        is_active: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-blue-500"
                  >
                    <option value={1}>🟢 Online (Aktiv)</option>
                    <option value={0}>🔴 Offline (Inaktiv)</option>
                  </select>
                </div>
              </div>

              {/* Comprehensive Product Pictures Management (Add, Edit, Reorder/Set Primary, Delete) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    🖼️ Produktbilder verwalten (Hauptbild & Galerie)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {((editingProduct.main_image_url ? 1 : 0) + (editingProduct.gallery_images?.length || 0))} Bild(er)
                  </span>
                </div>

                {/* Image List / Grid */}
                <div className="space-y-3 mb-4">
                  {/* Primary / Main Image Card */}
                  {editingProduct.main_image_url ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/60 border-2 border-blue-200 rounded-2xl">
                      <div className="w-16 h-16 rounded-xl bg-white border border-blue-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                        <img
                          src={
                            editingProduct.main_image_url.startsWith('http') || editingProduct.main_image_url.startsWith('/')
                              ? editingProduct.main_image_url
                              : `/images/products/${editingProduct.sku.toLowerCase().replace('/', '-').replace(/[^a-z0-9-]/g, '')}/main.jpg`
                          }
                          alt="Hauptbild"
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            // Fallback if broken
                            (e.currentTarget as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%2394a3b8"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24">🖼️</text></svg>';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0b57d0] text-white">
                            ⭐ Hauptbild
                          </span>
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            Wird in Übersicht und Teasern angezeigt
                          </span>
                        </div>

                        {editingImageIdx === -1 ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editingImageUrl}
                              onChange={(e) => setEditingImageUrl(e.target.value)}
                              className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-xs font-mono"
                              placeholder="z.B. /images/products/h4/main.jpg"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditedImage(editingProduct.main_image_url || '', true)}
                              className="px-2.5 py-1 bg-[#0b57d0] text-white rounded-lg text-xs font-bold hover:bg-[#0842a0] cursor-pointer"
                            >
                              Speichern
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingImageIdx(null)}
                              className="px-2 py-1 text-slate-500 text-xs font-bold hover:bg-slate-200 rounded-lg cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs font-mono text-slate-600 truncate">
                            {editingProduct.main_image_url}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {editingImageIdx !== -1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingImageIdx(-1);
                              setEditingImageUrl(editingProduct.main_image_url || '');
                            }}
                            title="Bild-Pfad bearbeiten"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-200 transition-colors text-xs font-bold cursor-pointer"
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(editingProduct.main_image_url || '', true)}
                          title="Hauptbild entfernen"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors text-xs font-bold cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-between">
                      <span>⚠️ Kein Hauptbild festgelegt. Bitte ein Bild aus der Galerie wählen oder neu hinzufügen.</span>
                    </div>
                  )}

                  {/* Additional Gallery Images */}
                  {editingProduct.gallery_images && editingProduct.gallery_images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Weitere Galerie-Bilder ({editingProduct.gallery_images.length}):
                      </p>
                      {editingProduct.gallery_images.map((imgUrl, idx) => (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
                            <img
                              src={imgUrl}
                              alt={`Galerie ${idx + 1}`}
                              className="w-full h-full object-contain p-0.5"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%2394a3b8"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20">🖼️</text></svg>';
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            {editingImageIdx === idx ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingImageUrl}
                                  onChange={(e) => setEditingImageUrl(e.target.value)}
                                  className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-xs font-mono"
                                  placeholder="z.B. /images/products/h4/gallery-1.jpg"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedImage(imgUrl, false)}
                                  className="px-2.5 py-1 bg-[#0b57d0] text-white rounded-lg text-xs font-bold hover:bg-[#0842a0] cursor-pointer"
                                >
                                  Speichern
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingImageIdx(null)}
                                  className="px-2 py-1 text-slate-500 text-xs font-bold hover:bg-slate-200 rounded-lg cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Bild #{idx + 1}
                                </span>
                                <p className="text-xs font-mono text-slate-700 truncate">{imgUrl}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(imgUrl)}
                              title="Als Hauptbild festlegen"
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              ⭐ Als Hauptbild
                            </button>
                            {editingImageIdx !== idx && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingImageIdx(idx);
                                  setEditingImageUrl(imgUrl);
                                }}
                                title="Bild-Pfad bearbeiten"
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-200 transition-colors text-xs font-bold cursor-pointer"
                              >
                                ✏️
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(imgUrl, false)}
                              title="Bild löschen"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors text-xs font-bold cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Image Input Field */}
                  <div className="p-3 bg-slate-50/80 border border-dashed border-slate-300 rounded-2xl">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ➕ Neues Bild hinzufügen (URL oder Pfad):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newImageInput}
                        onChange={(e) => setNewImageInput(e.target.value)}
                        placeholder="z.B. /images/products/h4/gallery-3.jpg oder https://..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewImage();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewImage}
                        disabled={!newImageInput.trim()}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        Hinzufügen
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Hinweis: Bilder können interne Pfade (z.B. <code className="font-mono">/images/products/...</code>) oder beliebige HTTPS-Links sein.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingProduct;
                    setEditingProduct(null);
                    setDeletingProduct(toDelete);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  🗑️ Artikel löschen
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0b57d0] hover:bg-[#0842a0] transition-colors shadow-xs cursor-pointer"
                  >
                    {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-extrabold text-slate-900">Artikel wirklich löschen?</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Möchten Sie den Artikel <strong className="text-slate-900">{deletingProduct.sku} – {deletingProduct.title}</strong> wirklich unwiderruflich aus der Datenbank entfernen?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => deleteProductConfirmed(deletingProduct)}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                {saving ? 'Wird gelöscht...' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
