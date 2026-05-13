'use client';

import * as React from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Star, Utensils, ArrowLeft, Users, Zap, Briefcase } from 'lucide-react';
import { Review } from '@/lib/data';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useDinner } from '@/contexts/DinnerContext';

const StatItem = ({ icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="p-1.5 bg-accent/20 text-accent rounded-md">
            {React.createElement(icon, { className: "h-4 w-4" })}
        </div>
        <div className="flex-grow">
            <p className="font-bold text-base text-foreground">{value}</p>
            <p className="text-xs">{label}</p>
        </div>
    </div>
);


const StarRating = ({ rating, totalReviews }: { rating: number, totalReviews: number }) => {
    return (
        <div className="flex items-center gap-2">
             <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-5 w-5 ${
                    i < Math.round(rating) ? 'text-primary fill-primary' : 'text-muted-foreground/30'
                    }`}
                />
                ))}
            </div>
            <span className="text-muted-foreground text-sm">
                {rating.toFixed(1)} ({totalReviews} reviews)
            </span>
        </div>
    )
}

export default function PublicProfilePage() {
  const { fetchPublicProfile, fetchUserReviews } = useAuth();
  const { dinners, loading: dinnersLoading } = useDinner();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const username = params.username as string;

  useEffect(() => {
    if (!username) return;

    const loadProfileData = async () => {
        setLoading(true);
        try {
            const userProfile = await fetchPublicProfile(username);
            if (userProfile) {
                setProfile(userProfile);
                const userReviews = await fetchUserReviews(userProfile.uid);
                 userReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setReviews(userReviews);
            } else {
                toast({ title: "User not found", description: "This profile could not be found.", variant: 'destructive'});
                router.push('/');
            }
        } catch (error) {
            console.error("Error loading profile data:", error);
            toast({ title: "Error", description: "There was a problem loading this profile.", variant: 'destructive'});
        } finally {
            setLoading(false);
        }
    }

    loadProfileData();

  }, [username, fetchPublicProfile, fetchUserReviews, router, toast]);
  
  const userStats = useMemo(() => {
    if (!profile || dinnersLoading || !profile.uid) {
      return { hosted: 0, attended: 0, peopleMet: 0 };
    }
    
    const hosted = dinners.filter(d => d.creatorId === profile.uid).length;
    const attended = dinners.filter(d => d.bookedBy?.includes(profile.uid!) && d.creatorId !== profile.uid).length;

    // Correct logic for peopleMet
    // It should include everyone from dinners the user hosted AND attended.
    const relevantDinners = dinners.filter(d => d.creatorId === profile.uid || d.bookedBy?.includes(profile.uid!));
    
    const metUserIds = new Set<string>();
    relevantDinners.forEach(d => {
        d.attendees?.forEach(attendee => {
            // Add everyone who is not the profile owner to the set
            if (attendee.uid !== profile.uid) {
                metUserIds.add(attendee.uid);
            }
        });
    });

    return {
      hosted,
      attended,
      peopleMet: metUserIds.size
    };
  }, [profile, dinners, dinnersLoading]);

  
  if (loading || !profile) {
    return <ProfileSkeleton />;
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.back()} className='mb-4'>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-32 w-32 border-4 border-primary/50 mb-4">
                        <AvatarImage src={`https://api.dicebear.com/7.x/micah/svg?seed=${profile.avatarSeed || profile.email}`} alt={profile.name || ''} />
                        <AvatarFallback>{(profile.name || profile.email || 'U')?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <h1 className="font-headline text-3xl">{profile.name}</h1>
                        <p className="text-muted-foreground">@{profile.username}</p>
                         {averageRating > 0 && (
                            <div className='mt-4'>
                                <StarRating rating={averageRating} totalReviews={reviews.length} />
                            </div>
                        )}
                         <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {profile.city && <Badge variant="secondary">{profile.city}</Badge>}
                        </div>
                    </div>

                    <div className="mt-6 text-sm">
                        <h3 className="font-bold mb-2">About Me</h3>
                        <p className="text-muted-foreground">{profile.bio || "This user hasn't written a bio yet."}</p>
                    </div>
                    
                    <div className="mt-6 border-t pt-4 space-y-4">
                        <h3 className="font-bold mb-2">Activity</h3>
                        <StatItem icon={Briefcase} label="Dinners Hosted" value={userStats.hosted} />
                        <StatItem icon={Zap} label="Dinners Attended" value={userStats.attended} />
                        <StatItem icon={Users} label="People Met" value={userStats.peopleMet} />
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline text-2xl'>Received Reviews</CardTitle>
                    <CardDescription>What others are saying about {profile.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <div key={review.id} className="flex gap-4">
                                     <Avatar className='h-10 w-10 mt-1'>
                                        <AvatarImage src={review.reviewerImage} alt={review.reviewerName}/>
                                        <AvatarFallback>{review.reviewerName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button variant="link" asChild className="p-0 h-auto font-bold">
                                                    <Link href={`/profile/${review.reviewerName}`}>@{review.reviewerName}</Link>
                                                </Button>
                                            </div>
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm text-foreground mt-2 italic">"{review.comment}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                            <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="font-headline text-xl mt-4">No Reviews Yet</h3>
                            <p className="text-muted-foreground mt-2">
                                This user hasn't received any reviews yet.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

const ProfileSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
             <Skeleton className="h-10 w-24 mb-4" />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="pt-6">
                             <div className="flex flex-col items-center text-center">
                                <Skeleton className="h-32 w-32 rounded-full mb-4" />
                                <Skeleton className="h-8 w-40 mb-2" />
                                <Skeleton className="h-4 w-24" />
                                <div className="flex gap-2 mt-4">
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            </div>
                            <div className="mt-6">
                                <Skeleton className="h-5 w-24 mb-2" />
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                             <div className="mt-6 border-t pt-4 space-y-4">
                                <Skeleton className="h-5 w-20 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                                <Skeleton className="mx-auto h-12 w-12" />
                                <Skeleton className="h-6 w-40 mx-auto mt-4" />
                                <Skeleton className="h-4 w-56 mx-auto mt-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

    
