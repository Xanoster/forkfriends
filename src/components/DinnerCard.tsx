'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Dinner, Comment } from '@/lib/data';
import { MapPin, Calendar, Users, DollarSign, Crown, Pencil, Ban, MessageCircle, Star } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDinner } from '@/contexts/DinnerContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
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

interface DinnerCardProps {
  dinner: Dinner;
  isPast?: boolean;
}

const StarRating = ({ rating, totalReviews }: { rating: number, totalReviews: number }) => {
    if (totalReviews === 0) return null;
    return (
        <div className="flex items-center gap-1">
             <div className="flex items-center">
                <Star className="h-4 w-4 text-primary fill-primary" />
            </div>
            <span className="text-muted-foreground text-xs font-semibold">
                {rating.toFixed(1)} ({totalReviews})
            </span>
        </div>
    )
}

const DinnerCard = ({ dinner, isPast = false }: DinnerCardProps) => {
    const { user } = useAuth();
    const { bookDinner, cancelBooking, getComments, hasUnreadMessages } = useDinner();
    const { toast } = useToast();
    const router = useRouter();
    const [isBooking, setIsBooking] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    
    // Dinner comes from props, but the full details (like attendees) might be in the context
    const fullDinner = useDinner().dinners.find(d => d.id === dinner.id) || dinner;
    const hostUsername = fullDinner?.creatorUsername;

    useEffect(() => {
        if (!user || (!dinner.bookedBy?.includes(user.uid) && dinner.creatorId !== user.uid)) return;
        const unsubscribe = getComments(dinner.id, setComments);
        return () => unsubscribe();
    }, [dinner.id, dinner.bookedBy, dinner.creatorId, user, getComments]);
    
    const filledSlots = fullDinner.filledSlots || (fullDinner.bookedBy?.length ?? 0);
    const progress = (filledSlots / fullDinner.maxGuests) * 100;

    const isCreator = user && fullDinner.creatorId === user.uid;
    const isBookedByUser = user && fullDinner.bookedBy?.includes(user.uid);
    const isFull = filledSlots >= fullDinner.maxGuests;
    const unreadMessages = hasUnreadMessages(fullDinner.id, comments);

    const handleBooking = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            toast({
                title: 'Please sign in',
                description: 'You need to be logged in to book a slot.',
                variant: 'destructive',
            });
            router.push('/signin');
            return;
        }
        if (!isFull) {
            setIsBooking(true);
            try {
                await bookDinner(fullDinner.id, user.uid);
                toast({
                    title: 'Slot booked!',
                    description: `You've successfully booked a slot at ${fullDinner.restaurantName}.`,
                    duration: 5000,
                });
            } catch (e) {
                toast({
                    title: 'Booking failed',
                    description: 'Could not book your slot. Please try again.',
                    variant: 'destructive',
                });
            } finally {
                setIsBooking(false); // Reset on success or failure
            }
        }
    };

    const handleCancel = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (isCreator) {
            toast({
                title: 'Action Not Allowed',
                description: "As the host, you can't cancel your booking. You can edit the dinner instead.",
                variant: 'destructive'
            });
            return;
        }
        try {
            await cancelBooking(fullDinner.id, user.uid);
            toast({
                title: 'Booking Cancelled',
                description: `Your slot at ${fullDinner.restaurantName} has been cancelled.`,
                variant: 'destructive',
            });
        } catch (e) {
            toast({
                title: 'Cancellation failed',
                description: 'Could not cancel your booking. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/edit/${fullDinner.id}`);
    }

    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isPast) {
            router.push(`/review/${fullDinner.id}`);
        } else {
            router.push(`/dinner/${fullDinner.id}`);
        }
    }
    
    const handleHostClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // The Link component will handle navigation, we just need to stop propagation.
    }


    const getPastButtonText = () => {
        if (isCreator) return 'View/Leave Reviews';
        return 'Leave a Review';
    }


  return (
      <Card 
        onClick={handleCardClick}
        className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full cursor-pointer bg-card"
      >
        <CardHeader className="p-6 pb-4">
          <div className="flex justify-between items-start">
              <CardTitle className="font-headline text-2xl mb-1">{fullDinner.restaurantName}</CardTitle>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary">{fullDinner.cuisine}</Badge>
                <Badge variant={fullDinner.dietary === 'Vegan' ? 'default' : fullDinner.dietary === 'Veg' ? 'secondary' : 'outline' }>{fullDinner.dietary}</Badge>
              </div>
          </div>
          <CardDescription className="flex items-center gap-2 text-sm pt-2">
              <MapPin className="h-4 w-4" /> {fullDinner.address}, {fullDinner.city}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-6 px-6 pt-0">
            {!isCreator && hostUsername && (
                <Link href={`/profile/${hostUsername}`} onClick={handleHostClick} className="flex items-center justify-between cursor-pointer group -ml-1 p-1 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={fullDinner.creatorImage} alt={fullDinner.creatorName} />
                            <AvatarFallback>{fullDinner.creatorName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{fullDinner.creatorName}</p>
                    </div>
                    <StarRating rating={fullDinner.hostAverageRating || 0} totalReviews={fullDinner.hostReviewCount || 0} />
                </Link>
            )}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span>{new Date(`${fullDinner.date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric'})} at {fullDinner.time}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-lg text-primary">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span>{fullDinner.budget}</span>
              </div>
          </div>
         {!isPast && (
             <div>
              <div className="flex justify-between items-center mb-1">
                  <div className='flex items-center gap-2 text-sm font-medium'>
                      <Users className="h-4 w-4 text-accent" />
                      <span>Slots</span>
                  </div>
                  <span className="text-sm font-semibold">{filledSlots} / {fullDinner.maxGuests} Filled</span>
              </div>
              <Progress value={progress} aria-label={`${filledSlots} out of ${fullDinner.maxGuests} slots filled`}/>
          </div>
         )}
        </CardContent>
        <CardFooter className="p-6 pt-4 mt-auto flex flex-col gap-2">
            {isPast ? (
                 <Button className='w-full' variant="secondary" disabled={!isBookedByUser && !isCreator}>
                    {isBookedByUser || isCreator ? (
                        <>
                            <Star className="mr-2 h-4 w-4" />
                            {getPastButtonText()}
                        </>
                    ) : (
                       "This dinner has ended"
                    )}
                </Button>
            ) : (
                <>
                    {isCreator && (
                        <div className='w-full flex justify-between items-center bg-primary/10 p-2 rounded-md'>
                            <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                <Crown className="h-4 w-4" />
                                <span>You are the host</span>
                            </div>
                            <div className='flex items-center gap-1'>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEdit}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 relative" asChild>
                                    <Link href={`/dinner/${fullDinner.id}`} onClick={(e) => e.stopPropagation()}>
                                        {unreadMessages && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary animate-pulse" />}
                                        <MessageCircle className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                    {!isCreator && !isBookedByUser && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full" disabled={isFull || isBooking} onClick={(e) => e.stopPropagation()}>
                                    {isFull ? 'Dinner is Full' : (isBooking ? 'Booking...' : 'Book a Slot')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to book a slot for {fullDinner.restaurantName} on {new Date(`${fullDinner.date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric'})}?
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBooking} disabled={isBooking}>
                                    {isBooking ? 'Booking...' : 'Confirm'}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {!isCreator && isBookedByUser && (
                        <div className='w-full flex items-center gap-2'>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="destructive" className="w-full" onClick={(e) => e.stopPropagation()}>
                                        <Ban className="mr-2 h-4 w-4" />
                                        Cancel Booking
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to cancel your booking for {fullDinner.restaurantName}? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCancel}>Cancel Booking</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="outline" asChild>
                                <Link href={`/dinner/${fullDinner.id}`} onClick={(e) => e.stopPropagation()} className='relative'>
                                    {unreadMessages && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />}
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Chat
                                </Link>
                            </Button>
                        </div>
                    )}
                </>
            )}
        </CardFooter>
      </Card>
  );
};

const DinnerCardSkeleton = () => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg bg-card">
            <CardHeader className="p-6 pb-4">
                 <div className="flex justify-between items-start">
                    <Skeleton className="h-7 w-3/4 mb-1" />
                    <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-12" />
                    </div>
                </div>
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="flex-grow space-y-6 px-6 pt-0">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <Skeleton className="h-5 w-2/5" />
                    <Skeleton className="h-5 w-1/5" />
                </div>
                 <div className="space-y-2">
                     <div className="flex justify-between items-center mb-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/3" />
                     </div>
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardContent>
            <CardFooter className="p-6 pt-4 mt-auto">
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}

DinnerCard.Skeleton = DinnerCardSkeleton;


export default DinnerCard;
    