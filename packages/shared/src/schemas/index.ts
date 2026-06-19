import { z } from 'zod';

// Poll Type Schema
export const pollTypeSchema = z.enum(['single_choice', 'multiple_choice', 'calendar']);

// Poll Status Schema
export const pollStatusSchema = z.enum(['draft', 'active', 'closed', 'expired']);

// Poll Option Schema
export const createPollOptionSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

// Create Poll Schema
export const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000).optional(),
  pollType: pollTypeSchema,
  options: z.array(createPollOptionSchema).min(2, 'At least 2 options required'),
  
  // Settings
  allowAnonymous: z.boolean().default(true),
  requireName: z.boolean().default(true),
  allowMultipleVotes: z.boolean().default(false),
  showResultsBeforeVote: z.boolean().default(true),
  password: z.string().min(4).max(50).optional(),
  
  // Multiple choice
  minSelections: z.number().int().min(1).default(1),
  maxSelections: z.number().int().min(1).optional(),
  
  // Calendar
  timezone: z.string().default('UTC'),
  expiresAt: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.pollType === 'calendar') {
      return data.options.every(opt => opt.date);
    }
    return data.options.every(opt => opt.text);
  },
  {
    message: 'Calendar polls require dates, other polls require text options',
  }
);

// Vote Schema
export const createVoteSchema = z.object({
  pollId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()),
  isNotAvailable: z.boolean().optional(),
  voterName: z.string().min(1).max(100).optional(),
  password: z.string().optional(),
}).refine(
  (data) => data.isNotAvailable || data.optionIds.length > 0,
  {
    message: 'Select at least one option or mark not available',
    path: ['optionIds'],
  }
);

// Update Profile Schema
export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  locale: z.enum(['en', 'it']).optional(),
  notificationEmail: z.boolean().optional(),
});

// Inferred types (use these for runtime validation)
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PollStatus = z.infer<typeof pollStatusSchema>;
