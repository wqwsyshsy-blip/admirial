
export type InputType = "userId" | "username" | "profileUrl" | "image";

export interface GroupInfo {
  groupId: number;
  groupName: string;
  role: string;
  rank: number;
}

export interface BadgeInfo {
  badgeId: number;
  badgeName: string;
  iconUrl: string;
}

export interface FriendInfo {
  id: number;
  name: string;
  displayName: string;
  avatarUrl?: string;
  presence?: "online" | "offline" | "playing" | "studio";
}

export interface GroupRole {
  id: number;
  name: string;
  rank: number;
  memberCount: number;
}

export interface RobloxGroupFullData {
  id: number;
  name: string;
  description: string;
  owner: {
    id: number;
    type: string;
    name: string;
    displayName?: string; 
  } | null;
  memberCount: number;
  created: string;
  hasClan: boolean;
  publicEntryAllowed: boolean;
  isLocked: boolean;
  shout: {
    body: string;
    poster: {
      username: string;
    };
    created: string;
  } | null;
  roles: GroupRole[];
  iconUrl: string;
}

export interface RobloxGameData {
  placeId: number;
  universeId: number;
  name: string;
  description: string;
  price: number | null; // 0 or null is public/free
  allowedGearCategories: string[];
  studioAccessToApisAllowed: boolean;
  createVipServersAllowed: boolean;
  universeAvatarType: string;
  genre: string;
  playing: number;
  visits: number;
  maxPlayers: number;
  created: string;
  updated: string;
  favoritedCount: number;
  likes: number;
  dislikes: number;
  iconUrl: string;
  creator: {
    id: number;
    name: string;
    type: string; // User or Group
    hasVerifiedBadge?: boolean;
  };
  rootPlaceId?: number;
}

export interface RobloxLivePlayerData {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastOnline: string;
  placeId: number | null;
  gameName: string | null;
  primaryGroup: {
    name: string;
    role: string;
    id: number;
  } | null;
}

export interface RobloxPlayerData {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  description: string | null;
  createdAt: string | null;
  accountAge: string | null;
  isPremium: boolean | null;
  lastOnline: string | null;
  presence: "online" | "offline" | "playing" | "studio" | null;
  currentGame?: string | null;
  isBanned: boolean | null;
  previousUsernames: string[];
  friendsCount: number | null;
  friendsList: FriendInfo[];
  followersCount: number | null;
  followingCount: number | null;
  groups: GroupInfo[];
  badges: BadgeInfo[];
  ownedGamePasses: any[];
  recentPlaces: any[];
  rawApiResponses: any | null;
  identificationMethod?: 'text' | 'image';
  notes?: string;
  tags?: string[];
  caseStatus?: 'open' | 'closed';
  isPinned?: boolean;
}

export type ReconToolId = 
  | 'old_usernames' 
  | 'deleted_assets' 
  | 'favorites_count' 
  | 'private_places' 
  | 'hidden_roles' 
  | 'delisted_games' 
  | 'unlisted_versions' 
  | 'product_revenue' 
  | 'ghost_players' 
  | 'hidden_languages'
  | 'account_forge'
  | 'group_treasury';

export interface ReconResult {
  status: "success" | "error";
  message?: string;
  data?: any;
}

export interface ApiResponse {
  status: "success" | "error" | "loading";
  message: string;
  data: RobloxPlayerData | RobloxGroupFullData | RobloxGameData | RobloxLivePlayerData | any | null;
  code: number;
  type?: 'user' | 'group' | 'game' | 'live_user' | 'new_account';
}

export interface SearchHistoryItem {
  timestamp: string;
  userId: number;
  username: string;
  avatarUrl: string;
  inputMethod: 'text' | 'image';
  isPinned?: boolean;
  notes?: string;
  tags?: string[];
  caseStatus?: 'open' | 'closed';
  groupIds?: number[];
  presence?: "online" | "offline" | "playing" | "studio" | null;
  currentGame?: string | null;
}

export interface AuditLogEntry {
  action: string;
  admin: string;
  timestamp: string;
  targetId?: number;
  details?: string;
}

export type ReportType = 'Suspicious Activity' | 'Harassment' | 'Scam / Fraud' | 'Impersonation' | 'Other';
export type SeverityLevel = 'Low' | 'Medium' | 'High';
export type CaseClassification = 'Informational' | 'Needs Review' | 'Escalated';
export type ReportStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface CyberReport {
  reportId: string;
  timestamp: string;
  reportType: ReportType;
  severity: SeverityLevel;
  status: ReportStatus;
  targetData: RobloxPlayerData;
  incidentSummary: string;
  ageRange: 'Under 13' | '13–17' | '18–25' | '26+' | 'Unknown';
  region?: string;
  platformContext: string;
  reporterAlias?: string;
  reporterEmail?: string;
  classification?: CaseClassification;
  adminNotes?: string;
  statusHistory?: { status: ReportStatus; timestamp: string }[];
}

export type ManagedAccountStatus = 'Active' | 'Under Review' | 'Banned';

export interface ManagedAccount {
  userId: number;
  username: string;
  displayName: string;
  creationDate: string;
  status: ManagedAccountStatus;
  tags: string[];
  notes: string;
  addedAt: string;
  linkedReportIds: string[];
}

declare global {
  interface Window {
    electronAPI: {
      openExternal: (url: string) => void;
    };
    html2pdf: any;
  }
}
