'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Plus, BarChart3, Users, FileText, Loader2, MoreVertical, Trash2, XCircle, CheckCircle, Vote } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Poll {
  id: string;
  short_id: string;
  title: string;
  status: string;
  created_at: string;
  creator_id: string | null;
}

interface PollWithVotes extends Poll {
  voteCount: number;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [myPolls, setMyPolls] = useState<PollWithVotes[]>([]);
  const [votedPolls, setVotedPolls] = useState<PollWithVotes[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<PollWithVotes | null>(null);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    
    // Fetch polls created by user
    const { data: myPollsData, error: myPollsError } = await supabase
      .from('polls')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (myPollsError) {
      console.error('Error fetching my polls:', myPollsError);
    }

    const myPollsList = myPollsData || [];

    // Fetch vote counts for my polls
    const myPollsWithVotes: PollWithVotes[] = await Promise.all(
      myPollsList.map(async (poll) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', poll.id);

        return {
          ...poll,
          voteCount: count || 0,
        };
      })
    );

    setMyPolls(myPollsWithVotes);

    // Fetch polls where user has voted (but not created by user)
    const { data: userVotes } = await supabase
      .from('votes')
      .select('poll_id')
      .eq('user_id', user.id);

    const votedPollIds = Array.from(new Set((userVotes || []).map(v => v.poll_id)));
    
    // Filter out polls created by user
    const otherPollIds = votedPollIds.filter(
      pollId => !myPollsList.some(p => p.id === pollId)
    );

    if (otherPollIds.length > 0) {
      const { data: votedPollsData } = await supabase
        .from('polls')
        .select('*')
        .in('id', otherPollIds)
        .order('created_at', { ascending: false });

      const votedPollsWithVotes: PollWithVotes[] = await Promise.all(
        (votedPollsData || []).map(async (poll) => {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);

          return {
            ...poll,
            voteCount: count || 0,
          };
        })
      );

      setVotedPolls(votedPollsWithVotes);
    } else {
      setVotedPolls([]);
    }

    // Calculate stats (only for my polls)
    const totalPolls = myPollsList.length;
    const activePolls = myPollsList.filter(p => p.status === 'active').length;
    const totalVotes = myPollsWithVotes.reduce((sum, p) => sum + p.voteCount, 0);

    setStats({
      totalPolls,
      activePolls,
      totalVotes,
    });

    setLoading(false);
  }, []);

  const handleToggleStatus = async (poll: PollWithVotes, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const supabase = createClient();
    const newStatus = poll.status === 'active' ? 'closed' : 'active';
    
    const { error } = await supabase
      .from('polls')
      .update({ status: newStatus })
      .eq('id', poll.id);
    
    if (error) {
      toast.error(t('actions.statusError'));
      return;
    }
    
    toast.success(newStatus === 'closed' ? t('actions.pollClosed') : t('actions.pollActivated'));
    fetchDashboardData();
  };

  const handleDeleteClick = (poll: PollWithVotes, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPollToDelete(poll);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pollToDelete) return;
    
    const supabase = createClient();
    
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollToDelete.id);
    
    if (error) {
      toast.error(t('actions.deleteError'));
      setDeleteDialogOpen(false);
      setPollToDelete(null);
      return;
    }
    
    toast.success(t('actions.pollDeleted'));
    setDeleteDialogOpen(false);
    setPollToDelete(null);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDashboardName = () => {
    if (!currentUser) return 'user';

    const fullName = (currentUser.user_metadata?.full_name || '').trim();
    if (!fullName) return 'user';

    // Show only first name in the welcome greeting.
    return fullName.split(/\s+/)[0] || 'user';
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground">
                {t('welcome', { name: getDashboardName() })}
              </p>
            </div>
            <Button asChild>
              <Link href="/polls/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Poll
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('stats.totalPolls')}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPolls}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('stats.activePolls')}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePolls}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('stats.totalVotes')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVotes}</div>
              </CardContent>
            </Card>
          </div>

          {/* My Polls List */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('myPolls.title')}</CardTitle>
              <CardDescription>
                {t('myPolls.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myPolls.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">{t('empty.title')}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {t('empty.description')}
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/polls/create">{t('empty.cta')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {myPolls.map((poll) => (
                    <div
                      key={poll.id}
                      className="flex items-center justify-between py-4 transition-colors hover:bg-muted/50"
                    >
                      <Link href={`/polls/${poll.short_id}`} className="flex-1">
                        <h3 className="font-medium">{poll.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDate(poll.created_at)} • {poll.voteCount} votes
                        </p>
                      </Link>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            poll.status === 'active'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {poll.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleToggleStatus(poll, e)}>
                              {poll.status === 'active' ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {t('actions.closePoll')}
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {t('actions.activatePoll')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteClick(poll, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('actions.deletePoll')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Polls I Voted In */}
          {votedPolls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  {t('votedPolls.title')}
                </CardTitle>
                <CardDescription>
                  {t('votedPolls.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {votedPolls.map((poll) => (
                    <div
                      key={poll.id}
                      className="flex items-center justify-between py-4 transition-colors hover:bg-muted/50"
                    >
                      <Link href={`/polls/${poll.short_id}`} className="flex-1">
                        <h3 className="font-medium">{poll.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {poll.voteCount} votes • {poll.status}
                        </p>
                      </Link>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          poll.status === 'active'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {poll.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.deleteConfirmDescription', { title: pollToDelete?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
