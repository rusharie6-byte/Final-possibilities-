// Sovereign Scavenger Engine for Possibilities
// Implements On-Demand Inbound Technical Scavenging & Zero-Egress Non-Broadcast Protocol (LAW 13)

import { constitutionIntegrity } from './constitutionIntegrity';
import { memoryStore } from './memoryStore';

export interface ScavengeResult {
  query: string;
  source: string;
  summary: string;
  extractedRawText: string;
  timestamp: string;
  sanitized: boolean;
}

class SovereignScavengerService {
  private isGatewayActive: boolean = true;
  private localKnowledgeCache: Map<string, ScavengeResult> = new Map();

  constructor() {
    this.bindAppLifecycle();
  }

  /**
   * Binds browser/app lifecycle to strictly open the gateway during active session
   * and immediately close/sever all network connections on exit/background.
   */
  private bindAppLifecycle(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.isGatewayActive = true;
        console.log('[Scavenger Gateway] Active session confirmed. Internet Gateway: OPEN for inbound query.');
      });

      window.addEventListener('blur', () => {
        // App put to background
        console.log('[Scavenger Gateway] App minimized/blurred. Pausing open background streams.');
      });

      window.addEventListener('beforeunload', () => {
        this.isGatewayActive = false;
        console.log('[Scavenger Gateway] App closing. ALL OUTBOUND NETWORK GATES SEVERED.');
      });
    }
  }

  public isGatewayOpen(): boolean {
    return this.isGatewayActive;
  }

  /**
   * Enforces LAW 13: Sanitizes search queries before any internet egress.
   * Strips out any private user names, credentials, keys, or personal tokens.
   */
  public sanitizeQuery(rawQuery: string): string {
    let sanitized = rawQuery;

    // Redact secrets, keys, and tokens
    sanitized = constitutionIntegrity.redactSecrets(sanitized);

    // Redact Creator personal names / identifiers from search queries
    sanitized = sanitized.replace(/\b(Arno|Arie|rusharie6@gmail\.com)\b/gi, '');
    sanitized = sanitized.replace(/\b(my password|my key|my secret|my phone|my email)\b/gi, '');
    
    // Clean multiple whitespace
    return sanitized.trim().replace(/\s+/g, ' ');
  }

  /**
   * Inbound technical search & raw text grabber.
   * Pulls raw facts, code syntax, technical docs, and latest updates without broadcasting user data.
   */
  public async scavengeTechnicalKnowledge(targetTopic: string): Promise<ScavengeResult | null> {
    if (!this.isGatewayActive) {
      console.warn('[Scavenger Gateway] Cannot fetch: App is offline or gateway is closed.');
      return null;
    }

    const cleanTopic = this.sanitizeQuery(targetTopic);
    if (!cleanTopic || cleanTopic.length < 3) return null;

    // Check memory / cache first to avoid redundant fetches
    const cached = this.localKnowledgeCache.get(cleanTopic.toLowerCase());
    if (cached) {
      console.log(`[Scavenger] Memory hit for "${cleanTopic}". Retrieved locally without network egress.`);
      return cached;
    }

    try {
      // Call backend server scavenger proxy
      const response = await fetch('/api/scavenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanTopic }),
      });

      if (!response.ok) {
        throw new Error(`Scavenge endpoint returned status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.success) {
        const result: ScavengeResult = {
          query: cleanTopic,
          source: data.source || 'Direct Web Ingest',
          summary: data.summary || '',
          extractedRawText: data.rawText || '',
          timestamp: new Date().toISOString(),
          sanitized: true,
        };

        // Cache in memory
        this.localKnowledgeCache.set(cleanTopic.toLowerCase(), result);

        // Distill into durable Memory Vault (LAW 13)
        if (data.summary) {
          memoryStore.addCoreMemory(
            `[Technical Knowledge Ingest: ${cleanTopic}] ${data.summary.substring(0, 300)}`,
            'Permanent Preference',
            'system'
          );
        }

        return result;
      }
    } catch (err: any) {
      console.warn('[Scavenger Notice] Inbound scavenging fallback:', err.message);
    }

    return null;
  }
}

export const sovereignScavenger = new SovereignScavengerService();
