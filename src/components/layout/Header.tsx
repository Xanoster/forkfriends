
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, LogOut, User as UserIcon, BookUser, Star, Activity, LifeBuoy } from 'lucide-react';
import CreateDinnerButton from './CreateDinnerButton';
import NotificationBell from './NotificationBell';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          <CreateDinnerButton />
          {user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/7.x/micah/svg?seed=${user.avatarSeed || user.email}`} alt={user.email || ''} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Signed in as</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <Link href="/my-dinners">
                      <BookUser className="mr-2 h-4 w-4" />
                      <span>My Dinners</span>
                    </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <Link href="/my-activity">
                      <Activity className="mr-2 h-4 w-4" />
                      <span>My Activity</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-reviews">
                        <Star className="mr-2 h-4 w-4" />
                        <span>Community Kudos</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/help">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        <span>Help & Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
