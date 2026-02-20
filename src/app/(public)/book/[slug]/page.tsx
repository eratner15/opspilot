import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { BookForm } from "./book-form";
import { Phone, Clock, Star } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;

  let db;
  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
  } catch {
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient();
  }

  const org = await db.organization.findUnique({ where: { id: slug } });
  if (!org) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {org.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">Request Service</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Fill out the form below and we&apos;ll reach out to confirm your appointment.
          </p>
        </div>

        {/* Trust badges */}
        <div className="mb-6 grid grid-cols-3 gap-3 text-center text-xs text-zinc-500">
          <div className="flex flex-col items-center gap-1">
            <Phone className="h-4 w-4 text-blue-500" />
            <span>We call you back fast</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Same-day available</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Star className="h-4 w-4 text-blue-500" />
            <span>Licensed & insured</span>
          </div>
        </div>

        {/* Form */}
        <BookForm orgId={org.id} />

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Questions? Call {org.name}
          {org.phone ? ` at ${org.phone}` : " directly"}.
        </p>
      </div>
    </div>
  );
}
