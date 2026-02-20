import Link from "next/link";
import { Zap, Phone, Briefcase, MessageSquare, BarChart3, CheckCircle, Star, ChevronDown, ArrowRight } from "lucide-react";

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5 backdrop-blur-md bg-[#080912]/80">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">OpsPilot</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          Start Free Trial
        </Link>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm text-blue-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          AI-Powered Operations for Trades Businesses
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05]">
          Your phones answered.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Your jobs dispatched.
          </span>
          <br />
          Automatically.
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          OpsPilot&apos;s AI voice agent answers every call, creates jobs, dispatches technicians by SMS, sends digital quotes, and collects payment online — while you focus on the work.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-500/35 hover:-translate-y-0.5"
          >
            Start Your Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/5"
          >
            View Demo Dashboard
          </Link>
        </div>

        <p className="text-sm text-zinc-600">
          No credit card required · 14-day free trial · Cancel anytime
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5 max-w-lg mx-auto">
          {[
            { value: "24/7", label: "AI Call Coverage" },
            { value: "< 60s", label: "Job Creation" },
            { value: "$199", label: "Per Month" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Phone,
      title: "AI Answers the Call",
      desc: "Customer calls your Twilio number. OpsPilot AI answers professionally 24/7, collects all job details, and identifies the customer.",
    },
    {
      step: "02",
      icon: Briefcase,
      title: "Job Created Instantly",
      desc: "AI classifies the request (emergency, maintenance, install), creates a job in your dashboard, and matches the best available technician.",
    },
    {
      step: "03",
      icon: MessageSquare,
      title: "Tech Dispatched by SMS",
      desc: "Your technician gets an SMS with all job details. They reply YES to confirm. Customer gets a confirmation message automatically.",
    },
    {
      step: "04",
      icon: BarChart3,
      title: "Quote, Invoice, Paid",
      desc: "Send a digital quote for customer e-signature. Convert to invoice. Customer pays online via Stripe. Revenue hits your account.",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            From call to cash in one platform
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            OpsPilot connects every step of your operations — no more missed calls, lost jobs, or chasing payments.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-blue-500/20 hover:bg-white/[0.04] transition-all group"
              >
                <div className="absolute top-4 right-4 text-xs font-mono text-zinc-700 group-hover:text-zinc-500 transition-colors">
                  {step.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    category: "CAPTURE",
    title: "Never miss a call again",
    desc: "Your AI voice agent answers every call — day, night, and weekends. It sounds professional, collects all the details, and gets the job in your system before you even wake up.",
    points: ["Professional AI voice greeting", "Speech-to-text transcription", "Intent classification & sentiment analysis", "Automatic customer lookup or creation"],
    accent: "from-blue-500 to-indigo-500",
  },
  {
    category: "EXECUTE",
    title: "Dispatch the right tech instantly",
    desc: "AI matches each job to the best available technician based on skills, location, and schedule. One SMS and they're confirmed on the job.",
    points: ["Smart technician matching", "SMS dispatch with YES/NO confirmation", "Job status tracking in real-time", "Customer SMS confirmations & updates"],
    accent: "from-cyan-500 to-teal-500",
  },
  {
    category: "GROW",
    title: "Quote, invoice, collect — online",
    desc: "Send professional digital quotes customers can e-sign on their phone. Convert to invoices and collect payment via Stripe. Your QuickBooks syncs automatically.",
    points: ["AI-assisted quote line items", "Customer e-signature (mobile-friendly)", "Stripe online payments", "QuickBooks sync + weekly AI digest"],
    accent: "from-emerald-500 to-green-500",
  },
];

function Features() {
  return (
    <section className="py-24 px-4 sm:px-8 bg-gradient-to-b from-transparent to-white/[0.01]">
      <div className="max-w-5xl mx-auto space-y-20">
        {features.map((f, i) => (
          <div
            key={f.category}
            className={`grid gap-12 lg:grid-cols-2 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}
          >
            <div className={`space-y-6 ${i % 2 === 1 ? "lg:col-start-2" : ""}`}>
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${f.accent} bg-clip-text text-transparent`}>
                  {f.category}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">{f.title}</h3>
              </div>
              <p className="text-zinc-400 leading-relaxed">{f.desc}</p>
              <ul className="space-y-3">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckCircle className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual placeholder */}
            <div
              className={`rounded-2xl border border-white/5 bg-white/[0.02] h-64 flex items-center justify-center ${i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}
            >
              <div className="text-center space-y-3">
                <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center shadow-xl opacity-80`}>
                  {i === 0 && <Phone className="w-7 h-7 text-white" />}
                  {i === 1 && <MessageSquare className="w-7 h-7 text-white" />}
                  {i === 2 && <BarChart3 className="w-7 h-7 text-white" />}
                </div>
                <p className="text-xs text-zinc-600 font-medium">{f.category}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

function SocialProof() {
  const testimonials = [
    { quote: "We went from missing 30% of after-hours calls to capturing every one. Paid for itself in the first month.", author: "Mike D.", role: "Owner, Tampa HVAC Co." },
    { quote: "The SMS dispatch is a game changer. My techs get the details instantly and I don't have to play phone tag.", author: "Sandra R.", role: "Dispatcher, Coastal Plumbing" },
    { quote: "Quotes used to take me an hour. Now AI suggests the line items and customers sign on their phone. Incredible.", author: "Carlos M.", role: "Owner, Pro Electric Tampa" },
  ];

  return (
    <section className="py-24 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <p className="text-zinc-400 text-sm">Loved by HVAC, plumbing, electrical, and roofing companies</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
              <p className="text-zinc-300 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-white text-sm font-semibold">{t.author}</p>
                <p className="text-zinc-600 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$199",
      period: "/month",
      desc: "Perfect for growing trades businesses with one location.",
      features: ["1 location", "Up to 5 technicians", "AI call answering", "Job + dispatch automation", "Digital quotes & invoices", "Stripe payments", "Email support"],
      cta: "Start Free Trial",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$349",
      period: "/month",
      desc: "For established businesses ready to scale operations.",
      features: ["Up to 3 locations", "Unlimited technicians", "Everything in Starter", "Advanced analytics & charts", "Weekly AI performance digest", "QuickBooks sync", "Priority support"],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      desc: "Multi-location operations with dedicated support.",
      features: ["Unlimited locations", "White-label option", "Custom AI voice personas", "Dedicated account manager", "SLA guarantee", "Custom integrations", "24/7 phone support"],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-8" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, transparent pricing</h2>
          <p className="text-zinc-400">No setup fees. No per-call charges. Cancel anytime.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 space-y-6 flex flex-col ${
                plan.highlight
                  ? "border-blue-500/40 bg-blue-600/5 shadow-xl shadow-blue-600/10"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-zinc-500 text-sm mt-2">{plan.desc}</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckCircle className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta === "Contact Sales" ? "mailto:sales@opspilot.ai" : "/sign-up"}
                className={`block text-center rounded-xl py-3 text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                    : "border border-white/10 text-white hover:bg-white/5"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const items = [
    {
      q: "How quickly can I get set up?",
      a: "Most customers are live in under 30 minutes. You'll need a Twilio phone number (takes 5 minutes to provision), connect your Stripe account, and add your technicians. Our setup wizard walks you through each step.",
    },
    {
      q: "What trades does OpsPilot work for?",
      a: "OpsPilot is built for HVAC, plumbing, electrical, roofing, appliance repair, and any other field service business that takes service calls. The AI is trained on common trades terminology and job types.",
    },
    {
      q: "What happens when the AI can't handle a call?",
      a: "If the AI detects a situation it can't handle (complex commercial projects, angry customers, etc.), it professionally collects a callback number and flags the call for human follow-up. You're always in control.",
    },
    {
      q: "Does it work with my existing software?",
      a: "OpsPilot syncs with QuickBooks for accounting. We're adding integrations with ServiceTitan and Jobber. The full REST API lets you connect to any system your team already uses.",
    },
    {
      q: "What if I already have a receptionist?",
      a: "Many of our customers use OpsPilot as overflow coverage for after-hours, weekends, and high call volume periods. Your receptionist handles complex calls; OpsPilot handles the rest.",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-white">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium text-sm hover:bg-white/[0.02] transition-colors">
                {item.q}
                <ChevronDown className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform shrink-0 ml-4" />
              </summary>
              <div className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-600/30 mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Ready to stop missing jobs?
        </h2>
        <p className="text-zinc-400 text-lg">
          Start your 14-day free trial. No credit card required.
          Your AI answering service goes live in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-500/35"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 text-zinc-300 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/5"
          >
            View Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">OpsPilot</span>
          <span className="text-zinc-600 text-xs ml-2">© 2026</span>
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-zinc-600">
          <span>AI Operations for Trades Businesses</span>
          <Link href="/sign-in" className="hover:text-zinc-400 transition-colors">Sign In</Link>
          <Link href="/sign-up" className="hover:text-zinc-400 transition-colors">Start Trial</Link>
          <Link href="#pricing" className="hover:text-zinc-400 transition-colors">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-[#080912] text-white min-h-screen">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <SocialProof />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
