'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { SalesEntry } from '@/lib/types';

const formSchema = z.object({
  date: z.date({
    required_error: 'A date is required.',
  }),
  salesValue: z.coerce.number().min(0, { message: 'Sales value must be positive.' }),
  ticketAverage: z.coerce.number().min(0, { message: 'Ticket average must be positive.' }),
  productsPerService: z.coerce.number().min(0, { message: 'Products per service must be positive.' }),
});

type SalesFormProps = {
  onSaleAdd: (data: Omit<SalesEntry, 'id'>) => void;
};

export default function SalesForm({ onSaleAdd }: SalesFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      salesValue: 0,
      ticketAverage: 0,
      productsPerService: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSaleAdd(values);
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Sale</CardTitle>
        <CardDescription>Enter the details for a new sales entry.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salesValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Value ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1500.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ticketAverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Average ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 75.25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productsPerService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Products Per Service (PPA)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
