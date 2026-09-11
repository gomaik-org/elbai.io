# Tester-Leitfaden für Testbetrieb & Versender

Leitfaden für die geschützte Testumgebung auf `dev.elbi.de`.

---

## 1. Schutz vor der Öffentlichkeit (Cloudflare Zero Trust)

Damit die Testseite online erreichbar ist, aber weder von Google indexiert noch von Unbefugten aufgerufen werden kann, nutzen wir **Cloudflare Zero Trust (Access)**:
- Beim Aufruf von `dev.elbi.de` erscheint ein Schutzfenster.
- Der Tester gibt seine E-Mail-Adresse ein.
- Cloudflare sendet einen 6-stelligen PIN-Code per E-Mail.
- Nur wer auf der Erlaubnisliste steht, erhält Zugriff.
- **Kein VPN nötig:** Funktioniert direkt im Browser auf PC, Tablet oder Smartphone.

---

## 2. Anleitung für den Shop-Inhaber (Vater)

### Schritt 1: Anmelden
- Webseite aufrufen: `https://dev.elbi.de`
- E-Mail eingeben und den zugesandten PIN eintragen.

### Schritt 2: Testbestellung machen
- Katalog durchstöbern (z. B. Lehrerkalender, Schreibhefte).
- Artikel in den Warenkorb legen und Testbestellung abschicken. Es wird im Testmodus kein echtes Geld abgebucht!

### Schritt 3: Der Verwaltungsbereich (Admin)
- Admin-Portal aufrufen: `https://dev.elbi.de/admin`
- **Preise & Texte anpassen:** In der Liste können Preise direkt geändert oder Artikel editiert werden.
- **Artikel schalten:** Mit einem Klick Artikel online oder offline stellen.
- **Bestellungen prüfen:** Im Reiter *„Bestellungen & Versand“* alle Eingänge mit Anschrift sehen.

---

## 3. Für den Versender (Lieferschein & Paketversand)

1. Im Reiter **„Bestellungen & Versand“** auf den Button **„🖨️ Drucken“** klicken.
2. Der Browser öffnet direkt den optimierten **DIN-A4 Lieferschein** (ohne Knöpfe oder Menüs).
3. Paket packen und auf **„✓ Als versendet markieren“** klicken.
