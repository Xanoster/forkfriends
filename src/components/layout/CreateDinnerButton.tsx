'use client';

import Link from 'next/link';
import { useDinner } from '@/contexts/DinnerContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateDinnerButton() {
    const { selectedCity, selectedDietary } = useDinner();
    const { user } = useAuth();
    
    const params = new URLSearchParams();
    if (selectedCity && selectedCity !== 'all') {
        params.set('city', selectedCity);
    }
    if (selectedDietary && selectedDietary !== 'all') {
        params.set('dietary', selectedDietary);
    }

    const href = user ? `/create?${params.toString()}` : '/signin';

    return (
        <Button variant="ghost" asChild>
            <Link href={href}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Dinner
            </Link>
        </Button>
    )
}
