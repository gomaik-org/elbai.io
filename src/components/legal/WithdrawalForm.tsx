import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { WithdrawalReceipt } from '../../types/shop';

interface FormData {
  order_nr: string;
  customer_name: string;
  customer_email: string;
  order_date: string;
  received_date: string;
  items_description: string;
  customer_comment: string;
}

const initialData: FormData = {
  order_nr: '',
  customer_name: '',
  customer_email: '',
  order_date: '',
  received_date: '',
  items_description: '',
  customer_comment: '',
};

export default function WithdrawalForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<WithdrawalReceipt | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateStep1 = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!data.order_nr.trim()) {
      errs.order_nr = 'Bitte geben Sie Ihre Bestellnummer ein.';
    }
    if (!data.customer_name.trim()) {
      errs.customer_name = 'Bitte geben Sie Ihren vollständigen Namen ein.';
    }
    if (!data.customer_email.trim() || !data.customer_email.includes('@')) {
      errs.customer_email = 'Bitte eine gültige Emailadresse eingeben';
    }
    if (!data.items_description.trim()) {
      errs.items_description = 'Bitte benennen Sie die betroffenen Waren oder Leistungen.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const resData = (await res.json()) as any;
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Fehler beim Übermitteln des Widerrufs');
      }

      setReceipt(resData.data);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Progress Indicators */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">1</span>
          <span className="text-sm">Angaben erfassen</span>
        </div>
        <div className="h-0.5 w-12 bg-gray-200" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">2</span>
          <span className="text-sm">Bestätigen</span>
        </div>
        <div className="h-0.5 w-12 bg-gray-200" />
        <div className={`flex items-center gap-2 ${step === 3 ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">✓</span>
          <span className="text-sm">Eingangsbeleg</span>
        </div>
      </div>

      {/* Step 1: Form Inputs */}
      {step === 1 && (
        <form onSubmit={handleNext} noValidate className="space-y-4">
          <p className="text-xs text-gray-500 mb-4">
            Gemäß § 356a BGB können Sie diesen Vertrag ohne Angabe von Gründen elektronisch widerrufen. Pflichtfelder sind mit einem Stern (*) gekennzeichnet.
          </p>

          <div>
            <label htmlFor="order_nr" className="block text-xs font-semibold text-gray-700">
              Bestellnummer *
            </label>
            <input
              id="order_nr"
              type="text"
              required
              placeholder="z.B. ELBI-2026-12345"
              value={data.order_nr}
              onChange={(e) => setData({ ...data, order_nr: e.target.value })}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm ${
                errors.order_nr ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {errors.order_nr && <p className="mt-1 text-xs text-red-600">{errors.order_nr}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer_name" className="block text-xs font-semibold text-gray-700">
                Vor- und Nachname *
              </label>
              <input
                id="customer_name"
                type="text"
                required
                placeholder="Erika Mustermann"
                value={data.customer_name}
                onChange={(e) => setData({ ...data, customer_name: e.target.value })}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm ${
                  errors.customer_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>}
            </div>

            <div>
              <label htmlFor="customer_email" className="block text-xs font-semibold text-gray-700">
                E-Mail-Adresse *
              </label>
              <input
                id="customer_email"
                type="email"
                required
                placeholder="name@beispiel.de"
                value={data.customer_email}
                onChange={(e) => setData({ ...data, customer_email: e.target.value })}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm ${
                  errors.customer_email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customer_email && <p className="mt-1 text-xs text-red-600">{errors.customer_email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order_date" className="block text-xs font-semibold text-gray-700">
                Bestelldatum (optional)
              </label>
              <input
                id="order_date"
                type="date"
                value={data.order_date}
                onChange={(e) => setData({ ...data, order_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="received_date" className="block text-xs font-semibold text-gray-700">
                Erhalten am (optional)
              </label>
              <input
                id="received_date"
                type="date"
                value={data.received_date}
                onChange={(e) => setData({ ...data, received_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="items_description" className="block text-xs font-semibold text-gray-700">
              Widerrufene Artikel / Waren *
            </label>
            <textarea
              id="items_description"
              required
              rows={3}
              placeholder="z.B. 2x Lehrerkalender 2026/2027 (Art. 0101-001)"
              value={data.items_description}
              onChange={(e) => setData({ ...data, items_description: e.target.value })}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm ${
                errors.items_description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.items_description && <p className="mt-1 text-xs text-red-600">{errors.items_description}</p>}
          </div>

          <div>
            <label htmlFor="customer_comment" className="block text-xs font-semibold text-gray-700">
              Freiwillige Anmerkung
            </label>
            <textarea
              id="customer_comment"
              rows={2}
              placeholder="Grund des Widerrufs oder weitere Hinweise (optional)"
              value={data.customer_comment}
              onChange={(e) => setData({ ...data, customer_comment: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-4">
            <button
              type="button"
              data-testid="withdrawal-next-btn"
              onClick={handleNext}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              Weiter zur Bestätigung
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Confirmation / Verification Step */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-md">
            <h3 className="text-sm font-bold text-amber-900">Bitte überprüfen Sie Ihre Angaben</h3>
            <p className="mt-1 text-xs text-amber-700">
              Mit Klick auf &bdquo;Widerruf bestätigen&ldquo; erklären Sie rechtswirksam Ihren Widerruf. Wir bestätigen Ihnen den Eingang unverzüglich per E-Mail.
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <dt className="font-semibold text-gray-500">Bestellnummer</dt>
              <dd className="font-bold text-gray-900 mt-0.5">{data.order_nr}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-500">Name</dt>
              <dd className="font-bold text-gray-900 mt-0.5">{data.customer_name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-500">E-Mail</dt>
              <dd className="font-bold text-gray-900 mt-0.5">{data.customer_email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-500">Bestelldatum</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{data.order_date || '–'}</dd>
            </div>
            {data.received_date && (
              <div>
                <dt className="font-semibold text-gray-500">Ware erhalten am</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{data.received_date}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="font-semibold text-gray-500">Widerrufene Artikel</dt>
              <dd className="font-medium text-gray-900 mt-0.5 whitespace-pre-wrap">{data.items_description}</dd>
            </div>
            {data.customer_comment && (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-gray-500">Freiwillige Anmerkung</dt>
                <dd className="font-normal text-gray-600 mt-0.5 italic">{data.customer_comment}</dd>
              </div>
            )}
          </dl>

          {submitError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
              {submitError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              type="button"
              data-testid="withdrawal-confirm-btn"
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Wird übermittelt...' : 'Widerruf bestätigen'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={submitting}
              className="w-full sm:w-auto text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              Angaben korrigieren
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Legally Binding Receipt (§ 356a BGB) */}
      {step === 3 && receipt && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="mt-3 text-base font-bold text-green-900">
              Widerruf erfolgreich eingegangen
            </h3>
            <p className="mt-1 text-xs text-green-800">
              Ihr Widerruf wurde mit sofortigem Zeitstempel rechtssicher in unserem System registriert. Eine Bestätigung wurde an <strong>{receipt.customer_email}</strong> gesendet.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Widerrufs-Referenznummer:</span>
              <span className="font-mono font-bold text-gray-900">{receipt.withdrawal_nr}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Bestellnummer:</span>
              <span className="font-bold text-gray-900">{receipt.order_nr}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Eingangszeitpunkt:</span>
              <span className="font-medium text-gray-900">{new Date(receipt.created_at).toLocaleString('de-DE')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Verbraucher:</span>
              <span className="font-medium text-gray-900">{receipt.customer_name}</span>
            </div>
            <div className="py-1">
              <span className="text-gray-500 block">Widerrufene Artikel:</span>
              <span className="font-medium text-gray-900 mt-1 block whitespace-pre-wrap">{receipt.items_description}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Eingangsbeleg drucken / als PDF
            </button>
            <a
              href="/"
              className="text-xs font-semibold text-blue-600 hover:text-blue-500"
            >
              Zurück zur Startseite
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
