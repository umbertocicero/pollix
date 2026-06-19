// Poll Types
export type PollType = 'single_choice' | 'multiple_choice' | 'calendar';
export type PollStatus = 'draft' | 'active' | 'closed' | 'expired';

// Base Poll
export interface Poll {
  id: string;
  shortId: string;
  creatorId: string | null;
  title: string;
  description: string | null;
  pollType: PollType;
  status: PollStatus;
  
  // Settings
  allowAnonymous: boolean;
  requireName: boolean;
  allowMultipleVotes: boolean;
  showResultsBeforeVote: boolean;
  hasPassword: boolean;
  
  // Multiple choice settings
  minSelections: number;
  maxSelections: number | null;
  
  // Calendar settings
  timezone: string;
  
  // Timestamps
  expiresAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Poll Option
export interface PollOption {
  id: string;
  pollId: string;
  text: string | null;
  
  // Calendar specific
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  
  sortOrder: number;
  createdAt: string;
}

// Vote
export interface Vote {
  id: string;
  pollId: string;
  optionId: string | null;
  userId: string | null;
  voterName: string | null;
  isNotAvailable?: boolean;
  createdAt: string;
}

// Poll with options and votes
export interface PollWithDetails extends Poll {
  options: PollOption[];
  votes: Vote[];
}

// Poll Result
export interface PollResult {
  optionId: string;
  optionText: string | null;
  optionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  voteCount: number;
  voterNames: string[];
  percentage: number;
}

// User Profile
export interface UserProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  notificationEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create Poll Input
export interface CreatePollInput {
  title: string;
  description?: string;
  pollType: PollType;
  options: CreatePollOptionInput[];
  
  // Settings
  allowAnonymous?: boolean;
  requireName?: boolean;
  allowMultipleVotes?: boolean;
  showResultsBeforeVote?: boolean;
  password?: string;
  
  // Multiple choice
  minSelections?: number;
  maxSelections?: number;
  
  // Calendar
  timezone?: string;
  expiresAt?: string;
}

export interface CreatePollOptionInput {
  text?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

// Vote Input
export interface CreateVoteInput {
  pollId: string;
  optionIds: string[];
  isNotAvailable?: boolean;
  voterName?: string;
  password?: string;
}
