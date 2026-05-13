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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Star, CheckCircle, Users, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useDinner } from '@/contexts/DinnerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';


const reviewSchema = z.object({
  rating: z.number().min(1, { message: 'Please select a rating.' }).max(5),
  comment: z.string().min(10, { message: 'Review must be at least 10 characters.' }).max(500, { message: 'Review cannot exceed 500 characters.' }),
});

type AttendeeInfo = {
    uid: string;
    name: string;
    username: string;
    avatar: string;
};

function ReviewPageContent() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const { dinners, addReview } = useDinner();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewee, setReviewee] = useState<AttendeeInfo | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const dinnerId = params.id as string;
    const dinner = dinners.find(d => d.id === dinnerId);
    
    const form = useForm<z.infer<typeof reviewSchema>>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            comment: '',
        },
    });

    const isAttendee = user && dinner?.bookedBy?.includes(user.uid);
    const isHost = user && dinner?.creatorId === user.uid;

    const myReviews = dinner?.reviews?.[user?.uid || ''] || [];
    
    const { hostToReview, fellowAttendeesToReview } = useMemo(() => {
        if (!dinner || !user) return { hostToReview: null, fellowAttendeesToReview: [] };

        const allPossibleReviewees = [...(dinner.attendees || [])];
        
        // Ensure host is in the list if they are not already, and get their details
        let host: AttendeeInfo | null = null;
        const hostInAttendees = allPossibleReviewees.find(a => a.uid === dinner.creatorId);
        if (hostInAttendees) {
            host = hostInAttendees;
        } else {
            host = {
                uid: dinner.creatorId,
                name: dinner.creatorName,
                username: dinner.creatorUsername,
                avatar: dinner.creatorImage
            }
        }
        
        // Exclude self and host from the "fellow attendees" list
        const fellowAttendees = allPossibleReviewees.filter(
            attendee => attendee.uid !== user.uid && attendee.uid !== dinner.creatorId
        );
        
        // Return host only if current user is not the host
        const finalHostToReview = user.uid === host.uid ? null : host;
        
        return { hostToReview: finalHostToReview, fellowAttendeesToReview: fellowAttendees };

    }, [dinner, user]);


    if (!dinner) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="font-headline text-3xl">Dinner not found</h1>
                <p className="text-muted-foreground mt-2">The dinner you are trying to review does not exist.</p>
                <Button asChild className='mt-4'>
                    <Link href="/my-dinners">Go to My Dinners</Link>
                </Button>
            </div>
        )
    }

    if (!isAttendee && !isHost) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="font-headline text-3xl">Review Not Available</h1>
                <p className="text-muted-foreground mt-2">
                    You can only review dinners you attended.
                </p>
                <Button asChild className='mt-4'>
                     <Link href="/my-dinners">Go to My Dinners</Link>
                </Button>
            </div>
        )
    }
  
    async function onSubmit(values: z.infer<typeof reviewSchema>) {
        if (!user || !dinner || !reviewee) return;

        setIsSubmitting(true);
        try {
            await addReview(dinner.id, {
                ...values,
                revieweeId: reviewee.uid,
                revieweeName: reviewee.name,
                revieweeUsername: reviewee.username,
                dinnerId: dinner.id,
                dinnerName: dinner.restaurantName,
                isHostReview: dinner.creatorId === reviewee.uid
            });
            toast({
                title: "Review Submitted!",
                description: `Your review for ${reviewee.name} has been recorded.`,
            })
            form.reset();
            setIsDialogOpen(false); // Close dialog on success
        } catch (e: any) {
             toast({
                title: "Error",
                description: `Failed to submit review: ${e.message}`,
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleDialogStateChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setReviewee(null);
            form.reset();
        }
    }

    const renderReviewableUser = (attendee: AttendeeInfo, isHostAttendee = false) => {
        const hasReviewed = myReviews.includes(attendee.uid);
        return (
            <div key={attendee.uid} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={attendee.avatar} alt={attendee.name}/>
                        <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">{attendee.name}</p>
                        <Link href={`/profile/${attendee.username}`} className="text-sm text-muted-foreground hover:underline">@{attendee.username}</Link>
                         {isHostAttendee && <Badge variant="secondary" className="ml-2">Host</Badge>}
                    </div>
                </div>
                {hasReviewed ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold text-sm">Reviewed</span>
                    </div>
                ) : (
                    <Dialog open={isDialogOpen && reviewee?.uid === attendee.uid} onOpenChange={handleDialogStateChange}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setReviewee(attendee)}>Leave a Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-headline">Review {reviewee?.name}</DialogTitle>
                                <DialogDescription>
                                    How was your experience with {reviewee?.name} at {dinner.restaurantName}?
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="rating"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Overall Rating</FormLabel>
                                        <FormControl>
                                            <div className='flex items-center gap-2'>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                    key={star}
                                                    className={`h-8 w-8 cursor-pointer transition-colors ${
                                                        field.value >= star
                                                        ? 'text-primary fill-primary'
                                                        : 'text-muted-foreground/30'
                                                    }`}
                                                    onClick={() => field.onChange(star)}
                                                    />
                                                ))}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="comment"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Review</FormLabel>
                                        <FormControl>
                                        <Textarea
                                            placeholder={`Share your experience. (min. 10 characters)`}
                                            {...field}
                                        />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => handleDialogStateChange(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                    </Button>
                                </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
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
          <CardTitle className="font-headline text-3xl">Review Your Dinner Companions</CardTitle>
          <CardDescription>
            Share your feedback for the dinner at <span className="font-bold">{dinner.restaurantName}</span>. Your reviews help build a trustworthy community.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {hostToReview && (
                <div>
                    <h3 className="font-headline text-xl flex items-center gap-2 mb-4">
                        <Crown className="h-5 w-5 text-primary" />
                        Review Your Host
                    </h3>
                    {renderReviewableUser(hostToReview, true)}
                </div>
            )}

            {fellowAttendeesToReview.length > 0 && (
                 <div>
                    {hostToReview && <Separator className="my-6" />}
                    <h3 className="font-headline text-xl flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5" />
                        Review Fellow Attendees
                    </h3>
                    <div className="space-y-4">
                        {fellowAttendeesToReview.map(attendee => renderReviewableUser(attendee))}
                    </div>
                </div>
            )}

            {!hostToReview && fellowAttendeesToReview.length === 0 && (
                 <p className="text-center text-muted-foreground py-8">
                    There are no other attendees to review for this dinner.
                 </p>
            )}
            
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={<ReviewPageSkeleton />}>
            <ReviewPageContent />
        </Suspense>
    )
}

const ReviewPageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-24 mb-4" />
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Skeleton className="h-6 w-1/3 mb-4" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                     <div>
                        <Skeleton className="h-6 w-1/3 mb-4" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}