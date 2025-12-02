# AGENTS.md

Guidance for coding agents working with this repository.

## Project Overview

TypeScript client library for Bitbucket Server/Data Center REST API. ESM-only package using axios.

## Commands

```bash
npm run build    # Compile TypeScript to dist/
npm run clean    # Remove dist/
npm run test     # Run tests
```

## Structure

- `src/client.ts` - BitbucketClient class with all API methods
- `src/types.ts` - TypeScript type definitions
- `src/index.ts` - Public exports

## Adding New Methods

1. Add params interface to `types.ts`
2. Add response type to `types.ts` if needed
3. Import types and implement method in `client.ts`
4. Run `npm run build` to verify

## Commit Convention

- Present tense ("Add feature" not "Added feature")
- Concise subject line
- Optional short description on new line
- No signatures or co-author tags
