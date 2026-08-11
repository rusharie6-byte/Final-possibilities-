import React, { useState } from "react";
import { authenticateAuthority } from "../services/biometricAuth";

export interface ToolProposal {
  toolName: string;
  args: {
    filePath?: string;
    command?: string;
    content?: string;
    reason: string;
  };
}

interface Props {
  proposal: ToolProposal;
  onReject: () => void;
  onSuccess: (result: any) => void;
}

export const ApprovalGateModal: React.FC<Props> = ({ proposal, onReject, onSuccess }) => {
  const [editedContent, setEditedContent] = useState(
    proposal.args.content || proposal.args.command || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setError(null);
    setLoading(true);

    const isAuthenticated = await authenticateAuthority();
    if (!isAuthenticated) {
      setError("Biometric Authentication Failed or Cancelled. Execution Aborted.");
      setLoading(false);
      return;
    }

    const payloadArgs = {
      ...proposal.args,
      ...(proposal.args.content !== undefined ? { content: editedContent } : {}),
      ...(proposal.args.command !== undefined ? { command: editedContent } : {}),
    };

    try {
      const response = await fetch("/api/tools/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-biometric-auth": "VERIFIED_BY_AUTHORITY",
        },
        body: JSON.stringify({
          toolName: proposal.toolName,
          args: payloadArgs,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Execution failed.");

      onSuccess(resData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalCardStyle}>
        <h2 style={{ color: "#d32f2f", marginTop: 0 }}>AUTHORITY SIGN-OFF REQUIRED</h2>
        <p><strong>Action:</strong> <code>{proposal.toolName}</code></p>
        <p><strong>Reasoning:</strong> {proposal.args.reason}</p>

        {proposal.args.filePath && <p><strong>Target File:</strong> <code>{proposal.args.filePath}</code></p>}

        <label style={{ display: "block", marginTop: "10px", fontWeight: "bold" }}>
          Inspect & Modify Payload Before Sign-Off:
        </label>
        <textarea
          rows={12}
          style={codeBoxStyle}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />

        {error && <p style={{ color: "#ff4d4d" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onReject} disabled={loading} style={rejectButtonStyle}>
            REJECT
          </button>
          <button onClick={handleApprove} disabled={loading} style={approveButtonStyle}>
            {loading ? "AUTHENTICATING..." : "APPROVE WITH BIOMETRICS"}
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
