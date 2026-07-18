# 5 — Operating the paper system

## Approval Mode

A research cycle can create an eligible decision, but the browser must approve the paper order.

## Autopilot Mode

The scheduled Worker can execute eligible paper decisions after Fact Checker and Risk Manager approval. It still cannot submit a real broker order.

## Schedule

The Worker Cron Trigger runs every 30 minutes:

1. Rotates to the next strategy department.
2. Builds a candidate from configured real sources or honest missing-data placeholders.
3. Runs one Workers AI council call when enabled.
4. Falls back to deterministic evidence-weighted logic if AI is unavailable.
5. Applies hard risk rules.
6. Optionally creates a paper order in Autopilot Mode.
7. Marks holdings with available quotes.
8. Opens loss reviews when needed.
9. Runs and stores the 30-minute meta-learning meeting.

## Emergency halt

The halt endpoint sets `system_halted=true` in D1. Scheduled research and paper execution stop until it is reset.

## Learning rules

The system may create improvement proposals. It cannot silently change risk limits. A safe change should pass:

```text
proposal → historical test → shadow simulation → improvement council → user approval → versioned update
```

## Keep the system honest

- Missing information must remain missing.
- Unverified news must not become fact through repetition.
- A winning trade can still have poor reasoning.
- A losing trade can still have sound reasoning.
- Total return is not enough; drawdown and risk-adjusted return matter more.
