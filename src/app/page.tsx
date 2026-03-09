
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
  Quote,
  Search,
  FileSpreadsheet,
  Send
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const handleCtaClick = (path: string) => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push(path);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-32 lg:pb-32 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs sm:text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Trusted by 15,000+ Nigerian Professionals</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter sm:text-6xl lg:text-8xl mb-6 leading-[1.1]">
            Extract Leads. <span className="text-primary">Verify </span> Accuracy. <br className="hidden sm:block" />
            <span className="text-accent">Personalize</span> at Scale.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-xl mb-10 px-2">
            The #1 AI outreach tool for Nigerian studios. Identify prospects from raw text, 
            verify deliverability locally, and launch hyper-personalized campaigns in seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
            <Button size="lg" className="h-14 px-8 text-lg font-bold w-full sm:w-auto" onClick={() => handleCtaClick("/signup")}>
              Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto" asChild>
              <Link href="/pricing">View Elite Pricing (₦1,000)</Link>
            </Button>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 -z-10 h-full w-full opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-accent blur-[120px]" />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-5xl mb-4 tracking-tight uppercase tracking-widest">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">From raw data to delivered messages in 4 simple steps.</p>
          </div>
          <div className="grid gap-12 md:grid-cols-4 relative">
             <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-primary/20 -translate-y-1/2 -z-10" />
             <Step number="01" icon={<Search className="h-6 w-6" />} title="Extract" description="Paste raw text or LinkedIn bios. AI extracts names, roles, and emails." />
             <Step number="02" icon={<ShieldCheck className="h-6 w-6" />} title="Clean" description="Automatic MX record checks ensure every address is valid in Nigeria." />
             <Step number="03" icon={<Sparkles className="h-6 w-6" />} title="Craft" description="AI drafts personalized subject lines and body content using recipient tokens." />
             <Step number="04" icon={<Send className="h-6 w-6" />} title="Dispatch" description="Send via professional infrastructure. Pay locally via Paystack USSD or Card." />
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-5xl mb-4 tracking-tight">Built for the Nigerian Landscape</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Fast, reliable, and integrated with local payments for Lagos-based studios.</p>
          </div>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              icon={<Mailbox className="h-10 w-10 text-primary" />}
              title="AI Lead Intelligence"
              description="Identify unique leads from LinkedIn bios, email threads, or mixed text instantly."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-10 w-10 text-green-500" />}
              title="Local Verification"
              description="Real-time MX cleaning ensures your outreach hits valid mailboxes on local ISPs."
            />
            <FeatureCard 
              icon={<Zap className="h-10 w-10 text-amber-500" />}
              title="Elite Templates"
              description="Craft content that speaks directly to job roles using AI-driven personalization."
            />
            <FeatureCard 
              icon={<Rocket className="h-10 w-10 text-primary" />}
              title="Batch Dispatch"
              description="Reliable delivery infrastructure. Pay easily via Paystack Card, Transfer, or USSD."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
           <h2 className="text-3xl font-bold text-center sm:text-5xl mb-16 tracking-tight">Voices of Success</h2>
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
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">Common Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg">Can I pay with my Nigerian Naira card?</AccordionTrigger>
              <AccordionContent>
                Yes! We use Paystack for all local transactions. You can pay easily using your Naira Mastercard, Visa, Verve, or even via Bank Transfer and USSD.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg">What is the difference between Free and Elite?</AccordionTrigger>
              <AccordionContent>
                The Free plan gives you basic AI extractions and campaign tools. Elite (₦1,000/mo) unlocks unlimited AI lead extractions, unlimited campaigns, and priority dispatch.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg">Do you share my contact data?</AccordionTrigger>
              <AccordionContent>
                Never. Your data is isolated in your private Firestore collection. We never sell or share your contact lists with third parties.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <h2 className="text-3xl font-bold sm:text-5xl mb-6 tracking-tight">Ready to close more deals?</h2>
            <p className="mx-auto max-w-xl text-lg mb-10 opacity-90">
              Join the Elite community of Nigerian studios automating their sales intelligence today.
            </p>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-xl font-bold w-full sm:w-auto" onClick={() => handleCtaClick("/signup")}>
              Create Your Free Account
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-center gap-6">
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

function Step({ number, icon, title, description }: { number: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center group bg-background p-6 rounded-2xl border hover:border-primary/50 transition-all">
      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-xs font-black text-primary/50 mb-2">{number}</span>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
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
