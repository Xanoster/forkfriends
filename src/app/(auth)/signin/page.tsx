'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState } from 'react';

export default function SignInPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('diner@example.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>
            Enter your email below to sign in to your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                 <div className="text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="underline">
                        Sign up
                    </Link>
                </div>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
