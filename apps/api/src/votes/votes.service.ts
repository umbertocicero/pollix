import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Vote, CreateVoteInput } from '@planora/shared';

@Injectable()
export class VotesService {
  constructor(private supabase: SupabaseService) {}

  async create(input: CreateVoteInput, userId?: string): Promise<Vote[]> {
    const client = this.supabase.getClient();

    // Validate poll exists and is active
    const { data: poll, error: pollError } = await client
      .from('polls')
      .select('*')
      .eq('id', input.pollId)
      .single();

    if (pollError || !poll) {
      throw new BadRequestException('Poll not found');
    }

    if (poll.status !== 'active') {
      throw new BadRequestException('Poll is not active');
    }

    // Check expiration
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new BadRequestException('Poll has expired');
    }

    const isNotAvailable = input.isNotAvailable === true;

    if (isNotAvailable && poll.poll_type !== 'calendar') {
      throw new BadRequestException(
        'Not-available response is only supported for calendar polls',
      );
    }

    if (!isNotAvailable && input.optionIds.length === 0) {
      throw new BadRequestException('Select at least one option');
    }

    if (!isNotAvailable && poll.poll_type === 'multiple_choice') {
      if (input.optionIds.length < poll.min_selections) {
        throw new BadRequestException(
          `Select at least ${poll.min_selections} options`,
        );
      }
      if (poll.max_selections && input.optionIds.length > poll.max_selections) {
        throw new BadRequestException(
          `Select at most ${poll.max_selections} options`,
        );
      }
    }

    // For single choice, only allow one selection
    if (!isNotAvailable && poll.poll_type === 'single_choice' && input.optionIds.length > 1) {
      throw new BadRequestException('Only one option allowed');
    }

    // Check if name is required
    if (poll.require_name && !input.voterName) {
      throw new BadRequestException('Name is required');
    }

    // Create votes
    const votesToInsert = isNotAvailable
      ? [
          {
            poll_id: input.pollId,
            option_id: null,
            user_id: userId || null,
            voter_name: input.voterName || null,
            is_not_available: true,
          },
        ]
      : input.optionIds.map((optionId) => ({
          poll_id: input.pollId,
          option_id: optionId,
          user_id: userId || null,
          voter_name: input.voterName || null,
          is_not_available: false,
        }));

    const { data: votes, error: voteError } = await client
      .from('votes')
      .insert(votesToInsert)
      .select();

    if (voteError) {
      throw new BadRequestException(voteError.message);
    }

    return votes.map(this.mapVote);
  }

  async deleteUserVotes(pollId: string, userId: string): Promise<void> {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
  }

  private mapVote(data: any): Vote {
    return {
      id: data.id,
      pollId: data.poll_id,
      optionId: data.option_id,
      userId: data.user_id,
      voterName: data.voter_name,
      isNotAvailable: data.is_not_available,
      createdAt: data.created_at,
    };
  }
}
