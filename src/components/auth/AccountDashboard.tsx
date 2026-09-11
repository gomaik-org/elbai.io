import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { clearSession, currentCustomer, sessionToken, updateStoredCustomer } from '../../stores/auth';
import type { CustomerProfile } from '../../stores/auth';
import LoginForm from './LoginForm';

export default function AccountDashboard() {
  const token = useStore(sessionToken);
  const localCustomer = useStore(currentCustomer);
  const [profile, setProfile] = useState<CustomerProfile | null>(localCustomer);
  const [loading, setLoading] = useState(Boolean(token));

  // Edit Address state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Array<{
    order: {
      id: string;
      order_nr: string;
      status: string;
      subtotal_cents: number;
      shipping_cents: number;
      tax_cents: number;
      total_cents: number;
      currency: string;
      payment_method: string;
      created_at: string;
    };
    items: Array<{
      id: string;
      sku: string;
      title: string;
      price_cents: number;
      quantity: number;
      subtotal_cents: number;
    }>;
  }>>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editStreetNr, setEditStreetNr] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountryId, setEditCountryId] = useState('DE');

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  // Sync edit form fields when profile is loaded or changed
  const populateEditFields = (p: CustomerProfile) => {
    setEditEmail(p.email || '');
    setEditCompany(p.company || '');
    setEditFirstName(p.first_name || '');
    setEditLastName(p.last_name || '');
    setEditStreet(p.street || '');
    setEditStreetNr(p.street_nr || '');
    setEditZip(p.zip || '');
    setEditCity(p.city || '');
    setEditCountryId(p.country_id || 'DE');
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setOrdersLoading(true);

    // Fetch customer profile
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.customer) {
            setProfile(data.customer);
            populateEditFields(data.customer);
            updateStoredCustomer(data.customer);
          }
        } else {
          try {
            const data = (await res.json()) as any;
            if (data.code === 'SESSION_EXPIRED' || data.code === 'UNAUTHORIZED') {
              clearSession();
              setProfile(null);
            }
          } catch {
            // Ignore non-JSON errors
          }
        }
      })
      .catch(() => {
        // Fall back to localCustomer
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch customer orders directly from D1
    fetch('/api/customer/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as any;
          if (Array.isArray(data.data)) {
            setOrders(data.data);
          }
        }
      })
      .catch(() => {
        // Ignore order fetch errors in static preview
      })
      .finally(() => {
        setOrdersLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center max-w-lg mx-auto shadow-xs">
        <div className="inline-block w-8 h-8 border-4 border-[#3395d1] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Kundenkonto wird geladen...</p>
      </div>
    );
  }

  if (!token || !profile) {
    return <LoginForm />;
  }

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  const handleStartEdit = () => {
    populateEditFields(profile);
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditingAddress(true);
  };

  const handleCancelEdit = () => {
    populateEditFields(profile);
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditingAddress(false);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const cleanEmail = editEmail.trim().toLowerCase();
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        throw new Error('Bitte eine gültige Emailadresse eingeben');
      }

      if (!editFirstName.trim() || !editLastName.trim()) {
        throw new Error('Bitte geben Sie Ihren Vor- und Nachnamen an.');
      }

      if (!editStreet.trim() || !editStreetNr.trim() || !editZip.trim() || !editCity.trim()) {
        throw new Error('Bitte füllen Sie alle erforderlichen Adressfelder aus (Straße, Hausnummer, PLZ, Ort).');
      }

      if (!/^\d{5}$/.test(editZip.trim())) {
        throw new Error('Bitte geben Sie eine gültige 5-stellige deutsche Postleitzahl (nur Ziffern) ein.');
      }

      const payload = {
        email: cleanEmail,
        company: editCompany.trim(),
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        street: editStreet.trim(),
        street_nr: editStreetNr.trim(),
        zip: editZip.trim(),
        city: editCity.trim(),
        country_id: editCountryId.trim() || 'DE',
      };

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Profil konnte nicht aktualisiert werden.');
      }

      if (data.customer) {
        setProfile(data.customer);
        updateStoredCustomer(data.customer);
        populateEditFields(data.customer);
      }
      setSaveSuccess('Profildaten und Adresse erfolgreich gespeichert.');
      setIsEditingAddress(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-3xl mx-auto overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gray-50 border-b border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            Aktives Kundenkonto
          </span>
          <h1 className="text-2xl font-black text-gray-900">
            {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.email}
          </h1>
          {profile.company && (
            <p className="text-sm font-semibold text-blue-700 mt-0.5">{profile.company}</p>
          )}
        </div>
        <div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {saveSuccess}
        </div>
      )}

      {saveError && (
        <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {saveError}
        </div>
      )}

      {/* Profile Details Grid */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Kontoinformationen</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-xs text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Kundennummer / ID:</span>
              <span className="font-mono text-gray-900 font-semibold">{profile.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">E-Mail:</span>
              <span className="text-gray-900 font-semibold">{profile.email}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Hinterlegte Daten &amp; Adresse</h2>
            {!isEditingAddress && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3395d1] hover:text-blue-700 hover:underline transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Daten &amp; E-Mail ändern
              </button>
            )}
          </div>

          {isEditingAddress ? (
            <form onSubmit={handleSaveAddress} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">E-Mail-Adresse *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="name@schule.de"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Schule / Institution / Firma</label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="z. B. Grundschule Schillerstraße"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vorname *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nachname *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Straße *</label>
                  <input
                    type="text"
                    required
                    value={editStreet}
                    onChange={(e) => setEditStreet(e.target.value)}
                    placeholder="Schillerstraße"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hausnr. *</label>
                  <input
                    type="text"
                    required
                    value={editStreetNr}
                    onChange={(e) => setEditStreetNr(e.target.value)}
                    placeholder="59/1 oder 12a"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">PLZ *</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    value={editZip}
                    onChange={(e) => setEditZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="74214"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ort *</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Schöntal"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3395d1]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#3395d1] hover:bg-blue-600 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {saveLoading ? 'Speichern...' : 'Adresse speichern'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-xs text-gray-700">
              {profile.company && <p className="font-bold text-gray-900">{profile.company}</p>}
              {(profile.first_name || profile.last_name) && (
                <p className="font-medium">{profile.first_name} {profile.last_name}</p>
              )}
              {profile.street ? (
                <p>{profile.street} {profile.street_nr || ''}</p>
              ) : (
                <p className="text-gray-400 italic">Keine Straße hinterlegt</p>
              )}
              {profile.zip || profile.city ? (
                <p>{profile.zip} {profile.city}</p>
              ) : (
                <p className="text-gray-400 italic">Keine PLZ/Ort hinterlegt</p>
              )}
              <p className="text-gray-500 pt-1">{profile.country_id || 'DE'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Orders & Invoices History */}
      <div className="border-t border-gray-200 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Meine Bestellungen &amp; Rechnungen</h2>
            <p className="text-xs text-gray-500 mt-0.5">Übersicht aller getätigten Bestellungen und Rechnungsstatus direkt aus der Datenbank.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
            {orders.length} {orders.length === 1 ? 'Bestellung' : 'Bestellungen'}
          </span>
        </div>

        {ordersLoading ? (
          <div className="py-8 text-center text-xs text-gray-500">
            <div className="inline-block w-5 h-5 border-2 border-[#3395d1] border-t-transparent rounded-full animate-spin mb-2" />
            <p>Bestellhistorie wird geladen...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-700">Noch keine Bestellungen aufgegeben.</p>
            <p className="text-[11px] text-gray-500 mt-1">Sobald Sie im Shop oder auf Rechnung bestellen, erscheinen Ihre Rechnungen und Artikel hier.</p>
            <a
              href="/catalog"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#3395d1] hover:underline"
            >
              Jetzt Lehrmittel entdecken &rarr;
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(({ order, items }) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:border-blue-300 transition-colors"
              >
                {/* Order Header */}
                <div className="bg-gray-50/75 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-900">{order.order_nr}</span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'processing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.status === 'paid'
                        ? 'Bezahlt'
                        : order.status === 'shipped'
                        ? 'Versendet'
                        : order.status === 'processing'
                        ? 'In Bearbeitung'
                        : 'Eingegangen (Offen)'}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      {order.payment_method === 'invoice' ? 'Kauf auf Rechnung' : order.payment_method}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                          {item.sku}
                        </span>
                        <span className="text-gray-900 font-medium">{item.title}</span>
                        <span className="text-gray-400 text-[11px]">(&times; {item.quantity})</span>
                      </div>
                      <span className="font-bold text-gray-800">
                        {(item.subtotal_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Summary Footer */}
                <div className="bg-gray-50/40 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px]">
                    inkl. MwSt. ({(order.tax_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}) + Versand ({(order.shipping_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })})
                  </span>
                  <span className="font-extrabold text-sm text-gray-900">
                    Gesamt: {(order.total_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50/50 border-t border-gray-100 p-6 sm:p-8">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/catalog"
            className="p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-sm text-center text-xs font-bold text-gray-800 transition-all"
          >
            📚 Lehrmittel &amp; Katalog
          </a>
          <a
            href="/widerruf"
            className="p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-sm text-center text-xs font-bold text-gray-800 transition-all"
          >
            📋 Widerruf (§ 356a BGB)
          </a>
          <a
            href="/konto/passwort-vergessen"
            className="p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-sm text-center text-xs font-bold text-gray-800 transition-all"
          >
            🔑 Passwort ändern
          </a>
        </div>
      </div>
    </div>
  );
}
