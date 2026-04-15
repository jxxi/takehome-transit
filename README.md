# Recidiviz Transit Takehome

This repo is organized by feature area so each task's logic, types, and tests stay close together.

## Structure

- `types.ts`: shared domain types from the prompt (`Route`, `Stop`, `RidershipObservation`, etc.)
- `feed.ts`: sample data used by tests and examples
- `solution.ts`: thin public entrypoint that re-exports task modules
- `validation/`: Task 1 implementation
  - `validation/index.ts`: `validateFeed()` orchestration + exports
  - `validation/types.ts`: validation report/issue types
  - `validation/checks/*.ts`: focused rule modules
  - `validation/validateFeed.test.ts`: task-specific unit tests
- `NOTES.md`: assumptions/tradeoffs for submission

## Conventions For New Tasks

For each new task, create a dedicated top-level folder and keep module + tests together.

Example:

- `summaries/index.ts`
- `summaries/types.ts`
- `summaries/<feature>.ts`
- `summaries/<feature>.test.ts`

Then re-export from `solution.ts` so the external API stays stable.

## Testing

- Run all tests: `npm test`
- Jest + `ts-jest` are configured in `package.json`
