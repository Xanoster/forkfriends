'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { type Dinner, cities, dietaryOptions } from '@/lib/data';
import DinnerCard from '@/components/DinnerCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDinner } from '@/contexts/DinnerContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const { dinners, selectedCity, setSelectedCity, selectedDietary, setSelectedDietary, loading: dinnersLoading } = useDinner();
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('soonest');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    // Update the current time every minute to re-evaluate dinner statuses
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const loading = dinnersLoading || authLoading;

  const filteredDinners = useMemo(() => {
    return dinners
      .filter((dinner) => {
        // Filter out dinners that have already passed
        const dinnerDateTime = new Date(`${dinner.date}T${dinner.time}`);
        return dinnerDateTime >= currentTime;
      })
      .filter((dinner) => {
        if (selectedCity === 'all') return true;
        return dinner.city.toLowerCase() === selectedCity.toLowerCase();
      })
      .filter((dinner) => {
        if (selectedDietary === 'all') return true;
        // This handles cases where dietary might not be set
        return dinner.dietary?.toLowerCase() === selectedDietary.toLowerCase();
      })
      .filter((dinner) => {
        if (!searchTerm) return true;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
          dinner.cuisine.toLowerCase().includes(lowerCaseSearchTerm) ||
          dinner.restaurantName.toLowerCase().includes(lowerCaseSearchTerm)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (sortBy === 'furthest') {
          return dateB - dateA;
        } else {
          return dateA - dateB;
        }
      });
  }, [searchTerm, dinners, selectedCity, selectedDietary, sortBy, currentTime]);
  
  const { myCreatedDinners, myBookedDinners, otherDinners } = useMemo(() => {
    if (!user) {
        return { myCreatedDinners: [], myBookedDinners: [], otherDinners: filteredDinners };
    }

    const myCreated = filteredDinners.filter(d => d.creatorId === user.uid);
    const myBooked = filteredDinners.filter(d => d.bookedBy?.includes(user.uid) && d.creatorId !== user.uid);
    const others = filteredDinners.filter(d => d.creatorId !== user.uid && !d.bookedBy?.includes(user.uid));

    return { myCreatedDinners: myCreated, myBookedDinners: myBooked, otherDinners: others };

  }, [filteredDinners, user]);
  

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedDietary('all');
    setSortBy('soonest');
  };

  const renderDinnerGrid = (dinnerList: Dinner[], emptyState: React.ReactNode) => {
    if (loading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => <DinnerCard.Skeleton key={i} />)}
            </div>
        )
    }

    if (dinnerList.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dinnerList.map((dinner) => (
            <DinnerCard key={dinner.id} dinner={dinner} />
          ))}
        </div>
      );
    }
    return emptyState;
  }
  
  const createDinnerLink = user ? "/create" : "/signin";

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center pt-8 pb-12">
        <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-primary">
          Never Dine Alone Again
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-foreground/80">
          Welcome to ForkFriends! Post a dinner plan or join one. Find amazing people to share a meal with.
        </p>
      </section>

      <section className="mb-12">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="relative md:col-span-3">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input
                type="text"
                placeholder="Search by cuisine or restaurant..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
            </Select>
             <Select value={selectedDietary} onValueChange={setSelectedDietary}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by dietary preference" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">No Preference</SelectItem>
                    {dietaryOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                    <SelectValue placeholder="Sort by date" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="soonest">Soonest</SelectItem>
                    <SelectItem value="furthest">Furthest</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {user ? (
        <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList>
                  <TabsTrigger value="upcoming">Upcoming Dinners ({otherDinners.length})</TabsTrigger>
                  <TabsTrigger value="my-booked">Booked Dinners ({myBookedDinners.length})</TabsTrigger>
                  <TabsTrigger value="my-created">Created Dinners ({myCreatedDinners.length})</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="upcoming">
                {renderDinnerGrid(otherDinners, (
                    <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                        <h3 className="font-headline text-2xl">No Dinners Found</h3>
                        <p className="text-muted-foreground mt-2">
                        No dinners match your current filters. Why not <Link href={createDinnerLink} className='underline font-bold'>create a new dinner</Link>?
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                    </div>
                ))}
            </TabsContent>
            <TabsContent value="my-created">
                {renderDinnerGrid(myCreatedDinners, (
                     <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                        <h3 className="font-headline text-2xl">You haven't created any dinners</h3>
                        <p className="text-muted-foreground mt-2">
                            This is your space to host! Create a dinner that matches the current filters.
                        </p>
                         <Button asChild className="mt-4">
                            <Link href="/create">Create a Dinner</Link>
                         </Button>
                    </div>
                ))}
            </TabsContent>
            <TabsContent value="my-booked">
                {renderDinnerGrid(myBookedDinners, (
                     <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                        <h3 className="font-headline text-2xl">You haven't booked any dinners</h3>
                        <p className="text-muted-foreground mt-2">
                            Join a dinner from the "Upcoming Dinners" list that matches your filters.
                        </p>
                         <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                    </div>
                ))}
            </TabsContent>
        </Tabs>
      ) : (
        <section>
            <h2 className="font-headline text-3xl font-bold mb-8 text-center">
            Upcoming Dinners
            </h2>
            {renderDinnerGrid(otherDinners, (
                 <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                    <h3 className="font-headline text-2xl">No Dinners Found</h3>
                    <p className="text-muted-foreground mt-2">
                    No dinners match your current filters. Why not <Link href={createDinnerLink} className='underline font-bold'>create a new dinner</Link>?
                    </p>
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                </div>
            ))}
        </section>
      )}
    </div>
  );
}
