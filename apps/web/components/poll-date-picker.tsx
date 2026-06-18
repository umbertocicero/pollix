'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { X, Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface DateOption {
  date: string;
  startTime?: string;
  endTime?: string;
}

interface PollDatePickerProps {
  value: DateOption[];
  onChange: (value: DateOption[]) => void;
  minDates?: number;
}

export function PollDatePicker({ value, onChange, minDates = 2 }: PollDatePickerProps) {
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
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="rounded-lg border bg-card">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleSelect}
              disabled={{ before: new Date() }}
              className="rounded-lg"
            />
            <div className="border-t p-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                onClick={handleToday}
              >
                {t('today')}
              </Button>
            </div>
          </div>
        </div>

        {/* Selected dates & options */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Time toggle */}
          <label 
            htmlFor="specify-times"
            className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id="specify-times"
              checked={showTimes}
              onCheckedChange={(checked) => setShowTimes(checked === true)}
              className="h-5 w-5"
            />
            <div className="flex-1">
              <span className="font-medium">{t('specifyTimes')}</span>
              <p className="text-sm text-muted-foreground">
                {t('specifyTimesDescription')}
              </p>
            </div>
          </label>

          {/* Selected dates */}
          {value.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                {t('selectedDates')} ({value.length})
              </Label>
              
              <div className="flex flex-wrap gap-3">
                {value.filter(opt => opt.date).map((opt) => {
                  const { month, day } = formatDateChip(opt.date);
                  return (
                    <div
                      key={opt.date}
                      className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/10 px-3 py-2"
                    >
                      <div className="text-center min-w-[2rem]">
                        <div className="text-xs text-primary/70">{month}</div>
                        <div className="text-lg font-semibold text-primary leading-tight">{day}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-primary/20"
                        onClick={() => handleRemoveDate(opt.date)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time inputs for each date */}
          {showTimes && value.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('timeSlots')}
              </Label>
              <div className="space-y-2">
                {value.filter(opt => opt.date).map((opt) => {
                  const date = new Date(opt.date);
                  return (
                    <div key={opt.date} className="flex items-center gap-2">
                      <div className="w-16 text-sm font-medium shrink-0">
                        {format(date, 'd MMM', { locale: dateLocale })}
                      </div>
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <select
                          value={opt.startTime?.split(':')[0] || ''}
                          onChange={(e) => {
                            const hour = e.target.value;
                            const minutes = opt.startTime?.split(':')[1] || '00';
                            handleTimeChange(opt.date, 'startTime', hour ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <span className="text-muted-foreground">:</span>
                        <select
                          value={opt.startTime?.split(':')[1] || ''}
                          onChange={(e) => {
                            const hour = opt.startTime?.split(':')[0] || '00';
                            const minutes = e.target.value;
                            handleTimeChange(opt.date, 'startTime', minutes ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="">--</option>
                          {['00', '15', '30', '45'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <span className="text-muted-foreground mx-1">-</span>
                        <select
                          value={opt.endTime?.split(':')[0] || ''}
                          onChange={(e) => {
                            const hour = e.target.value;
                            const minutes = opt.endTime?.split(':')[1] || '00';
                            handleTimeChange(opt.date, 'endTime', hour ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <span className="text-muted-foreground">:</span>
                        <select
                          value={opt.endTime?.split(':')[1] || ''}
                          onChange={(e) => {
                            const hour = opt.endTime?.split(':')[0] || '00';
                            const minutes = e.target.value;
                            handleTimeChange(opt.date, 'endTime', minutes ? `${hour}:${minutes}` : '');
                          }}
                          className="w-14 h-9 rounded-md border border-input bg-background px-2 text-sm"
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

          {/* Minimum dates warning */}
          {value.filter(opt => opt.date).length < minDates && (
            <p className="text-sm text-muted-foreground">
              {t('minDatesRequired', { count: minDates })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
