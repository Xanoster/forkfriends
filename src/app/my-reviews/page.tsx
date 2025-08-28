'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { type Review } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Star, Utensils } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function MyReviewsPage() {
  const { user: authUser, loading: authLoading, fetchUserReviews } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast } = useToast();

  const loadReviews = useCallback(async (uid: string) => {
    setPageLoading(true);
    try {
        const userReviews = await fetchUserReviews(uid);
        // Sort reviews by date to show newest first within groups
        userReviews.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setReviews(userReviews);
    } catch(e) {
        console.error("Could not load reviews", e);
        toast({ title: 'Error', description: 'Could not load your reviews.', variant: 'destructive'})
    } finally {
        setPageLoading(false);
    }
  }, [fetchUserReviews, toast]);

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }
    if (authUser) {
      loadReviews(authUser.uid);
    } else {
       router.push('/signin');
    }
  }, [authUser, authLoading, router, loadReviews]);

  const groupedReviews = useMemo(() => {
    if (!reviews) return {};
    return reviews.reduce((acc, review) => {
        const key = review.dinnerId;
        if (!acc[key]) {
            acc[key] = {
                dinnerName: review.dinnerName,
                reviews: []
            };
        }
        acc[key].reviews.push(review);
        return acc;
    }, {} as Record<string, { dinnerName: string; reviews: Review[] }>);
  }, [reviews]);


  if (pageLoading) {
    return <ReviewsSkeleton />;
  }
  
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
             <Button variant="outline" onClick={() => router.back()} className='mb-4'>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline text-3xl'>Community Kudos</CardTitle>
                    <CardDescription>
                        {reviews.length > 0 
                            ? `Here's what other diners are saying about you. Your average rating is ${averageRating.toFixed(1)} stars!`
                            : "You haven't received any reviews yet. Participate in a dinner to get feedback!"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {Object.keys(groupedReviews).length > 0 ? (
                        <div className="space-y-8">
                           {Object.values(groupedReviews).map((group, index) => (
                                <div key={index}>
                                    <h3 className="font-headline text-xl mb-4 border-b pb-2">{group.dinnerName}</h3>
                                    <div className="space-y-6">
                                        {group.reviews.map(review => (
                                             <div key={review.id} className="flex gap-4">
                                                <Avatar className='h-10 w-10 mt-1 flex-shrink-0'>
                                                    <AvatarImage src={review.reviewerImage} alt={review.reviewerName}/>
                                                    <AvatarFallback>{review.reviewerName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-grow">
                                                    <div className="flex items-center justify-between">
                                                         <div className='flex items-center gap-2'>
                                                            <Button variant="link" asChild className='p-0 h-auto font-bold'>
                                                                <Link href={`/profile/${review.reviewerName}`}>@{review.reviewerName}</Link>
                                                            </Button>
                                                            {review.isHostReview && <Badge variant="outline">Host</Badge>}
                                                         </div>
                                                        <div className="flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-foreground mt-1 italic">"{review.comment}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                           ))}
                        </div>
                    ) : (
                            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                            <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="font-headline text-xl mt-4">No Reviews Yet</h3>
                            <p className="text-muted-foreground mt-2">
                                Your received reviews will appear here.
                            </p>
                             <Button asChild className="mt-4">
                                <Link href="/">Browse Dinners</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

const ReviewsSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className='max-w-4xl mx-auto'>
                <Skeleton className="h-10 w-24 mb-4" />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                             <div key={i} className="flex gap-4 p-4 border rounded-lg">
                                <div className="flex-grow space-y-2">
                                    <div className='flex justify-between'>
                                        <Skeleton className="h-6 w-3/5" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                     <Skeleton className="h-4 w-4/5" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
