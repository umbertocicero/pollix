'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle2, ListChecks, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
import { cn } from '@/lib/utils';

const pollTypes = [
  {
    id: 'single_choice',
    icon: CheckCircle2,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'multiple_choice',
    icon: ListChecks,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    id: 'calendar',
    icon: Calendar,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
] as const;

const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  pollType: z.enum(['single_choice', 'multiple_choice', 'calendar']),
  options: z.array(
    z.object({
      text: z.string(),
    })
  ).optional(),
  dateOptions: z.array(
    z.object({
      date: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
  ).optional(),
  allowAnonymous: z.boolean().default(true),
  requireName: z.boolean().default(true),
  showResultsBeforeVote: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.pollType === 'calendar') {
      // For calendar: need at least 2 date options with valid dates
      const validDates = data.dateOptions?.filter(opt => opt.date && opt.date.length > 0) || [];
      return validDates.length >= 2;
    }
    // For single/multiple choice: need at least 2 options with text
    const validOptions = data.options?.filter(opt => opt.text && opt.text.trim().length > 0) || [];
    return validOptions.length >= 2;
  },
  { message: 'At least 2 options required', path: ['options'] }
);

type CreatePollForm = z.infer<typeof createPollSchema>;

export default function CreatePollPage() {
  const t = useTranslations('poll.create');
  const tTypes = useTranslations('poll.types');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePollForm>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      pollType: 'single_choice',
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

  const selectedType = watch('pollType');
  const isCalendar = selectedType === 'calendar';

  const onSubmit = async (data: CreatePollForm) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      
      // Create the poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: data.title,
          description: data.description || null,
          poll_type: data.pollType,
          allow_anonymous: data.allowAnonymous,
          require_name: data.requireName,
          show_results_before_vote: data.showResultsBeforeVote,
          status: 'active',
        })
        .select()
        .single();

      if (pollError) {
        console.error('Error creating poll:', pollError);
        throw new Error(pollError.message);
      }

      // Create poll options (filter out empty ones)
      const options = data.pollType === 'calendar'
        ? (data.dateOptions || [])
            .filter(opt => opt.date && opt.date.length > 0)
            .map((opt, index) => ({
              poll_id: poll.id,
              date: opt.date || null,
              start_time: opt.startTime || null,
              end_time: opt.endTime || null,
              sort_order: index,
            }))
        : (data.options || [])
            .filter(opt => opt.text && opt.text.trim().length > 0)
            .map((opt, index) => ({
              poll_id: poll.id,
              text: opt.text,
              sort_order: index,
            }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(options);

      if (optionsError) {
        console.error('Error creating options:', optionsError);
        // Rollback: delete the poll if options failed
        await supabase.from('polls').delete().eq('id', poll.id);
        throw new Error(optionsError.message);
      }

      toast.success(t('pollCreated') || 'Poll created successfully!');
      router.push(`/polls/${poll.short_id}`);
    } catch (error) {
      console.error('Failed to create poll:', error);
      toast.error(t('createError') || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit, (errors) => console.log('Validation errors:', errors))} className="space-y-8">
            {/* Poll Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pollType')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {pollTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setValue('pollType', type.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-muted hover:border-muted-foreground/20'
                        )}
                      >
                        <div className={cn('rounded-lg p-2', type.bgColor)}>
                          <Icon className={cn('h-6 w-6', type.color)} />
                        </div>
                        <span className="text-sm font-medium">
                          {tTypes(type.id)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

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
                  // Calendar date/time options
                  <>
                    {dateFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            {t('date')}
                          </Label>
                          <Input
                            type="date"
                            {...register(`dateOptions.${index}.date`)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">
                            <Clock className="mr-1 inline h-3 w-3" />
                            {t('startTime')}
                          </Label>
                          <Input
                            type="time"
                            {...register(`dateOptions.${index}.startTime`)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">
                            <Clock className="mr-1 inline h-3 w-3" />
                            {t('endTime')}
                          </Label>
                          <Input
                            type="time"
                            {...register(`dateOptions.${index}.endTime`)}
                            className="mt-1"
                          />
                        </div>
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
                    {errors.dateOptions && (
                      <p className="text-sm text-destructive">
                        {typeof errors.dateOptions === 'object' && 'message' in errors.dateOptions
                          ? errors.dateOptions.message
                          : errors.dateOptions.root?.message}
                      </p>
                    )}
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
                  // Regular text options
                  <>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          {...register(`options.${index}.text`)}
                          placeholder={t('optionPlaceholder', { number: index + 1 })}
                          className={
                            errors.options?.[index]?.text ? 'border-destructive' : ''
                          }
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
                    {errors.options && (
                      <p className="text-sm text-destructive">
                        {typeof errors.options === 'object' && 'message' in errors.options
                          ? errors.options.message
                          : errors.options.root?.message}
                      </p>
                    )}
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
                    {t('showResultsBeforeVote') || 'Show results before voting'}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : t('createPoll')}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
