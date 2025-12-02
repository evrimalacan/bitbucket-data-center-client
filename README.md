# Bitbucket Data Center Client

TypeScript client for Bitbucket Server/Data Center REST API.

## Installation

```bash
npm install bitbucket-data-center-client
```

## Usage

```typescript
import { BitbucketClient } from 'bitbucket-data-center-client';

const client = new BitbucketClient({
  token: 'your-personal-access-token',
  baseUrl: 'https://bitbucket.example.com'
});

// List projects
const projects = await client.listProjects();

// Browse repository contents
const contents = await client.browse({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  path: 'src'
});

// Get raw file content
const file = await client.getRawContent({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  path: 'package.json'
});
```

## Available Methods

| Category | Methods |
|----------|---------|
| Users | `getUserProfile`, `getAllUsers` |
| Projects | `listProjects` |
| Repositories | `listRepositories`, `getRepository`, `browse`, `getRawContent` |
| Pull Requests | `getInboxPullRequests`, `getDashboardPullRequests`, `getPullRequest`, `createPullRequest`, `getRequiredReviewers` |
| PR Changes | `getPullRequestChanges`, `getPullRequestDiff`, `getPullRequestFileDiff` |
| PR Comments | `addPullRequestComment`, `deletePullRequestComment`, `getPullRequestActivities` |
| PR Review | `updateReviewStatus`, `addPullRequestCommentReaction`, `removePullRequestCommentReaction` |

## Authentication

Generate a Personal Access Token in Bitbucket: **Profile → Manage account → Personal access tokens**

## Requirements

- Node.js >= 18.0.0
- Bitbucket Server/Data Center 7.0+

## License

MIT
