'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    const fullName = user.user_metadata?.full_name;
    if (fullName) return fullName.split(' ')[0];
    return user.email?.split('@')[0] || 'User';
  };

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white dark:bg-[#3B3B3B] border-b-[3px] border-black/10 dark:border-black/70 shadow-sm dark:shadow-[0_3px_0_rgba(255,255,255,0.08)]"
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo + Nav links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div
              className="flex h-9 w-9 items-center justify-center font-press text-white text-sm"
              style={{
                background: '#5D8A3A',
                borderTop: '3px solid rgba(255,255,255,0.55)',
                borderLeft: '3px solid rgba(255,255,255,0.55)',
                borderBottom: '3px solid rgba(0,0,0,0.5)',
                borderRight: '3px solid rgba(0,0,0,0.5)',
              }}
            >
              P
            </div>
            <span className="font-press text-sm text-[#5D8A3A] dark:text-[#FCEE4B] hidden sm:block">Pollix</span>
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/polls/create"
              className="font-pixel text-sm text-[#4A4A4A] dark:text-[#C6C6C6] hover:text-[#5D8A3A] dark:hover:text-[#3DCC4A] transition-colors duration-100"
            >
              {t('createPoll')}
            </Link>
            <Link
              href="/dashboard"
              className="font-pixel text-sm text-[#4A4A4A] dark:text-[#C6C6C6] hover:text-[#5D8A3A] dark:hover:text-[#3DCC4A] transition-colors duration-100"
            >
              {t('dashboard')}
            </Link>
          </div>
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />

          {loading ? (
            <div className="h-8 w-20 animate-pulse bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-[#4A4A4A] dark:text-[#C6C6C6] hover:text-foreground">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate font-pixel text-xs">
                    {getUserDisplayName()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 font-pixel text-xs mc-panel"
              >
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer text-foreground/80 hover:text-foreground">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer text-foreground/80 hover:text-foreground">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('account')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-[#B02E26] hover:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-foreground/70">
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#5D8A3A] text-white">
                <Link href="/signup">{t('signup')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-foreground/70 hover:text-foreground transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="px-4 py-4 md:hidden bg-white dark:bg-[#2A2A2A] border-b-[3px] border-black/10 dark:border-black/70"
        >
          <div className="flex flex-col gap-4">
            <Link
              href="/polls/create"
              className="font-pixel text-sm text-foreground/70 hover:text-[#5D8A3A] dark:hover:text-[#3DCC4A]"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('createPoll')}
            </Link>
            <Link
              href="/dashboard"
              className="font-pixel text-sm text-foreground/70 hover:text-[#5D8A3A] dark:hover:text-[#3DCC4A]"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('dashboard')}
            </Link>
            <div className="flex items-center gap-4 pt-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-pixel">
                  <User className="h-4 w-4" />
                  <span className="truncate">{getUserDisplayName()}</span>
                </div>
                <Link
                  href="/account"
                  className="font-pixel text-sm text-foreground/70 hover:text-[#5D8A3A] dark:hover:text-[#3DCC4A] flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  {t('account')}
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href="/signup">{t('signup')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
