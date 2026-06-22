'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, Save, Trash2, AlertTriangle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { WalkingChicken } from '@/components/walking-chicken';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

export default function AccountPage() {
  const t = useTranslations('account');
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [initialName, setInitialName] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setUser(user);

      // Display name shown in polls lives in profiles.full_name.
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const name =
        profile?.full_name?.trim() ||
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        '';

      setDisplayName(name);
      setInitialName(name);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = displayName.trim();
    if (!trimmed) {
      toast.error(t('nameRequired'));
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Update auth metadata (used by header/dashboard greeting). The `data`
      // keys are merged, so other metadata is preserved.
      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (metaError) throw metaError;

      // Update profiles.full_name (poll voter name) and propagate the new name
      // to all votes already cast. Done server-side because votes has no RLS
      // UPDATE policy and requires the service role.
      const res = await fetch('/api/account/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: trimmed }),
      });
      if (!res.ok) throw new Error('update_failed');

      setInitialName(trimmed);
      toast.success(t('nameUpdated'));
    } catch (error) {
      console.error('Failed to update display name:', error);
      toast.error(t('nameUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });

      if (!res.ok) {
        throw new Error('deletion_failed');
      }

      // Clear any client-side session remnants.
      const supabase = createClient();
      await supabase.auth.signOut();

      toast.success(t('accountDeleted'));
      router.replace('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(t('deleteError'));
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
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

  const nameUnchanged = displayName.trim() === initialName.trim();
  const confirmWord = t('deleteConfirmWord');
  const canDelete = confirmText.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>

          {/* Profile / display name */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {t('profile.title')}
              </CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1.5"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t('profile.emailHint')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayName">{t('profile.displayName')}</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('profile.displayNamePlaceholder')}
                    maxLength={60}
                    className="mt-1.5"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t('profile.displayNameHint')}
                  </p>
                </div>

                <Button type="submit" disabled={saving || nameUnchanged}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t('profile.save')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="relative border-destructive/50">
            <WalkingChicken />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('danger.title')}
              </CardTitle>
              <CardDescription>{t('danger.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmText('');
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('danger.deleteButton')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !deleting && setDeleteDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>{t('deleteDialog.bulletPolls')}</li>
            <li>{t('deleteDialog.bulletVotes')}</li>
            <li>{t('deleteDialog.bulletProfile')}</li>
          </ul>

          <div>
            <Label htmlFor="confirmDelete">
              {t('deleteDialog.confirmLabel', { word: confirmWord })}
            </Label>
            <Input
              id="confirmDelete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmWord}
              className="mt-1.5"
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={!canDelete || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('deleteDialog.deleting')}
                </>
              ) : (
                t('deleteDialog.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
