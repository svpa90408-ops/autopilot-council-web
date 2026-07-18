# API endpoints

## Public read endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/conversations?limit=100`
- `GET /api/market/quote?symbol=MSFT`
- `GET /api/news/search?q=MSFT`
- `GET /api/sec/submissions?cik=0000789019`
- `GET /api/sec/companyfacts?cik=0000789019`

## Admin endpoints

Send `Authorization: Bearer <ADMIN_TOKEN>`.

- `POST /api/admin/cycle`
- `POST /api/admin/meeting`
- `POST /api/admin/approve`
- `POST /api/admin/reject`
- `POST /api/admin/halt`
- `POST /api/admin/mode`
- `POST /api/admin/congress/import`
- `POST /api/admin/institutional/import`
- `POST /api/admin/traders/import`
- `POST /api/admin/evidence/import`
- `POST /api/admin/improvements/propose`
- `POST /api/admin/seed`
