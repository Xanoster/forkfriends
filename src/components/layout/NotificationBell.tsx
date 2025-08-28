'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, UserPlus, History, Trash2 } from 'lucide-react';
import { useDinner } from '@/contexts/DinnerContext';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '../ui/badge';
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

export default function NotificationBell() {
  const { 
    unreadDinnerIds, 
    readDinnerIds, 
    dinners, 
    notifications, 
    markNotificationsAsRead,
    deleteAllNotifications
  } = useDinner();

  const unreadDinners = dinners.filter(dinner => unreadDinnerIds.includes(dinner.id));
  const readDinners = readDinnerIds.map(id => dinners.find(d => d.id === id)).filter(d => !!d);

  const unreadNotifications = notifications.filter(n => !n.read);

  const totalNotifications = unreadDinners.length + unreadNotifications.length;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadNotifications.length > 0) {
      markNotificationsAsRead();
    }
  }

  const handleDeleteAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteAllNotifications();
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {totalNotifications}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="messages">
                    Messages <Badge variant={unreadDinners.length > 0 ? "destructive" : "secondary"} className="ml-2 px-1.5">{unreadDinners.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="bookings">
                    Bookings <Badge variant={unreadNotifications.length > 0 ? "destructive" : "secondary"} className="ml-2 px-1.5">{unreadNotifications.length}</Badge>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="messages">
                <DropdownMenuLabel>Unread Messages</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {unreadDinners.length > 0 ? (
                    unreadDinners.map(dinner => (
                    <DropdownMenuItem key={dinner.id} asChild>
                        <Link href={`/dinner/${dinner.id}`} className='flex justify-between items-center'>
                        <div>
                            <p className="font-semibold">{dinner.restaurantName}</p>
                            <p className="text-xs text-muted-foreground">{dinner.city}</p>
                        </div>
                        <MessageCircle className="h-4 w-4 text-primary" />
                        </Link>
                    </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                    No new messages.
                    </p>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuLabel>Recent Chats</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                  {readDinners.length > 0 ? (
                     readDinners.map(dinner => (
                        dinner && (
                            <DropdownMenuItem key={dinner.id} asChild>
                                <Link href={`/dinner/${dinner.id}`} className='flex justify-between items-center'>
                                <div>
                                    <p className="font-semibold">{dinner.restaurantName}</p>
                                    <p className="text-xs text-muted-foreground">{dinner.city}</p>
                                </div>
                                <History className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </DropdownMenuItem>
                        )
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        No recent chats.
                    </p>
                )}
            </TabsContent>
            <TabsContent value="bookings">
                <div className='flex justify-between items-center pr-2'>
                    <DropdownMenuLabel>Booking Activity</DropdownMenuLabel>
                    {notifications.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className='h-7 w-7 text-muted-foreground hover:text-destructive'>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all of your booking notifications. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAll}>Delete All</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                     notifications.map(notif => (
                        <DropdownMenuItem key={notif.id} asChild>
                            <Link href={`/dinner/${notif.dinnerId}`} className='flex items-start gap-3'>
                                <UserPlus className="h-4 w-4 text-accent mt-1" />
                                <div>
                                    <p className="font-semibold text-sm leading-snug">
                                        <span className="font-bold">{notif.actorName}</span> booked a slot for <span className="font-bold">{notif.dinnerName}</span>.
                                    </p>
                                    <p className="text-xs text-muted-foreground">{new Date(notif.createdAt?.toDate()).toLocaleString()}</p>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        No booking notifications yet.
                    </p>
                )}
            </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
