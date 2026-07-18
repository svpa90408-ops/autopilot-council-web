import type { Env, EvidenceItem } from "../types";
import { isoNow } from "../utils";

export async function getSecSubmissions(env: Env, cik: string): Promise<EvidenceItem[]> {
  const padded = cik.replace(/\D/g, "").padStart(10, "0");
  if (!/^\d{10}$/.test(padded)) throw new Error("Invalid CIK.");

  const response = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
    headers: {
      "user-agent": env.SEC_USER_AGENT,
      "accept-encoding": "gzip, deflate",
      "host": "data.sec.gov"
    }
  });
  if (!response.ok) throw new Error(`SEC submissions request failed with ${response.status}.`);

  const data = await response.json() as {
    name?: string;
    tickers?: string[];
    filings?: { recent?: { accessionNumber?: string[]; form?: string[]; filingDate?: string[]; primaryDocument?: string[] } };
  };
  const recent = data.filings?.recent;
  const length = Math.min(recent?.form?.length ?? 0, 30);
  const output: EvidenceItem[] = [];

  for (let index = 0; index < length; index += 1) {
    const accession = recent?.accessionNumber?.[index];
    const form = recent?.form?.[index];
    const filingDate = recent?.filingDate?.[index];
    const document = recent?.primaryDocument?.[index];
    const accessionClean = accession?.replaceAll("-", "");
    const numericCik = String(Number(padded));
    const filingUrl = accessionClean && document
      ? `https://www.sec.gov/Archives/edgar/data/${numericCik}/${accessionClean}/${document}`
      : undefined;

    output.push({
      sourceType: "regulatory_filing",
      sourceName: "SEC EDGAR",
      url: filingUrl,
      title: `${data.name ?? "Company"} ${form ?? "filing"}`,
      publishedAt: filingDate,
      retrievedAt: isoNow(),
      trustTier: 1,
      status: "VERIFIED",
      summary: `Official SEC filing${form ? ` (${form})` : ""}.`,
      symbol: data.tickers?.[0],
      raw: { cik: padded, accession, form }
    });
  }
  return output;
}

export async function getCompanyFacts(env: Env, cik: string): Promise<Record<string, unknown>> {
  const padded = cik.replace(/\D/g, "").padStart(10, "0");
  const response = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`, {
    headers: {
      "user-agent": env.SEC_USER_AGENT,
      "accept-encoding": "gzip, deflate",
      "host": "data.sec.gov"
    }
  });
  if (!response.ok) throw new Error(`SEC company facts request failed with ${response.status}.`);
  return await response.json() as Record<string, unknown>;
}
