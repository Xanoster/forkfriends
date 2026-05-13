
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDinner } from '@/contexts/DinnerContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Briefcase, Zap, Users, Eye } from 'lucide-react';
import Link from 'next/link';

const StatItem = ({ icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg text-center">
        <div className="p-3 bg-accent/20 text-accent rounded-full mb-3">
            {React.createElement(icon, { className: "h-6 w-6" })}
        </div>
        <p className="font-bold text-3xl text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
);

export default function MyActivityPage() {
    const { user: authUser, loading: authLoading } = useAuth();
    const { dinners, loading: dinnersLoading } = useDinner();
    const router = useRouter();
    const [pageLoading, setPageLoading] = useState(true);


    useEffect(() => {
        if (authLoading) {
          setPageLoading(true);
          return;
        }
        if (!authUser) {
           router.push('/signin');
        } else {
            setPageLoading(false);
        }
    }, [authUser, authLoading, router]);

    const userStats = useMemo(() => {
        if (!authUser || dinnersLoading) {
          return { hosted: 0, attended: 0, peopleMet: 0 };
        }
        
        const hosted = dinners.filter(d => d.creatorId === authUser.uid).length;
        const attended = dinners.filter(d => d.bookedBy?.includes(authUser.uid!) && d.creatorId !== authUser.uid).length;
    
        const relevantDinners = dinners.filter(d => d.creatorId === authUser.uid || d.bookedBy?.includes(authUser.uid!));
        
        const metUserIds = new Set<string>();
        relevantDinners.forEach(d => {
            d.attendees?.forEach(attendee => {
                if (attendee.uid !== authUser.uid) {
                    metUserIds.add(attendee.uid);
                }
            });
        });
    
        return {
          hosted,
          attended,
          peopleMet: metUserIds.size
        };
      }, [authUser, dinners, dinnersLoading]);

    if (pageLoading || dinnersLoading) {
        return <ActivitySkeleton />;
    }

    if (!authUser) {
        return null;
    }


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <Button variant="outline" onClick={() => router.back()} className='mb-4'>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className='font-headline text-3xl'>Your Activity Dashboard</CardTitle>
                        <CardDescription>Here's a summary of your engagement on ForkFriends. Keep up the great work!</CardDescription>
                    </CardHeader>
                    <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <StatItem icon={Briefcase} label="Dinners Hosted" value={userStats.hosted} />
                        <StatItem icon={Zap} label="Dinners Attended" value={userStats.attended} />
                        <StatItem icon={Users} label="People Met" value={userStats.peopleMet} />
                    </CardContent>
                     <CardFooter className="flex justify-start border-t pt-4 mt-4">
                         <Button variant="ghost" asChild>
                            <Link href={`/profile/${authUser.username}`}>
                               <Eye className="mr-2 h-4 w-4" />
                               View Public Profile
                            </Link>
                         </Button>
                     </CardFooter>
                </Card>
            </div>
        </div>
    )
}

const ActivitySkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-8">
                 <Skeleton className="h-10 w-24 mb-4" />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg text-center">
                             <Skeleton className="h-12 w-12 rounded-full mb-3" />
                             <Skeleton className="h-8 w-12" />
                             <Skeleton className="h-4 w-24 mt-2" />
                        </div>
                          <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg text-center">
                             <Skeleton className="h-12 w-12 rounded-full mb-3" />
                             <Skeleton className="h-8 w-12" />
                             <Skeleton className="h-4 w-24 mt-2" />
                        </div>
                          <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg text-center">
                             <Skeleton className="h-12 w-12 rounded-full mb-3" />
                             <Skeleton className="h-8 w-12" />
                             <Skeleton className="h-4 w-24 mt-2" />
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    )
}
