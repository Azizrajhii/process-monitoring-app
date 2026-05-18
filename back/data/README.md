Usage:

- `import_measurements.csv` is a sample CSV compatible with the backend `POST /api/measurements/import-csv` endpoint.
- Columns accepted (case-insensitive): `process` (id or name), `value`, `date` (ISO), `comment`.

To import via curl (requires an authenticated token):

curl -X POST "http://localhost:5000/api/measurements/import-csv" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d @payload.json

Where `payload.json` content:
{
  "csv": "$(cat import_measurements.csv | sed ':a;N;$!ba;s/\n/\\n/g')"
}

Alternatively open the file and paste the CSV into the import UI if provided.
