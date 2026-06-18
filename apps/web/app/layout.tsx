import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Planora - Simple polls for better decisions',
  description:
    'Create polls and schedule meetings in minutes. Participants can vote without registration.',
  keywords: ['polls', 'scheduling', 'meetings', 'voting', 'availability'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://planora-jet.vercel.app'),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Planora - Simple polls for better decisions',
    description: 'Create polls, schedule meetings, and collect availability in minutes.',
    type: 'website',
    siteName: 'Planora',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planora - Simple polls for better decisions',
    description: 'Create polls, schedule meetings, and collect availability in minutes.',
    images: ['/opengraph-image.png'],
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
