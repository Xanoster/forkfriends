'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cities, dietaryOptions } from '@/lib/data';
import { useDinner } from '@/contexts/DinnerContext';
import { useAuth } from '@/contexts/AuthContext';


const formSchema = z.object({
  restaurantName: z.string().min(2, { message: 'Restaurant name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  city: z.string({ required_error: 'City is required.' }),
  cuisine: z.string().min(2, { message: 'Cuisine type is required.' }),
  dietary: z.enum(['Veg', 'Non-Veg', 'Vegan'], { required_error: 'Dietary preference is required.' }),
  budget: z.enum(['$', '$$', '$$$', '$$$$'], { required_error: 'Budget is required.' }),
  maxGuests: z.coerce.number().min(1, { message: 'Must allow at least 1 guest.' }).max(20, { message: 'Cannot exceed 20 guests.' }),
  date: z.date({ required_error: 'A date for the dinner is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:MM).' }),
});

export default function CreateDinnerPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { addDinner } = useDinner();
    const { user } = useAuth();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            restaurantName: '',
            address: '',
            city: '',
            cuisine: '',
            maxGuests: 4,
            date: new Date(),
            time: '19:00',
        },
    });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to create a dinner.",
            variant: "destructive"
        })
        router.push('/signin');
        return;
    }
    try {
        const newDinnerId = await addDinner({
            ...values,
            date: format(values.date, 'yyyy-MM-dd')
        });
        toast({
            title: "Dinner Created!",
            description: `Your dinner at ${values.restaurantName} has been posted.`,
        })
        if (newDinnerId) {
            router.push(`/dinner/${newDinnerId}`);
        } else {
            router.push('/');
        }
    } catch (error: any) {
        toast({
            title: "Error Creating Dinner",
            description: error.message || "An unknown error occurred. Please try again.",
            variant: "destructive"
        })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.back()} className='mb-4'>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create a New Dinner</CardTitle>
          <CardDescription>
            Fill out the details below to invite others to join you for a meal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="restaurantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Cozy Corner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Foodie Lane" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="cuisine"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cuisine</FormLabel>
                        <FormControl>
                        <Input placeholder="Italian, Mexican, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dietary"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Dietary Preference</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a dietary preference" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {dietaryOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a budget range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="$">$ (Inexpensive)</SelectItem>
                          <SelectItem value="$$">$$ (Moderate)</SelectItem>
                          <SelectItem value="$$$">$$$ (Pricey)</SelectItem>
                          <SelectItem value="$$$$">$$$$ (Ultra High-End)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Guests</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
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
                    name="time"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>


              <Button type="submit" className="w-full">Create Dinner Invitation</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
