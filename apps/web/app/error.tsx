'use client';

import Link from 'next/link';
import { ChickenGame } from '@/components/chicken-game';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="text-center space-y-2">
          <h1 className="font-press text-foreground" style={{ fontSize: 20 }}>
            Something went wrong
          </h1>
          <p className="font-vt text-muted-foreground text-xl">
            The server hit a creeper. While we fix it, play a round.
          </p>
        </div>

        <div className="w-full max-w-3xl">
          <ChickenGame label="500" />
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <Button
            onClick={reset}
            className="mc-btn bg-primary text-primary-foreground px-6"
          >
            Try again
          </Button>
          <Button asChild variant="outline" className="mc-btn px-6">
            <Link href="/">← Back to home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
