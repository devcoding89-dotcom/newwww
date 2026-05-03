
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Mailbox,
  Send,
  Settings,
  ShieldCheck,
  CreditCard,
  Home,
  FileText
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { SheetClose } from '@/components/ui/sheet';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/extract', label: 'Extract Intelligence', icon: Mailbox },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/campaigns', label: 'Campaigns', icon: Send },
  { href: '/pricing', label: 'Elite Pricing', icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  return (
    <nav className="grid gap-6 text-lg font-medium">
      <SheetClose asChild>
        <Link
          href="/"
          className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
        >
          <Icons.logo className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="sr-only">EmailCraft Studio</span>
        </Link>
      </SheetClose>
      
      {!user && (
        <SheetClose asChild>
          <Link
            href="/"
            className={cn(
              'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
              { 'text-foreground': pathname === '/' }
            )}
          >
            <Home className="h-5 w-5" />
            Home
          </Link>
        </SheetClose>
      )}

      {user && navLinks.map(({ href, label, icon: Icon }) => (
        <SheetClose asChild key={href}>
          <Link
            href={href}
            className={cn(
              'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
              {
                'text-foreground':
                  (href === '/dashboard' && pathname === '/dashboard') ||
                  (href !== '/dashboard' && pathname.startsWith(href)),
              }
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        </SheetClose>
      ))}

      {profile?.isAdmin && (
        <SheetClose asChild>
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
              {
                'text-foreground': pathname.startsWith('/admin'),
              }
            )}
          >
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Admin Panel
          </Link>
        </SheetClose>
      )}

      <SheetClose asChild>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
            {
              'text-foreground': pathname.startsWith('/settings'),
            }
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </SheetClose>
    </nav>
  );
}
