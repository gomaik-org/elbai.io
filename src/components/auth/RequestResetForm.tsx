import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';

export default function RequestResetForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  const showEmailError = emailTouched && (!email.trim() || !emailRegex.test(email.trim()));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          turnstile_token: '1x00000000000000000000AA',
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Anfrage konnte nicht verarbeitet werden.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMsg('Verbindungsfehler zum Server. Bitte versuchen Sie es später erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto text-center">
        <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-900">Aktivierungslink versendet</h2>
        <p className="mt-3 text-xs text-gray-600 leading-relaxed">
          Falls ein Kundenkonto mit der Adresse <strong className="text-gray-900">{email}</strong> registriert ist,
          haben wir Ihnen eine E-Mail mit einem sicheren Link zum Festlegen Ihres Passworts geschickt.
        </p>

        <div className="mt-6 p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-900 text-left space-y-1.5">
          <p className="font-bold">Hinweise:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Der Sicherheits-Link ist <strong>1 Stunde lang gültig</strong>.</li>
            <li>Prüfen Sie bitte auch Ihren <strong>Spam- bzw. Werbe-Ordner</strong>.</li>
            <li>Öffnen Sie den Link auf Ihrem Rechner oder Smartphone.</li>
          </ul>
        </div>

        <div className="mt-8">
          <a
            href="/konto/login"
            className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-5 py-2.5 text-xs font-bold text-gray-800 hover:bg-gray-200 transition-colors"
          >
            Zurück zur Anmeldung
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Passwort zurücksetzen</h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Für bestehende Kunden aus dem bisherigen Shop oder bei vergessenem Passwort.
        </p>
      </div>

      <div className="mb-6 p-5 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-950 space-y-2">
        <div className="font-bold flex items-center gap-1.5 text-sm text-[#1f6f9f]">
          <span>ℹ️</span>
          <span>Hinweis für Schulen &amp; Lehrkräfte:</span>
        </div>
        <p className="text-xs text-blue-900/90 leading-relaxed font-medium">
          Wenn Sie bereits Kunde im früheren ELBI-Shop waren, geben Sie einfach Ihre damals hinterlegte E-Mail-Adresse ein.
          Sie erhalten unmittelbar Ihren persönlichen Aktivierungslink.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-2xl border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="resetEmail" className="block text-sm font-bold text-slate-800">
              Ihre registrierte E-Mail-Adresse *
            </label>
            {showEmailError && (
              <span className="text-xs font-bold text-red-600 animate-in fade-in">
                Bitte eine gültige Emailadresse eingeben
              </span>
            )}
          </div>
          <input
            id="resetEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="schulleitung@schule-beispiel.de"
            className={`w-full rounded-2xl border px-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-hidden ${
              showEmailError
                ? 'border-red-500 bg-red-50/40 text-red-900 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 bg-slate-50/50 hover:bg-white focus:bg-white'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-3 inline-flex items-center justify-center rounded-2xl bg-[#3395d1] hover:bg-[#287bb0] px-5 py-4 text-base font-extrabold text-white disabled:opacity-50 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
        >
          {submitting ? 'Link wird angefordert...' : 'Sicheren Aktivierungslink anfordern'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <a href="/konto/login" className="text-sm font-bold text-[#3395d1] hover:text-[#ff9e00] underline transition-colors">
          &larr; Zurück zur Anmeldung
        </a>
      </div>
    </div>
  );
}
