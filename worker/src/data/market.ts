import type { Env, MarketQuote } from "../types";
import { isoNow, parseNumber } from "../utils";

export async function getMarketQuote(env: Env, symbol: string): Promise<MarketQuote> {
  const clean = symbol.toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
  if (!clean) throw new Error("Invalid market symbol.");

  if (env.TWELVE_DATA_API_KEY) {
    const url = new URL("https://api.twelvedata.com/quote");
    url.searchParams.set("symbol", clean);
    url.searchParams.set("apikey", env.TWELVE_DATA_API_KEY);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Twelve Data request failed with ${response.status}.`);
    const data = await response.json() as Record<string, unknown>;
    if (data.status === "error") throw new Error(String(data.message ?? "Twelve Data error."));
    return {
      symbol: clean,
      price: parseNumber(data.close),
      changePct: parseNumber(data.percent_change),
      timestamp: String(data.datetime ?? isoNow()),
      source: "Twelve Data",
      delayed: true
    };
  }

  if (env.ALPHA_VANTAGE_API_KEY) {
    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("function", "GLOBAL_QUOTE");
    url.searchParams.set("symbol", clean);
    url.searchParams.set("apikey", env.ALPHA_VANTAGE_API_KEY);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Alpha Vantage request failed with ${response.status}.`);
    const data = await response.json() as { "Global Quote"?: Record<string, string> };
    const quote = data["Global Quote"] ?? {};
    return {
      symbol: clean,
      price: parseNumber(quote["05. price"]),
      changePct: parseNumber((quote["10. change percent"] ?? "0").replace("%", "")),
      timestamp: quote["07. latest trading day"] ?? isoNow(),
      source: "Alpha Vantage",
      delayed: true
    };
  }

  throw new Error("No market-data key is configured. Set TWELVE_DATA_API_KEY or ALPHA_VANTAGE_API_KEY.");
}
