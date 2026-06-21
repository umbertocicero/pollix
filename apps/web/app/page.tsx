import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { McBackground } from '@/components/mc-background';
import { FeatureCard } from '@/components/feature-card';
import { CheckCircle2, ListChecks, Calendar } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  return (
    <>
      {/* Minecraft landscape background */}
      <McBackground className="fixed inset-0 z-0" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex-1">

          {/* ── HERO ──────────────────────────────────────────────── */}
          <section className="relative overflow-hidden py-24 sm:py-36">
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-black/25 z-0" />

            <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              {/* Main title in Press Start 2P */}
              <h1 className="mc-title text-xl sm:text-2xl lg:text-3xl text-[#FCEE4B] mb-6 px-2">
                {t('home.hero.title')}
              </h1>

              {/* Subtitle */}
              <p className="mt-4 text-base sm:text-lg text-white/90 font-pixel max-w-xl mx-auto leading-7">
                {t('home.hero.subtitle')}
              </p>

              {/* CTA Button */}
              <div className="mt-12 flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className="font-press text-xs px-8 py-4 h-auto bg-[#3DCC4A] text-[#0A1E0D]"
                >
                  <Link href="/polls/create">{t('home.hero.cta')}</Link>
                </Button>
              </div>
            </div>
          </div>

        </section>

        {/* ── FEATURES — inventory slots ─────────────────────────── */}
        <section id="features" className="py-20 bg-[#D0D0D0]/95 dark:bg-[#2A2A2A]/95 backdrop-blur-sm">
          <div className="container mx-auto px-4">

            {/* Section heading */}
            <div className="mx-auto max-w-xl text-center mb-16">
              <h2 className="font-press text-base sm:text-lg text-[#1E1E1E] dark:text-[#FCEE4B]">
                {t('home.features.title')}
              </h2>
              {/* Decorative pixel underline */}
              <div className="mt-4 mx-auto h-1 w-24 bg-[#5D8A3A]" />
            </div>

            {/* 3-column inventory grid */}
            <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 md:grid-cols-3">

              {/* Slot 1 — Single Choice */}
              <FeatureCard href="/polls/create?type=single_choice">
                <div
                  className="mc-slot w-16 h-16 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="h-8 w-8 text-[#3DCC4A]" />
                </div>
                <h3 className="font-pixel text-base text-[#1E1E1E] dark:text-white mb-3">
                  {t('home.features.singleChoice.title')}
                </h3>
                <p className="font-pixel text-xs text-[#666] dark:text-[#888] leading-6">
                  {t('home.features.singleChoice.description')}
                </p>
              </FeatureCard>

              {/* Slot 2 — Multiple Choice */}
              <FeatureCard href="/polls/create?type=multiple_choice">
                <div
                  className="mc-slot w-16 h-16 flex items-center justify-center mb-6"
                >
                  <ListChecks className="h-8 w-8 text-[#FCEE4B]" />
                </div>
                <h3 className="font-pixel text-base text-[#1E1E1E] dark:text-white mb-3">
                  {t('home.features.multipleChoice.title')}
                </h3>
                <p className="font-pixel text-xs text-[#666] dark:text-[#888] leading-6">
                  {t('home.features.multipleChoice.description')}
                </p>
              </FeatureCard>

              {/* Slot 3 — Calendar */}
              <FeatureCard href="/polls/create?type=calendar">
                <div
                  className="mc-slot w-16 h-16 flex items-center justify-center mb-6"
                >
                  <Calendar className="h-8 w-8 text-[#5DEFEA]" />
                </div>
                <h3 className="font-pixel text-base text-[#1E1E1E] dark:text-white mb-3">
                  {t('home.features.calendar.title')}
                </h3>
                <p className="font-pixel text-xs text-[#666] dark:text-[#888] leading-6">
                  {t('home.features.calendar.description')}
                </p>
              </FeatureCard>

            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS — crafting steps ─────────────────────── */}
        <section className="py-20 bg-[#C6C6C6]/95 dark:bg-[#1E1E1E]/95 backdrop-blur-sm">
          <div className="container mx-auto px-4">

            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="font-press text-base sm:text-lg text-[#1E1E1E] dark:text-white">
                {t('home.howItWorks.title')}
              </h2>
              <div className="mt-4 mx-auto h-1 w-24 bg-[#9C6B30]" />
            </div>

            <div className="mx-auto max-w-4xl grid grid-cols-1 gap-10 md:grid-cols-3">

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 flex items-center justify-center font-press text-white text-xl mb-6"
                  style={{
                    background: '#5D8A3A',
                    borderTop: '3px solid rgba(255,255,255,0.55)',
                    borderLeft: '3px solid rgba(255,255,255,0.55)',
                    borderBottom: '3px solid rgba(0,0,0,0.5)',
                    borderRight: '3px solid rgba(0,0,0,0.5)',
                  }}
                >
                  1
                </div>
                <h3 className="font-pixel text-base text-[#1E1E1E] dark:text-white mb-3">{t('home.howItWorks.step1Title')}</h3>
                <p className="font-pixel text-xs text-[#666] dark:text-[#888] leading-6">
                  {t('home.howItWorks.step1Description')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 flex items-center justify-center font-press text-white text-xl mb-6"
                  style={{
                    background: '#9C6B30',
                    borderTop: '3px solid rgba(255,255,255,0.55)',
                    borderLeft: '3px solid rgba(255,255,255,0.55)',
                    borderBottom: '3px solid rgba(0,0,0,0.5)',
                    borderRight: '3px solid rgba(0,0,0,0.5)',
                  }}
                >
                  2
                </div>
                <h3 className="font-pixel text-base text-[#1E1E1E] dark:text-white mb-3">{t('home.howItWorks.step2Title')}</h3>
                <p className="font-pixel text-xs text-[#666] dark:text-[#888] leading-6">
                  {t('home.howItWorks.step2Description')}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 flex items-center justify-center font-press text-white text-xl mb-6"
                  style={{
                    background: '#3DCC4A',
                    borderTop: '3px solid rgba(255,255,255,0.55)',
                    borderLeft: '3px solid rgba(255,255,255,0.55)',
                    borderBottom: '3px solid rgba(0,0,0,0.5)',
                    borderRight: '3px solid rgba(0,0,0,0.5)',
                  }}
                >
                  3
                </div>
                <h3 className="font-pixel text-base text-[#1E1E1E] dark:text-white mb-3">{t('home.howItWorks.step3Title')}</h3>
                <p className="font-pixel text-xs text-[#666] dark:text-[#888] leading-6">
                  {t('home.howItWorks.step3Description')}
                </p>
              </div>

            </div>

            {/* Final CTA */}
            <div className="mt-16 flex justify-center">
              <Button
                asChild
                size="lg"
                className="font-press text-xs px-8 py-4 h-auto"
              >
                <Link href="/polls/create">
                  [ {t('home.howItWorks.cta')} ]
                </Link>
              </Button>
            </div>

          </div>
        </section>

      </main>

        <Footer />
      </div>
    </>
  );
}
