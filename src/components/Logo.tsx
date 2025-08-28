import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="p-2 bg-primary/20 text-primary rounded-lg group-hover:bg-primary/30 transition-colors">
        <UtensilsCrossed className="h-6 w-6" />
      </div>
      <span className="font-headline text-2xl font-bold text-primary group-hover:text-primary/90 transition-colors">
        ForkFriends
      </span>
    </Link>
  );
};

export default Logo;
