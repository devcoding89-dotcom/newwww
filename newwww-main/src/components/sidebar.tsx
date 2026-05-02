
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  Mailbox,
  Send,
  Settings,
  ShieldCheck,
  FileText,
  CreditCard,
  Home
} from "lucide-react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/extract", label: "Extract Intelligence", icon: Mailbox },
  { href: "/contacts", label: "Contact Lists", icon: Users },
  { href: "/templates", label: "Email Templates", icon: FileText },
  { href: "/campaigns", label: "Campaign Builder", icon: Send },
  { href: "/pricing", label: "Elite Pricing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href={user ? "/dashboard" : "/"}
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Icons.logo className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">EmailCraft Studio</span>
          </Link>

          {!user && (
             <Tooltip>
               <TooltipTrigger asChild>
                 <Link
                   href="/"
                   className={cn(
                     "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                     { "bg-accent text-accent-foreground": pathname === "/" }
                   )}
                 >
                   <Home className="h-5 w-5" />
                   <span className="sr-only">Home</span>
                 </Link>
               </TooltipTrigger>
               <TooltipContent side="right">Home</TooltipContent>
             </Tooltip>
          )}

          {user && navLinks.map(({ href, label, icon: Icon }) => (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    {
                      "bg-accent text-accent-foreground":
                        (href === "/dashboard" && pathname === "/dashboard") ||
                        (href !== "/dashboard" && pathname.startsWith(href)),
                    }
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
          
          {profile?.isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    {
                      "bg-accent text-accent-foreground": pathname.startsWith("/admin"),
                    }
                  )}
                >
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  <span className="sr-only">Admin Panel</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Admin Panel</TooltipContent>
            </Tooltip>
          )}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                  {
                    "bg-accent text-accent-foreground":
                      pathname === "/settings",
                  }
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
