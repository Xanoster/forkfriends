
'use client';

import React, { useMemo, Suspense } from 'react';
import DinnerCard from '@/components/DinnerCard';
import { useDinner } from '@/contexts/DinnerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';


function MyDinnersContent() {
  const { dinners, loading: dinnersLoading } = useDinner();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const loading = dinnersLoading || authLoading;

  const view = searchParams.get('view') || 'upcoming';
  const type = searchParams.get('type') || 'booked';

  const { upcomingBooked, pastBooked, upcomingCreated, pastCreated } = useMemo(() => {
    if (!user) {
        return { upcomingBooked: [], pastBooked: [], upcomingCreated: [], pastCreated: [] };
    }
    
    const now = new Date();
    const myDinners = dinners.filter(d => d.creatorId === user.uid || d.bookedBy?.includes(user.uid));

    const upcomingDinners = myDinners.filter(d => new Date(`${d.date}T${d.time}`) >= now);
    const pastDinners = myDinners.filter(d => new Date(`${d.date}T${d.time}`) < now);

    return {
        upcomingBooked: upcomingDinners.filter(d => d.bookedBy?.includes(user.uid) && d.creatorId !== user.uid),
        pastBooked: pastDinners.filter(d => d.bookedBy?.includes(user.uid) && d.creatorId !== user.uid),
        upcomingCreated: upcomingDinners.filter(d => d.creatorId === user.uid),
        pastCreated: pastDinners.filter(d => d.creatorId === user.uid)
    }

  }, [dinners, user]);

   const handleTabChange = (value: string, paramName: 'view' | 'type') => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set(paramName, value);
    // When switching between upcoming/past, reset the inner tab to default
    if (paramName === 'view') {
        newParams.set('type', 'booked');
    }
    router.push(`/my-dinners?${newParams.toString()}`);
  }


  if (loading) {
    return <MyDinnersSkeleton/>;
  }

  if (!user) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="font-headline text-3xl">Please sign in</h1>
            <p className="text-muted-foreground mt-2">You need to be logged in to see your dinners.</p>
            <Button asChild className='mt-4'>
                <Link href="/signin">Sign In</Link>
            </Button>
        </div>
    )
  }

  const renderDinnerGrid = (dinnerList: any[], emptyState: React.ReactNode, isPast = false) => {
     if (dinnerList.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dinnerList.map((dinner) => (
            <DinnerCard key={dinner.id} dinner={dinner} isPast={isPast} />
          ))}
        </div>
      );
    }
    return emptyState;
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => router.back()} className='mb-4'>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
      </Button>
      <section className="text-center pt-2 pb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-primary">
          My Dinners
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-foreground/80">
          Manage the dinners you've booked and the ones you've created.
        </p>
      </section>

      <Tabs value={view} onValueChange={(value) => handleTabChange(value, 'view')} className="w-full max-w-5xl mx-auto">
        <div className='flex justify-center'>
            <TabsList className="bg-muted/60 p-1.5 rounded-lg">
                <TabsTrigger value="upcoming" className="px-6 data-[state=active]:bg-card data-[state=active]:text-primary">Upcoming</TabsTrigger>
                <TabsTrigger value="past" className="px-6 data-[state=active]:bg-card data-[state=active]:text-primary">Past</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="upcoming" className="pt-8">
            <div className='p-6 border rounded-lg bg-card/50'>
                <Tabs value={type} onValueChange={(value) => handleTabChange(value, 'type')} className="w-full">
                    <div className='flex justify-center'>
                        <TabsList>
                            <TabsTrigger value="booked">I'm Attending</TabsTrigger>
                            <TabsTrigger value="created">I'm Hosting</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="booked" className="mt-8">
                        {renderDinnerGrid(upcomingBooked, (
                            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                                <h3 className="font-headline text-2xl">You Haven't Booked Any Upcoming Dinners</h3>
                                <p className="text-muted-foreground mt-2">
                                Looks like you haven't joined any upcoming dinners yet.
                                </p>
                                <Button variant="default" className="mt-4" asChild>
                                    <Link href="/">Browse Dinners</Link>
                                </Button>
                            </div>
                        ))}
                    </TabsContent>
                    <TabsContent value="created" className="mt-8">
                        {renderDinnerGrid(upcomingCreated, (
                            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                                <h3 className="font-headline text-2xl">You Haven't Created Any Upcoming Dinners</h3>
                                <p className="text-muted-foreground mt-2">
                                    Ready to host? Create a new dinner and invite others to join!
                                </p>
                                <Button variant="default" className="mt-4" asChild>
                                    <Link href="/create">Create a Dinner</Link>
                                </Button>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </TabsContent>
        <TabsContent value="past" className="pt-8">
             <div className='p-6 border rounded-lg bg-card/50'>
                <Tabs value={type} onValueChange={(value) => handleTabChange(value, 'type')} className="w-full">
                    <div className='flex justify-center'>
                        <TabsList>
                            <TabsTrigger value="booked">I Attended</TabsTrigger>
                            <TabsTrigger value="created">I Hosted</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="booked" className="mt-8">
                        {renderDinnerGrid(pastBooked, (
                            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                                <h3 className="font-headline text-2xl">No Past Dinners Attended</h3>
                                <p className="text-muted-foreground mt-2">
                                    Your attended dinners will appear here once their date has passed.
                                </p>
                            </div>
                        ), true)}
                    </TabsContent>
                    <TabsContent value="created" className="mt-8">
                        {renderDinnerGrid(pastCreated, (
                            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                                <h3 className="font-headline text-2xl">No Past Dinners Hosted</h3>
                                <p className="text-muted-foreground mt-2">
                                    Your hosted dinners will appear here once their date has passed.
                                </p>
                            </div>
                        ), true)}
                    </TabsContent>
                </Tabs>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function MyDinnersPage() {
    return (
        <Suspense fallback={<MyDinnersSkeleton />}>
            <MyDinnersContent />
        </Suspense>
    )
}

const MyDinnersSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
             <Skeleton className="h-10 w-24 mb-4" />
             <div className="text-center pt-2 pb-12">
                <Skeleton className="h-12 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
             </div>
             <div className="w-full max-w-5xl mx-auto">
                <div className='flex justify-center'>
                     <Skeleton className="h-10 w-48" />
                </div>
                <div className="pt-8">
                    <div className="p-6 border rounded-lg bg-card/50">
                        <div className="flex justify-center">
                            <Skeleton className="h-10 w-64" />
                        </div>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <DinnerCard.Skeleton />
                            <DinnerCard.Skeleton />
                            <DinnerCard.Skeleton />
                        </div>
                    </div>
                </div>
             </div>
        </div>
    )
}
