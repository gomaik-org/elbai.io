import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { setSession } from '../../stores/auth';

type CustomerType = 'p' | 's' | 'c';

export default function RegisterForm() {
  // Step 1: E-Mail & Passwort
  // Step 2: Kundentyp & Name / Institution
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('p');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [institutionName, setInstitutionName] = useState('');

  // Address states
  const [street, setStreet] = useState('');
  const [streetNr, setStreetNr] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  const showEmailError = emailTouched && (!email.trim() || !emailRegex.test(email.trim().toLowerCase()));

  const handleNextStep = async (e: SyntheticEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Bitte eine gültige Emailadresse eingeben');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    setCheckingEmail(true);
    try {
      const checkRes = await fetch(`/api/auth/check-email?email=${encodeURIComponent(cleanEmail)}`);
      if (checkRes.ok) {
        const checkData = (await checkRes.json()) as { exists: boolean };
        if (checkData.exists) {
          setErrorMsg('Mit dieser E-Mail-Adresse existiert bereits ein Kundenkonto. Bitte melden Sie sich an oder nutzen Sie die Passwort-vergessen-Funktion.');
          setCheckingEmail(false);
          return;
        }
      }
    } catch {
      // If check-email endpoint fails, allow proceeding to step 2 where register will validate
    } finally {
      setCheckingEmail(false);
    }

    // Step 1 validated & email available -> go to Step 2
    setStep(2);
  };

  const handleFinalSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    if (customerType === 's' && !institutionName.trim()) {
      setErrorMsg('Bitte geben Sie den Namen Ihrer Schule oder Einrichtung an.');
      setSubmitting(false);
      return;
    }

    if (customerType === 'c' && !institutionName.trim()) {
      setErrorMsg('Bitte geben Sie Ihren Firmennamen an.');
      setSubmitting(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Bitte geben Sie Ihren Vor- und Nachnamen an.');
      setSubmitting(false);
      return;
    }

    if (!street.trim() || !streetNr.trim() || !zip.trim() || !city.trim()) {
      setErrorMsg('Bitte füllen Sie alle erforderlichen Adressfelder aus (Straße, Hausnummer, PLZ, Ort).');
      setSubmitting(false);
      return;
    }

    if (!/^\d{5}$/.test(zip.trim())) {
      setErrorMsg('Bitte geben Sie eine gültige 5-stellige deutsche Postleitzahl (nur Ziffern) ein.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          company: customerType !== 'p' ? institutionName.trim() : undefined,
          street: street.trim(),
          street_nr: streetNr.trim(),
          zip: zip.trim(),
          city: city.trim(),
          turnstile_token: '1x00000000000000000000AA',
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
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
    <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs max-w-lg mx-auto transition-all">
      {/* Step Indicator Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600 mb-3">
          <span>Schritt {step} von 2</span>
          <span>&bull;</span>
          <span>{step === 1 ? 'Zugangsdaten' : 'Kontoprofil'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {step === 1 ? 'Konto eröffnen' : 'Wie bestellen Sie?'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          {step === 1
            ? 'Legen Sie Ihre Zugangsdaten fest, um bei Elbi zu bestellen.'
            : 'Passen Sie Ihr Konto für Schule, Privat oder Fachhandel an.'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-2xl border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* ================= STEP 1: E-MAIL & PASSWORT ================= */}
      {step === 1 && (
        <div>

          <form onSubmit={handleNextStep} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="regEmail" className="block text-sm font-bold text-slate-800">
                E-Mail-Adresse *
              </label>
              {showEmailError && (
                <span className="text-xs font-bold text-red-600 animate-in fade-in">
                  Bitte eine gültige Emailadresse eingeben
                </span>
              )}
            </div>
            <input
              id="regEmail"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="ihre.adresse@schule.de"
              className={`w-full rounded-2xl border px-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-hidden ${
                showEmailError
                  ? 'border-red-500 bg-red-50/40 text-red-900 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-300 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 bg-slate-50/50 hover:bg-white focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label htmlFor="regPassword" className="block text-sm font-bold text-slate-800 mb-1.5">
              Passwort wählen * <span className="text-xs text-slate-500 font-normal">(mind. 8 Zeichen)</span>
            </label>
            <input
              id="regPassword"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={checkingEmail}
            className="w-full mt-3 inline-flex items-center justify-center rounded-2xl bg-[#3395d1] hover:bg-[#287bb0] px-5 py-4 text-base font-extrabold text-white disabled:opacity-50 transition-all shadow-sm active:scale-[0.99] cursor-pointer gap-2"
          >
            <span>{checkingEmail ? 'E-Mail wird geprüft...' : 'Weiter'}</span>
            <span>&rarr;</span>
          </button>
          </form>
        </div>
      )}

      {/* ================= STEP 2: KUNDENTYP & DETAILS ================= */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6">
          {/* Customer Type Segmented Switch */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Kontoart auswählen
            </label>
            <div className="p-1.5 bg-slate-100/80 rounded-2xl flex items-center gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setCustomerType('p')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerType === 'p'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>👤</span>
                <span>Privat</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerType('s')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerType === 's'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>🏫</span>
                <span>Schule</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerType('c')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerType === 'c'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>🏢</span>
                <span>Firma</span>
              </button>
            </div>
          </div>

          {/* Conditional Institution Field */}
          {customerType === 's' && (
            <div>
              <label htmlFor="regSchoolName" className="block text-sm font-bold text-slate-800 mb-1.5">
                Schulname &amp; Schulform *
              </label>
              <input
                id="regSchoolName"
                type="text"
                required
                autoFocus
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="z. B. Grundschule am Park"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
              />
              <p className="mt-1 text-xs text-slate-500">
                Für offene Rechnungen mit 14 Tagen Zahlungsziel.
              </p>
            </div>
          )}

          {customerType === 'c' && (
            <div>
              <label htmlFor="regFirmName" className="block text-sm font-bold text-slate-800 mb-1.5">
                Firmenname / Buchhandlung *
              </label>
              <input
                id="regFirmName"
                type="text"
                required
                autoFocus
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="z. B. Buchhandlung Meier GmbH"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
              />
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="regFirstName" className="block text-sm font-bold text-slate-800 mb-1.5">
                Vorname *
              </label>
              <input
                id="regFirstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Maria"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="regLastName" className="block text-sm font-bold text-slate-800 mb-1.5">
                Nachname *
              </label>
              <input
                id="regLastName"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Muster"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
              />
            </div>
          </div>

          {/* Address Fields */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Rechnungs- &amp; Lieferadresse (Pflichtangaben) *
            </h3>

            {/* Street & House Number */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="col-span-3">
                <label htmlFor="regStreet" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Straße *
                </label>
                <input
                  id="regStreet"
                  type="text"
                  autoComplete="address-line1"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Schulstraße"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="regStreetNr" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Nr. *
                </label>
                <input
                  id="regStreetNr"
                  type="text"
                  autoComplete="address-line2"
                  required
                  value={streetNr}
                  onChange={(e) => setStreetNr(e.target.value)}
                  placeholder="12a"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            {/* Postal Code & City */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label htmlFor="regZip" className="block text-sm font-bold text-slate-800 mb-1.5">
                  PLZ *
                </label>
                <input
                  id="regZip"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  autoComplete="postal-code"
                  required
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="10115"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="regCity" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Ort / Stadt *
                </label>
                <input
                  id="regCity"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base font-medium text-slate-900 focus:border-[#3395d1] focus:ring-2 focus:ring-[#3395d1]/20 transition-all outline-hidden bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              &larr; Zurück
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center rounded-2xl bg-[#3395d1] hover:bg-[#287bb0] px-5 py-4 text-base font-extrabold text-white disabled:opacity-50 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              {submitting ? 'Konto wird erstellt...' : 'Konto fertigstellen'}
            </button>
          </div>
        </form>
      )}

      {/* Switch to Login / Info */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
        <p className="text-sm text-slate-600 font-medium">
          Bereits registriert?
        </p>
        <a
          href="/konto/login"
          className="inline-flex items-center justify-center w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-extrabold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
        >
          Zum Login anmelden &rarr;
        </a>
      </div>
    </div>
  );
}
