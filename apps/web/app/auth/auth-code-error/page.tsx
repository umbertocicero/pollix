'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { AlertTriangle, Clock, Mail, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { McBackground } from '@/components/mc-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function AuthCodeErrorContent() {
  const t = useTranslations('auth.authCodeError');
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get('reason') ?? 'invalid';
  const isExpired = reason === 'expired';

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Email inviata!');
    } catch {
      toast.error('Errore nell\'invio. Riprova o vai al login.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <McBackground className="fixed inset-0 z-0" />
      <div className="relative z-10 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="mc-panel">
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center">
                {isExpired ? (
                  <Clock className="h-12 w-12 text-yellow-500" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                )}
              </div>
              <CardTitle className="font-pixel text-xl">
                {isExpired ? t('expiredTitle') : t('invalidTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {isExpired ? t('expiredDescription') : t('invalidDescription')}
                <br />
                <span className="text-muted-foreground text-sm">
                  {isExpired ? t('expiredHint') : t('invalidHint')}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isExpired && !sent && (
                <form onSubmit={handleResend} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mc-inset"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full mc-btn bg-primary text-primary-foreground"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : t('resendEmail')}
                  </Button>
                </form>
              )}

              {sent && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ✓ Check your inbox — a new confirmation link is on its way.
                </p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full mc-btn"
                  onClick={() => router.push('/auth/login')}
                >
                  {t('goToLogin')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('goHome')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthCodeErrorContent />
    </Suspense>
  );
}
