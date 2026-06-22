'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
                {/* Pixel-art envelope icon */}
                <div className="mx-auto" style={{ width: 64, height: 64, imageRendering: 'pixelated' }}>
                  <svg viewBox="0 0 16 16" width="64" height="64" style={{ imageRendering: 'pixelated', display: 'block' }}>
                    {/* envelope body */}
                    <rect x="1" y="3" width="14" height="10" fill="#5D8A3A"/>
                    <rect x="1" y="3" width="14" height="1"  fill="#8BC34A"/>
                    <rect x="1" y="3" width="1"  height="10" fill="#8BC34A"/>
                    <rect x="1" y="12" width="14" height="1" fill="#2E5A1A"/>
                    <rect x="14" y="3" width="1"  height="10" fill="#2E5A1A"/>
                    {/* flap chevron (two diagonals) */}
                    <rect x="1" y="4"  width="2" height="1" fill="#3A7A1E"/>
                    <rect x="3" y="5"  width="2" height="1" fill="#3A7A1E"/>
                    <rect x="5" y="6"  width="2" height="1" fill="#3A7A1E"/>
                    <rect x="7" y="7"  width="2" height="1" fill="#3A7A1E"/>
                    <rect x="9" y="6"  width="2" height="1" fill="#3A7A1E"/>
                    <rect x="11" y="5" width="2" height="1" fill="#3A7A1E"/>
                    <rect x="13" y="4" width="2" height="1" fill="#3A7A1E"/>
                    {/* letter inside */}
                    <rect x="4" y="9"  width="8" height="1" fill="#C8E6A0"/>
                    <rect x="4" y="11" width="5" height="1" fill="#C8E6A0"/>
                  </svg>
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
