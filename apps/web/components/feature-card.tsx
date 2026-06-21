'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface FeatureCardProps {
  href: string;
  children: ReactNode;
}

export function FeatureCard({ href, children }: FeatureCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    router.push(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="mc-panel mc-btn p-8 block no-underline bg-[#E0E0E0] dark:bg-[#3B3B3B] relative cursor-pointer"
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#E0E0E0]/90 dark:bg-[#3B3B3B]/90 z-10">
          <Loader2 className="h-8 w-8 text-[#5D8A3A] dark:text-[#3DCC4A] animate-spin" />
        </div>
      )}
      {children}
    </a>
  );
}
