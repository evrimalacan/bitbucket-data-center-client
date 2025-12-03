import axios, { type AxiosInstance } from 'axios';
import type {
  AddCommentBody,
  AddPullRequestCommentParams,
  AddPullRequestCommentReactionParams,
  BitbucketClientConfig,
  BrowseParams,
  BrowseResponse,
  ChangesResponse,
  CheckRepositoryPermissionsParams,
  CreatePullRequestBody,
  CreatePullRequestParams,
  DeletePullRequestCommentParams,
  DiffResponse,
  GetAllUsersParams,
  GetDashboardPullRequestsParams,
  GetRawContentParams,
  GetInboxPullRequestsParams,
  GetPullRequestActivitiesParams,
  GetPullRequestChangesParams,
  GetPullRequestDiffParams,
  GetPullRequestFileDiffParams,
  GetPullRequestParams,
  GetRepositoryParams,
  GetRequiredReviewersParams,
  GetUserProfileParams,
  InboxPullRequest,
  ListProjectsParams,
  ListRepositoriesParams,
  PaginatedResponse,
  RemovePullRequestCommentReactionParams,
  RepositoriesResponse,
  RepositoryPermissions,
  RestComment,
  RestProject,
  RestPullRequest,
  RestPullRequestActivityApiResponse,
  RestPullRequestParticipant,
  RestRepository,
  RestUser,
  RestUserReaction,
  UpdateReviewStatusParams,
} from './types.js';

/**
 * Bitbucket Server/Data Center API client.
 * Provides typed methods for interacting with Bitbucket Server REST API.
 */
export class BitbucketClient {
  private client: AxiosInstance;

  constructor(config: BitbucketClientConfig) {
    const { token, baseUrl, axiosConfig = {} } = config;

    // Merge user config with baseURL and authentication defaults
    this.client = axios.create({
      ...axiosConfig,
      baseURL: `${baseUrl}/rest/api/latest`,
      headers: {
        ...axiosConfig.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get a Bitbucket Server user profile by username
   */
  async getUserProfile(params: GetUserProfileParams): Promise<RestUser> {
    const response = await this.client.get<RestUser>(`/users/${params.username}`);
    return response.data;
  }

  /**
   * Get all users, optionally filtered by search term
   */
  async getAllUsers(params?: GetAllUsersParams): Promise<PaginatedResponse<RestUser>> {
    const response = await this.client.get<PaginatedResponse<RestUser>>('/users', {
      params: params?.filter ? { filter: params.filter } : {},
    });
    return response.data;
  }

  /**
   * List projects, optionally filtered by name or permission
   */
  async listProjects(params?: ListProjectsParams): Promise<PaginatedResponse<RestProject>> {
    const response = await this.client.get<PaginatedResponse<RestProject>>('/projects', {
      params,
    });
    return response.data;
  }

  /**
   * List all repositories in a project
   */
  async listRepositories(params: ListRepositoriesParams): Promise<RepositoriesResponse> {
    const response = await this.client.get<RepositoriesResponse>(`/projects/${params.projectKey}/repos`);
    return response.data;
  }

  /**
   * Get a repository by project key and slug
   */
  async getRepository(params: GetRepositoryParams): Promise<RestRepository> {
    const { projectKey, repositorySlug } = params;
    const response = await this.client.get<RestRepository>(`/projects/${projectKey}/repos/${repositorySlug}`);
    return response.data;
  }

  /**
   * Get pull requests in the authenticated user's inbox (where they are assigned as reviewer)
   */
  async getInboxPullRequests(params?: GetInboxPullRequestsParams): Promise<PaginatedResponse<InboxPullRequest>> {
    const response = await this.client.get<PaginatedResponse<InboxPullRequest>>('/inbox/pull-requests', { params });
    return response.data;
  }

  /**
   * Get pull requests from the user's dashboard.
   * Can filter by role (AUTHOR, REVIEWER, PARTICIPANT), state, and more.
   */
  async getDashboardPullRequests(
    params?: GetDashboardPullRequestsParams,
  ): Promise<PaginatedResponse<RestPullRequest>> {
    const response = await this.client.get<PaginatedResponse<RestPullRequest>>('/dashboard/pull-requests', {
      params: {
        role: 'AUTHOR',
        state: 'OPEN',
        order: 'NEWEST',
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Get pull request details (title, description, author, branches, etc.)
   */
  async getPullRequest(params: GetPullRequestParams): Promise<RestPullRequest> {
    const { projectKey, repositorySlug, pullRequestId } = params;
    const response = await this.client.get<RestPullRequest>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}`,
    );
    return response.data;
  }

  /**
   * Create a new pull request.
   * Supports both same-repo PRs (default) and cross-repo PRs (when fromRepositorySlug is provided).
   * Branch names are automatically converted to full refs (e.g., "main" → "refs/heads/main").
   */
  async createPullRequest(params: CreatePullRequestParams): Promise<RestPullRequest> {
    const {
      projectKey,
      repositorySlug,
      title,
      description,
      fromBranch,
      toBranch,
      fromRepositorySlug,
      fromProjectKey,
      reviewers,
      draft,
    } = params;

    // Convert branch names to full refs if needed
    const toRefId = (branch: string) =>
      branch.startsWith('refs/') ? branch : `refs/heads/${branch}`;

    const body: CreatePullRequestBody = {
      title,
      ...(description && { description }),
      fromRef: {
        id: toRefId(fromBranch),
        ...(fromRepositorySlug && {
          repository: {
            slug: fromRepositorySlug,
            project: { key: fromProjectKey || projectKey },
          },
        }),
      },
      toRef: {
        id: toRefId(toBranch),
      },
      ...(reviewers && reviewers.length > 0 && {
        reviewers: reviewers.map((username) => ({ user: { name: username } })),
      }),
      ...(draft !== undefined && { draft }),
    };

    const response = await this.client.post<RestPullRequest>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests`,
      body,
    );
    return response.data;
  }

  /**
   * Get all changed files in a pull request
   */
  async getPullRequestChanges(params: GetPullRequestChangesParams): Promise<ChangesResponse> {
    const { projectKey, repositorySlug, pullRequestId, limit } = params;
    const response = await this.client.get<ChangesResponse>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/changes`,
      { params: limit ? { limit } : {} },
    );
    return response.data;
  }

  /**
   * Get structured line-by-line diff for a specific file in a pull request
   */
  async getPullRequestFileDiff(params: GetPullRequestFileDiffParams): Promise<DiffResponse> {
    const { projectKey, repositorySlug, pullRequestId, path, contextLines } = params;
    const response = await this.client.get<DiffResponse>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/diff/${path}`,
      { params: contextLines ? { contextLines } : {} },
    );
    return response.data;
  }

  /**
   * Get diff for a pull request (or specific file).
   * When path is empty or undefined, returns the full PR diff.
   * Format controls the response type:
   * - 'text': Raw diff as plain text string
   * - 'json': Structured diff object (DiffResponse)
   */
  async getPullRequestDiff(params: GetPullRequestDiffParams): Promise<string | DiffResponse> {
    const {
      projectKey,
      repositorySlug,
      pullRequestId,
      path,
      sinceId,
      untilId,
      contextLines,
      whitespace,
      format = 'text',
    } = params;

    const queryParams: Record<string, string | number> = {};
    if (sinceId) queryParams['sinceId'] = sinceId;
    if (untilId) queryParams['untilId'] = untilId;
    if (contextLines !== undefined) queryParams['contextLines'] = contextLines;
    if (whitespace) queryParams['whitespace'] = whitespace;

    const response = await this.client.get<string | DiffResponse>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/diff/${path || ''}`,
      {
        params: queryParams,
        headers: { Accept: format === 'text' ? 'text/plain' : 'application/json' },
      },
    );
    return response.data;
  }

  /**
   * Get activity on a pull request (comments, approvals, merges, reviews, updates)
   */
  async getPullRequestActivities(
    params: GetPullRequestActivitiesParams,
  ): Promise<PaginatedResponse<RestPullRequestActivityApiResponse>> {
    const { projectKey, repositorySlug, pullRequestId, ...queryParams } = params;
    const response = await this.client.get<PaginatedResponse<RestPullRequestActivityApiResponse>>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/activities`,
      { params: queryParams },
    );
    return response.data;
  }

  /**
   * Add a comment to a pull request (supports general comments, replies, and inline file/line comments)
   */
  async addPullRequestComment(params: AddPullRequestCommentParams): Promise<RestComment> {
    const { projectKey, repositorySlug, pullRequestId, text, parentId, path, line, lineType, fileType } = params;

    const body: AddCommentBody = { text };
    if (parentId) body.parent = { id: parentId };
    if (path) {
      body.anchor = {
        path,
        diffType: 'EFFECTIVE',
        ...(line !== undefined && { line }),
        ...(lineType && { lineType }),
        ...(fileType && { fileType }),
      };
    }

    const response = await this.client.post<RestComment>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments`,
      body,
    );
    return response.data;
  }

  /**
   * Delete a pull request comment. Returns void on success (HTTP 204).
   * Anyone can delete their own comment. Only REPO_ADMIN can delete others' comments.
   * Comments with replies cannot be deleted.
   */
  async deletePullRequestComment(params: DeletePullRequestCommentParams): Promise<void> {
    const { projectKey, repositorySlug, pullRequestId, commentId, version } = params;

    await this.client.delete(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${commentId}`,
      {
        params: { version },
      },
    );
  }

  /**
   * Update review status for a pull request (approve, request changes, or remove approval)
   */
  async updateReviewStatus(params: UpdateReviewStatusParams): Promise<RestPullRequestParticipant> {
    const { projectKey, repositorySlug, pullRequestId, status } = params;

    // Get authenticated user slug from application properties
    const propertiesResponse = await this.client.get('/application-properties');
    const userSlug = propertiesResponse.headers['x-ausername'];

    const response = await this.client.put<RestPullRequestParticipant>(
      `/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/participants/${userSlug}`,
      { status },
    );
    return response.data;
  }

  /**
   * Add an emoticon reaction to a pull request comment
   */
  async addPullRequestCommentReaction(params: AddPullRequestCommentReactionParams): Promise<RestUserReaction> {
    const { projectKey, repositorySlug, pullRequestId, commentId, emoticon } = params;

    // Use comment-likes plugin API endpoint
    const response = await this.client.put<RestUserReaction>(
      `/comment-likes/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${commentId}/reactions/${emoticon}`,
      {},
      {
        baseURL: this.client.defaults.baseURL?.replace('/rest/api/latest', '/rest'),
      },
    );
    return response.data;
  }

  /**
   * Remove an emoticon reaction from a pull request comment
   */
  async removePullRequestCommentReaction(params: RemovePullRequestCommentReactionParams): Promise<void> {
    const { projectKey, repositorySlug, pullRequestId, commentId, emoticon } = params;

    // Use comment-likes plugin API endpoint
    await this.client.delete(
      `/comment-likes/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/comments/${commentId}/reactions/${emoticon}`,
      {
        baseURL: this.client.defaults.baseURL?.replace('/rest/api/latest', '/rest'),
      },
    );
  }

  /**
   * Get the list of required/default reviewers for a pull request.
   * Returns users who would be automatically assigned as reviewers based on configured rules.
   * Note: Default reviewers are NOT auto-added when creating PRs via API - you must
   * fetch them with this method and pass them to createPullRequest().
   * Branch names are automatically converted to full refs (e.g., "main" → "refs/heads/main").
   * Use getRepository() to obtain the repositoryId.
   */
  async getRequiredReviewers(params: GetRequiredReviewersParams): Promise<RestUser[]> {
    const { projectKey, repositorySlug, repositoryId, sourceBranch, targetBranch } = params;

    // Convert branch names to full refs if needed
    const toRefId = (branch: string) =>
      branch.startsWith('refs/') ? branch : `refs/heads/${branch}`;

    // Uses /default-reviewers/latest base path (not /rest/api/latest)
    const response = await this.client.get<RestUser[]>(
      `/default-reviewers/latest/projects/${projectKey}/repos/${repositorySlug}/reviewers`,
      {
        params: {
          sourceRepoId: repositoryId,
          targetRepoId: repositoryId,
          sourceRefId: toRefId(sourceBranch),
          targetRefId: toRefId(targetBranch),
        },
        baseURL: this.client.defaults.baseURL?.replace('/rest/api/latest', '/rest'),
      },
    );

    return response.data;
  }

  /**
   * Browse repository contents at a given path (structured JSON response).
   * Returns different response based on path type:
   * - Directory: { children: [...] } with file/folder entries
   * - File: { lines: [...] } with file content
   * Check 'children' in response to determine type.
   */
  async browse(params: BrowseParams): Promise<BrowseResponse> {
    const { projectKey, repositorySlug, path, at, limit, start } = params;

    const queryParams: Record<string, string | number> = {};
    if (at) queryParams['at'] = at;
    if (limit !== undefined) queryParams['limit'] = limit;
    if (start !== undefined) queryParams['start'] = start;

    const response = await this.client.get<BrowseResponse>(
      `/projects/${projectKey}/repos/${repositorySlug}/browse/${path || ''}`,
      { params: queryParams },
    );
    return response.data;
  }

  /**
   * Get raw content from repository (plain text).
   * Returns file content as plain text, or git tree listing for directories.
   */
  async getRawContent(params: GetRawContentParams): Promise<string> {
    const { projectKey, repositorySlug, path, at } = params;

    const queryParams: Record<string, string> = {};
    if (at) queryParams['at'] = at;

    const response = await this.client.get<string>(
      `/projects/${projectKey}/repos/${repositorySlug}/raw/${path}`,
      {
        params: queryParams,
        headers: { Accept: 'text/plain' },
      },
    );
    return response.data;
  }

  /**
   * Check repository permissions for the authenticated token.
   * Returns read/write access flags without modifying anything.
   */
  async checkRepositoryPermissions(
    params: CheckRepositoryPermissionsParams,
  ): Promise<RepositoryPermissions> {
    const { projectKey, repositorySlug } = params;
    const repoPath = `/projects/${projectKey}/repos/${repositorySlug}`;

    // Check READ permission
    try {
      await this.client.get(repoPath);
    } catch {
      return { read: false, write: false };
    }

    // Check WRITE permission (try creating branch with invalid body)
    try {
      await this.client.post(`${repoPath}/branches`, {});
      return { read: true, write: true }; // Unlikely path
    } catch (error) {
      // Validation error ("name field is required") = has write
      // Permission error = no write
      const message =
        (error as { response?: { data?: { errors?: Array<{ message?: string }> } } })?.response
          ?.data?.errors?.[0]?.message || '';
      const write = message.includes('name') && message.includes('required');
      return { read: true, write };
    }
  }
}
