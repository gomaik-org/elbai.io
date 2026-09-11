import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { setSession } from '../../stores/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMigratedAccount, setIsMigratedAccount] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  const isEmailValid = email.trim().length === 0 || emailRegex.test(email.trim());
  const showEmailError = emailTouched && (!email.trim() || !emailRegex.test(email.trim()));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) {
        setErrorMsg(urlError);
      }
    }
  }, []);

  const handleOAuthLogin = (provider: 'google' | 'apple') => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setIsMigratedAccount(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          turnstile_token: '1x00000000000000000000AA',
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok || !data.success) {
        if (data.code === 'MIGRATED_ACCOUNT_NEEDS_RESET') {
          setIsMigratedAccount(true);
        } else {
          setErrorMsg(data.error || 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre Eingaben.');
        }
        setSubmitting(false);
        return;
      }

      if (data.session) {
        setSession(data.session.session_token, data.session.customer);
        window.location.href = '/konto';
      }
    } catch {
      setErrorMsg('Verbindungsfehler zum Server. Bitte versuchen Sie es in Kürze erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Kunden-Login</h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Melden Sie sich mit Ihren Zugangsdaten an.
        </p>
      </div>

      {isMigratedAccount && (
        <div className="mb-6 p-5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2">
          <div className="font-bold flex items-center gap-2 text-sm text-amber-900">
            <span>🛡️</span>
            <span>Konto-Sicherheitsaktualisierung</span>
          </div>
          <p className="leading-relaxed">
            Ihr Kundenkonto wurde sicher aus dem bisherigen ELBI-Shop übernommen.
            Zum Schutz Ihrer Daten vergeben Sie bitte einmalig ein neues sicheres Passwort.
          </p>
          <div className="pt-2">
            <a
              href={`/konto/passwort-vergessen?email=${encodeURIComponent(email)}`}
              className="inline-flex items-center gap-1.5 font-bold text-amber-900 underline hover:text-[#ff9e00]"
            >
              Jetzt neues Passwort anfordern &rarr;
            </a>
          </div>
        </div>
      )}

      {errorMsg && !isMigratedAccount && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-2xl border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="loginEmail" className="block text-sm font-bold text-slate-800">
              E-Mail-Adresse
            </label>
            {showEmailError && (
              <span className="text-xs font-bold text-red-600 animate-in fade-in">
                Bitte eine gültige Emailadresse eingeben
              </span>
            )}
          </div>
          <input
            id="loginEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="name@schule-beispiel.de"
            className={`w-full rounded-2xl border px-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-hidden ${
              showEmailError
                ? 'border-red-500 bg-red-50/40 text-red-900 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 bg-slate-50/50 hover:bg-white focus:bg-white'
            }`}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="loginPassword" className="block text-sm font-bold text-slate-800">
              Passwort
            </label>
            <a
              href={email ? `/konto/passwort-vergessen?email=${encodeURIComponent(email)}` : '/konto/passwort-vergessen'}
              className="text-xs font-bold text-[#3395d1] hover:text-[#ff9e00] hover:underline transition-colors"
            >
              Passwort vergessen?
            </a>
          </div>
          <input
            id="loginPassword"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-3 inline-flex items-center justify-center rounded-2xl bg-[#3395d1] hover:bg-[#287bb0] px-5 py-4 text-base font-extrabold text-white disabled:opacity-50 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
        >
          {submitting ? 'Anmeldung läuft...' : 'Anmelden'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-4">
        <div>
          <p className="text-sm text-slate-600 font-medium">
            Noch kein Kundenkonto?
          </p>
          <a
            href="/konto/registrieren"
            className="mt-2 inline-flex items-center justify-center w-full rounded-2xl border-2 border-[#3395d1] bg-white px-4 py-3 text-base font-extrabold text-[#3395d1] hover:bg-blue-50 transition-colors cursor-pointer"
          >
            Jetzt neues Konto erstellen &rarr;
          </a>
        </div>

        <div className="pt-2">
          <p className="text-xs text-slate-500">
            Bestehendes Kundenkonto aus dem bisherigen Shop?
          </p>
          <a
            href="/konto/passwort-vergessen"
            className="mt-1 inline-block text-xs font-bold text-slate-700 hover:text-[#ff9e00] underline"
          >
            Einmaliges Passwort für migriertes Konto anfordern &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
