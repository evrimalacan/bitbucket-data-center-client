# Bitbucket Data Center Client

A TypeScript client library for Bitbucket Server/Data Center REST API. This library provides a simple, type-safe interface for interacting with Bitbucket Server's REST API.

## Features

- 🔒 **Type-safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Simple**: Clean, intuitive API design
- 📦 **Lightweight**: Minimal dependencies (only axios)
- 🎯 **Complete**: Covers users, projects, repositories, and pull requests operations

## Installation

```bash
npm install bitbucket-data-center-client
```

## Quick Start

```typescript
import { BitbucketClient } from 'bitbucket-data-center-client';

// Initialize the client
const client = new BitbucketClient({
  token: 'your-personal-access-token',
  baseUrl: 'https://bitbucket.example.com'
});

// Get user profile
const user = await client.getUserProfile({ username: 'john.doe' });
console.log(user.displayName);

// List projects
const projects = await client.listProjects({ limit: 10 });
projects.values.forEach(project => {
  console.log(`${project.key}: ${project.name}`);
});

// Get pull requests in your inbox
const prs = await client.getInboxPullRequests({ limit: 25 });
prs.values.forEach(pr => {
  console.log(`PR #${pr.id}: ${pr.title}`);
});
```

## Authentication

The client uses **Bearer token authentication** with Bitbucket Personal Access Tokens:

1. Generate a Personal Access Token in Bitbucket Server:
   - Navigate to **Profile → Manage account → Personal access tokens**
   - Create a token with appropriate permissions (e.g., `REPO_READ`, `REPO_WRITE`)
2. Pass the token and base URL to the client constructor

```typescript
// Simple configuration (most common)
const client = new BitbucketClient({
  token: process.env.BITBUCKET_TOKEN!,
  baseUrl: process.env.BITBUCKET_URL! // e.g., 'https://bitbucket.example.com'
});

// Advanced: with custom axios configuration
const client = new BitbucketClient({
  token: process.env.BITBUCKET_TOKEN!,
  baseUrl: process.env.BITBUCKET_URL!,
  axiosConfig: {
    timeout: 10000,
    headers: {
      'X-Custom-Header': 'value'
    }
  }
});
```

## API Reference

### User Operations

#### Get User Profile

```typescript
const user = await client.getUserProfile({
  username: 'john.doe'
});
console.log(user.displayName, user.emailAddress);
```

#### Get All Users

```typescript
const users = await client.getAllUsers({
  filter: 'john' // Optional: filter by username, name, or email
});
```

### Project Operations

#### List Projects

```typescript
const projects = await client.listProjects({
  name: 'MyProject',           // Optional: filter by name
  permission: 'PROJECT_WRITE', // Optional: filter by permission
  start: 0,                    // Optional: pagination start
  limit: 25                    // Optional: page size
});
```

### Repository Operations

#### List Repositories

```typescript
const repos = await client.listRepositories({
  projectKey: 'PROJ'
});
repos.values.forEach(repo => {
  console.log(`${repo.slug}: ${repo.name}`);
});
```

#### Get Repository

```typescript
const repo = await client.getRepository({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo'
});
console.log(`ID: ${repo.id}, Name: ${repo.name}`);
```

### Pull Request Operations

#### Get Inbox Pull Requests

Get all PRs where you're assigned as a reviewer:

```typescript
const prs = await client.getInboxPullRequests({
  start: 0,
  limit: 25
});
```

#### Get Pull Request Details

```typescript
const pr = await client.getPullRequest({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123
});
console.log(pr.title, pr.author?.user.displayName);
```

#### Create Pull Request

Create a new pull request. Branch names are automatically converted to full refs:

```typescript
// Simple same-repo PR
const pr = await client.createPullRequest({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  title: 'Add new feature',
  description: 'This PR adds the new feature as discussed',
  fromBranch: 'feature-branch',  // Just the branch name
  toBranch: 'main'
});

// PR with reviewers
const prWithReviewers = await client.createPullRequest({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  title: 'Fix critical bug',
  description: 'Fixes issue #123',
  fromBranch: 'bugfix/critical-issue',
  toBranch: 'develop',
  reviewers: ['john.doe', 'jane.smith']
});

// Draft PR
const draftPr = await client.createPullRequest({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  title: 'WIP: Refactor authentication',
  fromBranch: 'wip/auth-refactor',
  toBranch: 'main',
  draft: true
});

// Cross-repo PR (from fork to upstream)
const crossRepoPr = await client.createPullRequest({
  projectKey: 'UPSTREAM',
  repositorySlug: 'upstream-repo',
  title: 'Contribution from fork',
  fromBranch: 'feature',
  toBranch: 'main',
  fromRepositorySlug: 'my-fork',
  fromProjectKey: 'MYPROJ'
});
```

#### Get Required/Default Reviewers

Get the list of default reviewers for a PR before creating it. **Important:** Default reviewers are NOT automatically added when creating PRs via API - you must fetch them and pass them explicitly.

Use `getRepository()` to obtain the repository ID:

```typescript
// First get the repository to obtain its ID
const repo = await client.getRepository({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo'
});

// Get default reviewers for a specific source/target branch combination
const reviewers = await client.getRequiredReviewers({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  repositoryId: repo.id,
  sourceBranch: 'feature-branch',
  targetBranch: 'main'
});

console.log('Required reviewers:', reviewers.map(r => r.displayName));

// Create PR with default reviewers
const pr = await client.createPullRequest({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  title: 'My feature',
  fromBranch: 'feature-branch',
  toBranch: 'main',
  reviewers: reviewers.map(r => r.name)
});
```

#### Get Pull Request Changes

Get list of changed files:

```typescript
const changes = await client.getPullRequestChanges({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123
});
changes.values.forEach(change => {
  console.log(`${change.type}: ${change.path?.toString}`);
});
```

#### Get Pull Request Diff

Get diff for entire PR or specific file:

```typescript
// Full PR diff (text format)
const textDiff = await client.getPullRequestDiff({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  format: 'text'
});

// Structured diff for specific file
const structuredDiff = await client.getPullRequestDiff({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  path: 'src/index.ts',
  format: 'json',
  contextLines: 3
});
```

#### Get File Diff with Line Numbers

Get structured line-by-line diff for a specific file:

```typescript
const diff = await client.getPullRequestFileDiff({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  path: 'src/main.ts',
  contextLines: 10
});

// Access hunks and segments
diff.diffs[0]?.hunks?.forEach(hunk => {
  hunk.segments.forEach(segment => {
    segment.lines.forEach(line => {
      console.log(`Line ${line.destination}: ${line.line}`);
    });
  });
});
```

#### Get Pull Request Activities

Get PR activity (comments, approvals, etc.):

```typescript
const activities = await client.getPullRequestActivities({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  activityTypes: ['COMMENTED', 'REVIEW_COMMENTED'], // Optional filter
  start: 0,
  limit: 25
});

activities.values.forEach(activity => {
  console.log(`${activity.action}: ${activity.comment?.text}`);
});
```

#### Add Pull Request Comment

Add general, file, or line comment:

```typescript
// General comment
await client.addPullRequestComment({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'Looks good to me!'
});

// File-level comment
await client.addPullRequestComment({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'This file needs refactoring',
  path: 'src/main.ts'
});

// Inline comment on specific line
await client.addPullRequestComment({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'Consider using const here',
  path: 'src/main.ts',
  line: 42,
  lineType: 'ADDED',
  fileType: 'TO'
});

// Reply to a comment
await client.addPullRequestComment({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  text: 'Good catch!',
  parentId: 456
});
```

#### Delete Pull Request Comment

```typescript
await client.deletePullRequestComment({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  commentId: 456,
  version: 1 // Get from comment object
});
```

#### Update Review Status

Approve, request changes, or remove approval:

```typescript
// Approve PR
await client.updateReviewStatus({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  status: 'APPROVED'
});

// Request changes
await client.updateReviewStatus({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  status: 'NEEDS_WORK'
});

// Remove approval
await client.updateReviewStatus({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  status: 'UNAPPROVED'
});
```

#### Add/Remove Comment Reactions

```typescript
// Add reaction
await client.addPullRequestCommentReaction({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  commentId: 456,
  emoticon: 'thumbsup' // thumbsup, thumbsdown, heart, thinking_face, laughing
});

// Remove reaction
await client.removePullRequestCommentReaction({
  projectKey: 'PROJ',
  repositorySlug: 'my-repo',
  pullRequestId: 123,
  commentId: 456,
  emoticon: 'thumbsup'
});
```

## Complete Example: PR Review Workflow

```typescript
import { BitbucketClient } from 'bitbucket-data-center-client';

const client = new BitbucketClient({
  token: process.env.BITBUCKET_TOKEN!,
  baseUrl: process.env.BITBUCKET_URL!
});

async function reviewPullRequest() {
  // 1. Get PRs in your inbox
  const inbox = await client.getInboxPullRequests({ limit: 10 });
  const pr = inbox.values[0];

  if (!pr) {
    console.log('No PRs to review');
    return;
  }

  console.log(`Reviewing: ${pr.title}`);

  // 2. Get PR details
  const projectKey = pr.toRef.repository.project.key;
  const repositorySlug = pr.toRef.repository.slug;
  const pullRequestId = pr.id;

  // 3. Get changed files
  const changes = await client.getPullRequestChanges({
    projectKey,
    repositorySlug,
    pullRequestId
  });

  console.log(`Changed files: ${changes.values.length}`);

  // 4. Review each file
  for (const change of changes.values) {
    const path = change.path?.toString;
    if (!path) continue;

    // Get file diff
    const diff = await client.getPullRequestFileDiff({
      projectKey,
      repositorySlug,
      pullRequestId,
      path
    });

    // Check for issues and add comments
    diff.diffs[0]?.hunks?.forEach(hunk => {
      hunk.segments.forEach(segment => {
        if (segment.type === 'ADDED') {
          segment.lines.forEach(line => {
            if (line.line?.includes('console.log')) {
              // Add inline comment
              client.addPullRequestComment({
                projectKey,
                repositorySlug,
                pullRequestId,
                text: 'Please remove console.log before merging',
                path,
                line: line.destination!,
                lineType: 'ADDED',
                fileType: 'TO'
              });
            }
          });
        }
      });
    });
  }

  // 5. Approve or request changes
  await client.updateReviewStatus({
    projectKey,
    repositorySlug,
    pullRequestId,
    status: 'NEEDS_WORK'
  });

  console.log('Review complete!');
}

reviewPullRequest().catch(console.error);
```

## Type Definitions

This library exports comprehensive TypeScript types for all API entities:

```typescript
import type {
  // Common
  PaginatedResponse,
  // User & Project
  RestUser,
  RestProject,
  RestRepository,
  // Pull Request
  RestPullRequest,
  InboxPullRequest,
  RestComment,
  RestChange,
  DiffResponse,
  RestPullRequestActivity,
  // Method parameters
  GetPullRequestParams,
  AddPullRequestCommentParams,
  UpdateReviewStatusParams,
  // ... and many more
} from 'bitbucket-data-center-client';
```

See [types.ts](./src/types.ts) for the complete list of exported types.

## API Documentation

This library is based on the official Bitbucket Server REST API. See `BitbucketServerSwagger.json` in this package for the complete API specification.

## Error Handling

The client throws axios errors for failed requests:

```typescript
try {
  const pr = await client.getPullRequest({
    projectKey: 'PROJ',
    repositorySlug: 'my-repo',
    pullRequestId: 999
  });
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data);
  }
}
```

## Requirements

- Node.js >= 18.0.0
- Bitbucket Server/Data Center 7.0+

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:
- GitHub Issues: [your-repo-url]
- Documentation: See inline JSDoc comments in the source code
