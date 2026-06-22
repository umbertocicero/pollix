'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { McBackground } from '@/components/mc-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ConfirmEmailPage() {
  const t = useTranslations('auth.confirm');

  return (
    <>
      <McBackground className="fixed inset-0 z-0" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md px-4">
            <Card className="overflow-hidden mc-panel">
              <CardContent className="p-8 text-center space-y-6">
                {/* Email Icon */}
                <div className="mx-auto w-20 h-20 bg-primary/10 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-primary" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{t('title')}</h1>
                  <p className="text-muted-foreground">
                    {t('description')}
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
                  <p>{t('instructions')}</p>
                  <p className="text-xs">{t('spam')}</p>
                </div>

                {/* Back to login */}
                <Button variant="outline" asChild className="w-full mc-btn">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('backToLogin')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
