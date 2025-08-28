'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, Trash } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cities, dietaryOptions } from '@/lib/data';
import { useDinner } from '@/contexts/DinnerContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  restaurantName: z.string().min(2, { message: 'Restaurant name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  city: z.string({ required_error: 'City is required.' }),
  cuisine: z.string().min(2, { message: 'Cuisine type is required.' }),
  dietary: z.enum(['Veg', 'Non-Veg', 'Vegan']),
  budget: z.enum(['$', '$$', '$$$', '$$$$']),
  maxGuests: z.coerce.number().min(1, { message: 'Must allow at least 1 guest.' }).max(20, { message: 'Cannot exceed 20 guests.' }),
  date: z.date({ required_error: 'A date for the dinner is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:MM).' }),
});

export default function EditDinnerPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const { dinners, updateDinner, deleteDinner } = useDinner();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const dinnerId = params.id as string;
    const dinner = dinners.find(d => d.id === dinnerId);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            restaurantName: '',
            address: '',
            city: '',
            cuisine: '',
            dietary: 'Non-Veg',
            budget: '$$',
            maxGuests: 1,
            time: '19:00',
        },
    });

  useEffect(() => {
    if (dinner) {
        if (user?.uid !== dinner.creatorId) {
             toast({
                title: 'Unauthorized',
                description: "You can only edit dinners you have created.",
                variant: 'destructive',
            });
            router.push('/');
            return;
        }

        form.reset({
            ...dinner,
            date: new Date(dinner.date),
        });
        setIsLoading(false);
    }
  }, [dinner, user, router, form, toast]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !dinner) return;

    setIsSubmitting(true);
    // Ensure maxGuests is not less than filledSlots
    if(values.maxGuests < (dinner.filledSlots || 0) ) {
        toast({
            title: "Invalid Guest Count",
            description: `Maximum guests cannot be less than the number of people who have already booked (${dinner.filledSlots}).`,
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }
    try {
        await updateDinner(dinner.id, {
            ...values,
            date: values.date.toISOString().split('T')[0],
        });
        toast({
            title: "Dinner Updated!",
            description: `Your dinner at ${values.restaurantName} has been updated.`,
        })
        router.push(`/dinner/${dinner.id}`);
    } catch(e) {
         toast({
            title: "Error",
            description: "Failed to update dinner.",
            variant: "destructive"
        })
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDelete = async () => {
    if (!dinner) return;
    try {
        await deleteDinner(dinner.id);
        toast({
            title: "Dinner Deleted",
            description: "The dinner has been successfully deleted.",
            variant: "destructive"
        });
        router.push('/my-dinners');
    } catch (e) {
        toast({
            title: "Error",
            description: "Failed to delete dinner.",
            variant: "destructive"
        });
    }
  }

  if (isLoading) {
    return <EditPageSkeleton />;
  }

  if (!dinner) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="font-headline text-3xl">Dinner Not Found</h1>
            <p className="text-muted-foreground mt-2">The dinner you are looking for may have been deleted.</p>
            <Button asChild className='mt-4' onClick={() => router.push('/')}>
                Go Home
            </Button>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className='mb-4'>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Edit Your Dinner</CardTitle>
          <CardDescription>
            Update the details for your dinner event below.
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                       <FormDescription>
                        {dinner.filledSlots || 0} slot(s) are already booked.
                       </FormDescription>
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
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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


              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t pt-6 mt-6 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Dinner
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this dinner
                    and remove it for everyone who has booked it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

const EditPageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className='h-10 w-24 mb-4' />
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <Skeleton className='h-8 w-48' />
                    <Skeleton className='h-4 w-64 mt-2' />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className='h-4 w-32' />
                        <Skeleton className='h-10 w-full' />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className='h-10 w-full' />
                </CardFooter>
            </Card>
        </div>
    )
}
