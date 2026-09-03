// Complete Robust Tool Schema for Possibilities System
import path from 'path';
import fs from 'fs/promises';

export const POSSIBILITIES_TOOLS: any[] = [
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
  },
];

export async function executeToolCall(name: string, args: any): Promise<any> {
  try {
    if (name === 'github_api') {
      const owner = String(args?.owner || 'rusharie6-byte').trim();
      const repo = String(args?.repo || 'Final-possibilities-').trim();
      const rawPath = String(args?.path || '').trim();
      const cleanPath = rawPath.replace(/^\//, '');
      const queryRef = args?.ref ? `?ref=${encodeURIComponent(args.ref)}` : '';
      const url = `https://api.github.com/repos/${owner}/${repo}/contents${cleanPath ? `/${cleanPath}` : ''}${queryRef}`;

      const headers: Record<string, string> = {
        'User-Agent': 'Possibilities-Companion-App',
        'Accept': 'application/vnd.github.v3+json',
      };
      if (typeof process !== 'undefined' && process.env?.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          error: `GitHub API returned HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          url,
          details: errJson?.message || 'Resource not found or restricted.',
        };
      }

      const data: any = await response.json();

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
      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Possibilities-Companion-App' },
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
