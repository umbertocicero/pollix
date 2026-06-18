import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { 
  CheckCircle2, 
  ListChecks, 
  Calendar,
  Share2,
  Users,
  BarChart3
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-background py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                {t('home.hero.title')}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t('home.hero.subtitle')}
              </p>
              <div className="mt-10 mx-auto w-full max-w-md px-2 grid grid-cols-1 gap-3 sm:max-w-none sm:px-0 sm:flex sm:items-center sm:justify-center sm:gap-x-4">
                <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary-600">
                  <Link href="/polls/create">{t('home.hero.cta')}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="#features">{t('home.hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('home.features.title')}
              </h2>
            </div>
            <div className="mx-auto mt-16 max-w-5xl">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Single Choice */}
                <div className="relative rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">
                    {t('home.features.singleChoice.title')}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {t('home.features.singleChoice.description')}
                  </p>
                </div>

                {/* Multiple Choice */}
                <div className="relative rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                    <ListChecks className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">
                    {t('home.features.multipleChoice.title')}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {t('home.features.multipleChoice.description')}
                  </p>
                </div>

                {/* Calendar */}
                <div className="relative rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">
                    {t('home.features.calendar.title')}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {t('home.features.calendar.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-muted/50 py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
            </div>
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                    1
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">Create</h3>
                  <p className="mt-2 text-muted-foreground">
                    Set up your poll in seconds with our intuitive interface
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-white">
                    2
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">Share</h3>
                  <p className="mt-2 text-muted-foreground">
                    Send the link or QR code to participants
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">
                    3
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">Decide</h3>
                  <p className="mt-2 text-muted-foreground">
                    View real-time results and make decisions together
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
