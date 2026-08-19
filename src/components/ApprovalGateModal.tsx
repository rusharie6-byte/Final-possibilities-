import React, { useState } from "react";
import { authenticateAuthority } from "../services/biometricAuth";
import { capabilityEngine, ExecutionCapability } from "../utils/capabilityEngine";
import { ShieldCheck, AlertTriangle, RefreshCw, FileText, CheckCircle2, Lock } from "lucide-react";

export interface ToolProposal {
  toolName: string;
  args: {
    filePath?: string;
    command?: string;
    content?: string;
    reason: string;
    preState?: string;
  };
}

interface Props {
  proposal: ToolProposal;
  onReject: () => void;
  onSuccess: (result: any) => void;
}

export const ApprovalGateModal: React.FC<Props> = ({ proposal, onReject, onSuccess }) => {
  const initialContent = proposal.args.content || proposal.args.command || "";
  const [editedContent, setEditedContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStage, setVerificationStage] = useState<string | null>(null);

  const isModified = editedContent !== initialContent;

  const handleApprove = async () => {
    setError(null);
    setLoading(true);
    setVerificationStage("Stage 0: Authenticating Creator Sovereign Authority...");

    const isAuthenticated = await authenticateAuthority();
    if (!isAuthenticated) {
      setError("Biometric / Authority Authentication Failed or Cancelled. Execution Aborted.");
      setLoading(false);
      setVerificationStage(null);
      return;
    }

    try {
      // Mint single-use Capability Token bound to the exact payload
      setVerificationStage("Minting Single-Use Execution Capability Token...");
      const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const capability: ExecutionCapability = await capabilityEngine.mintCapability({
        proposalId,
        toolName: proposal.toolName,
        actionType: proposal.toolName.includes('file') ? 'file_write' : proposal.toolName.includes('command') ? 'terminal_command' : 'memory_write',
        canonicalTargetPath: proposal.args.filePath,
        payloadText: editedContent,
        preStateText: proposal.args.preState,
      });

      // 8-Stage Sequential Execution Pipeline
      setVerificationStage("Running 8-Stage Sequential Verification Pipeline...");
      const verification = await capabilityEngine.verifyAndExecute(
        capability,
        editedContent,
        proposal.args.preState
      );

      if (!verification.success) {
        throw new Error(verification.error || "Verification pipeline failed.");
      }

      // Dispatch payload to backend tool executor with verified Capability Token
      const payloadArgs = {
        ...proposal.args,
        ...(proposal.args.content !== undefined ? { content: editedContent } : {}),
        ...(proposal.args.command !== undefined ? { command: editedContent } : {}),
      };

      const response = await fetch("/api/tools/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-biometric-auth": "VERIFIED_BY_AUTHORITY",
          "x-capability-token": JSON.stringify(capability),
        },
        body: JSON.stringify({
          toolName: proposal.toolName,
          args: payloadArgs,
          capability,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Execution failed.");

      onSuccess({
        ...resData,
        receipt: verification.receipt,
        merkleRoot: verification.receipt?.merkleRoot,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setVerificationStage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl bg-zinc-950 border border-purple-500/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.35)] text-purple-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm tracking-wider uppercase">
            <Lock className="w-4 h-4" />
            <span>SOVEREIGN CAPABILITY GATEWAY</span>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30">
            ZERO TRUST
          </span>
        </div>

        <div className="flex flex-col gap-2 text-xs font-mono">
          <p><strong className="text-white">Action:</strong> <code className="text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded">{proposal.toolName}</code></p>
          <p><strong className="text-white">Reasoning:</strong> {proposal.args.reason}</p>
          {proposal.args.filePath && (
            <p><strong className="text-white">Target Canonical Path:</strong> <code className="text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded">{proposal.args.filePath}</code></p>
          )}
        </div>

        {/* Payload Modification & Hash Re-Binding */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Inspect & Modify Payload Before Signing:</span>
            </label>
            {isModified && (
              <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                MODIFIED (Will Mint New Capability & Re-Hash)
              </span>
            )}
          </div>
          <textarea
            rows={10}
            className="w-full p-3 rounded-xl bg-black/80 border border-purple-500/30 text-purple-200 font-mono text-xs focus:border-purple-400 focus:outline-none custom-scrollbar"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
        </div>

        {verificationStage && (
          <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
            <span>{verificationStage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-all"
          >
            DISCARD
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? "VERIFYING..." : isModified ? "SIGN NEW CAPABILITY" : "APPROVE WITH BIOMETRICS"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: "#1a1a1a", color: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "700px", width: "90%", border: "1px solid #333"
};

const codeBoxStyle: React.CSSProperties = {
  width: "100%", fontFamily: "monospace", backgroundColor: "#000", color: "#00ff66", padding: "10px", border: "1px solid #444", borderRadius: "4px"
};

const approveButtonStyle: React.CSSProperties = {
  flex: 1, padding: "12px", backgroundColor: "#2e7d32", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer"
};

const rejectButtonStyle: React.CSSProperties = {
  flex: 1, padding: "12px", backgroundColor: "#c62828", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer"
};
