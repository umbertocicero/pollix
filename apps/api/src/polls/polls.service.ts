import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreatePollInput, Poll, PollWithDetails, PollResult } from '@planora/shared';

@Injectable()
export class PollsService {
  constructor(private supabase: SupabaseService) {}

  async create(input: CreatePollInput, creatorId?: string): Promise<Poll> {
    const client = this.supabase.getClient();

    // Create the poll
    const { data: poll, error: pollError } = await client
      .from('polls')
      .insert({
        creator_id: creatorId || null,
        title: input.title,
        description: input.description,
        poll_type: input.pollType,
        allow_anonymous: input.allowAnonymous ?? true,
        require_name: input.requireName ?? true,
        allow_multiple_votes: input.allowMultipleVotes ?? false,
        show_results_before_vote: input.showResultsBeforeVote ?? true,
        min_selections: input.minSelections ?? 1,
        max_selections: input.maxSelections,
        timezone: input.timezone ?? 'UTC',
        expires_at: input.expiresAt,
      })
      .select()
      .single();

    if (pollError) {
      throw new BadRequestException(pollError.message);
    }

    // Create options
    const optionsToInsert = input.options.map((opt, index) => ({
      poll_id: poll.id,
      text: opt.text,
      date: opt.date,
      start_time: opt.startTime,
      end_time: opt.endTime,
      sort_order: index,
    }));

    const { error: optionsError } = await client
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      // Rollback poll creation
      await client.from('polls').delete().eq('id', poll.id);
      throw new BadRequestException(optionsError.message);
    }

    return this.mapPoll(poll);
  }

  async findByShortId(shortId: string): Promise<PollWithDetails> {
    const client = this.supabase.getClient();

    const { data: poll, error: pollError } = await client
      .from('polls')
      .select(`
        *,
        poll_options (*),
        votes (*)
      `)
      .eq('short_id', shortId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundException('Poll not found');
    }

    return {
      ...this.mapPoll(poll),
      options: poll.poll_options.map(this.mapOption),
      votes: poll.votes.map(this.mapVote),
    };
  }

  async findById(id: string): Promise<PollWithDetails> {
    const client = this.supabase.getClient();

    const { data: poll, error: pollError } = await client
      .from('polls')
      .select(`
        *,
        poll_options (*),
        votes (*)
      `)
      .eq('id', id)
      .single();

    if (pollError || !poll) {
      throw new NotFoundException('Poll not found');
    }

    return {
      ...this.mapPoll(poll),
      options: poll.poll_options.map(this.mapOption),
      votes: poll.votes.map(this.mapVote),
    };
  }

  async getResults(pollId: string): Promise<PollResult[]> {
    const poll = await this.findById(pollId);
    const totalVotes = poll.votes.length;

    return poll.options.map((option) => {
      const optionVotes = poll.votes.filter((v) => v.optionId === option.id);
      return {
        optionId: option.id,
        optionText: option.text,
        optionDate: option.date,
        startTime: option.startTime,
        endTime: option.endTime,
        voteCount: optionVotes.length,
        voterNames: optionVotes
          .map((v) => v.voterName)
          .filter((n): n is string => n !== null),
        percentage: totalVotes > 0 ? (optionVotes.length / totalVotes) * 100 : 0,
      };
    });
  }

  async findByCreator(creatorId: string): Promise<Poll[]> {
    const client = this.supabase.getClient();

    const { data: polls, error } = await client
      .from('polls')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return polls.map(this.mapPoll);
  }

  async close(pollId: string, creatorId: string): Promise<Poll> {
    const client = this.supabase.getClient();

    const { data: poll, error } = await client
      .from('polls')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', pollId)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error || !poll) {
      throw new NotFoundException('Poll not found or unauthorized');
    }

    return this.mapPoll(poll);
  }

  async delete(pollId: string, creatorId: string): Promise<void> {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('polls')
      .delete()
      .eq('id', pollId)
      .eq('creator_id', creatorId);

    if (error) {
      throw new BadRequestException(error.message);
    }
  }

  private mapPoll(data: any): Poll {
    return {
      id: data.id,
      shortId: data.short_id,
      creatorId: data.creator_id,
      title: data.title,
      description: data.description,
      pollType: data.poll_type,
      status: data.status,
      allowAnonymous: data.allow_anonymous,
      requireName: data.require_name,
      allowMultipleVotes: data.allow_multiple_votes,
      showResultsBeforeVote: data.show_results_before_vote,
      hasPassword: !!data.password_hash,
      minSelections: data.min_selections,
      maxSelections: data.max_selections,
      timezone: data.timezone,
      expiresAt: data.expires_at,
      closedAt: data.closed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapOption(data: any) {
    return {
      id: data.id,
      pollId: data.poll_id,
      text: data.text,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
    };
  }

  private mapVote(data: any) {
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
