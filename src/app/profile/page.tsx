
'use client';

import * as React from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cities, dietaryOptions, Review, Dinner } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Shuffle, Star, Trash, Eye } from 'lucide-react';
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
import { useDinner } from '@/contexts/DinnerContext';
import Link from 'next/link';


const StarRating = ({ rating, totalReviews }: { rating: number, totalReviews: number }) => {
    if (totalReviews === 0) return null;
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

export default function ProfilePage() {
  const { user: authUser, loading: authLoading, updateUser, fetchUserProfile, fetchUserReviews, deleteAccount } = useAuth();
  const { dinners, loading: dinnersLoading } = useDinner();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const loadProfileData = useCallback(async (uid: string) => {
    setPageLoading(true);
    try {
        const userProfile = await fetchUserProfile(uid);
        setProfile(userProfile);
        if (userProfile) {
            const userReviews = await fetchUserReviews(uid);
            setReviews(userReviews);
        }
    } catch(e) {
        toast({ title: "Error", description: "Could not load profile data.", variant: "destructive"})
    } finally {
        setPageLoading(false);
    }
  }, [fetchUserProfile, fetchUserReviews, toast]);

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }
    if (authUser) {
      loadProfileData(authUser.uid);
    } else {
       router.push('/signin');
    }
  }, [authUser, authLoading, router, loadProfileData]);
  

  if (pageLoading || !profile || dinnersLoading) {
    return <ProfileSkeleton />;
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfile(prev => (prev ? { ...prev, [id]: value } : null));
  }

  const handleSelectChange = (id: keyof User) => (value: string) => {
    setProfile(prev => (prev ? { ...prev, [id]: value } : null));
  }
  
  const handleAvatarShuffle = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setProfile(prev => prev ? { ...prev, avatarSeed: newSeed } : null);
  }

  const handleSave = async () => {
    if(profile && authUser) {
        setIsSaving(true);
        try {
            await updateUser(profile);
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved successfully.",
            });
        } catch (error: any) {
             toast({
                title: "Update Failed",
                description: error?.message || "Could not save your profile changes.",
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }
  };

  const handleDeleteAccount = async () => {
    try {
        await deleteAccount();
        toast({
            title: "Account Deleted",
            description: "Your account has been permanently deleted."
        });
        router.push('/');
    } catch (error: any) {
        toast({
            title: "Deletion Failed",
            description: error.message || "Could not delete your account. Please try again.",
            variant: "destructive"
        })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
            <CardHeader>
            <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={`https://api.dicebear.com/7.x/micah/svg?seed=${profile.avatarSeed || profile.email}`} alt={profile.name || ''} />
                    <AvatarFallback>{(profile.name || profile.email || 'U')?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button 
                    size="icon" 
                    variant="outline" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={handleAvatarShuffle}
                    aria-label="Shuffle Avatar"
                    >
                    <Shuffle className="h-4 w-4" />
                    </Button>
                </div>
                <div className='flex flex-col items-center gap-1'>
                    <CardTitle className="font-headline text-3xl">{profile.name}</CardTitle>
                    <CardDescription>@{profile.username} &middot; {profile.email}</CardDescription>
                    {reviews.length > 0 && <div className="mt-2"><StarRating rating={averageRating} totalReviews={reviews.length} /></div>}
                </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Your Name" value={profile.name || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="A unique username" value={profile.username || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="city">City</Label>
                        <Select onValueChange={handleSelectChange('city')} value={profile.city || ''} disabled={isSaving}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your city" />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" placeholder="Your Age" value={profile.age || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="dietary">Dietary Preference</Label>
                    <Select onValueChange={handleSelectChange('dietary')} value={profile.dietary || ''} disabled={isSaving}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your dietary preference" />
                        </SelectTrigger>
                        <SelectContent>
                            {dietaryOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="bio">Your Bio</Label>
                    <Textarea id="bio" placeholder="Tell us a little about yourself, your favorite foods, and what you love about dining with others!" value={profile.bio || ''} onChange={handleChange} disabled={isSaving} />
                </div>

            </CardContent>
            <CardFooter className='flex justify-between items-center'>
                 <Button variant="ghost" asChild>
                    <Link href={`/profile/${profile.username}`}>
                       <Eye className="mr-2 h-4 w-4" />
                       View Public Profile
                    </Link>
                 </Button>
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
            </CardFooter>
        </Card>
        
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive font-headline">Danger Zone</CardTitle>
                <CardDescription>
                    This action is permanent and cannot be undone. Please proceed with caution.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete My Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account,
                                remove your profile data, and log you out.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                                Yes, delete my account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

const ProfileSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className='max-w-3xl mx-auto space-y-8'>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-center text-center gap-4">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="flex-grow space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-1.5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-1.5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                        <div className="space-y-1.5"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-1.5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-20 w-full" /></div>
                    </CardContent>
                    <CardFooter className='justify-end'>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <Skeleton className='h-12 w-full' />
                        <Skeleton className='h-12 w-full' />
                        <Skeleton className='h-12 w-full' />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
