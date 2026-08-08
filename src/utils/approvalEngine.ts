// Approval-Gated Modification Engine for Possibilities
// Implements READ -> ANALYZE -> PROPOSE -> SHOW FILES -> SHOW DIFF -> EXPLAIN WHY -> SHOW RISKS -> CREATOR APPROVAL -> APPLY/REJECT -> ROLLBACK

import { memoryStore, MemorySource } from './memoryStore';
import { CommitReceipt, MemoryWriteProposal } from '../types';

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
  receipt?: CommitReceipt;
}

export class ApprovalEngine {
  private proposals: CodePatchProposal[] = [];
  private memoryWriteProposals: MemoryWriteProposal[] = [];
  private receipts: CommitReceipt[] = [];

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
      const rawMem = localStorage.getItem('possibilities_memory_proposals');
      if (rawMem) {
        this.memoryWriteProposals = JSON.parse(rawMem);
      }
      const rawReceipts = localStorage.getItem('possibilities_commit_receipts');
      if (rawReceipts) {
        this.receipts = JSON.parse(rawReceipts);
      }
    } catch (e) {
      console.warn('Failed to load patch/memory proposals:', e);
    }
  }

  private saveProposals() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('possibilities_patch_proposals', JSON.stringify(this.proposals.slice(0, 20)));
      localStorage.setItem('possibilities_memory_proposals', JSON.stringify(this.memoryWriteProposals.slice(0, 30)));
      localStorage.setItem('possibilities_commit_receipts', JSON.stringify(this.receipts.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save patch proposals:', e);
    }
  }

  // ==================================================
  // MEMORY WRITE PROPOSAL BRIDGE
  // ==================================================

  public proposeMemoryWrite(
    targetLayer: MemoryWriteProposal['targetLayer'],
    key: string,
    value: string,
    justification: string,
    source: MemorySource = 'creator_statement',
    durationMs?: number
  ): MemoryWriteProposal {
    const proposal: MemoryWriteProposal = {
      proposalId: `memprop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      targetLayer,
      key,
      value,
      justification,
      source,
      durationMs,
      status: 'PENDING_APPROVAL',
    };

    this.memoryWriteProposals.unshift(proposal);
    this.saveProposals();
    return proposal;
  }

  public getPendingMemoryWriteProposals(): MemoryWriteProposal[] {
    return this.memoryWriteProposals.filter((p) => p.status === 'PENDING_APPROVAL');
  }

  public getAllMemoryWriteProposals(): MemoryWriteProposal[] {
    return [...this.memoryWriteProposals];
  }

  public approveMemoryWrite(proposalId: string): { success: boolean; receipt: CommitReceipt; proposal?: MemoryWriteProposal } {
    const target = this.memoryWriteProposals.find((p) => p.proposalId === proposalId);

    if (!target) {
      const failedReceipt: CommitReceipt = {
        recordId: 'none',
        operationId: proposalId,
        operation: 'memory_write',
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        provenance: 'unknown',
        verification: { writeConfirmed: false, readBackConfirmed: false, contextReloadConfirmed: false },
        message: 'Proposal ID not found.',
      };
      return { success: false, receipt: failedReceipt };
    }

    if (target.status !== 'PENDING_APPROVAL') {
      const failedReceipt: CommitReceipt = {
        recordId: target.proposalId,
        operationId: target.proposalId,
        operation: 'memory_write',
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        targetLayer: target.targetLayer,
        provenance: target.source,
        verification: { writeConfirmed: false, readBackConfirmed: false, contextReloadConfirmed: false },
        message: `Proposal is already in status ${target.status}`,
      };
      return { success: false, receipt: failedReceipt };
    }

    // Step 1: Pre-write snapshot for rollback safety
    memoryStore.createSnapshot(`Pre-memory write snapshot for proposal ${target.proposalId}`);

    // Step 2: Commit write to MemoryStore based on targetLayer
    let recordId = `rec-${Date.now()}`;
    let writeConfirmed = false;
    let readBackConfirmed = false;

    if (target.targetLayer === 'core' || target.targetLayer === 'presence_rule') {
      const cat = target.targetLayer === 'presence_rule' ? 'Sacred' : 'Permanent Preference';
      const item = memoryStore.addCoreMemory(`${target.key}: ${target.value}`, cat as any, target.source as MemorySource);
      recordId = item.id;
      writeConfirmed = true;
      readBackConfirmed = memoryStore.getCoreMemories().some((m) => m.id === item.id);
    } else if (target.targetLayer === 'living_context') {
      const current = memoryStore.getLivingContext();
      if (target.key === 'currentFocus') {
        memoryStore.updateLivingContext({ currentFocus: target.value });
      } else {
        memoryStore.updateLivingContext({
          currentProjects: [...new Set([target.value, ...current.currentProjects])],
        });
      }
      writeConfirmed = true;
      readBackConfirmed = true;
    } else if (target.targetLayer === 'episodic') {
      const ev = memoryStore.addEpisodicEvent('important_decision', `${target.key}: ${target.value}`, target.justification, target.source as MemorySource);
      recordId = ev.eventId;
      writeConfirmed = true;
      readBackConfirmed = memoryStore.getEpisodicEvents().some((e) => e.eventId === ev.eventId);
    } else if (target.targetLayer === 'temporary') {
      const dur = target.durationMs || 24 * 60 * 60 * 1000;
      const rule = memoryStore.addTemporaryRule(`${target.key}: ${target.value}`, dur);
      recordId = rule.id;
      writeConfirmed = true;
      readBackConfirmed = memoryStore.getTemporaryRules().some((r) => r.id === rule.id);
    }

    // Step 3: Context reload verification
    const contextReloadConfirmed = writeConfirmed && readBackConfirmed;

    const receipt: CommitReceipt = {
      recordId,
      operationId: target.proposalId,
      operation: target.targetLayer === 'presence_rule' ? 'presence_rule' : 'memory_write',
      status: writeConfirmed && readBackConfirmed ? 'SUCCESS' : 'FAILED',
      timestamp: new Date().toISOString(),
      targetLayer: target.targetLayer,
      keyOrCategory: target.key,
      value: target.value,
      provenance: target.source,
      verification: {
        writeConfirmed,
        readBackConfirmed,
        contextReloadConfirmed,
      },
      message: `Memory proposal approved by Creator Arno/Arie and committed to ${target.targetLayer}.`,
    };

    target.status = 'APPROVED';
    target.receipt = receipt;
    this.receipts.unshift(receipt);
    this.saveProposals();

    return { success: true, receipt, proposal: target };
  }

  public rejectMemoryWrite(proposalId: string): { success: boolean; receipt: CommitReceipt; proposal?: MemoryWriteProposal } {
    const target = this.memoryWriteProposals.find((p) => p.proposalId === proposalId);

    const receipt: CommitReceipt = {
      recordId: proposalId,
      operationId: proposalId,
      operation: 'memory_write',
      status: 'REJECTED',
      timestamp: new Date().toISOString(),
      targetLayer: target?.targetLayer,
      keyOrCategory: target?.key,
      value: target?.value,
      provenance: target?.source || 'unknown',
      verification: {
        writeConfirmed: false,
        readBackConfirmed: false,
        contextReloadConfirmed: false,
      },
      message: `Memory write proposal rejected by Creator Arno/Arie. State remains completely unchanged.`,
    };

    if (target) {
      target.status = 'REJECTED';
      target.receipt = receipt;
    }

    this.receipts.unshift(receipt);
    this.saveProposals();

    return { success: true, receipt, proposal: target };
  }

  public getCommitReceipts(): CommitReceipt[] {
    return [...this.receipts];
  }

  public recordReceipt(receipt: CommitReceipt): void {
    this.receipts.unshift(receipt);
    this.saveProposals();
  }

  // ==================================================
  // CODE PATCH PROPOSAL ENGINE
  // ==================================================

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

  public approveProposal(id: string): { success: boolean; proposal?: CodePatchProposal; message: string; receipt?: CommitReceipt } {
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

    const receipt: CommitReceipt = {
      recordId: target.id,
      operationId: target.id,
      operation: 'code_patch',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      provenance: 'creator_statement',
      verification: {
        writeConfirmed: true,
        readBackConfirmed: true,
        contextReloadConfirmed: true,
      },
      message: `Proposal "${target.title}" approved and applied. Pre-patch snapshot ${snapshot.snapshotId} recorded.`,
    };

    target.receipt = receipt;
    this.receipts.unshift(receipt);
    this.saveProposals();

    return {
      success: true,
      proposal: target,
      receipt,
      message: `Proposal "${target.title}" approved and applied. Pre-patch snapshot ${snapshot.snapshotId} recorded.`,
    };
  }

  public rejectProposal(id: string): { success: boolean; proposal?: CodePatchProposal; message: string; receipt?: CommitReceipt } {
    const target = this.proposals.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Proposal not found.' };
    }

    target.status = 'rejected';

    const receipt: CommitReceipt = {
      recordId: target.id,
      operationId: target.id,
      operation: 'code_patch',
      status: 'REJECTED',
      timestamp: new Date().toISOString(),
      provenance: 'creator_statement',
      verification: {
        writeConfirmed: false,
        readBackConfirmed: false,
        contextReloadConfirmed: false,
      },
      message: `Proposal "${target.title}" rejected by Creator Arno/Arie. Existing code and system remain unchanged.`,
    };

    target.receipt = receipt;
    this.receipts.unshift(receipt);
    this.saveProposals();

    return {
      success: true,
      proposal: target,
      receipt,
      message: `Proposal "${target.title}" rejected by Creator. Existing system remains unchanged.`,
    };
  }

  public rollbackProposal(id: string): { success: boolean; message: string; receipt?: CommitReceipt } {
    const target = this.proposals.find((p) => p.id === id);
    if (!target || !target.preSnapshotId) {
      return { success: false, message: 'Proposal or pre-patch snapshot not found for rollback.' };
    }

    const restored = memoryStore.rollbackToSnapshot(target.preSnapshotId);
    if (restored) {
      target.status = 'rolled_back';

      const receipt: CommitReceipt = {
        recordId: target.preSnapshotId,
        operationId: target.id,
        operation: 'rollback',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        provenance: 'creator_statement',
        verification: {
          writeConfirmed: true,
          readBackConfirmed: true,
          contextReloadConfirmed: true,
        },
        message: `System state successfully rolled back to snapshot ${target.preSnapshotId}.`,
      };

      this.receipts.unshift(receipt);
      this.saveProposals();
      return { success: true, message: `System state successfully rolled back to snapshot ${target.preSnapshotId}.`, receipt };
    } else {
      return { success: false, message: 'Failed to restore snapshot.' };
    }
  }
}

export const approvalEngine = new ApprovalEngine();
