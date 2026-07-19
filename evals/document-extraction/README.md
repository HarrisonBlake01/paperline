# Document-extraction evaluation

A small, synthetic, privacy-safe regression set for Paperline's structured extraction shape.
No network calls, credentials, or customer documents are used.

- `cases.json` contains document text, the template schema, and labeled `ExtractionResult` values.
- `sample-predictions.json` is a deliberately imperfect example output used to exercise every metric.
- `scripts/evaluate-extraction.ts` scores predictions against all schema fields.

Run the bundled sample:

```sh
pnpm test:extraction-eval
```

Score another output file (same case-id to `ExtractionResult` map shape):

```sh
pnpm test:extraction-eval -- path/to/predictions.json
```

Metrics:

- **Exact field accuracy** compares JSON values without normalization.
- **Normalized field accuracy** applies field-type-aware normalization: case/whitespace for text, numeric parsing, deterministic ISO/named-month date parsing, common boolean forms, and order-insensitive list comparison.
- **Presence precision/recall/F1** measures null versus non-null extraction behavior.
- **List-item precision/recall/F1** measures normalized list membership.

Confidence values remain in the product-compatible fixture shape but are not scored because this set does not contain enough examples to evaluate confidence calibration meaningfully.
