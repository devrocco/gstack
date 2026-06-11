export type SourceType = 'ugc' | 'official' | 'news' | 'unknown' | 'licensed' | 'user_owned';
export type LicenseMode = 'metadata_only' | 'licensed_only' | 'safe_assets';
export type AssetType = 'voiceover' | 'caption' | 'graphic' | 'stats_card' | 'licensed_footage' | 'user_footage';
export type JobStatus = 'pending' | 'processing' | 'done' | 'failed_retryable' | 'failed';
export type ClipStatus = 'discovered' | 'scored' | 'blocked' | 'scripted' | 'approved' | 'rejected' | 'submitted';

export interface ClipCandidate {
  id: string;
  url: string;
  title: string;
  source: 'reddit' | 'youtube';
  sourceType: SourceType;
  viralityScore: number;
  copyrightRiskScore: number;
  upvotes?: number;
  views?: number;
  duration?: number;
  thumbnail?: string;
  createdAt: Date;
}

export interface ComplianceResult {
  approved: boolean;
  riskScore: number;
  reason?: string;
}

export interface ScriptIdea {
  title: string;
  description: string;
  hashtags: string[];
  assetsNeeded: AssetType[];
}

export interface VugolaJob {
  jobId: string;
  clipId: string;
  status: JobStatus;
  platforms: string[];
  approvedByHuman: boolean;
  approvedAt?: Date;
  rejectionReason?: string;
  clipUrl?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface AuditEntry {
  clipId: string;
  sourceUrl: string;
  sourceType: SourceType;
  viralityScore: number;
  riskScore: number;
  licenseMode: LicenseMode;
  title: string;
  platforms: string;
  status: string;
  approvedByHuman: boolean;
  approvedAt?: string;
  rejectionReason?: string;
  timestamp: string;
}

export interface SocialAccount {
  platform: string;
  handle: string;
  connected: boolean;
}

export interface PipelineResult {
  scouted: number;
  duplicates: number;
  belowThreshold: number;
  blocked: number;
  scripted: number;
  submitted: number;
  jobIds: string[];
}
