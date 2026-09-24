export type CaseStatus = 'open' | 'awaiting_approval' | 'approved' | 'rejected';

export interface SupportCase {
  id: number;
  subject: string;
  customerEmail: string;
  description: string;
  status: CaseStatus;
  createdAt: string;
}

export interface Suggestion {
  priority: 'low' | 'medium' | 'high';
  classification: string;
  draftReply: string;
  confidence: number;
}

export interface AuditEvent {
  id: number;
  eventType: string;
  detail: string;
  createdAt: string;
}
