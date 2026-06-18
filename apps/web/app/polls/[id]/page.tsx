'use client'; 

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  Copy,
  Check,
  Share2,
  QrCode,
  Mail,
  MessageCircle,
  Loader2,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
}

interface Poll {
  id: string;
  short_id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  poll_type: 'single_choice' | 'multiple_choice' | 'calendar';
  require_name: boolean;
  allow_anonymous: boolean;
  show_results_before_vote: boolean;
  status: string;
}

interface VoteResult {
  optionId: string;
  voteCount: number;
  percentage: number;
}

interface UserVote {
  id: string;
  option_id: string;
}

export default function PollVotePage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voterName, setVoterName] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Validation errors
  const [nameError, setNameError] = useState(false);
  const [selectionError, setSelectionError] = useState(false);

  const pollUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/polls/${pollId}` 
    : '';

  const fetchPollData = useCallback(async () => {
    const supabase = createClient();
    
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('short_id', pollId)
      .single();

    if (pollError || !pollData) {
      setError('Poll not found');
      setLoading(false);
      return;
    }

    setPoll(pollData);

    const { data: optionsData } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollData.id)
      .order('sort_order');

    setOptions(optionsData || []);

    const { data: votesData } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollData.id);

    const votes = votesData || [];
    const total = votes.length;
    setTotalVotes(total);

    const voteCounts: Record<string, number> = {};
    votes.forEach(v => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
    });

    const resultsData: VoteResult[] = (optionsData || []).map(opt => ({
      optionId: opt.id,
      voteCount: voteCounts[opt.id] || 0,
      percentage: total > 0 ? Math.round((voteCounts[opt.id] || 0) / total * 100) : 0,
    }));

    setResults(resultsData);
    setLoading(false);
  }, [pollId]);

  useEffect(() => {
    const checkUserAndVotes = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        // Pre-fill voter name with user's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setVoterName(profile.full_name);
        } else {
          // Use email as fallback
          setVoterName(user.email?.split('@')[0] || '');
        }
      }
    };
    checkUserAndVotes();
    fetchPollData();
  }, [fetchPollData]);

  // Check if logged user has already voted
  useEffect(() => {
    const checkUserVotes = async () => {
      if (!currentUser || !poll) return;
      
      const supabase = createClient();
      const { data: votes } = await supabase
        .from('votes')
        .select('id, option_id')
        .eq('poll_id', poll.id)
        .eq('user_id', currentUser.id);
      
      if (votes && votes.length > 0) {
        setUserVotes(votes);
        setHasVoted(true);
        setSelectedOptions(votes.map(v => v.option_id));
      }
    };
    checkUserVotes();
  }, [currentUser, poll]);

  const isOwner = poll && currentUser && poll.creator_id === currentUser.id;

  const handleVote = async () => {
    if (!poll) return;
    
    setNameError(false);
    setSelectionError(false);
    
    let hasErrors = false;
    
    if (poll.require_name && !voterName.trim()) {
      setNameError(true);
      hasErrors = true;
    }
    if (selectedOptions.length === 0) {
      setSelectionError(true);
      hasErrors = true;
    }
    
    if (hasErrors) return;

    setSubmitting(true);
    const supabase = createClient();

    try {
      const votes = selectedOptions.map(optionId => ({
        poll_id: poll.id,
        option_id: optionId,
        voter_name: voterName.trim() || null,
        user_id: currentUser?.id || null,
      }));

      const { error: voteError } = await supabase
        .from('votes')
        .insert(votes);

      if (voteError) throw new Error(voteError.message);

      setHasVoted(true);
      setIsEditing(false);
      toast.success(t('poll.vote.voteRecorded'));
      await fetchPollData();
      
      // Refresh user votes
      if (currentUser) {
        const { data: newVotes } = await supabase
          .from('votes')
          .select('id, option_id')
          .eq('poll_id', poll.id)
          .eq('user_id', currentUser.id);
        if (newVotes) setUserVotes(newVotes);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      toast.error(t('poll.vote.voteError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVote = async () => {
    if (!poll || !currentUser || userVotes.length === 0) return;
    
    setSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('poll_id', poll.id)
        .eq('user_id', currentUser.id);

      if (error) throw new Error(error.message);

      setUserVotes([]);
      setHasVoted(false);
      setSelectedOptions([]);
      toast.success(t('poll.vote.voteDeleted') || 'Vote deleted');
      await fetchPollData();
    } catch (err) {
      console.error('Failed to delete vote:', err);
      toast.error(t('poll.vote.deleteError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleModifyVote = async () => {
    if (!poll || !currentUser) return;
    
    setSubmitting(true);
    const supabase = createClient();

    try {
      // Delete old votes
      await supabase
        .from('votes')
        .delete()
        .eq('poll_id', poll.id)
        .eq('user_id', currentUser.id);

      // Insert new votes
      const votes = selectedOptions.map(optionId => ({
        poll_id: poll.id,
        option_id: optionId,
        voter_name: voterName.trim() || null,
        user_id: currentUser.id,
      }));

      const { error: voteError } = await supabase
        .from('votes')
        .insert(votes);

      if (voteError) throw new Error(voteError.message);

      setIsEditing(false);
      toast.success(t('poll.vote.voteModified') || 'Vote modified');
      await fetchPollData();
      
      // Refresh user votes
      const { data: newVotes } = await supabase
        .from('votes')
        .select('id, option_id')
        .eq('poll_id', poll.id)
        .eq('user_id', currentUser.id);
      if (newVotes) setUserVotes(newVotes);
    } catch (err) {
      console.error('Failed to modify vote:', err);
      toast.error(t('poll.vote.modifyError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    if (!poll) return;
    const text = `Vote on: ${poll.title}`;
    const urls: Record<string, string> = {
      email: `mailto:?subject=${encodeURIComponent(poll.title)}&body=${encodeURIComponent(text + '\n' + pollUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + pollUrl)}`,
    };
    window.open(urls[platform], '_blank');
  };

  const getOptionText = (option: PollOption) => {
    if (option.text) return option.text;
    if (option.date) {
      let text = new Date(option.date).toLocaleDateString();
      if (option.start_time) text += ` ${option.start_time}`;
      if (option.end_time) text += ` - ${option.end_time}`;
      return text;
    }
    return 'Option';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>{t('errors.pollNotFound')}</CardTitle>
              <CardDescription>
                {t('errors.pollNotFoundDescription')}
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{poll.title}</CardTitle>
                  {poll.description && (
                    <CardDescription>{poll.description}</CardDescription>
                  )}
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/polls/${poll.short_id}/edit`)}
                    className="ml-4 shrink-0"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('common.edit')}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Voter Name - show when not voted or editing, but disable for logged users */}
              {poll.require_name && (!hasVoted || isEditing) && (
                <div className="space-y-2">
                  <Label htmlFor="voterName" className="flex items-center gap-1 text-base font-semibold">
                    {t('poll.vote.yourName')}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="voterName"
                    value={voterName}
                    onChange={(e) => {
                      setVoterName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    placeholder={t('poll.vote.namePlaceholder')}
                    disabled={!!currentUser}
                    className={cn(
                      'text-base',
                      currentUser && 'bg-muted cursor-not-allowed',
                      nameError && 'border-2 border-red-500 bg-red-500/10'
                    )}
                  />
                  {currentUser && (
                    <p className="text-xs text-muted-foreground">
                      {t('poll.vote.nameAutoFilled')}
                    </p>
                  )}
                  {nameError && (
                    <div className="flex items-center gap-2 rounded-md bg-red-500/20 p-3 text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{t('poll.vote.nameRequired')}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Selection Error */}
              {selectionError && (!hasVoted || isEditing) && (
                <div className="flex items-center gap-2 rounded-md bg-red-500/20 p-3 text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{t('poll.vote.selectionRequired')}</span>
                </div>
              )}

              {/* Voting Options - show when not voted or editing */}
              {(!hasVoted || isEditing) && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-1 text-base font-semibold">
                    {poll.poll_type === 'single_choice' ? t('poll.vote.selectOption') : t('poll.vote.selectOptions')}
                    <span className="text-red-500">*</span>
                  </Label>
                  
                  {poll.poll_type === 'single_choice' ? (
                    <RadioGroup
                      value={selectedOptions[0]}
                      onValueChange={(value) => {
                        setSelectedOptions([value]);
                        setSelectionError(false);
                      }}
                      className={cn(selectionError && 'rounded-lg ring-2 ring-red-500 ring-offset-2 ring-offset-background')}
                    >
                      {options.map((option) => {
                        const result = results.find((r) => r.optionId === option.id);
                        return (
                          <div
                            key={option.id}
                            className={cn(
                              'flex items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/50 cursor-pointer',
                              selectedOptions.includes(option.id) 
                                ? 'border-primary bg-primary/10 shadow-md' 
                                : 'border-muted-foreground/20'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="flex-1 cursor-pointer text-base">
                                {getOptionText(option)}
                              </Label>
                            </div>
                            {poll.show_results_before_vote && (
                              <span className="text-sm text-muted-foreground">
                                {result?.voteCount || 0} ({result?.percentage || 0}%)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  ) : (
                    <div className={cn(selectionError && 'rounded-lg ring-2 ring-red-500 ring-offset-2 ring-offset-background')}>
                      {options.map((option) => {
                        const result = results.find((r) => r.optionId === option.id);
                        return (
                          <div
                            key={option.id}
                            className={cn(
                              'flex items-center justify-between rounded-lg border-2 p-4 mb-2 transition-all hover:bg-muted/50 cursor-pointer',
                              selectedOptions.includes(option.id) 
                                ? 'border-primary bg-primary/10 shadow-md' 
                                : 'border-muted-foreground/20'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={option.id}
                                checked={selectedOptions.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedOptions([...selectedOptions, option.id]);
                                    setSelectionError(false);
                                  } else {
                                    setSelectedOptions(selectedOptions.filter((id) => id !== option.id));
                                  }
                                }}
                              />
                              <Label htmlFor={option.id} className="flex-1 cursor-pointer text-base">
                                {getOptionText(option)}
                              </Label>
                            </div>
                            {poll.show_results_before_vote && (
                              <span className="text-sm text-muted-foreground">
                                {result?.voteCount || 0} ({result?.percentage || 0}%)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {poll.show_results_before_vote && (
                    <p className="text-sm text-muted-foreground">
                      {t('poll.results.totalVotes', { count: totalVotes })}
                    </p>
                  )}
                </div>
              )}

              {/* Results after voting (for logged users who voted and are not editing) */}
              {hasVoted && currentUser && !isEditing && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
                    <span className="font-medium">{t('poll.vote.yourVote')}:</span>
                    {' '}
                    {options
                      .filter(opt => userVotes.some(v => v.option_id === opt.id))
                      .map(opt => getOptionText(opt))
                      .join(', ')}
                  </div>
                  {options.map((option) => {
                    const result = results.find((r) => r.optionId === option.id);
                    const isUserChoice = userVotes.some(v => v.option_id === option.id);
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={cn('font-medium', isUserChoice && 'text-primary')}>
                            {isUserChoice && '✓ '}
                            {getOptionText(option)}
                          </span>
                          <span className="text-muted-foreground">
                            {result?.voteCount || 0} ({result?.percentage || 0}%)
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full transition-all duration-500',
                              isUserChoice ? 'bg-primary' : 'bg-muted-foreground/30'
                            )}
                            style={{ width: `${result?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-sm text-muted-foreground">
                    {t('poll.results.totalVotes', { count: totalVotes })}
                  </p>
                </div>
              )}

              {/* Results after voting (for anonymous users who voted) */}
              {hasVoted && !currentUser && (
                <div className="space-y-3">
                  {options.map((option) => {
                    const result = results.find((r) => r.optionId === option.id);
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{getOptionText(option)}</span>
                          <span className="text-muted-foreground">
                            {result?.voteCount || 0} ({result?.percentage || 0}%)
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${result?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-sm text-muted-foreground">
                    {t('poll.results.totalVotes', { count: totalVotes })}
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-4">
              {/* Submit button for new votes */}
              {(!hasVoted || isEditing) && !currentUser && (
                <Button 
                  onClick={handleVote} 
                  className="w-full" 
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('poll.vote.sending')}
                    </>
                  ) : (
                    t('poll.vote.submitVote')
                  )}
                </Button>
              )}

              {/* Submit button for logged in user's first vote */}
              {!hasVoted && currentUser && (
                <Button 
                  onClick={handleVote} 
                  className="w-full" 
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('poll.vote.sending')}
                    </>
                  ) : (
                    t('poll.vote.submitVote')
                  )}
                </Button>
              )}

              {/* Edit/Delete buttons for logged users who have voted */}
              {hasVoted && currentUser && !isEditing && (
                <div className="flex w-full gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(true)} 
                    className="flex-1"
                    disabled={submitting}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('poll.vote.modifyVote')}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteVote}
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {t('poll.vote.deleteVote')}
                  </Button>
                </div>
              )}

              {/* Save/Cancel buttons when editing */}
              {isEditing && currentUser && (
                <div className="flex w-full gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedOptions(userVotes.map(v => v.option_id));
                    }}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    onClick={handleModifyVote}
                    className="flex-1"
                    disabled={submitting || selectedOptions.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('poll.vote.saving')}
                      </>
                    ) : (
                      t('poll.vote.saveChanges')
                    )}
                  </Button>
                </div>
              )}

              {/* Confirmation message for anonymous users */}
              {hasVoted && !currentUser && (
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent/10 p-4 text-accent">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">{t('poll.vote.voteRecorded')}</span>
                </div>
              )}
            </CardFooter>
          </Card>

          {/* Share Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="h-5 w-5" />
                {t('poll.share.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={pollUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShowQR(!showQR)} className="gap-2">
                  <QrCode className="h-4 w-4" />
                  {t('poll.share.qrCode')}
                </Button>
              </div>

              {showQR && (
                <div className="flex justify-center rounded-lg bg-white p-4">
                  <QRCodeSVG value={pollUrl} size={200} />
                </div>
              )}

              <div className="flex justify-center gap-2">
                <Button variant="outline" size="icon" onClick={() => handleShare('email')}>
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleShare('whatsapp')}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
