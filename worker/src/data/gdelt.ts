import type { EvidenceItem } from "../types";
import { isoNow } from "../utils";

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

export async function searchGdelt(query: string, maxRecords = 20): Promise<EvidenceItem[]> {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", String(Math.min(maxRecords, 75)));
  url.searchParams.set("sort", "datedesc");

  const response = await fetch(url, {
    headers: { "user-agent": "AutopilotCouncil/4.0 research@example.com" }
  });
  if (!response.ok) {
    throw new Error(`GDELT request failed with ${response.status}.`);
  }

  const data = await response.json() as { articles?: GdeltArticle[] };
  return (data.articles ?? []).map((article) => ({
    sourceType: "news",
    sourceName: article.domain ?? "GDELT indexed source",
    url: article.url,
    title: article.title ?? "Untitled article",
    publishedAt: article.seendate,
    retrievedAt: isoNow(),
    trustTier: 3,
    status: "UNVERIFIED",
    summary: `Global news lead indexed by GDELT${article.sourcecountry ? ` from ${article.sourcecountry}` : ""}.`,
    raw: { language: article.language, sourcecountry: article.sourcecountry }
  }));
}
