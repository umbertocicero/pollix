'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { X, Clock, CalendarDays } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface DateOption {
  date: string;
  startTime?: string;
  endTime?: string;
}

interface PollDatePickerProps {
  value: DateOption[];
  onChange: (value: DateOption[]) => void;
}

export function PollDatePicker({ value, onChange }: PollDatePickerProps) {
  const t = useTranslations('poll.create');
  const locale = useLocale();
  const dateLocale = locale === 'it' ? it : enUS;
  
  const [showTimes, setShowTimes] = React.useState(false);

  // Convert string dates to Date objects for the calendar
  const selectedDates = value
    .filter(opt => opt.date)
    .map(opt => new Date(opt.date));

  const handleSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      onChange([]);
      return;
    }

    // Create new date options array
    const newOptions: DateOption[] = dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Preserve existing time data if date already exists
      const existing = value.find(v => v.date === dateStr);
      return {
        date: dateStr,
        startTime: existing?.startTime || '',
        endTime: existing?.endTime || '',
      };
    });

    // Sort by date
    newOptions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    onChange(newOptions);
  };

  const handleRemoveDate = (dateToRemove: string) => {
    const newOptions = value.filter(opt => opt.date !== dateToRemove);
    onChange(newOptions);
  };

  const handleTimeChange = (dateStr: string, field: 'startTime' | 'endTime', time: string) => {
    const newOptions = value.map(opt => 
      opt.date === dateStr ? { ...opt, [field]: time } : opt
    );
    onChange(newOptions);
  };

  const handleToday = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Check if today is already selected
    const isAlreadySelected = value.some(v => v.date === todayStr);
    
    if (isAlreadySelected) {
      return;
    }

    const newOptions = [
      ...value,
      { date: todayStr, startTime: '', endTime: '' }
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    onChange(newOptions);
  };

  const formatDateChip = (dateStr: string) => {
    const date = new Date(dateStr);
    const monthShort = format(date, 'MMM', { locale: dateLocale }).toLowerCase();
    const day = format(date, 'd');
    return { month: monthShort, day };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendar - Apple style */}
        <div className="flex-1">
          <div className="rounded-2xl bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-white/10 overflow-hidden">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleSelect}
              disabled={{ before: new Date() }}
              className="rounded-2xl"
            />
            <div className="border-t border-white/10 p-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-11 rounded-xl font-medium text-orange-500 hover:bg-orange-500/10 active:scale-[0.98] transition-all"
                onClick={handleToday}
              >
                {t('today')}
              </Button>
            </div>
          </div>
        </div>

        {/* Selected dates & options - Apple style */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Time toggle - Apple style pill */}
          <button 
            type="button"
            onClick={() => setShowTimes(!showTimes)}
            className={`
              w-full flex items-center gap-4 rounded-2xl p-4 
              transition-all duration-200 active:scale-[0.98]
              ${showTimes 
                ? 'bg-primary/10 border-2 border-primary shadow-md shadow-primary/10' 
                : 'bg-card/60 backdrop-blur border border-white/10 hover:bg-card/80'
              }
            `}
          >
            <div className={`
              flex items-center justify-center w-6 h-6 rounded-full transition-all
              ${showTimes 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
              }
            `}>
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold">{t('specifyTimes')}</span>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('specifyTimesDescription')}
              </p>
            </div>
            <div className={`
              w-12 h-7 rounded-full transition-all duration-300 relative
              ${showTimes ? 'bg-primary' : 'bg-muted'}
            `}>
              <div className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md
                transition-all duration-300
                ${showTimes ? 'left-[1.375rem]' : 'left-0.5'}
              `} />
            </div>
          </button>

          {/* Selected dates - Apple style chips */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground font-medium">
                {value.length > 0 
                  ? `${t('selectedDates')} (${value.length})`
                  : t('selectedDates')
                }
              </Label>
            </div>
            
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {value.filter(opt => opt.date).map((opt) => {
                  const { month, day } = formatDateChip(opt.date);
                  return (
                    <div
                      key={opt.date}
                      className="group flex items-center gap-2 rounded-2xl bg-primary/15 px-3 py-2 transition-all hover:bg-primary/20 active:scale-[0.96]"
                    >
                      <div className="text-center min-w-[2.5rem]">
                        <div className="text-[10px] font-medium text-primary/70 uppercase tracking-wide">{month}</div>
                        <div className="text-xl font-bold text-primary leading-tight">{day}</div>
                      </div>
                      <button
                        type="button"
                        className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                        onClick={() => handleRemoveDate(opt.date)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('noDatesSelected')}
                </p>
              </div>
            )}
          </div>

          {/* Time inputs for each date - Apple style */}
          {showTimes && value.length > 0 && (
            <div className="space-y-4 rounded-2xl bg-card/60 backdrop-blur border border-white/10 p-5">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {t('timeSlots')}
              </Label>
              <div className="space-y-3">
                {value.filter(opt => opt.date).map((opt) => {
                  const date = new Date(opt.date);
                  return (
                    <div key={opt.date} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <div className="w-16 text-sm font-semibold shrink-0 text-primary">
                        {format(date, 'd MMM', { locale: dateLocale })}
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <select
                          value={opt.startTime?.split(':')[0] || ''}
                          onChange={(e) => {
                            const hour = e.target.value;
                            const minutes = opt.startTime?.split(':')[1] || '00';
                            handleTimeChange(opt.date, 'startTime', hour ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-10 rounded-xl border-0 bg-background/80 px-2 text-sm font-medium text-center shadow-sm focus:ring-2 focus:ring-primary"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <span className="text-muted-foreground font-bold">:</span>
                        <select
                          value={opt.startTime?.split(':')[1] || ''}
                          onChange={(e) => {
                            const hour = opt.startTime?.split(':')[0] || '00';
                            const minutes = e.target.value;
                            handleTimeChange(opt.date, 'startTime', minutes ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-10 rounded-xl border-0 bg-background/80 px-2 text-sm font-medium text-center shadow-sm focus:ring-2 focus:ring-primary"
                        >
                          <option value="">--</option>
                          {['00', '15', '30', '45'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <span className="text-muted-foreground/50 mx-2">→</span>
                        <select
                          value={opt.endTime?.split(':')[0] || ''}
                          onChange={(e) => {
                            const hour = e.target.value;
                            const minutes = opt.endTime?.split(':')[1] || '00';
                            handleTimeChange(opt.date, 'endTime', hour ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-10 rounded-xl border-0 bg-background/80 px-2 text-sm font-medium text-center shadow-sm focus:ring-2 focus:ring-primary"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <span className="text-muted-foreground font-bold">:</span>
                        <select
                          value={opt.endTime?.split(':')[1] || ''}
                          onChange={(e) => {
                            const hour = opt.endTime?.split(':')[0] || '00';
                            const minutes = e.target.value;
                            handleTimeChange(opt.date, 'endTime', minutes ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-10 rounded-xl border-0 bg-background/80 px-2 text-sm font-medium text-center shadow-sm focus:ring-2 focus:ring-primary"
                        >
                          <option value="">--</option>
                          {['00', '15', '30', '45'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
