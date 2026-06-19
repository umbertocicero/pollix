import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Planora - Simple polls for better decisions',
  description:
    'Create polls and schedule meetings in minutes. Participants can vote without registration.',
  keywords: ['polls', 'scheduling', 'meetings', 'voting', 'availability', 'survey', 'decision making'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://planora-jet.vercel.app'),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  openGraph: {
    title: 'Planora - Simple polls for better decisions',
    description: 'Create polls, schedule meetings, and collect availability in minutes.',
    type: 'website',
    siteName: 'Planora',
    images: ['/opengraph-image.png'],
    url: 'https://planora-jet.vercel.app',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planora - Simple polls for better decisions',
    description: 'Create polls, schedule meetings, and collect availability in minutes.',
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  alternates: {
    canonical: 'https://planora-jet.vercel.app',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Planora',
              description: messages?.seo?.description || 'Create polls and schedule meetings in minutes. Participants can vote without registration.',
              url: appUrl,
              applicationCategory: 'BusinessApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'EUR',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '150',
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
