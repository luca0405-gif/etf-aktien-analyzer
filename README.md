# ETF & Aktien Analyzer

Single-Page-Webanwendung zur Analyse und zum Vergleich von ETFs und
Einzelaktien, inklusive KI-gestützter News-Auswertung (finanzen.net-Stil)
und Szenario-Prognosen.

## Kernfunktionen

- **Asset-Suche & Vergleich**: Autocomplete-Suche nach Ticker, ISIN oder
  Name, bis zu 4 ETFs/Aktien gleichzeitig vergleichbar.
- **Dynamische Vergleichstabelle**: allgemeine Kennzahlen (Performance,
  Volatilität, Sharpe Ratio) sowie ETF- bzw. aktienspezifische Kennzahlen
  (TER/AUM/Replikation vs. KGV/KBV/Dividendenrendite/Wachstum), inkl.
  ETF-Overlap-Analyse und Top-10-Positionsvergleich.
- **Charts**: normierter Performance-Verlauf (Linie oder Kerzen/OHLC),
  Branchen-/Regionenverteilung, Bull-/Base-/Bear-Szenario-Prognose
  (12–36 Monate).
- **News & KI-Sentiment**: News-Karten im finanzen.net-Stil mit
  Sentiment-Klassifizierung (Bullisch/Neutral/Bärisch, Score 0–100) und
  KI-Zusammenfassung der Kursauswirkung.
- **Live-Kurs (Beta)**: echte Tageskurse für alle 10 Assets über eine
  serverseitige Yahoo-Finance-Anbindung, mit automatischem Fallback auf
  Beispieldaten bei Fehlern.

## Tech-Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui-Stil-
Komponenten (Radix UI) · Recharts · Zustand

## Entwicklung

```bash
npm install
npm run dev
```

Dann `http://localhost:3000` öffnen.

## Datenarchitektur

Alle Anzeigedaten stammen aktuell aus einem handkuratierten Mock-Datensatz
(`lib/mock-data.ts`, 5 ETFs + 5 Aktien). Die Datenschicht (`lib/api.ts`)
ist bewusst als austauschbares Interface gebaut, sodass reale APIs
(z. B. Financial Modeling Prep, Yahoo Finance, ein LLM für News-Sentiment)
angebunden werden können, ohne die UI-Komponenten anzufassen.

Die Live-Kurs-Funktion (`app/api/quote/[symbol]/route.ts`) wurde in einer
Sandbox ohne Zugriff auf externe Hosts entwickelt und ist bislang nicht
gegen echte Antworten getestet — nach dem Deployment ggf. verifizieren
und anpassen.

## Deployment

Empfohlen: [Vercel](https://vercel.com) — Repo importieren, Framework
„Next.js" wird automatisch erkannt, „Deploy" klicken.
