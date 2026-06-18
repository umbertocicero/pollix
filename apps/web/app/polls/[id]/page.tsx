'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';

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

export default function PollVotePage() {
  const t = useTranslations();
  const params = useParams();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voterName, setVoterName] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validation errors
  const [nameError, setNameError] = useState(false);
  const [selectionError, setSelectionError] = useState(false);

  const pollUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/polls/${pollId}` 
    : '';

  const fetchPollData = useCallback(async () => {
    const supabase = createClient();
    
    // Fetch poll by short_id
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

    // Fetch options
    const { data: optionsData } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollData.id)
      .order('sort_order');

    setOptions(optionsData || []);

    // Fetch vote counts
    const { data: votesData } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollData.id);

    const votes = votesData || [];
    const total = votes.length;
    setTotalVotes(total);

    // Calculate results
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
    setShowResults(pollData.show_results_before_vote);
    setLoading(false);
  }, [pollId]);

  useEffect(() => {
    fetchPollData();
  }, [fetchPollData]);

  const handleVote = async () => {
    if (!poll) return;
    
    // Reset errors
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
    
    if (hasErrors) {
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      // Insert votes
      const votes = selectedOptions.map(optionId => ({
        poll_id: poll.id,
        option_id: optionId,
        voter_name: voterName.trim() || null,
      }));

      const { error: voteError } = await supabase
        .from('votes')
        .insert(votes);

      if (voteError) {
        console.error('Vote error:', voteError);
        throw new Error(voteError.message);
      }

      setHasVoted(true);
      setShowResults(true);
      toast.success(t('poll.vote.voteRecorded'));
      
      // Refresh results
      await fetchPollData();
    } catch (err) {
      console.error('Failed to vote:', err);
      toast.error('Failed to submit vote');
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
      teams: `https://teams.microsoft.com/share?href=${encodeURIComponent(pollUrl)}&text=${encodeURIComponent(text)}`,
    };
    window.open(urls[platform], '_blank');
  };

  // Helper to get option display text
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
              <CardTitle>Poll not found</CardTitle>
              <CardDescription>
                This poll may have been deleted or the link is incorrect.
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
          {/* Poll Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription>{poll.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Voter Name */}
              {poll.require_name && !hasVoted && (
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
                    className={cn(
                      'mt-1.5 text-base',
                      nameError && 'border-2 border-red-500 bg-red-500/10 focus-visible:ring-red-500'
                    )}
                  />
                  {nameError && (
                    <div className="flex items-center gap-2 rounded-md bg-red-500/20 p-3 text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{t('poll.vote.nameRequired') || 'Per favore inserisci il tuo nome'}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Selection Error */}
              {selectionError && !hasVoted && (
                <div className="flex items-center gap-2 rounded-md bg-red-500/20 p-3 text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{t('poll.vote.selectionRequired') || 'Per favore seleziona almeno un\'opzione'}</span>
                </div>
              )}

              {/* Voting Options (show when not voted) */}
              {!hasVoted && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-1 text-base font-semibold\">\n                    {poll.poll_type === 'single_choice' \n                      ? (t('poll.vote.selectOption') || 'Seleziona un\\'opzione')\n                      : (t('poll.vote.selectOptions') || 'Seleziona le opzioni')}\n                    <span className=\"text-red-500\">*</span>\n                  </Label>\n                  \n                  {poll.poll_type === 'single_choice' ? (\n                    <RadioGroup\n                      value={selectedOptions[0]}\n                      onValueChange={(value) => {\n                        setSelectedOptions([value]);\n                        setSelectionError(false);\n                      }}\n                      className={cn(selectionError && 'rounded-lg ring-2 ring-red-500 ring-offset-2 ring-offset-background')}\n                    >\n                      {options.map((option) => {\n                        const result = results.find((r) => r.optionId === option.id);\n                        return (\n                          <div\n                            key={option.id}\n                            className={cn(\n                              'flex items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/50 cursor-pointer',\n                              selectedOptions.includes(option.id) \n                                ? 'border-primary bg-primary/10 shadow-md' \n                                : 'border-muted-foreground/20'\n                            )}\n                          >\n                            <div className=\"flex items-center space-x-3\">\n                              <RadioGroupItem value={option.id} id={option.id} />\n                              <Label\n                                htmlFor={option.id}\n                                className=\"flex-1 cursor-pointer text-base\"\n                              >\n                                {getOptionText(option)}\n                              </Label>\n                            </div>\n                            {poll.show_results_before_vote && (\n                              <span className=\"text-sm text-muted-foreground\">
                                {result?.voteCount || 0} ({result?.percentage || 0}%)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  ) : (
                    options.map((option) => {
                      const result = results.find((r) => r.optionId === option.id);
                      return (
                        <div
                          key={option.id}
                          className={cn(
                            'flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50',
                            selectedOptions.includes(option.id) && 'border-primary bg-primary/5'
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={option.id}
                              checked={selectedOptions.includes(option.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedOptions([...selectedOptions, option.id]);
                                } else {
                                  setSelectedOptions(
                                    selectedOptions.filter((id) => id !== option.id)
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={option.id}
                              className="flex-1 cursor-pointer"
                            >
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
                    })
                  )}
                  {poll.show_results_before_vote && (
                    <p className="text-sm text-muted-foreground">
                      {t('poll.results.totalVotes', { count: totalVotes })}
                    </p>
                  )}
                </div>
              )}

              {/* Results Only (show after voting) */}
              {hasVoted && (
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
              {!hasVoted && (
                <Button 
                  onClick={handleVote} 
                  className="w-full" 
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    t('poll.vote.submitVote')
                  )}
                </Button>
              )}

              {hasVoted && (
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
              {/* Copy Link */}
              <div className="flex gap-2">
                <Input value={pollUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowQR(!showQR)}
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  {t('poll.share.qrCode')}
                </Button>
              </div>

              {showQR && (
                <div className="flex justify-center rounded-lg bg-white p-4">
                  <QRCodeSVG value={pollUrl} size={200} />
                </div>
              )}

              {/* Share Buttons */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('email')}
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('whatsapp')}
                >
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
