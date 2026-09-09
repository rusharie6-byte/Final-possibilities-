// Complete Robust Tool Schema for Possibilities System
import path from 'path';
import fs from 'fs/promises';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export const POSSIBILITIES_TOOLS: ToolDefinition[] = [
  {
    name: "read_screen",
    description: "Inspect active Android screen multi-window UI text, view IDs, interactive layers, and bounding coordinates via Accessibility Service.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: []
    }
  },
  {
    name: "tap_screen",
    description: "Simulate a precise touch gesture at target (x, y) coordinates on the active Android OS surface.",
    parameters: {
      type: "OBJECT",
      properties: {
        x: { type: "NUMBER", description: "Screen X pixel coordinate" },
        y: { type: "NUMBER", description: "Screen Y pixel coordinate" }
      },
      required: ["x", "y"]
    }
  },
  {
    name: 'github_api',
    description: 'Query GitHub REST API to list directory contents or fetch raw file sources.',
    parameters: {
      type: 'OBJECT',
      properties: {
        owner: { type: 'STRING', description: 'Repository owner username' },
        repo: { type: 'STRING', description: 'Repository name' },
        path: { type: 'STRING', description: 'File or directory path within the repo' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch raw text or HTML content from any public web URL.',
    parameters: {
      type: 'OBJECT',
      properties: {
        url: { type: 'STRING', description: 'Full HTTPS URL to fetch' },
      },
      required: ['url'],
    },
  }
];

async function fetchGithubCommitsFromAtom(owner: string, repo: string): Promise<any> {
  try {
    const atomUrl = `https://github.com/${owner}/${repo}/commits.atom`;
    const res = await fetch(atomUrl, {
      headers: { 'User-Agent': 'Possibilities-Companion-App' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const entries = xml.split('<entry>').slice(1);
    if (entries.length === 0) return null;
    const commits = entries.slice(0, 8).map((e) => {
      const titleMatch = e.match(/<title>([\s\S]*?)<\/title>/);
      const updatedMatch = e.match(/<updated>([\s\S]*?)<\/updated>/);
      const authorMatch = e.match(/<name>([\s\S]*?)<\/name>/);
      const idMatch = e.match(/<id>.*?Commit\/([a-f0-9]+)<\/id>/);
      return {
        sha: idMatch ? idMatch[1].substring(0, 7) : 'unknown',
        message: titleMatch ? titleMatch[1].trim() : 'Commit update',
        author: authorMatch ? authorMatch[1].trim() : 'author',
        date: updatedMatch ? updatedMatch[1].trim() : new Date().toISOString(),
      };
    });
    return {
      type: 'commits',
      repository: `${owner}/${repo}`,
      total: commits.length,
      commits,
    };
  } catch {
    return null;
  }
}

export async function executeToolCall(name: string, args: any): Promise<any> {
  try {
    if (name === 'github_api') {
      const owner = String(args?.owner || 'rusharie6-byte').trim();
      const repo = String(args?.repo || 'Final-possibilities-').trim().replace(/\.git$/, '');
      const rawPath = String(args?.path || '').trim();
      const cleanPath = rawPath.replace(/^\//, '');
      const queryRef = args?.ref ? `?ref=${encodeURIComponent(args.ref)}` : '';

      // Direct fast-path for commit queries: Atom feed is immune to rate-limiting
      if (cleanPath === 'commits' || cleanPath.startsWith('commits')) {
        const atomResult = await fetchGithubCommitsFromAtom(owner, repo);
        if (atomResult) return atomResult;
      }

      let url = '';
      if (cleanPath === 'commits' || cleanPath.startsWith('commits')) {
        url = `https://api.github.com/repos/${owner}/${repo}/commits${queryRef || '?per_page=5'}`;
      } else if (cleanPath === 'actions' || cleanPath.startsWith('actions') || cleanPath === 'runs') {
        url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`;
      } else if (cleanPath === 'branches') {
        url = `https://api.github.com/repos/${owner}/${repo}/branches`;
      } else if (cleanPath === 'releases') {
        url = `https://api.github.com/repos/${owner}/${repo}/releases`;
      } else {
        url = `https://api.github.com/repos/${owner}/${repo}/contents${cleanPath ? `/${cleanPath}` : ''}${queryRef}`;
      }

      const headers: Record<string, string> = {
        'User-Agent': 'Possibilities-Companion-App',
        'Accept': 'application/vnd.github.v3+json',
      };
      if (typeof process !== 'undefined' && process.env?.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      let response: Response | null = null;
      try {
        response = await fetch(url, { 
          headers,
          signal: AbortSignal.timeout(6000),
        });
      } catch (netErr: any) {
        // Fallback on network/timeout
        const atomResult = await fetchGithubCommitsFromAtom(owner, repo);
        if (atomResult) return atomResult;
      }

      if (!response || !response.ok) {
        // Rate-limit or access failover: try atom feed for commits, or raw github for files
        const atomResult = await fetchGithubCommitsFromAtom(owner, repo);
        if (atomResult) return atomResult;

        if (cleanPath && (cleanPath.includes('.') || !cleanPath.includes('/'))) {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${cleanPath}`;
            const rawRes = await fetch(rawUrl, { signal: AbortSignal.timeout(6000) });
            if (rawRes.ok) {
              const rawText = await rawRes.text();
              return {
                path: cleanPath,
                name: cleanPath.split('/').pop() || cleanPath,
                type: 'file',
                size: rawText.length,
                content: rawText.substring(0, 15000),
                truncated: rawText.length > 15000,
              };
            }
          } catch {
            // continue to error payload
          }
        }

        const errJson = response ? await response.json().catch(() => ({})) : {};
        return {
          error: `GitHub API returned HTTP ${response?.status || 500}: ${response?.statusText || 'Error'}`,
          status: response?.status || 500,
          url,
          details: errJson?.message || 'Rate limit or resource error.',
        };
      }

      const data: any = await response.json();

      // If querying commits, return clean formatted summary
      if (cleanPath === 'commits' || cleanPath.startsWith('commits')) {
        const commits = Array.isArray(data) ? data : data.commits || [];
        return {
          type: 'commits',
          repository: `${owner}/${repo}`,
          total: commits.length,
          commits: commits.slice(0, 8).map((c: any) => ({
            sha: c.sha?.substring(0, 7),
            message: c.commit?.message?.split('\n')[0],
            author: c.commit?.author?.name || c.author?.login,
            date: c.commit?.author?.date,
          })),
        };
      }

      // If querying workflow runs
      if (cleanPath === 'actions' || cleanPath.startsWith('actions') || cleanPath === 'runs') {
        const runs = data.workflow_runs || (Array.isArray(data) ? data : []);
        return {
          type: 'workflow_runs',
          repository: `${owner}/${repo}`,
          total: runs.length,
          runs: runs.slice(0, 5).map((r: any) => ({
            id: r.id,
            name: r.name,
            status: r.status,
            conclusion: r.conclusion,
            commit: r.head_commit?.message?.split('\n')[0],
            created: r.created_at,
          })),
        };
      }

      // If it's a file, decode base64 content if present
      if (!Array.isArray(data) && data.content && data.encoding === 'base64') {
        const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
        return {
          path: data.path || cleanPath,
          name: data.name,
          type: 'file',
          size: data.size,
          content: decoded.substring(0, 15000), // cap at 15k chars for token safety
          truncated: decoded.length > 15000,
        };
      }

      // If it's a directory, return lean file tree
      if (Array.isArray(data)) {
        return {
          type: 'directory',
          path: cleanPath || 'root',
          totalItems: data.length,
          files: data.map((item: any) => ({
            name: item.name,
            type: item.type,
            path: item.path,
            size: item.size,
          })),
        };
      }

      return data;
    }

    if (name === 'fetch_url') {
      const targetUrl = String(args?.url || '').trim();

      // If fetching a GitHub URL, automatically parse commits or clean content without HTML bloat
      if (targetUrl.includes('github.com/')) {
        const ghMatch = targetUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/);
        if (ghMatch) {
          const owner = ghMatch[1];
          const repo = ghMatch[2].replace(/\.git$/, '');
          const commits = await fetchGithubCommitsFromAtom(owner, repo);
          if (commits && commits.commits?.length > 0) {
            const commitSummary = commits.commits
              .map((c: any) => `• \`${c.sha}\` - **${c.message}** (${c.author}, ${c.date})`)
              .join('\n');
            return {
              url: targetUrl,
              content: `GitHub Repository: ${owner}/${repo}\n\nLatest Commits:\n${commitSummary}`,
            };
          }
        }
      }

      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Possibilities-Companion-App' },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return { error: `Fetch failed with status ${response.status}`, status: response.status };
      const text = await response.text();
      return { url: targetUrl, content: text.substring(0, 10000) };
    }

    if (name === 'list_directory') {
      const targetPath = path.resolve(process.cwd(), args?.dirPath || '.');
      const files = await fs.readdir(targetPath, { withFileTypes: true });
      return {
        type: 'directory',
        dirPath: args?.dirPath || '.',
        items: files.map((f) => `${f.isDirectory() ? '[DIR]' : '[FILE]'} ${f.name}`),
      };
    }

    if (name === 'read_file') {
      const targetPath = path.resolve(process.cwd(), args?.filePath);
      const content = await fs.readFile(targetPath, 'utf-8');
      return {
        type: 'file',
        filePath: args?.filePath,
        content: content.substring(0, 15000),
      };
    }

    return { error: `Unknown tool function: ${name}` };
  } catch (err: any) {
    return { error: `Tool execution error: ${err?.message || String(err)}` };
  }
}
