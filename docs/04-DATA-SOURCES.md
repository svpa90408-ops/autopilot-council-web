# 4 — Data-source status

## Available without a key

### GDELT

Used for broad global-news discovery. GDELT items are treated as leads until stronger evidence verifies them.

### SEC EDGAR

Used for official company submissions and XBRL company facts. Configure a truthful `SEC_USER_AGENT` containing a contact email.

## Free key required

### Twelve Data or Alpha Vantage

Used for delayed/current quote research depending on the provider plan. The adapter never assumes the data is exchange-grade real time.

## Normalised official import required

### Congressional disclosures

Use `POST /api/admin/congress/import` with the structure in:

```text
sample-data/congress-trades.example.json
```

Only import records traced to an official disclosure URL. The system stores transaction date and disclosure date separately so reporting delay can be penalised.

### Institutional and insider activity

Use `POST /api/admin/institutional/import` with the structure in:

```text
sample-data/institutional-signals.example.json
```

The signal should be derived from an official SEC filing or another authoritative source.

### Top-ten trader consensus

Use `POST /api/admin/traders/import` with verified, opt-in data. Ten eligible profiles are required. The system ranks them by risk-adjusted performance, drawdown, consistency and sample size.

Random social-media posts must not be marked as broker verified.

## Primary evidence import

Company announcements or other verified primary evidence can be imported through `POST /api/admin/evidence/import` using:

```text
sample-data/evidence.example.json
```
