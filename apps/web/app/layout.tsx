import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pollix.it';

export const metadata: Metadata = {
  title: 'Pollix - Simple polls for better decisions',
  description:
    'Create polls and schedule meetings in minutes. Participants can vote without registration.',
  keywords: ['polls', 'scheduling', 'meetings', 'voting', 'availability', 'survey', 'decision making'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.pollix.it'),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  openGraph: {
    title: 'Pollix - Simple polls for better decisions',
    description: 'Create polls, schedule meetings, and collect availability in minutes.',
    type: 'website',
    siteName: 'Pollix',
    images: ['/opengraph-image.png'],
    url: 'https://www.pollix.it',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pollix - Simple polls for better decisions',
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
    canonical: 'https://www.pollix.it',
  },
};

function hasSeoDescription(messages: unknown): messages is { seo: { description: string } } {
  return (
    typeof messages === 'object' &&
    messages !== null &&
    'seo' in messages &&
    typeof (messages as any).seo?.description === 'string'
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const schemaDescription = hasSeoDescription(messages)
    ? messages.seo.description
    : 'Create polls and schedule meetings in minutes. Participants can vote without registration.';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pixel fonts — must load before first paint to avoid FOUT */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&family=Press+Start+2P&family=Pixelify+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Pollix',
              description: schemaDescription,
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
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'? '&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');`,
              }}
            />
        )}
        {process.env.NEXT_PUBLIC_COOKIEYES_ID && (
          <Script
            id="cookieyes"
            strategy="beforeInteractive"
            src={`https://cdn-cookieyes.com/client_data/${process.env.NEXT_PUBLIC_COOKIEYES_ID}/script.js`}
          />
        )}
        {!process.env.NEXT_PUBLIC_GTM_ID && !process.env.NEXT_PUBLIC_COOKIEYES_ID && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body>
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
            <Analytics />
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
