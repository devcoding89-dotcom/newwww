"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Mail, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Rocket, 
  Users, 
  BarChart3,
  Mailbox,
  Star,
  Quote
} from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LandingPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-20 lg:pt-32 lg:pb-32 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span>Trusted by 15,000+ Nigerian Professionals</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter sm:text-6xl lg:text-8xl mb-6 leading-[1.1]">
            Extract Leads. <span className="text-primary">Verify </span> Accuracy. <br className="hidden sm:block" />
            <span className="text-accent">Personalize</span> at Scale.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-xl mb-10 px-2">
            The #1 AI outreach tool for Nigerian studios. Identify prospects from raw text, 
            verify deliverability locally, and launch hyper-personalized campaigns in seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button size="lg" className="h-12 sm:h-14 px-8 text-base sm:text-lg font-bold w-full sm:w-auto" asChild>
              <Link href="/signup">
                Start Sending for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 sm:h-14 px-8 text-base sm:text-lg w-full sm:w-auto" asChild>
              <Link href="/pricing">View Elite Pricing (₦1,000)</Link>
            </Button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 grayscale opacity-50">
             <div className="flex flex-col items-center">
                <p className="text-2xl font-black">2.4M+</p>
                <p className="text-[10px] uppercase font-bold tracking-widest">Emails Sent</p>
             </div>
             <div className="h-8 w-px bg-border" />
             <div className="flex flex-col items-center">
                <p className="text-2xl font-black">15k</p>
                <p className="text-[10px] uppercase font-bold tracking-widest">Active Users</p>
             </div>
             <div className="h-8 w-px bg-border" />
             <div className="flex flex-col items-center">
                <p className="text-2xl font-black">98%</p>
                <p className="text-[10px] uppercase font-bold tracking-widest">Deliverability</p>
             </div>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 -z-10 h-full w-full opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] -translate-y-1/2 rounded-full bg-primary blur-[80px] sm:blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] -translate-y-1/2 rounded-full bg-accent blur-[80px] sm:blur-[120px]" />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold sm:text-5xl mb-4 tracking-tight">Everything You Need to Scale in Lagos</h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">Built for the Nigerian digital landscape—fast, reliable, and integrated with local payments.</p>
          </div>
          <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              icon={<Mailbox className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />}
              title="AI Lead Extraction"
              description="Identify unique leads from LinkedIn bios, email threads, or WhatsApp groups instantly."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />}
              title="Local MX Cleaning"
              description="Real-time verification to ensure your NGN outreach hits valid mailboxes across all Nigerian ISPs."
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />}
              title="Elite Personalization"
              description="Use AI to draft content that speaks directly to your prospects' job roles and company missions."
            />
            <FeatureCard 
              icon={<Rocket className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />}
              title="Batch Dispatch"
              description="Reliable email delivery infrastructure with zero-config SMTP. Pay locally via Paystack."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
           <h2 className="text-3xl font-bold text-center sm:text-5xl mb-12 sm:mb-16 tracking-tight">Voices of Success</h2>
           <div className="grid gap-8 md:grid-cols-3">
              <TestimonialCard 
                quote="EmailCraft changed how we handle B2B sales in Lagos. We extracted 500 leads in one afternoon and had a 40% open rate by morning."
                name="Tunde Balogun"
                role="CEO, Balogun Digital Studio"
                initials="TB"
              />
              <TestimonialCard 
                quote="Finally, an outreach tool that accepts local cards and understands the Nigerian market. The ₦1,000 Elite plan is a complete steal."
                name="Chidinma Okafor"
                role="Marketing Lead, Ikeja Tech Hub"
                initials="CO"
              />
              <TestimonialCard 
                quote="The AI extraction is pure magic. I just paste my LinkedIn feed and it pulls out every potential partner's email perfectly."
                name="Femi Adekunle"
                role="Founder, Ade-Media Abuja"
                initials="FA"
              />
           </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-muted/20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8 sm:mb-12 tracking-tight">Common Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base sm:text-lg">Can I pay with my Nigerian Naira card?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                Yes! We use Paystack for all local transactions. You can pay easily using your Naira Mastercard, Visa, Verve, or even via Bank Transfer and USSD.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-base sm:text-lg">What is the difference between Free and Elite?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                The Free plan gives you 50 AI extractions and basic campaign tools. Elite (₦1,000/mo) unlocks unlimited AI extractions, unlimited campaigns, and priority dispatch queues.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-base sm:text-lg">Do you share my contact data?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                Never. Your data is isolated in your private Firestore collection. We never sell or share your contact lists with third parties.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-4">
              <AccordionTrigger className="text-base sm:text-lg">Is there a long-term contract?</AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base">
                No. You can cancel your Elite subscription at any time with one click in your settings. Your account will simply revert to the Free tier at the end of your billing cycle.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-2xl sm:rounded-3xl bg-primary px-6 py-12 sm:py-16 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            
            <h2 className="text-3xl font-bold sm:text-5xl mb-4 sm:mb-6 tracking-tight">Ready to close more deals?</h2>
            <p className="mx-auto max-w-xl text-base sm:text-lg mb-8 sm:mb-10 opacity-90 text-primary-foreground/80">
              Join the Elite community of Nigerian studios automating their sales intelligence today.
            </p>
            <Button size="lg" variant="secondary" className="h-12 sm:h-14 px-10 text-lg sm:text-xl font-bold w-full sm:w-auto" asChild>
              <Link href="/signup">Create Your Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t mt-auto px-4">
        <div className="container mx-auto text-center text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row justify-center gap-4">
          <p>© {new Date().getFullYear()} EmailCraft Studio. All rights reserved.</p>
          <div className="flex justify-center gap-4">
             <Link href="/pricing" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Pricing</Link>
             <Link href="/signup" className="hover:text-primary transition-colors underline-offset-4 hover:underline">Elite Growth</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role, initials }: { quote: string; name: string; role: string; initials: string }) {
  return (
    <div className="p-8 rounded-2xl border bg-card flex flex-col gap-6 shadow-sm">
       <Quote className="h-8 w-8 text-primary opacity-20" />
       <p className="text-sm leading-relaxed italic text-foreground">"{quote}"</p>
       <div className="flex items-center gap-4 pt-4 border-t">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
             <AvatarFallback className="bg-primary/10 text-primary font-black">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
             <span className="text-sm font-bold">{name}</span>
             <span className="text-[10px] text-muted-foreground uppercase font-medium">{role}</span>
          </div>
       </div>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center relative">
      <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl sm:text-2xl font-black mb-4 sm:mb-6 shadow-sm">
        {number}
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-[200px] mx-auto">{description}</p>
    </div>
  );
}
