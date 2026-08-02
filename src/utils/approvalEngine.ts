// Approval-Gated Modification Engine for Possibilities
// Implements READ -> ANALYZE -> PROPOSE -> SHOW FILES -> SHOW DIFF -> EXPLAIN WHY -> SHOW RISKS -> CREATOR APPROVAL -> APPLY/REJECT -> ROLLBACK

import { memoryStore } from './memoryStore';

export interface CodePatchProposal {
  id: string;
  createdAt: string;
  title: string;
  targetFiles: string[];
  explanation: string;
  risks: string[];
  diffSummary: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied' | 'rolled_back';
  preSnapshotId?: string;
}

export class ApprovalEngine {
  private proposals: CodePatchProposal[] = [];

  constructor() {
    this.loadProposals();
  }

  private loadProposals() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem('possibilities_patch_proposals');
      if (raw) {
        this.proposals = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load patch proposals:', e);
    }
  }

  private saveProposals() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('possibilities_patch_proposals', JSON.stringify(this.proposals.slice(0, 20)));
    } catch (e) {
      console.warn('Failed to save patch proposals:', e);
    }
  }

  public createProposal(
    title: string,
    targetFiles: string[],
    explanation: string,
    risks: string[],
    diffSummary: string
  ): CodePatchProposal {
    const proposal: CodePatchProposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      title,
      targetFiles,
      explanation,
      risks,
      diffSummary,
      status: 'pending',
    };

    this.proposals.unshift(proposal);
    this.saveProposals();
    return proposal;
  }

  public getPendingProposals(): CodePatchProposal[] {
    return this.proposals.filter((p) => p.status === 'pending');
  }

  public getAllProposals(): CodePatchProposal[] {
    return [...this.proposals];
  }

  public approveProposal(id: string): { success: boolean; proposal?: CodePatchProposal; message: string } {
    const target = this.proposals.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Proposal not found.' };
    }

    if (target.status !== 'pending') {
      return { success: false, message: `Proposal is already in state ${target.status}.` };
    }

    // Step 1: Create snapshot before applying
    const snapshot = memoryStore.createSnapshot(`Pre-patch snapshot for proposal: ${target.title}`);
    target.preSnapshotId = snapshot.snapshotId;

    // Step 2: Mark approved & applied
    target.status = 'applied';
    this.saveProposals();

    return {
      success: true,
      proposal: target,
      message: `Proposal "${target.title}" approved and applied. Pre-patch snapshot ${snapshot.snapshotId} recorded.`,
    };
  }

  public rejectProposal(id: string): { success: boolean; proposal?: CodePatchProposal; message: string } {
    const target = this.proposals.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Proposal not found.' };
    }

    target.status = 'rejected';
    this.saveProposals();

    return {
      success: true,
      proposal: target,
      message: `Proposal "${target.title}" rejected by Creator. Existing system remains unchanged.`,
    };
  }

  public rollbackProposal(id: string): { success: boolean; message: string } {
    const target = this.proposals.find((p) => p.id === id);
    if (!target || !target.preSnapshotId) {
      return { success: false, message: 'Proposal or pre-patch snapshot not found for rollback.' };
    }

    const restored = memoryStore.rollbackToSnapshot(target.preSnapshotId);
    if (restored) {
      target.status = 'rolled_back';
      this.saveProposals();
      return { success: true, message: `System state successfully rolled back to snapshot ${target.preSnapshotId}.` };
    } else {
      return { success: false, message: 'Failed to restore snapshot.' };
    }
  }
}

export const approvalEngine = new ApprovalEngine();
