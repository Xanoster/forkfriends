
'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDinner } from '@/contexts/DinnerContext';
import { useAuth, User } from '@/contexts/AuthContext';
import { type Dinner, type Comment } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Crown,
  Pencil,
  Ban,
  MessageCircle,
  Send,
  Bell,
  Star,
  CheckCircle,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
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

const StarRating = ({ rating, totalReviews }: { rating: number, totalReviews: number }) => {
    if (totalReviews === 0) return null;
    return (
        <div className="flex items-center gap-2">
             <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-4 w-4 ${
                    i < Math.round(rating) ? 'text-primary fill-primary' : 'text-muted-foreground/30'
                    }`}
                />
                ))}
            </div>
            <span className="text-muted-foreground text-xs">
                ({rating.toFixed(1)})
            </span>
        </div>
    )
}

const colorPalette = [
    'bg-sky-100', 'bg-emerald-100', 'bg-amber-100', 
    'bg-rose-100', 'bg-violet-100', 'bg-lime-100'
];

const stringToHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const getUserColorClass = (userId: string, isHost: boolean) => {
  if (isHost) return 'bg-primary/10';
  const hash = stringToHash(userId);
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};


export default function DinnerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, fetchUserReviews } = useAuth();
  const {
    dinners,
    loading: dinnersLoading,
    bookDinner,
    cancelBooking,
    getComments,
    addComment,
    deleteComment,
    markCommentsAsRead,
    hasUnreadMessages
  } = useDinner();
  
  const [dinner, setDinner] = useState<Dinner | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [hostReviews, setHostReviews] = useState<any[]>([]);
  const [isPast, setIsPast] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dinnerId = params.id as string;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  useEffect(() => {
    const foundDinner = dinners.find((d) => d.id === dinnerId);
    if (foundDinner) {
      setDinner(foundDinner);
       if (foundDinner.creatorId) {
        fetchUserReviews(foundDinner.creatorId).then(setHostReviews);
      }
      const dinnerDateTime = new Date(`${foundDinner.date}T${foundDinner.time}`);
      setIsPast(dinnerDateTime < new Date());
    }
  }, [dinnerId, dinners, fetchUserReviews]);

  useEffect(() => {
    if (!dinnerId) return;
    const unsubscribe = getComments(dinnerId, (newComments) => {
        setComments(newComments);
        if(user && (dinner?.bookedBy?.includes(user.uid) || dinner?.creatorId === user.uid)) {
            markCommentsAsRead(dinnerId, newComments);
        }
    });
    return () => unsubscribe();
  }, [dinnerId, getComments, markCommentsAsRead, user, dinner]);
  
  const hostAverageRating = useMemo(() => {
    if (hostReviews.length === 0) return 0;
    return hostReviews.reduce((acc, review) => acc + review.rating, 0) / hostReviews.length;
  }, [hostReviews]);

  if (dinnersLoading || authLoading) {
    return <PageSkeleton />;
  }

  if (!dinner) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-3xl">Dinner not found</h1>
        <p className="text-muted-foreground mt-2">
          The dinner you are looking for might have been cancelled or never existed.
        </p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  const filledSlots = dinner.filledSlots || (dinner.bookedBy?.length ?? 0);
  const isFull = filledSlots >= dinner.maxGuests;
  const progress = (filledSlots / dinner.maxGuests) * 100;
  const isCreator = user && dinner.creatorId === user.uid;
  const isBookedByUser = user && dinner.bookedBy?.includes(user.uid);
  const canViewComments = isCreator || isBookedByUser;
  const unreadMessages = hasUnreadMessages(dinnerId, comments);

  const handleBooking = async () => {
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
      try {
        await bookDinner(dinner.id, user.uid);
        toast({
          title: 'Slot booked!',
          description: `You've successfully booked a slot at ${dinner.restaurantName}.`,
        });
      } catch (e) {
        toast({
          title: 'Booking failed',
          description: 'Could not book your slot. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    if (isCreator) {
        toast({
            title: 'Action Not Allowed',
            description: "As the host, you can't cancel your booking. You can edit or delete the dinner instead.",
            variant: 'destructive'
        });
        return;
    }
    try {
      await cancelBooking(dinner.id, user.uid);
      toast({
        title: 'Booking Cancelled',
        description: `Your slot at ${dinner.restaurantName} has been cancelled.`,
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
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setIsSubmittingComment(true);
    try {
        await addComment(dinnerId, newComment);
        setNewComment('');
    } catch (error) {
        toast({
            title: "Comment Failed",
            description: "Could not post your comment. Please try again.",
            variant: "destructive"
        })
    } finally {
        setIsSubmittingComment(false);
    }
  }

  const handleDeleteComment = async () => {
    if (!commentToDelete || !dinner || !user) return;

    try {
        const isUserHost = user.uid === dinner.creatorId;
        const isSelfDelete = user.uid === commentToDelete.userId;
        await deleteComment(dinner.id, commentToDelete.id, isUserHost, isSelfDelete);
        toast({
            title: 'Comment Removed',
            description: 'The message has been successfully removed.',
        });
        setCommentToDelete(null);
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Could not remove the comment. Please try again.',
            variant: 'destructive'
        });
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // We can cast the event target to a form and request submission.
        (e.target as HTMLTextAreaElement).form?.requestSubmit();
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <Button variant="outline" onClick={() => router.back()} className='mb-6'>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      <div className="grid grid-cols-1 lg:grid-cols-5 lg:items-start gap-8">
        <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden shadow-lg">
                <CardHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-3xl mb-1">{dinner.restaurantName}</CardTitle>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">{dinner.cuisine}</Badge>
                        <Badge variant={dinner.dietary === 'Vegan' ? 'default' : dinner.dietary === 'Veg' ? 'secondary' : 'outline'}>{dinner.dietary}</Badge>
                    </div>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-base pt-2">
                    <MapPin className="h-4 w-4" /> {dinner.address}, {dinner.city}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pt-4">
                    <div className="flex justify-between items-center text-base text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-accent" />
                        <span>{new Date(`${dinner.date}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})} at {dinner.time}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-lg text-primary">
                        <DollarSign className="h-5 w-5 text-accent" />
                        <span>{dinner.budget}</span>
                    </div>
                    </div>
                    <div>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 text-base font-medium">
                        <Users className="h-5 w-5 text-accent" />
                        <span>Guests</span>
                        </div>
                        <span className="text-base font-semibold">{filledSlots} / {dinner.maxGuests} Filled</span>
                    </div>
                    <Progress value={progress} aria-label={`${filledSlots} out of ${dinner.maxGuests} slots filled`} />
                    </div>
                </CardContent>
                <CardFooter className="p-6 pt-4">
                    {isPast ? (
                        <Button className="w-full" variant="secondary" disabled>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            This dinner has ended
                        </Button>
                    ) : (
                        <>
                            {!isCreator && !isBookedByUser && (
                            <Button className="w-full" onClick={handleBooking} disabled={isFull}>
                                {isFull ? 'Dinner is Full' : 'Book a Slot'}
                            </Button>
                            )}
                            {!isCreator && isBookedByUser && (
                            <Button variant="destructive" className="w-full" onClick={handleCancel}>
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel Booking
                            </Button>
                            )}
                            {isCreator && (
                            <Button className="w-full" disabled variant="outline">
                                You are hosting this dinner
                            </Button>
                            )}
                        </>
                    )}
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Host</CardTitle>
                </CardHeader>
                 <CardContent>
                     <Button variant="ghost" asChild className="h-auto p-2 -ml-2 hover:bg-muted/50">
                        <Link href={`/profile/${dinner.creatorUsername}`} className='flex items-center gap-4'>
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={dinner.creatorImage} alt={dinner.creatorName} />
                                <AvatarFallback>{dinner.creatorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-base">{dinner.creatorName}</p>
                                <StarRating rating={hostAverageRating} totalReviews={hostReviews.length} />
                            </div>
                        </Link>
                    </Button>
                 </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Attendees ({dinner.attendees?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-40">
                         <div className="space-y-4">
                            {dinner.attendees?.map(attendee => (
                                 <Button variant="ghost" asChild key={attendee.uid} className="h-auto p-2 w-full justify-start hover:bg-muted/50">
                                    <Link href={`/profile/${attendee.username}`} className="flex items-center gap-3">
                                         <Avatar className="h-8 w-8">
                                            <AvatarImage src={attendee.avatar} alt={attendee.name} />
                                            <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium text-sm">{attendee.name}</p>
                                        {attendee.uid === dinner.creatorId && <Badge variant="secondary">Host</Badge>}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card className="h-[50rem] flex flex-col">
            <CardHeader>
                <CardTitle className='flex items-center gap-2 font-headline'>
                    <MessageCircle />
                    Group Chat
                    {unreadMessages && <Bell className='h-4 w-4 text-primary animate-pulse'/>}
                </CardTitle>
                <CardDescription>
                    {canViewComments ? "Discuss plans with your fellow diners." : "Book a slot to join the conversation."}
                </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col flex-grow overflow-hidden'>
                {canViewComments ? (
                    <>
                        <ScrollArea className="flex-grow pr-4 -mr-4 mb-4">
                             <div className="space-y-4">
                                {comments.length > 0 ? (
                                    comments.map(comment => {
                                        const isHostComment = comment.userId === dinner.creatorId;
                                        const isMyComment = comment.userId === user?.uid;
                                        const canDelete = isCreator || isMyComment;
                                        const colorClass = getUserColorClass(comment.userId, isHostComment);

                                        return (
                                        <div key={comment.id} className="flex gap-3 items-start group">
                                            <Avatar className='h-8 w-8'>
                                                <AvatarImage src={comment.userImage} alt={comment.userName}/>
                                                <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-grow">
                                                <div className='flex items-center gap-2'>
                                                    <p className="font-bold text-sm">@{comment.userName}</p>
                                                    {isHostComment && <Badge variant="outline" className='text-xs'>Host</Badge>}
                                                </div>
                                                <div className={`p-2 rounded-lg mt-1 ${colorClass}`}>
                                                    <p className="text-sm">{comment.text}</p>
                                                </div>
                                            </div>
                                             {canDelete && !comment.text.startsWith('[This message was deleted') && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => setCommentToDelete(comment)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently remove the message from the chat.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setCommentToDelete(null)}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDeleteComment}>Delete Message</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    )})
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to say something!</p>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                       <form onSubmit={handleAddComment} className="flex gap-2 border-t pt-4">
                            <Textarea 
                                placeholder="Send a message..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSubmittingComment}
                                rows={1}
                                className="resize-none"
                            />
                            <Button type="submit" size="icon" disabled={!newComment.trim() || isSubmittingComment}>
                                <Send />
                            </Button>
                       </form>
                    </>
                ) : (
                    <div className="text-center py-10 bg-muted rounded-lg flex-grow flex flex-col justify-center items-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Book this dinner to chat with the group.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const PageSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8">
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <Card>
                        <CardHeader className="p-6 pb-2">
                             <div className="flex justify-between items-start">
                                 <Skeleton className="h-10 w-3/4" />
                                 <div className="flex flex-col items-end gap-2">
                                     <Skeleton className="h-6 w-20" />
                                     <Skeleton className="h-6 w-16" />
                                 </div>
                             </div>
                             <Skeleton className="h-6 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-6 px-6 pt-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-2/5" />
                                <Skeleton className="h-8 w-1/5" />
                            </div>
                            <div className="space-y-2">
                                 <div className="flex justify-between items-center mb-1">
                                     <Skeleton className="h-6 w-1/4" />
                                     <Skeleton className="h-6 w-1/4" />
                                 </div>
                                 <Skeleton className="h-4 w-full" />
                            </div>
                        </CardContent>
                         <CardFooter className="p-6 pt-4">
                             <Skeleton className="h-12 w-full" />
                         </CardFooter>
                    </Card>
                     <Card>
                        <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-8 w-full" />
                             <Skeleton className="h-8 w-full" />
                              <Skeleton className="h-8 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                             <Skeleton className="h-8 w-3/5" />
                             <Skeleton className="h-4 w-4/5" />
                        </CardHeader>
                         <CardContent>
                             <div className="text-center py-10 bg-muted rounded-lg">
                                 <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                                 <Skeleton className="mt-4 h-4 w-3/4 mx-auto" />
                             </div>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


    





    

    

    

    
