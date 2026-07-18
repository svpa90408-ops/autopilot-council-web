INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES
  ('system_halted', 'false', datetime('now')),
  ('execution_mode', 'approval', datetime('now'));

INSERT OR IGNORE INTO source_health (source_name, source_type, status, updated_at) VALUES
  ('GDELT', 'news', 'NOT_TESTED', datetime('now')),
  ('SEC EDGAR', 'filings', 'NOT_TESTED', datetime('now')),
  ('Twelve Data', 'market', 'KEY_REQUIRED', datetime('now')),
  ('Alpha Vantage', 'market', 'OPTIONAL_KEY', datetime('now')),
  ('Congress official import', 'congress', 'MANUAL_IMPORT_REQUIRED', datetime('now')),
  ('Verified trader provider', 'traders', 'PROVIDER_REQUIRED', datetime('now'));

INSERT OR IGNORE INTO improvement_proposals
(owner, title, detail, status, backtest_result_json, user_approved, created_at, updated_at)
VALUES
('Bias Detector', 'Strategy-specific freshness thresholds',
 'Breaking news, congressional disclosures and 13F filings should not share one age penalty.',
 'PROPOSED', '{}', 0, datetime('now'), datetime('now')),
('Data Quality Researcher', 'Primary-source confirmation for major catalysts',
 'Require an official company or government source before a large paper allocation.',
 'APPROVED_RULE', '{}', 1, datetime('now'), datetime('now'));
