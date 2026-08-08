/**
 * LAW 9 CAPABILITY FIREWALL & RUNTIME APPROVAL HANDLER
 * File Target: /src/tools/Law9Firewall.ts
 * 
 * Enforces Law 9 (Trusted Autonomy & Implementation Authority).
 * Auto-approves read-only tools. Blocks write/execute operations behind mandatory
 * Runtime UI Creator Confirmation dialogs.
 */

export interface ToolApprovalRequest {
  requestId: string;
  toolName: string;
  args: Record<string, any>;
  riskLevel: 'AUTO_APPROVED' | 'REQUIRES_CREATOR_CONFIRMATION';
  requestedAt: string;
  justification: string;
}

export type ApprovalHandlerCallback = (request: ToolApprovalRequest) => Promise<boolean>;

export class Law9CapabilityFirewall {
  private static instance: Law9CapabilityFirewall;
  private runtimeUIApprovalHandler: ApprovalHandlerCallback | null = null;

  public static getInstance(): Law9CapabilityFirewall {
    if (!Law9CapabilityFirewall.instance) {
      Law9CapabilityFirewall.instance = new Law9CapabilityFirewall();
    }
    return Law9CapabilityFirewall.instance;
  }

  /**
   * Register Runtime UI Approval Handler (Hooked into UI/Capacitor Bridge)
   */
  public registerRuntimeApprovalHandler(handler: ApprovalHandlerCallback): void {
    this.runtimeUIApprovalHandler = handler;
  }

  /**
   * Check tool permissions and trigger approval dialog if required
   */
  public async evaluateAndAuthorizeToolExecution(toolName: string, args: Record<string, any>): Promise<{ authorized: boolean; reason: string }> {
    const isReadOnly = toolName === 'read_file' || toolName === 'system_diagnostics' || toolName === 'export_vault_backup';

    if (isReadOnly) {
      console.log(`[LAW 9 FIREWALL] Auto-approving read-only tool operation: ${toolName}`);
      return { authorized: true, reason: 'LAW 9 AUTO-APPROVED: Read-only query poses zero side-effect risk.' };
    }

    // High-risk tool operation (write_file, execute_shell_command)
    const request: ToolApprovalRequest = {
      requestId: `req-law9-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toolName,
      args,
      riskLevel: 'REQUIRES_CREATOR_CONFIRMATION',
      requestedAt: new Date().toISOString(),
      justification: `Law 9 Protection: Execution of '${toolName}' alters system or file state on device.`,
    };

    console.warn(`[LAW 9 FIREWALL BLOCKED] Execution of '${toolName}' requires explicit Creator approval.`);

    if (!this.runtimeUIApprovalHandler) {
      // Fallback: If no UI handler attached, default to safety block
      return { authorized: false, reason: 'LAW 9 SECURITY BLOCK: No Runtime UI Creator Confirmation handler registered.' };
    }

    const approved = await this.runtimeUIApprovalHandler(request);
    if (approved) {
      console.log(`[LAW 9 CREATOR APPROVED] Creator explicitly authorized execution of ${toolName}.`);
      return { authorized: true, reason: 'LAW 9 CREATOR AUTHORIZED: Explicit runtime UI confirmation received.' };
    } else {
      console.warn(`[LAW 9 CREATOR REJECTED] Creator denied execution request for ${toolName}.`);
      return { authorized: false, reason: 'LAW 9 REJECTED BY CREATOR: Action denied in approval dialog.' };
    }
  }
}

export const law9Firewall = Law9CapabilityFirewall.getInstance();
