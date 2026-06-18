'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Calendar, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const editPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  options: z.array(
    z.object({
      id: z.string().optional(),
      text: z.string(),
    })
  ).optional(),
  dateOptions: z.array(
    z.object({
      id: z.string().optional(),
      date: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
  ).optional(),
  allowAnonymous: z.boolean().default(true),
  requireName: z.boolean().default(true),
  showResultsBeforeVote: z.boolean().default(true),
});

type EditPollForm = z.infer<typeof editPollSchema>;

interface Poll {
  id: string;
  short_id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  poll_type: 'single_choice' | 'multiple_choice' | 'calendar';
  allow_anonymous: boolean;
  require_name: boolean;
  show_results_before_vote: boolean;
  status: string;
}

interface PollOption {
  id: string;
  text: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
}

export default function EditPollPage() {
  const t = useTranslations('poll.create');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [originalOptions, setOriginalOptions] = useState<PollOption[]>([]);
  const [hasTimeOptions, setHasTimeOptions] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditPollForm>({
    resolver: zodResolver(editPollSchema),
    defaultValues: {
      options: [{ text: '' }, { text: '' }],
      dateOptions: [{ date: '', startTime: '', endTime: '' }, { date: '', startTime: '', endTime: '' }],
      allowAnonymous: true,
      requireName: true,
      showResultsBeforeVote: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const { fields: dateFields, append: appendDate, remove: removeDate } = useFieldArray({
    control,
    name: 'dateOptions',
  });

  useEffect(() => {
    const loadPoll = async () => {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/polls/' + pollId + '/edit');
        return;
      }
      setUser(user);

      // Load poll
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('short_id', pollId)
        .single();

      if (pollError || !pollData) {
        toast.error(tErrors('pollNotFound'));
        router.push('/dashboard');
        return;
      }

      // Check ownership
      if (pollData.creator_id !== user.id) {
        toast.error(tErrors('notOwner'));
        router.push('/polls/' + pollId);
        return;
      }

      setPoll(pollData);

      // Load options
      const { data: optionsData } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', pollData.id)
        .order('sort_order');

      setOriginalOptions(optionsData || []);

      // Check if poll was created with time options
      const hasTime = (optionsData || []).some(opt => opt.start_time || opt.end_time);
      setHasTimeOptions(hasTime);

      // Set form values
      const isCalendar = pollData.poll_type === 'calendar';

      reset({
        title: pollData.title,
        description: pollData.description || '',
        allowAnonymous: pollData.allow_anonymous,
        requireName: pollData.require_name,
        showResultsBeforeVote: pollData.show_results_before_vote,
        options: isCalendar ? [] : (optionsData || []).map(opt => ({
          id: opt.id,
          text: opt.text || '',
        })),
        dateOptions: isCalendar ? (optionsData || []).map(opt => ({
          id: opt.id,
          date: opt.date || '',
          startTime: opt.start_time || '',
          endTime: opt.end_time || '',
        })) : [],
      });

      setIsLoading(false);
    };

    loadPoll();
  }, [pollId, router, reset]);

  const onSubmit = async (data: EditPollForm) => {
    if (!poll || !user) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Update poll
      const { error: pollError } = await supabase
        .from('polls')
        .update({
          title: data.title,
          description: data.description || null,
          allow_anonymous: data.allowAnonymous,
          require_name: data.requireName,
          show_results_before_vote: data.showResultsBeforeVote,
          updated_at: new Date().toISOString(),
        })
        .eq('id', poll.id);

      if (pollError) {
        throw new Error(pollError.message);
      }

      // Update options - preserve existing option IDs to keep votes
      const isCalendar = poll.poll_type === 'calendar';

      if (isCalendar) {
        const newOptions = (data.dateOptions || [])
          .filter(opt => opt.date && opt.date.length > 0);

        // Get IDs of options that still exist in the form
        const existingIds = newOptions
          .filter(opt => opt.id)
          .map(opt => opt.id);

        // Delete only options that were removed from the form
        const idsToDelete = originalOptions
          .filter(orig => !existingIds.includes(orig.id))
          .map(orig => orig.id);

        if (idsToDelete.length > 0) {
          await supabase
            .from('poll_options')
            .delete()
            .in('id', idsToDelete);
        }

        // Update existing options and insert new ones
        for (let index = 0; index < newOptions.length; index++) {
          const opt = newOptions[index];
          if (opt.id) {
            // Update existing option
            await supabase
              .from('poll_options')
              .update({
                date: opt.date || null,
                start_time: opt.startTime || null,
                end_time: opt.endTime || null,
                sort_order: index,
              })
              .eq('id', opt.id);
          } else {
            // Insert new option
            await supabase
              .from('poll_options')
              .insert({
                poll_id: poll.id,
                text: null,
                date: opt.date || null,
                start_time: opt.startTime || null,
                end_time: opt.endTime || null,
                sort_order: index,
              });
          }
        }
      } else {
        const newOptions = (data.options || [])
          .filter(opt => opt.text && opt.text.trim().length > 0);

        // Get IDs of options that still exist in the form
        const existingIds = newOptions
          .filter(opt => opt.id)
          .map(opt => opt.id);

        // Delete only options that were removed from the form
        const idsToDelete = originalOptions
          .filter(orig => !existingIds.includes(orig.id))
          .map(orig => orig.id);

        if (idsToDelete.length > 0) {
          await supabase
            .from('poll_options')
            .delete()
            .in('id', idsToDelete);
        }

        // Update existing options and insert new ones
        for (let index = 0; index < newOptions.length; index++) {
          const opt = newOptions[index];
          if (opt.id) {
            // Update existing option
            await supabase
              .from('poll_options')
              .update({
                text: opt.text,
                sort_order: index,
              })
              .eq('id', opt.id);
          } else {
            // Insert new option
            await supabase
              .from('poll_options')
              .insert({
                poll_id: poll.id,
                text: opt.text,
                date: null,
                start_time: null,
                end_time: null,
                sort_order: index,
              });
          }
        }
      }

      toast.success(t('pollUpdated'));
      router.push(`/polls/${poll.short_id}`);
    } catch (error) {
      console.error('Failed to update poll:', error);
      toast.error(t('updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  const isCalendar = poll.poll_type === 'calendar';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">{t('editTitle') || 'Edit Poll'}</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Poll Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pollTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    {...register('title')}
                    placeholder={t('pollTitlePlaceholder')}
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    {...register('description')}
                    id="description"
                    placeholder={t('descriptionPlaceholder')}
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isCalendar ? t('dateOptions') : t('options')}
                </CardTitle>
                {isCalendar && (
                  <CardDescription>{t('dateOptionsDescription')}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isCalendar ? (
                  <>
                    {dateFields.map((field, index) => (
                        <div key={field.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <Label className="text-sm text-muted-foreground">
                              <Calendar className="mr-1 inline h-3 w-3" />
                              {t('date')}
                            </Label>
                            <Controller
                              control={control}
                              name={`dateOptions.${index}.date`}
                              render={({ field: dateField }) => (
                                <div className="mt-1 flex gap-1">
                                  <select
                                    value={dateField.value ? new Date(dateField.value).getDate().toString() : ''}
                                    onChange={(e) => {
                                      const day = parseInt(e.target.value);
                                      const current = dateField.value ? new Date(dateField.value) : new Date();
                                      current.setDate(day);
                                      dateField.onChange(format(current, 'yyyy-MM-dd'));
                                    }}
                                    className="w-16 h-9 rounded-md border border-input bg-background px-2 text-sm"
                                  >
                                    <option value="">{locale === 'it' ? 'GG' : 'DD'}</option>
                                    {Array.from({ length: 31 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {(i + 1).toString().padStart(2, '0')}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    value={dateField.value ? (new Date(dateField.value).getMonth() + 1).toString() : ''}
                                    onChange={(e) => {
                                      const month = parseInt(e.target.value) - 1;
                                      const current = dateField.value ? new Date(dateField.value) : new Date();
                                      current.setMonth(month);
                                      dateField.onChange(format(current, 'yyyy-MM-dd'));
                                    }}
                                    className="w-16 h-9 rounded-md border border-input bg-background px-2 text-sm"
                                  >
                                    <option value="">{locale === 'it' ? 'MM' : 'MM'}</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {(i + 1).toString().padStart(2, '0')}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    value={dateField.value ? new Date(dateField.value).getFullYear().toString() : ''}
                                    onChange={(e) => {
                                      const year = parseInt(e.target.value);
                                      const current = dateField.value ? new Date(dateField.value) : new Date();
                                      current.setFullYear(year);
                                      dateField.onChange(format(current, 'yyyy-MM-dd'));
                                    }}
                                    className="w-20 h-9 rounded-md border border-input bg-background px-2 text-sm"
                                  >
                                    <option value="">{locale === 'it' ? 'AAAA' : 'YYYY'}</option>
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <option key={2026 + i} value={2026 + i}>
                                        {2026 + i}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            />
                          </div>
                          {hasTimeOptions && (
                            <>
                              <div className="flex-1">
                                <Label className="text-sm text-muted-foreground">
                                  <Clock className="mr-1 inline h-3 w-3" />
                                  {t('startTime')}
                                </Label>
                                <Controller
                                  control={control}
                                  name={`dateOptions.${index}.startTime`}
                                  render={({ field: timeField }) => (
                                    <div className="mt-1 flex gap-1 items-center">
                                      <select
                                        value={timeField.value?.split(':')[0] || ''}
                                        onChange={(e) => {
                                          const hour = e.target.value;
                                          const minutes = timeField.value?.split(':')[1] || '00';
                                          timeField.onChange(hour ? `${hour}:${minutes}` : '');
                                        }}
                                        className="w-16 h-9 rounded-md border border-input bg-background px-2 text-sm"
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
                                        value={timeField.value?.split(':')[1] || ''}
                                        onChange={(e) => {
                                          const hour = timeField.value?.split(':')[0] || '00';
                                          const minutes = e.target.value;
                                          timeField.onChange(minutes ? `${hour}:${minutes}` : '');
                                        }}
                                        className="w-16 h-9 rounded-md border border-input bg-background px-2 text-sm"
                                      >
                                        <option value="">--</option>
                                        {['00', '15', '30', '45'].map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-sm text-muted-foreground">
                                  <Clock className="mr-1 inline h-3 w-3" />
                                  {t('endTime')}
                                </Label>
                                <Controller
                                  control={control}
                                  name={`dateOptions.${index}.endTime`}
                                  render={({ field: timeField }) => (
                                    <div className="mt-1 flex gap-1 items-center">
                                      <select
                                        value={timeField.value?.split(':')[0] || ''}
                                        onChange={(e) => {
                                          const hour = e.target.value;
                                          const minutes = timeField.value?.split(':')[1] || '00';
                                          timeField.onChange(hour ? `${hour}:${minutes}` : '');
                                        }}
                                        className="w-16 h-9 rounded-md border border-input bg-background px-2 text-sm"
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
                                        value={timeField.value?.split(':')[1] || ''}
                                        onChange={(e) => {
                                          const hour = timeField.value?.split(':')[0] || '00';
                                          const minutes = e.target.value;
                                          timeField.onChange(minutes ? `${hour}:${minutes}` : '');
                                        }}
                                        className="w-16 h-9 rounded-md border border-input bg-background px-2 text-sm"
                                      >
                                        <option value="">--</option>
                                        {['00', '15', '30', '45'].map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                />
                              </div>
                            </>
                          )}
                          {dateFields.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDate(index)}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendDate({ date: '', startTime: '', endTime: '' })}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addDate')}
                    </Button>
                  </>
                ) : (
                  <>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          {...register(`options.${index}.text`)}
                          placeholder={t('optionPlaceholder', { number: index + 1 })}
                        />
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ text: '' })}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addOption')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('settings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="allowAnonymous"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="allowAnonymous"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="allowAnonymous">{t('allowAnonymous')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="requireName"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="requireName"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="requireName">{t('requireName')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="showResultsBeforeVote"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="showResultsBeforeVote"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="showResultsBeforeVote">
                    {t('showResultsBeforeVote')}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('saving') : t('savePoll')}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
