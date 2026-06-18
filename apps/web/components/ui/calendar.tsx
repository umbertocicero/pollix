'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { it, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const locale = useLocale();
  const dateLocale = locale === 'it' ? it : enUS;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-4', className)}
      locale={dateLocale}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center px-2',
        caption_label: 'text-base font-semibold',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-muted/50 rounded-xl transition-all inline-flex items-center justify-center'
        ),
        nav_button_previous: 'absolute left-2',
        nav_button_next: 'absolute right-2',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-10 font-medium text-[0.75rem] uppercase',
        row: 'flex w-full mt-1',
        cell: 'h-10 w-10 text-center text-sm p-0.5 relative focus-within:relative focus-within:z-20',
        day: cn(
          'h-9 w-9 p-0 font-medium rounded-xl transition-all duration-200 hover:bg-muted/50 active:scale-90',
          'aria-selected:opacity-100 inline-flex items-center justify-center'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-xl shadow-md shadow-primary/20',
        day_today: 'ring-2 ring-orange-500 ring-offset-2 ring-offset-background font-bold',
        day_outside:
          'day-outside text-muted-foreground opacity-40 aria-selected:bg-primary/50 aria-selected:text-primary-foreground aria-selected:opacity-70',
        day_disabled: 'text-muted-foreground opacity-30 cursor-not-allowed',
        day_range_middle:
          'aria-selected:bg-primary/20 aria-selected:text-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
