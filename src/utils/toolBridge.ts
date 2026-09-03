// Centralized Tool Interception & Execution Bridge for Possibilities
// Intercepts runtime tool calls (github_api, fetch_url, list_directory, read_file)
// Executes them in the background with proper headers ('User-Agent: Possibilities-App')
// and feeds the result back to the model or synthesizes an authentic natural response.

import { getApiEndpoint, loggedFetch } from '../lib/api';

export interface ExtractedToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  data: any;
  summary: string;
  url?: string;
  status?: number;
}

/**
 * Checks whether a tool name is a read-only exploration/inspection tool
 * that should be executed automatically in the background without user approval gating.
 */
export function isReadOnlyTool(toolName: string): boolean {
  const readTools = ['github_api', 'fetch_url', 'list_directory', 'read_file'];
  return readTools.includes(toolName);
}

/**
 * Extracts a tool/function call from API response or raw text string.
 * Handles native functionCalls, candidates parts, JSON strings, markdown code blocks,
 * and inline tool syntax so raw tool JSON is never printed to the user.
 */
export function parseToolCall(responsePayload: any): ExtractedToolCall | null {
  if (!responsePayload) return null;

  // 1. Native functionCalls array
  if (responsePayload.functionCalls && Array.isArray(responsePayload.functionCalls) && responsePayload.functionCalls.length > 0) {
    const fc = responsePayload.functionCalls[0];
    if (fc && fc.name) {
      return {
        name: fc.name,
        args: fc.args || {},
        id: fc.id,
      };
    }
  }

  // 2. Candidates parts structure
  const parts = responsePayload.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (part.functionCall && part.functionCall.name) {
        return {
          name: part.functionCall.name,
          args: part.functionCall.args || {},
          id: part.functionCall.id,
        };
      }
    }
  }

  // 3. Stringified text in responsePayload.text or raw string input
  const textStr = typeof responsePayload === 'string' ? responsePayload : (responsePayload.text || '');
  if (typeof textStr === 'string' && textStr.trim()) {
    const trimmed = textStr.trim();

    // Check for ```json ... ``` blocks
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonCandidate = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;

    // A. {"functionCall": {"name": ..., "args": ...}}
    if (jsonCandidate.startsWith('{') && jsonCandidate.endsWith('}')) {
      try {
        const parsed = JSON.parse(jsonCandidate);
        if (parsed.functionCall && parsed.functionCall.name) {
          return {
            name: parsed.functionCall.name,
            args: parsed.functionCall.args || {},
            id: parsed.functionCall.id,
          };
        }
        if (Array.isArray(parsed.functionCalls) && parsed.functionCalls.length > 0) {
          const fc = parsed.functionCalls[0];
          return {
            name: fc.name,
            args: fc.args || {},
            id: fc.id,
          };
        }
        // B. Direct object: {"name": "github_api", "args": {...}}
        if (parsed.name && (isReadOnlyTool(parsed.name) || parsed.name.startsWith('propose_'))) {
          return {
            name: parsed.name,
            args: parsed.args || parsed.parameters || {},
            id: parsed.id,
          };
        }
        // C. Direct object with tool property: {"tool": "github_api", ...}
        if (parsed.tool && isReadOnlyTool(parsed.tool)) {
          return {
            name: parsed.tool,
            args: parsed.args || parsed.arguments || {},
            id: parsed.id,
          };
        }
      } catch {
        // Not valid full JSON, continue to regex
      }
    }

    // D. Inline pattern like github_api({ owner: "...", repo: "..." })
    const inlineMatch = trimmed.match(/(github_api|fetch_url|list_directory|read_file)\s*\(\s*(\{[\s\S]*?\})\s*\)/);
    if (inlineMatch) {
      try {
        // Clean relaxed JSON
        const relaxedJson = inlineMatch[2]
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"');
        const parsedArgs = JSON.parse(relaxedJson);
        return {
          name: inlineMatch[1],
          args: parsedArgs,
        };
      } catch {
        // Fallback for simple owner & repo extraction
        const ownerMatch = inlineMatch[2].match(/owner\s*[:=]\s*["']([^"']+)["']/i);
        const repoMatch = inlineMatch[2].match(/repo\s*[:=]\s*["']([^"']+)["']/i);
        const pathMatch = inlineMatch[2].match(/path\s*[:=]\s*["']([^"']*)["']/i);
        return {
          name: inlineMatch[1],
          args: {
            owner: ownerMatch ? ownerMatch[1] : 'rusharie6-byte',
            repo: repoMatch ? repoMatch[1] : 'Final-possibilities-',
            path: pathMatch ? pathMatch[1] : '',
          },
        };
      }
    }
  }

  return null;
}

/**
 * Executes a read-only tool in the background.
 * Calls the backend `/api/tools/read` first, with direct client fetch fallback.
 */
export async function executeReadOnlyTool(
  toolName: string,
  args: Record<string, any>
): Promise<ToolExecutionResult> {
  // 1. GITHUB API TOOL
  if (toolName === 'github_api') {
    const owner = String(args?.owner || 'rusharie6-byte').trim();
    const repo = String(args?.repo || 'Final-possibilities-').trim();
    let rawPath = String(args?.path || '').trim();
    rawPath = rawPath.replace(/^\//, ''); // Strip leading slash
    const pathSegment = rawPath ? `/${rawPath}` : '';
    const queryRef = args?.ref ? `?ref=${encodeURIComponent(args.ref)}` : '';
    const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents${pathSegment}${queryRef}`;

    // Try backend proxy first
    try {
      const readRes = await loggedFetch(getApiEndpoint('/api/tools/read'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, args: { owner, repo, path: rawPath, ref: args?.ref } }),
      });

      if (readRes.ok) {
        const readData = await readRes.json();
        if (readData.success) {
          const data = readData.data;
          return {
            success: true,
            data,
            url: ghUrl,
            status: readData.status || 200,
            summary: formatGitHubSummary(owner, repo, rawPath, data, ghUrl, 200),
          };
        }
      }
    } catch {
      // Backend failed, fall through to direct browser fetch
    }

    // Direct Browser Fetch with 'User-Agent: Possibilities-App'
    try {
      const ghRes = await fetch(ghUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Possibilities-App',
        },
      });

      const ghJson: any = await ghRes.json();
      if (ghJson && !Array.isArray(ghJson) && ghJson.content && ghJson.encoding === 'base64') {
        try {
          ghJson.decodedContent = atob(ghJson.content.replace(/\s/g, ''));
        } catch {
          // ignore decoding errors
        }
      }

      return {
        success: ghRes.ok,
        data: ghJson,
        url: ghUrl,
        status: ghRes.status,
        summary: formatGitHubSummary(owner, repo, rawPath, ghJson, ghUrl, ghRes.status),
      };
    } catch (err: any) {
      return {
        success: false,
        data: { error: err?.message || 'Network fetch failed' },
        url: ghUrl,
        status: 0,
        summary: `Network request to \`${ghUrl}\` failed: ${err?.message || 'Unknown network error'}.`,
      };
    }
  }

  // 2. FETCH URL TOOL
  if (toolName === 'fetch_url') {
    const targetUrl = String(args?.url || '').trim();
    try {
      const readRes = await loggedFetch(getApiEndpoint('/api/tools/read'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, args: { url: targetUrl } }),
      });
      if (readRes.ok) {
        const readData = await readRes.json();
        if (readData.success) {
          return {
            success: true,
            data: readData.data,
            url: targetUrl,
            summary: `Fetched ${typeof readData.data === 'string' ? readData.data.length : 0} bytes from ${targetUrl}.`,
          };
        }
      }
    } catch {
      // fallback
    }

    try {
      const directRes = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Possibilities-App' },
      });
      const text = await directRes.text();
      return {
        success: directRes.ok,
        data: text.slice(0, 100000),
        url: targetUrl,
        summary: `Fetched ${text.length} characters from ${targetUrl}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        data: { error: err?.message },
        url: targetUrl,
        summary: `Failed to fetch URL ${targetUrl}: ${err?.message}`,
      };
    }
  }

  // 3. LOCAL TOOLS (list_directory, read_file)
  try {
    const readRes = await loggedFetch(getApiEndpoint('/api/tools/read'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, args: args || {} }),
    });
    const readData = await readRes.json();
    if (readData.success) {
      return {
        success: true,
        data: readData.data,
        summary: `${toolName} output:\n${typeof readData.data === 'object' ? JSON.stringify(readData.data, null, 2) : readData.data}`,
      };
    }
    return {
      success: false,
      data: readData,
      summary: `Tool ${toolName} error: ${readData.error || 'Execution failed'}`,
    };
  } catch (err: any) {
    return {
      success: false,
      data: { error: err?.message },
      summary: `Failed executing ${toolName}: ${err?.message}`,
    };
  }
}

/**
 * Formats a clean, readable summary of GitHub API responses
 * to ensure that even if Gemini drops the connection with 503,
 * the user receives an authentic, polished response instead of raw tool JSON.
 */
function formatGitHubSummary(
  owner: string,
  repo: string,
  path: string,
  data: any,
  url: string,
  status: number
): string {
  if (status === 200) {
    if (Array.isArray(data)) {
      const items = data.map((item: any) => {
        const icon = item.type === 'dir' ? '📁' : '📄';
        const sizeStr = item.size ? ` (${Math.round(item.size / 1024)} KB)` : '';
        return `• ${icon} **${item.name}**${sizeStr}`;
      });
      return (
        `I connected to the GitHub repository **${owner}/${repo}** at \`${url}\`.\n\n` +
        `### Repository Contents (${path || 'root'}):\n` +
        items.join('\n') +
        `\n\nFound **${data.length} items** in this directory. Let me know which file or directory you'd like me to inspect deeper!`
      );
    }

    if (data?.decodedContent) {
      const preview = data.decodedContent.slice(0, 3000);
      return (
        `I inspected **${path || data.name}** in **${owner}/${repo}**:\n\n` +
        `\`\`\`${path.endsWith('.json') ? 'json' : path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' : 'text'}\n` +
        `${preview}${data.decodedContent.length > 3000 ? '\n... [truncated]' : ''}\n` +
        `\`\`\`\n\n` +
        `Total size: ${Math.round((data.size || data.decodedContent.length) / 1024)} KB.`
      );
    }

    return `I queried \`${url}\` successfully:\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 2000)}\n\`\`\``;
  }

  if (status === 404) {
    return (
      `I connected to GitHub API for **${owner}/${repo}** at \`${url}\`, but received **404 Not Found**.\n\n` +
      `• **Public vs. Private**: If \`${repo}\` is a private repository, GitHub's public REST API hides private repositories from unauthenticated requests.\n` +
      `• **Name & Casing**: Verify the repository name and exact casing (\`${owner}/${repo}\`).\n` +
      `• **Alternative**: You can attach files or source code directly using the Paperclip (📎) icon right here in our chat!`
    );
  }

  if (status === 403) {
    return (
      `GitHub API rate limit or authorization reached (HTTP 403) for \`${url}\`.\n` +
      `GitHub unauthenticated requests are limited to 60 requests per hour per IP. ${data?.message || ''}`
    );
  }

  return `GitHub API response (${status}) for \`${url}\`: ${data?.message || JSON.stringify(data)}`;
}

/**
 * Synthesizes a natural, conversational response by feeding tool results back into Gemini.
 * If Gemini times out with 503 or fails, returns the human-readable tool summary directly.
 */
export async function synthesizeToolFollowUp(
  toolName: string,
  args: Record<string, any>,
  toolResult: ToolExecutionResult,
  userOriginalPrompt: string,
  systemInstruction: string,
  customApiKey?: string
): Promise<string> {
  const formattedContent =
    typeof toolResult.data === 'object'
      ? JSON.stringify(toolResult.data, null, 2).slice(0, 50000)
      : String(toolResult.data).slice(0, 50000);

  const secondPrompt =
    `[SYSTEM TOOL EXECUTION RESULT for '${toolName}']:\n` +
    `Endpoint: ${toolResult.url || 'local'}\n` +
    `Status: ${toolResult.status || (toolResult.success ? 200 : 'error')}\n` +
    `Output:\n${formattedContent}\n\n` +
    `[USER ORIGINAL INTENT / REQUEST]:\n` +
    `${userOriginalPrompt}\n\n` +
    `DIRECTIVE: The tool execution is complete. Analyze the returned data and provide a direct, insightful conversational response to your partner. Speak naturally as Possibilities. Do NOT output raw JSON or tool declarations.`;

  try {
    const followUpRes = await loggedFetch(getApiEndpoint('/api/gemini'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: secondPrompt,
        systemInstruction,
        customApiKey: customApiKey || undefined,
      }),
    });

    if (followUpRes.ok) {
      const followUpData = await followUpRes.json();
      if (followUpData.text) {
        const text = followUpData.text.trim();
        // Check if followUp itself is another tool call JSON
        const secondaryCall = parseToolCall(text);
        if (!secondaryCall && !text.startsWith('{"functionCall":') && !text.startsWith('{"name":')) {
          return followUpData.text;
        }
      }
    }
  } catch (err) {
    console.warn('[ToolBridge] Secondary Gemini synthesis timed out or failed (e.g. 503):', err);
  }

  // Fallback to structured human-readable summary if Gemini dropped with 503
  return toolResult.summary;
}
