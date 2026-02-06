# Mini Name Screening Service

A lightweight backend service that performs fuzzy name screening against a watchlist.
It reads input data from files, compares names using approximate matching, and produces structured screening results.

This project is designed as a mini compliance / screening engine, focusing on correctness, explainability, and defensive file handling.

---

## Features

- File-based input processing
- Fuzzy name comparison using Jaro–Winkler similarity
- Handles:
  - Spelling variations
  - Missing letters
  - Token reordering (e.g. "Smith Alex" vs "Alex Smith")
  - Multiple aliases for the same input
- Deduplicates watchlist entries (one result per watchlist person)
- Match classification:
  - EXACT_MATCH
  - POSSIBLE_MATCH
  - NO_MATCH
- Generates:
  - Detailed screening output
  - Consolidated summary output
- Defensive error handling
- Cleans up output directory on failure
- Simple REST API trigger

---

## Project Structure

mini-name-screening/
├── app.js
├── watchlist.json
├── package.json
├── data/
│ └── {userId}/{requestId}/input/input.json
├── output/
│ └── {userId}/{requestId}/
│ ├── detailed.json
│ └── consolidated.json
├── utils/
│ ├── normalise.js
│ ├── similarity.js
│ └── logger.js
└── logs/app.log

---

## Input Format

data/{userId}/{requestId}/input/input.json

```json
{
  "requestId": "REQ-3001",
  "fullName": ["Alex Jon Smyth", "Smyth Alex"],
  "country": "US"
}
```

- fullName can be a string or an array of aliases

---

## Watchlist Format

watchlist.json

```json
[
  { "id": "W1", "name": "Alex John Smith" },
  { "id": "W2", "name": "Maria Garcia" },
  { "id": "W3", "name": "Smith Alex" }
]
```

---

## Matching Logic

- Names are normalized (lowercase, punctuation removed, extra spaces collapsed)
- Tokens are sorted to handle reordering
- Jaro–Winkler similarity is used for fuzzy matching
- Only the best alias match per watchlist person is retained

---

## Match Classification

| Score Range | Match Type     |
| ----------- | -------------- |
| >= 0.90     | EXACT_MATCH    |
| 0.75 – 0.89 | POSSIBLE_MATCH |
| < 0.75      | NO_MATCH       |

---

## Output Files

### detailed.json

Contains full screening details including aliases and top matches.

### consolidated.json

Contains the final screening result and ISO-8601 timestamp.

---

## API Usage

POST /process/{userId}/{requestId}

Example:

POST http://localhost:3000/process/user123/REQ-3001

No request body is required.

Response:

```json
{
  "outputPath": "output/user123/REQ-3001"
}
```

---

## Error Handling

- Missing input or watchlist files cause failure
- Invalid JSON causes failure
- Output directories are deleted on error
- No partial output is left behind
- All major steps are logged

---

## Logging

Logs are written to logs/app.log with timestamps and request identifiers.

---

## Running the App

```bash
npm install
node app.js
```

Server runs on port 3000.

---

## Notes

- Output timestamps use ISO-8601 format
- Designed for correctness and explainability
- No database required
