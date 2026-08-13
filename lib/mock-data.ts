import type {
  Asset,
  AssetWithNews,
  ForecastPoint,
  NewsItem,
  PricePoint,
} from "./types";

// --- deterministic PRNG so mock series are stable across renders ---
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TODAY = new Date("2026-08-13T00:00:00Z");

function monthsAgo(n: number): string {
  const d = new Date(TODAY);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 10);
}

function monthsAhead(n: number): string {
  const d = new Date(TODAY);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function genPriceHistory(
  seed: number,
  months: number,
  annualDrift: number,
  annualVol: number
): PricePoint[] {
  const rand = mulberry32(seed);
  const monthlyDrift = annualDrift / 12;
  const monthlyVol = annualVol / Math.sqrt(12);
  let value = 100;
  const points: PricePoint[] = [
    { date: monthsAgo(months), value: 100, open: 100, high: 100, low: 100 },
  ];
  for (let i = months - 1; i >= 0; i--) {
    const open = value;
    const shock = (rand() - 0.5) * 2 * monthlyVol;
    value = value * (1 + monthlyDrift / 100 + shock / 100);
    const close = value;
    // synthetic intra-period range for candlestick rendering
    const range = Math.abs(close - open) + open * (monthlyVol / 100) * rand() * 0.6;
    const high = Math.max(open, close) + range * rand() * 0.5;
    const low = Math.max(Math.min(open, close) - range * rand() * 0.5, 0.01);
    points.push({
      date: monthsAgo(i),
      value: Math.round(close * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
    });
  }
  return points;
}

function genForecast(
  seed: number,
  startValue: number,
  horizonMonths: number,
  bullAnnual: number,
  baseAnnual: number,
  bearAnnual: number
): ForecastPoint[] {
  const rand = mulberry32(seed);
  const points: ForecastPoint[] = [
    { date: monthsAhead(0), bull: startValue, base: startValue, bear: startValue },
  ];
  let bull = startValue;
  let base = startValue;
  let bear = startValue;
  for (let i = 1; i <= horizonMonths; i++) {
    const noise = () => (rand() - 0.5) * 0.8;
    bull *= 1 + bullAnnual / 12 / 100 + noise() / 100;
    base *= 1 + baseAnnual / 12 / 100 + noise() / 100;
    bear *= 1 + bearAnnual / 12 / 100 + noise() / 100;
    points.push({
      date: monthsAhead(i),
      bull: Math.round(bull * 100) / 100,
      base: Math.round(base * 100) / 100,
      bear: Math.round(bear * 100) / 100,
    });
  }
  return points;
}

function perf(history: PricePoint[], vol: number, sharpe: number) {
  const last = history[history.length - 1].value;
  const at = (monthsBack: number) => {
    const idx = Math.max(0, history.length - 1 - monthsBack);
    return history[idx].value;
  };
  const pct = (from: number) => Math.round(((last - from) / from) * 10000) / 100;
  return {
    y1: pct(at(12)),
    y3: Math.round((Math.pow(last / at(36), 1 / 3) - 1) * 10000) / 100,
    y5: Math.round((Math.pow(last / at(36), 1 / 3) - 1) * 8000) / 100, // approx, capped history at 36mo
    ytd: pct(at(new Date(TODAY).getUTCMonth())),
    volatility: vol,
    sharpeRatio: sharpe,
  };
}

// ---------------------------------------------------------------------------
// ETFs
// ---------------------------------------------------------------------------

const worldHistory = genPriceHistory(1, 36, 9.5, 15);
const iShWorld: Asset = {
  id: "etf-ishares-msci-world",
  type: "ETF",
  name: "iShares Core MSCI World UCITS ETF",
  ticker: "EUNL",
  isin: "IE00B4L5Y983",
  currency: "EUR",
  logoColor: "#2563eb",
  performance: perf(worldHistory, 14.2, 0.68),
  sectorAllocation: [
    { label: "Technologie", weight: 24.8 },
    { label: "Finanzwerte", weight: 15.1 },
    { label: "Gesundheitswesen", weight: 10.6 },
    { label: "Zykl. Konsumgüter", weight: 10.2 },
    { label: "Industrie", weight: 10.9 },
    { label: "Kommunikation", weight: 8.1 },
    { label: "Sonstige", weight: 20.3 },
  ],
  regionAllocation: [
    { label: "USA", weight: 71.2 },
    { label: "Japan", weight: 5.6 },
    { label: "Großbritannien", weight: 3.6 },
    { label: "Frankreich", weight: 2.7 },
    { label: "Kanada", weight: 2.6 },
    { label: "Sonstige", weight: 14.3 },
  ],
  priceHistory: worldHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Zinssenkungszyklus der Fed stützt Bewertungen von Qualitätsaktien",
      "KI-getriebene Produktivitätsgewinne beschleunigen Gewinnwachstum",
      "Stabiles globales Wachstum ohne Rezession (Soft Landing)",
    ],
    baseDrivers: [
      "Moderates Gewinnwachstum im Einklang mit langfristigem Trend (~7-9% p.a.)",
      "Inflation nähert sich Notenbankzielen, Zinsen bleiben leicht restriktiv",
      "Bewertungen nahe historischem Durchschnitt",
    ],
    bearDrivers: [
      "Konjunktureintrübung in den USA belastet Gewinnmargen",
      "Geopolitische Eskalation erhöht Risikoprämien",
      "Rückschlag bei KI-Investitionszyklus dämpft Tech-Sektor",
    ],
    points: genForecast(11, worldHistory[worldHistory.length - 1].value, 24, 13, 8, -4),
  },
  etf: {
    ter: 0.2,
    aum: 78_400_000_000,
    replicationMethod: "Physisch (Sampling)",
    distributionPolicy: "Thesaurierend",
    fundDomicile: "Irland",
    inceptionDate: "2009-09-25",
    topHoldings: [
      { name: "Apple Inc.", ticker: "AAPL", weight: 4.9 },
      { name: "Microsoft Corp.", ticker: "MSFT", weight: 4.6 },
      { name: "NVIDIA Corp.", ticker: "NVDA", weight: 4.3 },
      { name: "Amazon.com Inc.", ticker: "AMZN", weight: 2.5 },
      { name: "Alphabet Inc. (A)", ticker: "GOOGL", weight: 1.8 },
      { name: "Meta Platforms Inc.", ticker: "META", weight: 1.6 },
      { name: "Broadcom Inc.", ticker: "AVGO", weight: 1.3 },
      { name: "Tesla Inc.", ticker: "TSLA", weight: 1.1 },
      { name: "Eli Lilly & Co.", ticker: "LLY", weight: 0.9 },
      { name: "JPMorgan Chase & Co.", ticker: "JPM", weight: 0.9 },
    ],
  },
};

const allWorldHistory = genPriceHistory(2, 36, 9, 15.4);
const vanguardAllWorld: Asset = {
  id: "etf-vanguard-ftse-all-world",
  type: "ETF",
  name: "Vanguard FTSE All-World UCITS ETF",
  ticker: "VWCE",
  isin: "IE00BK5BQT80",
  currency: "EUR",
  logoColor: "#dc2626",
  performance: perf(allWorldHistory, 14.6, 0.63),
  sectorAllocation: [
    { label: "Technologie", weight: 23.1 },
    { label: "Finanzwerte", weight: 16.4 },
    { label: "Gesundheitswesen", weight: 10.1 },
    { label: "Zykl. Konsumgüter", weight: 10.6 },
    { label: "Industrie", weight: 11.2 },
    { label: "Kommunikation", weight: 7.8 },
    { label: "Sonstige", weight: 20.8 },
  ],
  regionAllocation: [
    { label: "USA", weight: 63.8 },
    { label: "Japan", weight: 5.4 },
    { label: "China", weight: 3.1 },
    { label: "Großbritannien", weight: 3.4 },
    { label: "Indien", weight: 2.1 },
    { label: "Sonstige", weight: 22.2 },
  ],
  priceHistory: allWorldHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Breitere Diversifikation inkl. Schwellenländer profitiert von globaler Erholung",
      "Schwächerer US-Dollar begünstigt internationale Titel",
      "Aufholpotenzial von Nebenwerten außerhalb der USA",
    ],
    baseDrivers: [
      "Globales BIP-Wachstum nahe langfristigem Trend (~3%)",
      "Ausgewogene Sektor- und Regionenverteilung dämpft Einzelrisiken",
      "Bewertungen international günstiger als in den USA",
    ],
    bearDrivers: [
      "Handelskonflikte belasten Emerging Markets stärker als Industrieländer",
      "Yen-/Dollar-Volatilität erhöht Wechselkursrisiken",
      "Schwellenländer-Schuldenlast bei hohen Zinsen",
    ],
    points: genForecast(12, allWorldHistory[allWorldHistory.length - 1].value, 24, 12.5, 7.5, -4.5),
  },
  etf: {
    ter: 0.22,
    aum: 14_200_000_000,
    replicationMethod: "Physisch (Sampling)",
    distributionPolicy: "Thesaurierend",
    fundDomicile: "Irland",
    inceptionDate: "2019-07-23",
    topHoldings: [
      { name: "Apple Inc.", ticker: "AAPL", weight: 4.1 },
      { name: "NVIDIA Corp.", ticker: "NVDA", weight: 3.8 },
      { name: "Microsoft Corp.", ticker: "MSFT", weight: 3.7 },
      { name: "Amazon.com Inc.", ticker: "AMZN", weight: 2.1 },
      { name: "Alphabet Inc. (A+C)", ticker: "GOOGL", weight: 1.9 },
      { name: "Meta Platforms Inc.", ticker: "META", weight: 1.3 },
      { name: "Broadcom Inc.", ticker: "AVGO", weight: 1.1 },
      { name: "Taiwan Semiconductor", ticker: "TSM", weight: 1.0 },
      { name: "Tesla Inc.", ticker: "TSLA", weight: 0.9 },
      { name: "Berkshire Hathaway", ticker: "BRK.B", weight: 0.8 },
    ],
  },
};

const sp500History = genPriceHistory(3, 36, 10.8, 16.2);
const iSharesSP500: Asset = {
  id: "etf-ishares-core-sp500",
  type: "ETF",
  name: "iShares Core S&P 500 UCITS ETF",
  ticker: "CSPX",
  isin: "IE00B5BMR087",
  currency: "USD",
  logoColor: "#0891b2",
  performance: perf(sp500History, 16.0, 0.71),
  sectorAllocation: [
    { label: "Technologie", weight: 32.4 },
    { label: "Finanzwerte", weight: 13.2 },
    { label: "Gesundheitswesen", weight: 9.8 },
    { label: "Zykl. Konsumgüter", weight: 10.1 },
    { label: "Kommunikation", weight: 9.4 },
    { label: "Industrie", weight: 8.2 },
    { label: "Sonstige", weight: 16.9 },
  ],
  regionAllocation: [{ label: "USA", weight: 100 }],
  priceHistory: sp500History,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Anhaltende Outperformance der 'Magnificent Seven' durch KI-Monetarisierung",
      "Robuste US-Konsumausgaben und starker Arbeitsmarkt",
      "Aktienrückkäufe auf Rekordniveau stützen EPS-Wachstum",
    ],
    baseDrivers: [
      "Gewinnwachstum von ca. 9-11% p.a. im Einklang mit Analystenschätzungen",
      "Fed hält Leitzins in restriktiv-neutraler Spanne",
      "Bewertung (KGV) leicht über historischem Median",
    ],
    bearDrivers: [
      "Hohe Konzentration in wenigen Mega-Cap-Technologiewerten erhöht Klumpenrisiko",
      "Enttäuschende KI-Kapitalrenditen lösen Bewertungskorrektur aus",
      "Restriktivere Geldpolitik länger als erwartet (higher for longer)",
    ],
    points: genForecast(13, sp500History[sp500History.length - 1].value, 24, 14.5, 9, -5.5),
  },
  etf: {
    ter: 0.07,
    aum: 92_100_000_000,
    replicationMethod: "Physisch (Full Replication)",
    distributionPolicy: "Thesaurierend",
    fundDomicile: "Irland",
    inceptionDate: "2010-05-19",
    topHoldings: [
      { name: "Apple Inc.", ticker: "AAPL", weight: 7.1 },
      { name: "NVIDIA Corp.", ticker: "NVDA", weight: 6.8 },
      { name: "Microsoft Corp.", ticker: "MSFT", weight: 6.4 },
      { name: "Amazon.com Inc.", ticker: "AMZN", weight: 3.7 },
      { name: "Alphabet Inc. (A+C)", ticker: "GOOGL", weight: 3.4 },
      { name: "Meta Platforms Inc.", ticker: "META", weight: 2.4 },
      { name: "Broadcom Inc.", ticker: "AVGO", weight: 2.0 },
      { name: "Tesla Inc.", ticker: "TSLA", weight: 1.7 },
      { name: "Berkshire Hathaway", ticker: "BRK.B", weight: 1.5 },
      { name: "JPMorgan Chase & Co.", ticker: "JPM", weight: 1.3 },
    ],
  },
};

const emHistory = genPriceHistory(4, 36, 5.4, 19.8);
const xtrackersEM: Asset = {
  id: "etf-xtrackers-msci-em",
  type: "ETF",
  name: "Xtrackers MSCI Emerging Markets UCITS ETF",
  ticker: "XMME",
  isin: "IE00BTJRMP35",
  currency: "USD",
  logoColor: "#16a34a",
  performance: perf(emHistory, 19.1, 0.31),
  sectorAllocation: [
    { label: "Technologie", weight: 22.6 },
    { label: "Finanzwerte", weight: 20.3 },
    { label: "Zykl. Konsumgüter", weight: 13.8 },
    { label: "Kommunikation", weight: 9.2 },
    { label: "Grundstoffe", weight: 7.4 },
    { label: "Energie", weight: 5.6 },
    { label: "Sonstige", weight: 21.1 },
  ],
  regionAllocation: [
    { label: "China", weight: 27.4 },
    { label: "Indien", weight: 19.8 },
    { label: "Taiwan", weight: 18.6 },
    { label: "Südkorea", weight: 11.2 },
    { label: "Brasilien", weight: 4.8 },
    { label: "Sonstige", weight: 18.2 },
  ],
  priceHistory: emHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Schwächerer US-Dollar erleichtert Kapitalzuflüsse in Schwellenländer",
      "Chinesische Konjunkturstimuli beleben Binnennachfrage",
      "Halbleiter-Zyklus begünstigt taiwanesische und südkoreanische Titel",
    ],
    baseDrivers: [
      "Wachstumsdifferenz zu Industrieländern bleibt moderat positiv",
      "Bewertungsabschlag gegenüber Industrieländern bleibt bestehen",
      "Rohstoffpreise stabilisieren sich auf aktuellem Niveau",
    ],
    bearDrivers: [
      "Eskalation im US-China-Handelskonflikt belastet Exporttitel",
      "Kapitalabflüsse bei erneut steigenden US-Realzinsen",
      "Immobiliensektor-Schwäche in China dämpft Wachstum",
    ],
    points: genForecast(14, emHistory[emHistory.length - 1].value, 24, 11, 5, -9),
  },
  etf: {
    ter: 0.18,
    aum: 6_800_000_000,
    replicationMethod: "Physisch (Sampling)",
    distributionPolicy: "Thesaurierend",
    fundDomicile: "Irland",
    inceptionDate: "2014-01-15",
    topHoldings: [
      { name: "Taiwan Semiconductor", ticker: "TSM", weight: 9.8 },
      { name: "Tencent Holdings", ticker: "0700.HK", weight: 4.6 },
      { name: "Samsung Electronics", ticker: "005930.KS", weight: 3.9 },
      { name: "Alibaba Group", ticker: "9988.HK", weight: 2.7 },
      { name: "Reliance Industries", ticker: "RELIANCE.NS", weight: 1.9 },
      { name: "HDFC Bank", ticker: "HDFCBANK.NS", weight: 1.5 },
      { name: "Meituan", ticker: "3690.HK", weight: 1.2 },
      { name: "ICBC", ticker: "1398.HK", weight: 1.1 },
      { name: "Infosys", ticker: "INFY.NS", weight: 1.0 },
      { name: "PDD Holdings", ticker: "PDD", weight: 1.0 },
    ],
  },
};

const stoxx600History = genPriceHistory(5, 36, 6.8, 14.7);
const iSharesStoxx600: Asset = {
  id: "etf-ishares-stoxx-europe-600",
  type: "ETF",
  name: "iShares STOXX Europe 600 UCITS ETF",
  ticker: "EXSA",
  isin: "DE0002635307",
  currency: "EUR",
  logoColor: "#7c3aed",
  performance: perf(stoxx600History, 13.9, 0.44),
  sectorAllocation: [
    { label: "Finanzwerte", weight: 19.8 },
    { label: "Industrie", weight: 16.4 },
    { label: "Gesundheitswesen", weight: 13.9 },
    { label: "Basiskonsumgüter", weight: 10.2 },
    { label: "Technologie", weight: 7.6 },
    { label: "Grundstoffe", weight: 6.9 },
    { label: "Sonstige", weight: 25.2 },
  ],
  regionAllocation: [
    { label: "Großbritannien", weight: 22.4 },
    { label: "Frankreich", weight: 16.8 },
    { label: "Deutschland", weight: 14.2 },
    { label: "Schweiz", weight: 13.6 },
    { label: "Niederlande", weight: 7.1 },
    { label: "Sonstige", weight: 25.9 },
  ],
  priceHistory: stoxx600History,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "EZB-Zinssenkungen beleben zinssensitive Sektoren (Immobilien, Industrie)",
      "Fiskalpakete (z. B. Infrastruktur, Verteidigung) stützen europäische Industrie",
      "Bewertungsabschlag gegenüber US-Aktien schließt sich",
    ],
    baseDrivers: [
      "Moderates Wirtschaftswachstum in der Eurozone (~1-1,5%)",
      "Stabile Dividendenrenditen stützen Gesamtrendite",
      "Euro-Wechselkurs bleibt in etablierter Handelsspanne",
    ],
    bearDrivers: [
      "Energiepreisschocks belasten europäische Industrieproduktion",
      "Politische Unsicherheit (Wahlen, Haushaltsdefizite) bremst Investitionen",
      "Schwache China-Nachfrage trifft exportorientierte Unternehmen",
    ],
    points: genForecast(15, stoxx600History[stoxx600History.length - 1].value, 24, 10.5, 6, -5),
  },
  etf: {
    ter: 0.2,
    aum: 3_600_000_000,
    replicationMethod: "Physisch (Full Replication)",
    distributionPolicy: "Ausschüttend",
    distributionFrequency: "Halbjährlich",
    fundDomicile: "Deutschland",
    inceptionDate: "2004-10-01",
    topHoldings: [
      { name: "ASML Holding", ticker: "ASML.AS", weight: 4.2 },
      { name: "Novo Nordisk", ticker: "NOVO-B.CO", weight: 3.6 },
      { name: "SAP SE", ticker: "SAP.DE", weight: 3.1 },
      { name: "LVMH", ticker: "MC.PA", weight: 2.4 },
      { name: "Nestlé", ticker: "NESN.SW", weight: 2.3 },
      { name: "Roche Holding", ticker: "ROG.SW", weight: 2.0 },
      { name: "AstraZeneca", ticker: "AZN.L", weight: 1.9 },
      { name: "Shell plc", ticker: "SHEL.L", weight: 1.8 },
      { name: "Novartis", ticker: "NOVN.SW", weight: 1.7 },
      { name: "HSBC Holdings", ticker: "HSBA.L", weight: 1.5 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------

const aaplHistory = genPriceHistory(21, 36, 12, 24);
const apple: Asset = {
  id: "stock-apple",
  type: "Stock",
  name: "Apple Inc.",
  ticker: "AAPL",
  isin: "US0378331005",
  currency: "USD",
  logoColor: "#a3a3a3",
  performance: perf(aaplHistory, 23.4, 0.58),
  sectorAllocation: [{ label: "Technologie", weight: 100 }],
  regionAllocation: [{ label: "USA", weight: 100 }],
  priceHistory: aaplHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Apple-Intelligence-Ökosystem treibt iPhone-Superzyklus und Services-Wachstum",
      "Bruttomarge steigt durch Services-Mix (App Store, Werbung, Abos)",
      "Aggressive Aktienrückkäufe reduzieren Aktienanzahl weiter deutlich",
    ],
    baseDrivers: [
      "Stabiles iPhone-Umsatzwachstum im niedrigen einstelligen Bereich",
      "Services bleiben Wachstumsmotor mit zweistelligen Raten",
      "Margen stabil auf hohem Niveau, Kapitalrückführung setzt sich fort",
    ],
    bearDrivers: [
      "Verlangsamung der iPhone-Nachfrage in China durch lokale Konkurrenz",
      "Regulatorischer Druck auf App-Store-Provisionen (EU/USA) belastet Margen",
      "Verzögerte KI-Differenzierung gegenüber Wettbewerbern",
    ],
    points: genForecast(31, aaplHistory[aaplHistory.length - 1].value, 24, 22, 11, -12),
  },
  stock: {
    pe: 31.4,
    pb: 48.2,
    dividendYield: 0.44,
    revenueGrowthYoY: 6.1,
    revenueGrowth3yCagr: 5.4,
    profitGrowthYoY: 9.8,
    profitGrowth3yCagr: 7.2,
    debtToEquity: 1.45,
    fcfMargin: 27.8,
    marketCap: 3_550_000_000_000,
    sector: "Technologie / Consumer Hardware",
  },
};

const nvdaHistory = genPriceHistory(22, 36, 48, 46);
const nvidia: Asset = {
  id: "stock-nvidia",
  type: "Stock",
  name: "NVIDIA Corp.",
  ticker: "NVDA",
  isin: "US67066G1040",
  currency: "USD",
  logoColor: "#22c55e",
  performance: perf(nvdaHistory, 45.6, 0.79),
  sectorAllocation: [{ label: "Technologie", weight: 100 }],
  regionAllocation: [{ label: "USA", weight: 100 }],
  priceHistory: nvdaHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Nachfrage nach Blackwell/Rubin-KI-Beschleunigern übersteigt Angebot weiterhin",
      "Hyperscaler erhöhen Capex-Budgets für KI-Infrastruktur erneut",
      "CUDA-Software-Ökosystem festigt Quasi-Monopolstellung",
    ],
    baseDrivers: [
      "Wachstum normalisiert sich auf weiterhin hohem Niveau (20-30% p.a.)",
      "Marktanteile im KI-Beschleuniger-Markt bleiben dominant, aber leicht rückläufig",
      "Neue Produktgeneration im Jahresrhythmus stützt Umsatz",
    ],
    bearDrivers: [
      "Kunden diversifizieren zu eigenen Chips (Google TPU, Amazon Trainium)",
      "Exportbeschränkungen nach China schmälern adressierbaren Markt",
      "Überinvestitionen im KI-Rechenzentrumsmarkt führen zu Nachfrage-Digestion",
    ],
    points: genForecast(32, nvdaHistory[nvdaHistory.length - 1].value, 24, 38, 18, -22),
  },
  stock: {
    pe: 42.8,
    pb: 34.6,
    dividendYield: 0.03,
    revenueGrowthYoY: 69.2,
    revenueGrowth3yCagr: 64.5,
    profitGrowthYoY: 80.1,
    profitGrowth3yCagr: 88.3,
    debtToEquity: 0.24,
    fcfMargin: 45.2,
    marketCap: 3_280_000_000_000,
    sector: "Technologie / Halbleiter",
  },
};

const msftHistory = genPriceHistory(23, 36, 14, 21);
const microsoft: Asset = {
  id: "stock-microsoft",
  type: "Stock",
  name: "Microsoft Corp.",
  ticker: "MSFT",
  isin: "US5949181045",
  currency: "USD",
  logoColor: "#0ea5e9",
  performance: perf(msftHistory, 20.8, 0.66),
  sectorAllocation: [{ label: "Technologie", weight: 100 }],
  regionAllocation: [{ label: "USA", weight: 100 }],
  priceHistory: msftHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Azure-Wachstum beschleunigt durch KI-Workloads (Copilot, OpenAI-Partnerschaft)",
      "Copilot-Monetarisierung über Microsoft-365-Suite skaliert schneller als erwartet",
      "Enterprise-Cloud-Migration weiterhin früh im Zyklus",
    ],
    baseDrivers: [
      "Azure wächst stabil im Bereich 25-30% p.a.",
      "Margenausweitung durch operative Effizienz in der Cloud",
      "Diversifiziertes Portfolio (Office, Gaming, LinkedIn) puffert Zyklizität",
    ],
    bearDrivers: [
      "Hohe Kapitalausgaben für KI-Rechenzentren belasten Free Cashflow",
      "Wettbewerbsdruck durch Google Cloud und AWS im KI-Segment",
      "Regulatorische Prüfung der OpenAI-Partnerschaft",
    ],
    points: genForecast(33, msftHistory[msftHistory.length - 1].value, 24, 18, 10, -8),
  },
  stock: {
    pe: 34.1,
    pb: 11.8,
    dividendYield: 0.72,
    revenueGrowthYoY: 15.7,
    revenueGrowth3yCagr: 13.9,
    profitGrowthYoY: 17.2,
    profitGrowth3yCagr: 15.1,
    debtToEquity: 0.32,
    fcfMargin: 31.5,
    marketCap: 3_120_000_000_000,
    sector: "Technologie / Software & Cloud",
  },
};

const amznHistory = genPriceHistory(24, 36, 16, 27);
const amazon: Asset = {
  id: "stock-amazon",
  type: "Stock",
  name: "Amazon.com Inc.",
  ticker: "AMZN",
  isin: "US0231351067",
  currency: "USD",
  logoColor: "#f59e0b",
  performance: perf(amznHistory, 25.9, 0.52),
  sectorAllocation: [{ label: "Zykl. Konsumgüter / Cloud", weight: 100 }],
  regionAllocation: [{ label: "USA", weight: 100 }],
  priceHistory: amznHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "AWS-Wachstum reaccelerates durch KI-Nachfrage und Trainium-Chips",
      "Werbegeschäft wird zu hochmargigem Wachstumstreiber",
      "Logistiknetzwerk-Effizienz verbessert E-Commerce-Margen strukturell",
    ],
    baseDrivers: [
      "AWS wächst stabil im Bereich 18-22% p.a.",
      "E-Commerce-Kernmarkt wächst mit BIP plus Marktanteilsgewinnen",
      "Operative Marge verbessert sich schrittweise weiter",
    ],
    bearDrivers: [
      "Konsumausgabenschwäche in den USA trifft Kerngeschäft direkt",
      "Preiskampf im Cloud-Markt drückt auf AWS-Margen",
      "Hohe Investitionen in Logistik und KI belasten Free Cashflow kurzfristig",
    ],
    points: genForecast(34, amznHistory[amznHistory.length - 1].value, 24, 24, 12, -10),
  },
  stock: {
    pe: 38.6,
    pb: 7.9,
    dividendYield: 0,
    revenueGrowthYoY: 11.3,
    revenueGrowth3yCagr: 10.8,
    profitGrowthYoY: 22.4,
    profitGrowth3yCagr: 34.6,
    debtToEquity: 0.51,
    fcfMargin: 6.8,
    marketCap: 2_180_000_000_000,
    sector: "Zykl. Konsumgüter / Cloud-Infrastruktur",
  },
};

const googlHistory = genPriceHistory(25, 36, 13, 22);
const alphabet: Asset = {
  id: "stock-alphabet",
  type: "Stock",
  name: "Alphabet Inc. (Class A)",
  ticker: "GOOGL",
  isin: "US02079K3059",
  currency: "USD",
  logoColor: "#ef4444",
  performance: perf(googlHistory, 22.1, 0.55),
  sectorAllocation: [{ label: "Kommunikationsdienste", weight: 100 }],
  regionAllocation: [{ label: "USA", weight: 100 }],
  priceHistory: googlHistory,
  forecast: {
    horizonMonths: 24,
    bullDrivers: [
      "Gemini-Modelle stärken Suchqualität und verteidigen Marktanteil erfolgreich",
      "Google-Cloud-Wachstum beschleunigt und erreicht profitable Skalierung",
      "YouTube und Werbenetzwerk profitieren von KI-gestützter Anzeigenoptimierung",
    ],
    baseDrivers: [
      "Werbeumsatz wächst im Einklang mit globalem Online-Werbemarkt",
      "Cloud-Segment gewinnt weiter Marktanteile bei verbesserter Marge",
      "Kapitalrückführung durch Rückkäufe und neue Dividende setzt sich fort",
    ],
    bearDrivers: [
      "KI-Chatbots (ChatGPT u.a.) erodieren klassisches Suchgeschäft strukturell",
      "Kartellrechtliche Verfahren in den USA/EU erzwingen Strukturänderungen",
      "Hohe KI-Infrastrukturinvestitionen belasten Marge kurzfristig",
    ],
    points: genForecast(35, googlHistory[googlHistory.length - 1].value, 24, 20, 10, -11),
  },
  stock: {
    pe: 24.7,
    pb: 7.1,
    dividendYield: 0.42,
    revenueGrowthYoY: 13.8,
    revenueGrowth3yCagr: 11.6,
    profitGrowthYoY: 19.5,
    profitGrowth3yCagr: 21.3,
    debtToEquity: 0.08,
    fcfMargin: 24.1,
    marketCap: 2_090_000_000_000,
    sector: "Kommunikationsdienste / Internet",
  },
};

export const ASSETS: Asset[] = [
  iShWorld,
  vanguardAllWorld,
  iSharesSP500,
  xtrackersEM,
  iSharesStoxx600,
  apple,
  nvidia,
  microsoft,
  amazon,
  alphabet,
];

// ---------------------------------------------------------------------------
// News (mock finanzen.net feed)
// ---------------------------------------------------------------------------

function n(
  id: string,
  assetId: string,
  title: string,
  daysBack: number,
  type: NewsItem["type"],
  sentiment: NewsItem["sentiment"],
  sentimentScore: number,
  aiSummary: string[],
  slug: string
): NewsItem {
  return {
    id,
    assetId,
    title,
    source: "finanzen.net",
    url: `https://www.finanzen.net/nachricht/${slug}`,
    publishedAt: daysAgo(daysBack),
    type,
    sentiment,
    sentimentScore,
    aiSummary,
  };
}

export const NEWS: NewsItem[] = [
  // iShares MSCI World
  n(
    "news-world-1",
    "etf-ishares-msci-world",
    "MSCI World erreicht neues Allzeithoch – Tech-Werte treiben Rally",
    1,
    "News",
    "Bullisch",
    78,
    [
      "Breite Kursgewinne bei Technologie- und Industriewerten stützen den Index.",
      "Anlegerzuflüsse in globale Aktien-ETFs auf Mehrmonatshoch.",
      "Kurzfristig positives Momentum, Bewertung nähert sich oberem historischem Band.",
    ],
    "msci-world-allzeithoch-tech-rally-8821341"
  ),
  n(
    "news-world-2",
    "etf-ishares-msci-world",
    "Analyse: Lohnt sich MSCI World noch nach der starken Rally?",
    5,
    "Analyse",
    "Neutral",
    54,
    [
      "Analysten sehen Bewertung als ambitioniert, aber nicht überzogen.",
      "Gewinnrevisionen bleiben überwiegend positiv.",
      "Empfehlung: Sparplan fortführen, keine Einmalanlage auf aktuellem Niveau.",
    ],
    "msci-world-bewertung-analyse-8819902"
  ),
  n(
    "news-world-3",
    "etf-ishares-msci-world",
    "Fed-Zinsentscheid im Fokus: Was er für globale Aktien-ETFs bedeutet",
    9,
    "News",
    "Neutral",
    58,
    [
      "Markt preist mit hoher Wahrscheinlichkeit eine Zinssenkung ein.",
      "Historisch folgt auf erste Zinssenkungen meist eine positive Aktienreaktion.",
      "Volatilität dürfte kurzfristig zunehmen.",
    ],
    "fed-zinsentscheid-aktien-etf-8815223"
  ),

  // Vanguard All-World
  n(
    "news-allworld-1",
    "etf-vanguard-ftse-all-world",
    "Vanguard FTSE All-World: Schwellenländer-Anteil sorgt für Diskussion unter Sparern",
    2,
    "Analyse",
    "Neutral",
    51,
    [
      "Emerging-Markets-Gewichtung erhöht kurzfristige Schwankungsbreite.",
      "Langfristig soll dies Diversifikationsvorteile bringen.",
      "Sparplan-Anleger zeigen sich laut Umfrage unbeeindruckt von Volatilität.",
    ],
    "vanguard-ftse-all-world-schwellenlaender-8820115"
  ),
  n(
    "news-allworld-2",
    "etf-vanguard-ftse-all-world",
    "Meistgekaufter ETF: All-World bleibt Liebling deutscher Sparer",
    6,
    "News",
    "Bullisch",
    69,
    [
      "ETF führt erneut die Sparplan-Rankings großer Neobroker an.",
      "Nettomittelzuflüsse deutlich über Vorjahresniveau.",
      "Kostenquote bleibt im Wettbewerbsvergleich attraktiv.",
    ],
    "all-world-meistgekaufter-etf-sparplan-8817744"
  ),
  n(
    "news-allworld-3",
    "etf-vanguard-ftse-all-world",
    "Schwacher Dollar belastet kurzfristig US-lastige Welt-ETFs",
    11,
    "News",
    "Bärisch",
    36,
    [
      "Dollarabwertung dämpft Eurorendite US-amerikanischer Positionen.",
      "Effekt betrifft alle marktkapitalisierungsgewichteten Welt-ETFs ähnlich stark.",
      "Kein struktureller, sondern währungsbedingter Kurzfristeffekt.",
    ],
    "schwacher-dollar-welt-etf-8813387"
  ),

  // iShares S&P 500
  n(
    "news-sp500-1",
    "etf-ishares-core-sp500",
    "S&P 500: Magnificent Seven verantworten fast die Hälfte der Jahresrendite",
    1,
    "Analyse",
    "Neutral",
    49,
    [
      "Indexkonzentration erreicht neuen Rekordwert seit den 1970ern.",
      "Klumpenrisiko bei Enttäuschung einzelner Mega-Caps steigt.",
      "Gleichgewichteter S&P 500 hinkt deutlich hinterher.",
    ],
    "sp500-magnificent-seven-konzentration-8821009"
  ),
  n(
    "news-sp500-2",
    "etf-ishares-core-sp500",
    "US-Arbeitsmarktdaten übertreffen Erwartungen – S&P 500 im Plus",
    4,
    "News",
    "Bullisch",
    74,
    [
      "Stärker als erwartete Beschäftigungszahlen stützen Soft-Landing-Szenario.",
      "Zinssenkungserwartungen leicht zurückgenommen, Aktien reagieren dennoch positiv.",
      "Zyklische Sektoren outperformen an diesem Handelstag.",
    ],
    "us-arbeitsmarktdaten-sp500-8818650"
  ),
  n(
    "news-sp500-3",
    "etf-ishares-core-sp500",
    "Rekordniveau bei Aktienrückkäufen stützt US-Standardwerte",
    8,
    "News",
    "Bullisch",
    71,
    [
      "S&P-500-Unternehmen kaufen im laufenden Jahr Aktien im Rekordvolumen zurück.",
      "Reduzierte Aktienanzahl stützt Gewinn je Aktie strukturell.",
      "Besonders Tech- und Finanzsektor treiben Rückkaufvolumen.",
    ],
    "aktienrueckkaeufe-rekord-sp500-8816012"
  ),

  // Xtrackers EM
  n(
    "news-em-1",
    "etf-xtrackers-msci-em",
    "China-Konjunkturpaket beflügelt Emerging-Markets-ETFs",
    2,
    "News",
    "Bullisch",
    72,
    [
      "Neue Stimulusmaßnahmen Pekings adressieren Immobilienkrise und Konsum.",
      "Chinesische Standardwerte legen deutlich zu, EM-ETFs profitieren breit.",
      "Analysten bleiben vorsichtig bezüglich Nachhaltigkeit der Erholung.",
    ],
    "china-konjunkturpaket-emerging-markets-8820442"
  ),
  n(
    "news-em-2",
    "etf-xtrackers-msci-em",
    "Halbleiter-Boom treibt Taiwan und Südkorea in EM-Indizes",
    7,
    "News",
    "Bullisch",
    67,
    [
      "TSMC und Samsung profitieren von anhaltend hoher KI-Chip-Nachfrage.",
      "Taiwan-Gewichtung in MSCI-EM-Indizes steigt weiter an.",
      "Zyklisches Risiko bei nachlassender Chip-Nachfrage bleibt bestehen.",
    ],
    "halbleiter-boom-taiwan-suedkorea-8817301"
  ),
  n(
    "news-em-3",
    "etf-xtrackers-msci-em",
    "Handelskonflikt-Sorgen belasten Schwellenländer-ETFs",
    10,
    "News",
    "Bärisch",
    28,
    [
      "Neue Zollandrohungen erhöhen Unsicherheit für exportorientierte EM-Unternehmen.",
      "Kapitalabflüsse aus EM-Fonds in der laufenden Woche registriert.",
      "Volatilität dürfte bis zur politischen Klärung erhöht bleiben.",
    ],
    "handelskonflikt-schwellenlaender-etf-8814556"
  ),

  // STOXX 600
  n(
    "news-stoxx-1",
    "etf-ishares-stoxx-europe-600",
    "EZB senkt Leitzins – europäische Aktien reagieren verhalten positiv",
    3,
    "News",
    "Bullisch",
    64,
    [
      "Zinssenkung war weitgehend erwartet und bereits eingepreist.",
      "Zinssensitive Sektoren wie Immobilien und Versorger legen zu.",
      "Ausblick der EZB bleibt vorsichtig datenabhängig formuliert.",
    ],
    "ezb-leitzins-europaeische-aktien-8819774"
  ),
  n(
    "news-stoxx-2",
    "etf-ishares-stoxx-europe-600",
    "Schwache China-Nachfrage belastet europäische Industriewerte",
    6,
    "News",
    "Bärisch",
    33,
    [
      "Exportorientierte Industrie- und Luxusgüterkonzerne senken Ausblick.",
      "STOXX 600 Industriesektor unter Druck, Sentiment eingetrübt.",
      "Diversifizierte Unternehmen mit US-Exposure zeigen sich robuster.",
    ],
    "china-nachfrage-europaeische-industrie-8816789"
  ),
  n(
    "news-stoxx-3",
    "etf-ishares-stoxx-europe-600",
    "Bewertungsabschlag: Warum Analysten europäische Aktien für unterbewertet halten",
    12,
    "Analyse",
    "Bullisch",
    61,
    [
      "KGV-Abschlag zu US-Aktien nahe historischem Höchststand.",
      "Dividendenrendite bietet zusätzlichen Puffer gegenüber USA.",
      "Analysten sehen Aufholpotenzial bei politischer Stabilisierung.",
    ],
    "bewertungsabschlag-europa-aktien-analyse-8813102"
  ),

  // Apple
  n(
    "news-aapl-1",
    "stock-apple",
    "Apple übertrifft Erwartungen: Services-Umsatz erreicht Rekordniveau",
    1,
    "Ad-hoc-Meldung",
    "Bullisch",
    82,
    [
      "Quartalsumsatz und Gewinn je Aktie übertreffen Analystenkonsens deutlich.",
      "Services-Segment wächst zweistellig und stützt Margenprofil.",
      "Guidance für kommendes Quartal optimistisch, Aktie vorbörslich im Plus.",
    ],
    "apple-quartalszahlen-services-rekord-8821555"
  ),
  n(
    "news-aapl-2",
    "stock-apple",
    "iPhone-Absatz in China rückläufig – Sorgen um Marktanteile wachsen",
    4,
    "News",
    "Bärisch",
    31,
    [
      "Lokale Wettbewerber gewinnen im Premium-Segment weiter Marktanteile.",
      "Absatzzahlen für das laufende Quartal unter Vorjahresniveau.",
      "Analysten senken vereinzelt Umsatzschätzungen für Greater China.",
    ],
    "iphone-absatz-china-ruecklaeufig-8818221"
  ),
  n(
    "news-aapl-3",
    "stock-apple",
    "Analysten heben Kursziel nach Apple-Intelligence-Update an",
    7,
    "Analyse",
    "Bullisch",
    75,
    [
      "Erweiterte KI-Funktionen erhalten positives Nutzerfeedback in ersten Tests.",
      "Mehrere Analysehäuser erhöhen Kursziel und Umsatzschätzungen.",
      "Upgrade-Zyklus für KI-fähige iPhones wird als Katalysator gesehen.",
    ],
    "apple-intelligence-kursziel-analysten-8815890"
  ),

  // NVIDIA
  n(
    "news-nvda-1",
    "stock-nvidia",
    "NVIDIA: Nachfrage nach neuer Blackwell-Generation übersteigt Produktionskapazität",
    1,
    "News",
    "Bullisch",
    88,
    [
      "Auftragsbestand für neue KI-Chip-Generation reicht bis weit ins nächste Jahr.",
      "Lieferengpässe bei Fortschrittspaketierung limitieren kurzfristig Auslieferungen.",
      "Preissetzungsmacht bleibt trotz Kapazitätsengpässen hoch.",
    ],
    "nvidia-blackwell-nachfrage-8821788"
  ),
  n(
    "news-nvda-2",
    "stock-nvidia",
    "US-Exportbeschränkungen für KI-Chips nach China verschärft",
    3,
    "Ad-hoc-Meldung",
    "Bärisch",
    27,
    [
      "Neue Regularien schränken Verkauf leistungsstarker Chips nach China weiter ein.",
      "Betroffener Umsatzanteil laut Unternehmensangaben mittelfristig relevant.",
      "Aktie reagiert mit erhöhter Volatilität auf Nachricht.",
    ],
    "nvidia-exportbeschraenkungen-china-8819334"
  ),
  n(
    "news-nvda-3",
    "stock-nvidia",
    "NVIDIA-Quartalszahlen: Rekordumsatz im Rechenzentrumsgeschäft",
    9,
    "Ad-hoc-Meldung",
    "Bullisch",
    85,
    [
      "Rechenzentrumssegment wächst erneut mit hoher zweistelliger bis dreistelliger Rate.",
      "Bruttomarge bleibt trotz Produktmix-Verschiebung robust hoch.",
      "Management signalisiert anhaltend starke Nachfrage für kommende Quartale.",
    ],
    "nvidia-quartalszahlen-rechenzentrum-8816433"
  ),

  // Microsoft
  n(
    "news-msft-1",
    "stock-microsoft",
    "Azure wächst schneller als erwartet – Copilot treibt Zusatzumsatz",
    2,
    "News",
    "Bullisch",
    79,
    [
      "Cloud-Segment übertrifft Wachstumserwartungen der Analysten deutlich.",
      "Copilot-Abonnements steigen quartalsweise zweistellig.",
      "Management erhöht Investitionsausblick für KI-Infrastruktur.",
    ],
    "microsoft-azure-copilot-wachstum-8820991"
  ),
  n(
    "news-msft-2",
    "stock-microsoft",
    "Kartellbehörden prüfen OpenAI-Partnerschaft von Microsoft genauer",
    5,
    "News",
    "Bärisch",
    38,
    [
      "Wettbewerbsbehörden in EU und USA leiten vertiefte Prüfung ein.",
      "Mögliche Auflagen könnten Struktur der Partnerschaft beeinflussen.",
      "Kurzfristig begrenzter Kursreaktion, regulatorisches Risiko bleibt im Blick.",
    ],
    "microsoft-openai-kartellpruefung-8817655"
  ),
  n(
    "news-msft-3",
    "stock-microsoft",
    "Microsoft erhöht Investitionsbudget für Rechenzentren deutlich",
    10,
    "News",
    "Neutral",
    55,
    [
      "Capex-Guidance für kommendes Geschäftsjahr deutlich angehoben.",
      "Investoren zeigen sich gespalten bezüglich kurzfristiger Free-Cashflow-Belastung.",
      "Management verweist auf starke Auslastung bestehender Kapazitäten als Rechtfertigung.",
    ],
    "microsoft-capex-rechenzentren-8814210"
  ),

  // Amazon
  n(
    "news-amzn-1",
    "stock-amazon",
    "AWS-Wachstum beschleunigt sich dank KI-Nachfrage",
    2,
    "News",
    "Bullisch",
    73,
    [
      "Cloud-Sparte wächst erstmals seit zwei Jahren wieder beschleunigt.",
      "Eigene Trainium-Chips senken Kosten für KI-Training laut Unternehmen deutlich.",
      "Operative Marge im Segment verbessert sich spürbar.",
    ],
    "amazon-aws-wachstum-ki-8820556"
  ),
  n(
    "news-amzn-2",
    "stock-amazon",
    "Schwächere Konsumausgaben belasten Amazon-Einzelhandelsgeschäft",
    6,
    "News",
    "Bärisch",
    34,
    [
      "Umsatzwachstum im Nordamerika-Einzelhandel verlangsamt sich sichtbar.",
      "Kunden verschieben Käufe zunehmend zu günstigeren Produktsegmenten.",
      "Guidance für Feiertagsquartal fällt vorsichtiger aus als im Vorjahr.",
    ],
    "amazon-konsumausgaben-einzelhandel-8817990"
  ),
  n(
    "news-amzn-3",
    "stock-amazon",
    "Amazon investiert Milliarden in Robotik und Logistikautomatisierung",
    11,
    "Analyse",
    "Bullisch",
    66,
    [
      "Automatisierung soll Erfüllungskosten pro Bestellung strukturell senken.",
      "Analysten sehen langfristig positive Margeneffekte für E-Commerce-Segment.",
      "Kurzfristig hohe Investitionsausgaben belasten Free Cashflow.",
    ],
    "amazon-robotik-logistik-investition-8813667"
  ),

  // Alphabet
  n(
    "news-googl-1",
    "stock-alphabet",
    "Google Cloud übertrifft erstmals Analystenerwartungen bei der Marge",
    1,
    "News",
    "Bullisch",
    76,
    [
      "Cloud-Segment erreicht operative Marge deutlich über Konsensschätzung.",
      "Gemini-basierte Enterprise-Produkte treiben Neukundengewinnung.",
      "Werbeumsatz wächst parallel stabil im zweistelligen Bereich.",
    ],
    "google-cloud-marge-uebertrifft-8821203"
  ),
  n(
    "news-googl-2",
    "stock-alphabet",
    "Kartellverfahren: US-Gericht prüft mögliche Zerschlagung von Google-Diensten",
    4,
    "Ad-hoc-Meldung",
    "Bärisch",
    24,
    [
      "Gerichtsverfahren zu möglichen strukturellen Auflagen läuft weiter.",
      "Ungewissheit über Ausgang belastet Bewertungsmultiplikator kurzfristig.",
      "Analysten verweisen auf langwierigen Berufungsprozess als dämpfenden Faktor.",
    ],
    "google-kartellverfahren-zerschlagung-8818877"
  ),
  n(
    "news-googl-3",
    "stock-alphabet",
    "Gemini-3-Modell verbessert Suchergebnisse laut ersten Nutzerdaten deutlich",
    8,
    "Analyse",
    "Bullisch",
    70,
    [
      "Verweildauer und Klickrate in ersten A/B-Tests spürbar verbessert.",
      "Analysten werten dies als Bestätigung der Verteidigungsstrategie gegen KI-Konkurrenz.",
      "Monetarisierung neuer KI-Suchformate bleibt zentraler Beobachtungspunkt.",
    ],
    "gemini-3-suchergebnisse-nutzerdaten-8815544"
  ),
];

export function getAssetById(id: string): Asset | undefined {
  return ASSETS.find((a) => a.id === id);
}

export function getNewsForAsset(assetId: string): NewsItem[] {
  return NEWS.filter((item) => item.assetId === assetId).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAssetWithNews(id: string): AssetWithNews | undefined {
  const asset = getAssetById(id);
  if (!asset) return undefined;
  return { ...asset, news: getNewsForAsset(id) };
}

export function searchAssets(query: string): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return ASSETS;
  return ASSETS.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.ticker.toLowerCase().includes(q) ||
      a.isin.toLowerCase().includes(q)
  );
}
