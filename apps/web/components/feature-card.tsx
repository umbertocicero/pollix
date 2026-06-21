'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface FeatureCardProps {
  href: string;
  children: ReactNode;
}

export function FeatureCard({ href, children }: FeatureCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Prefetch the target route so the redirect after a click is near-instant.
  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    router.push(href);
  };

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className="mc-panel mc-btn p-6 sm:p-8 block no-underline bg-[#E0E0E0] dark:bg-[#3B3B3B] cursor-pointer"
      >
        {children}
      </a>

      {/* Full-page centered loader shown while the redirect is in flight */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-[#3DCC4A]" />
        </div>
      )}
    </>
  );
}
