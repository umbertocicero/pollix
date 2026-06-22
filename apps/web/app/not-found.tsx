import Link from 'next/link';
import { McBackground } from '@/components/mc-background';
import { ChickenGame } from '@/components/chicken-game';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <>
      <McBackground className="fixed inset-0 z-0" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-10">
          <div className="text-center space-y-2">
            <h1 className="font-press text-white drop-shadow" style={{ fontSize: 20 }}>
              Page Not Found
            </h1>
            <p className="font-vt text-white/80 text-xl">
              This block doesn't exist. Jump over it.
            </p>
          </div>

          <div className="w-full max-w-2xl">
            <ChickenGame label="404" />
          </div>

          <Button asChild className="mc-btn bg-primary text-primary-foreground px-6">
            <Link href="/">← Back to home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    </>
  );
}
