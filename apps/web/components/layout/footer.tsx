import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-white dark:bg-[#2A2A2A] border-t-[3px] border-black/10 dark:border-black/70">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div
              className="flex h-8 w-8 items-center justify-center font-press text-white text-xs"
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
            <span className="font-press text-xs text-[#5D8A3A] dark:text-[#FCEE4B]">Planora</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/polls/create"
              className="font-pixel text-xs text-muted-foreground hover:text-foreground transition-colors duration-100"
            >
              {t('createPoll')}
            </Link>
            <Link
              href="/#features"
              className="font-pixel text-xs text-muted-foreground hover:text-foreground transition-colors duration-100"
            >
              {t('features')}
            </Link>
          </nav>

          <p className="font-pixel text-xs text-muted-foreground">
            {t('madeWith')}{' '}
            <span className="text-[#B02E26]">&#9829;</span>{' '}
            by Umberto Antonio Cicero
          </p>
        </div>
      </div>
    </footer>
  );
}
