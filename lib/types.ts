export type AssetType = "ETF" | "Stock";

export type Sentiment = "Bullisch" | "Neutral" | "Bärisch";

export interface PricePoint {
  date: string; // ISO date
  value: number; // close, normalized index (100 = start)
  open: number;
  high: number;
  low: number;
}

export interface AllocationSlice {
  label: string;
  weight: number; // percent, 0-100
}

export interface HoldingPosition {
  name: string;
  ticker?: string;
  weight: number; // percent, 0-100
}

export interface ForecastPoint {
  date: string; // ISO date, monthly
  bull: number;
  base: number;
  bear: number;
}

export interface ForecastScenario {
  bullDrivers: string[];
  baseDrivers: string[];
  bearDrivers: string[];
  horizonMonths: number;
  points: ForecastPoint[];
}

export interface NewsItem {
  id: string;
  assetId: string;
  title: string;
  source: "finanzen.net";
  url: string;
  publishedAt: string; // ISO datetime
  type: "News" | "Analyse" | "Ad-hoc-Meldung";
  sentiment: Sentiment;
  sentimentScore: number; // 0-100
  aiSummary: string[]; // bullet points: impact on price
}

export interface PerformanceMetrics {
  y1: number;
  y3: number;
  y5: number;
  ytd: number;
  volatility: number; // annualized, %
  sharpeRatio: number;
}

export interface EtfMetrics {
  ter: number; // %
  aum: number; // in EUR
  replicationMethod: "Physisch (Full Replication)" | "Physisch (Sampling)" | "Synthetisch (Swap)";
  distributionPolicy: "Ausschüttend" | "Thesaurierend";
  distributionFrequency?: "Monatlich" | "Quartalsweise" | "Halbjährlich" | "Jährlich";
  fundDomicile: string;
  inceptionDate: string;
  topHoldings: HoldingPosition[];
}

export interface StockMetrics {
  pe: number;
  pb: number;
  dividendYield: number; // %
  revenueGrowthYoY: number; // %
  revenueGrowth3yCagr: number; // %
  profitGrowthYoY: number; // %
  profitGrowth3yCagr: number; // %
  debtToEquity: number;
  fcfMargin: number; // %
  marketCap: number; // EUR
  sector: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  ticker: string;
  isin: string;
  currency: string;
  logoColor: string; // fallback avatar color
  performance: PerformanceMetrics;
  sectorAllocation: AllocationSlice[];
  regionAllocation: AllocationSlice[];
  priceHistory: PricePoint[];
  forecast: ForecastScenario;
  etf?: EtfMetrics;
  stock?: StockMetrics;
}

export interface AssetWithNews extends Asset {
  news: NewsItem[];
}
