# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript client library for Bitbucket Server/Data Center REST API. This is a lightweight NPM package that provides a type-safe interface for interacting with Bitbucket Server's REST API, focused on users, projects, repositories, and pull request operations.

## Development Commands

```bash
# Build
npm run build              # Compile TypeScript to dist/

# Clean build artifacts
npm run clean              # Remove dist/ directory

# Prepare for publishing
npm run prepublishOnly     # Clean + build (runs automatically before npm publish)

# Testing
npm run test               # Currently no tests (exits 0)
```

## Architecture

### Project Structure
- **src/client.ts**: Main `BitbucketClient` class with all API methods
- **src/types.ts**: Comprehensive TypeScript type definitions for all Bitbucket entities
- **src/index.ts**: Public API exports (client class and all types)
- **BitbucketServerSwagger.json**: Official Bitbucket Server API specification (reference)

### Client Design
The `BitbucketClient` is a simple wrapper around axios that:
- Requires `token` and `baseUrl` as essential configuration
- Accepts optional `axiosConfig` for advanced customization (timeout, headers, etc.)
- Automatically appends `/rest/api/latest` to the base URL
- Uses Bearer token authentication with Bitbucket Personal Access Tokens
- Merges user-provided axios config with authentication headers
- Provides typed methods for all supported operations
- Returns strongly-typed responses using types from `types.ts`

### Type System
All types are derived from the official Bitbucket Server Swagger specification and organized in `types.ts`:
- **Configuration**: `BitbucketClientConfig` - client constructor configuration
- **Common**: `PaginatedResponse<T>` - generic wrapper for list endpoints
- **Entities**: `RestUser`, `RestProject`, `RestRepository`, `RestPullRequest`, etc.
- **Method Parameters**: Each client method has a dedicated params interface (e.g., `GetPullRequestParams`)
- **API Responses**: Specialized response types for complex operations (e.g., `DiffResponse`, `ChangesResponse`)

### Key API Categories
1. **User Operations**: Get user profiles, list users
2. **Project Operations**: List projects with filtering
3. **Repository Operations**: List repositories in a project
4. **Pull Request Operations**: Full PR workflow including:
   - Getting inbox PRs (where user is reviewer)
   - PR details, changes, and diffs
   - Comments (general, file-level, line-level)
   - Activities (comments, approvals, reviews)
   - Review status (approve, request changes, unapprove)
   - Comment reactions (emojis)

### TypeScript Configuration
- **Target**: ES2022 with Node16 module resolution
- **Strict Mode**: Full strict mode enabled with all type safety flags
- **Output**: ESM modules with declaration files (.d.ts) and source maps
- **Type Checking**: Enforces no unused locals/parameters, no implicit returns, no unchecked indexed access

## Package Configuration

This is an **ESM-only package** (type: "module" in package.json):
- Main entry: `./dist/index.js`
- Types entry: `./dist/index.d.ts`
- All imports must use `.js` extensions (even for TypeScript files)
- Requires Node.js >= 18.0.0

## Authentication

The client uses Bitbucket Personal Access Tokens via Bearer authentication:
```typescript
// Simple configuration (most common)
const client = new BitbucketClient({
  token: 'your-personal-access-token',
  baseUrl: 'https://bitbucket.example.com'
});

// Advanced: with optional axios configuration
const client = new BitbucketClient({
  token: 'your-personal-access-token',
  baseUrl: 'https://bitbucket.example.com',
  axiosConfig: {
    timeout: 10000,
    headers: {
      'X-Custom-Header': 'value'
    }
  }
});
```

Tokens are generated in Bitbucket Server at: Profile → Manage account → Personal access tokens

The optional `axiosConfig` parameter accepts any axios configuration options (timeout, headers, interceptors, etc.) for advanced use cases.

## Common Development Patterns

### Adding New API Methods
1. Add the method parameters interface to `types.ts`
2. Add the response type to `types.ts` (if not already present)
3. Import the new types in `client.ts`
4. Implement the method in `BitbucketClient` class in `client.ts`
5. Update the README.md with usage examples
6. Run `npm run build` to verify TypeScript compilation

Note: All types are automatically exported via `export type * from './types.js'` in index.ts

### Working with Pull Request Diffs
- Use `getPullRequestFileDiff()` for structured line-by-line diffs with exact line numbers
- Use `getPullRequestDiff()` for raw unified diff format or JSON hunks
- Line numbers from diffs are required for adding inline comments
- Match `lineType` (ADDED/REMOVED/CONTEXT) and `fileType` (FROM/TO) when commenting

### Error Handling
All methods throw axios errors on failure. Use `axios.isAxiosError(error)` to check and access `error.response?.data` for API error details.

## Commit Convention

Commits must follow these rules:

- **Present tense**: Use "Add feature" not "Added feature"
- **Concise**: Keep the subject line short and to the point
- **Description**: Add a short relevant description on a new line if needed
- **No signatures**: Do not include agent signatures or co-author tags

### Format
```
<subject line in present tense>

<optional short description>
```

### Examples
```
Add browse and getRawContent methods

New methods for browsing repository contents and fetching raw file content
```

```
Fix pagination in list endpoints
```
