import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { setSession } from '../../stores/auth';

interface CustomerPreview {
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  auth_status: string;
}

export default function SetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerPreview | null>(null);

  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const rawToken = params.get('token');

    if (!rawToken) {
      setValidatingToken(false);
      setTokenError('Kein Aktivierungs-Token angegeben. Bitte nutzen Sie den Link aus Ihrer E-Mail.');
      return;
    }

    setToken(rawToken);

    // Verify token with backend API
    fetch('/api/auth/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken }),
    })
      .then(async (res) => {
        const data = (await res.json()) as any;
        if (!res.ok || !data.success) {
          setTokenValid(false);
          setTokenError(data.error || 'Dieser Link ist ungültig oder bereits abgelaufen.');
        } else {
          setTokenValid(true);
          setCustomer(data.customer);
        }
      })
      .catch(() => {
        setTokenValid(false);
        setTokenError('Der Server konnte nicht erreicht werden. Bitte prüfen Sie Ihre Verbindung.');
      })
      .finally(() => {
        setValidatingToken(false);
      });
  }, []);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setSubmitError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (password !== passwordRepeat) {
      setSubmitError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Passwort konnte nicht aktualisiert werden.');
        setSubmitting(false);
        return;
      }

      if (data.session) {
        setSession(data.session.session_token, data.session.customer);
      }

      setSuccess(true);
    } catch {
      setSubmitError('Verbindungsfehler beim Speichern. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-gray-900">Sicherheitslink wird geprüft...</h2>
        <p className="mt-1 text-xs text-gray-500">Einen Moment bitte.</p>
      </div>
    );
  }

  if (tokenError || !tokenValid) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto text-center">
        <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900">Ungültiger oder abgelaufener Link</h2>
        <p className="mt-3 text-xs text-gray-600 leading-relaxed">
          {tokenError || 'Dieser Aktivierungslink ist abgelaufen oder wurde bereits verwendet.'}
        </p>
        <p className="mt-2 text-[11px] text-gray-500">
          Aus Sicherheitsgründen sind Aktivierungslinks genau 1 Stunde gültig.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href="/konto/passwort-vergessen"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
          >
            Neuen Link anfordern
          </a>
          <a
            href="/konto/login"
            className="text-xs text-gray-500 hover:underline pt-2"
          >
            Zur Anmeldung
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto text-center">
        <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-900">Passwort erfolgreich gesetzt!</h2>
        <p className="mt-3 text-xs text-gray-600 leading-relaxed">
          Ihr Kundenkonto beim ELBI Verlag ist ab sofort aktiviert und geschützt.
          Sie sind jetzt angemeldet.
        </p>

        <div className="mt-8">
          <a
            href="/konto"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
          >
            Weiter zu Ihrem Kundenkonto &rarr;
          </a>
        </div>
      </div>
    );
  }

  const displayName = customer?.first_name
    ? `${customer.first_name} ${customer.last_name || ''}`.trim()
    : customer?.email;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Neues Passwort festlegen</h1>
        <p className="mt-1.5 text-xs text-gray-500">
          Willkommen zurück beim ELBI Verlag!
        </p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
        <div className="font-bold">Hallo {displayName},</div>
        {customer?.company && (
          <div className="text-[11px] text-blue-700 font-medium">{customer.company}</div>
        )}
        <p className="text-[11px] text-blue-800 leading-relaxed pt-1">
          Bitte vergeben Sie jetzt Ihr neues persönliches Passwort für Ihren Zugang.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-xs font-semibold text-gray-700">
            Neues Passwort (mind. 8 Zeichen) *
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="repeatPassword" className="block text-xs font-semibold text-gray-700">
            Passwort wiederholen *
          </label>
          <input
            id="repeatPassword"
            type="password"
            required
            minLength={8}
            value={passwordRepeat}
            onChange={(e) => setPasswordRepeat(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
        >
          {submitting ? 'Passwort wird gespeichert...' : 'Passwort speichern & Konto aktivieren'}
        </button>
      </form>
    </div>
  );
}
