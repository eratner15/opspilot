import type { Db } from '@/lib/db';

export interface DispatchResult {
  jobId: string;
  technicianId: string | null;
  smsSent: boolean;
  confirmationSent: boolean;
}

/**
 * Match the best available technician for a job based on category/skills.
 */
export async function matchTechnician(
  db: Db,
  organizationId: string,
  category: string | null
): Promise<string | null> {
  const techs = await db.technician.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
    },
  });

  if (techs.length === 0) return null;

  // Filter by skill match if category provided
  if (category) {
    const categoryLower = category.toLowerCase();
    const skilled = techs.filter((t) => {
      if (!t.skillsJson) return false;
      try {
        const skills: string[] = JSON.parse(t.skillsJson);
        return skills.some((s) => s.toLowerCase().includes(categoryLower));
      } catch {
        return false;
      }
    });
    if (skilled.length > 0) {
      // Pick the tech with fewest open jobs (load balancing)
      const techJobCounts = await Promise.all(
        skilled.map(async (t) => ({
          id: t.id,
          openJobs: await db.job.count({
            where: {
              organizationId,
              technicianId: t.id,
              status: { in: ['NEW', 'SCHEDULED', 'IN_PROGRESS'] },
            },
          }),
        }))
      );
      techJobCounts.sort((a, b) => a.openJobs - b.openJobs);
      return techJobCounts[0]!.id;
    }
  }

  // Fallback: first active tech
  return techs[0]!.id;
}

/**
 * Send SMS dispatch notification to technician.
 * Uses Twilio REST API directly (no SDK dependency here).
 */
export async function sendDispatchSms(
  accountSid: string,
  authToken: string,
  fromPhone: string,
  toPhone: string,
  message: string
): Promise<boolean> {
  try {
    const credentials = btoa(`${accountSid}:${authToken}`);
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromPhone,
          To: toPhone,
          Body: message,
        }).toString(),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Dispatch a technician to a job: assign, send SMS to tech, send confirmation to customer.
 */
export async function dispatchJob(
  db: Db,
  jobId: string,
  organizationId: string,
  twilioConfig: {
    accountSid?: string;
    authToken?: string;
    fromPhone?: string;
  }
): Promise<DispatchResult> {
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      customer: true,
      technician: true,
    },
  });

  if (!job) throw new Error('Job not found');

  // Match technician if not already assigned
  let techId = job.technicianId;
  if (!techId) {
    techId = await matchTechnician(db, organizationId, job.category);
    if (techId) {
      await db.job.update({
        where: { id: jobId },
        data: {
          technicianId: techId,
          status: 'SCHEDULED',
          updatedAt: new Date().toISOString(),
        },
      });
    }
  }

  let smsSent = false;
  let confirmationSent = false;

  const { accountSid, authToken, fromPhone } = twilioConfig;

  if (accountSid && authToken && fromPhone && techId) {
    const tech = await db.technician.findUnique({ where: { id: techId } });
    if (tech) {
      // SMS to technician
      const techMsg =
        `New job assigned: ${job.title}\n` +
        `Priority: ${job.priority}\n` +
        `Reply YES to confirm or NO to decline.\n` +
        `Job ID: ${job.id.slice(-6)}`;

      smsSent = await sendDispatchSms(
        accountSid,
        authToken,
        fromPhone,
        tech.phone,
        techMsg
      );
    }

    // SMS confirmation to customer
    if (job.customer?.phone) {
      const callbackWindow = job.priority === 'EMERGENCY' ? '30 minutes' : '2 hours';
      const org = await db.organization.findUnique({ where: { id: organizationId } });
      const orgName = org?.name ?? 'Your Service Team';
      const confirmMsg =
        `Hi${job.customer.firstName ? ` ${job.customer.firstName}` : ''}, ` +
        `your service request has been received. ` +
        `A technician will contact you within ${callbackWindow}. ` +
        `- ${orgName}`;

      confirmationSent = await sendDispatchSms(
        accountSid,
        authToken,
        fromPhone,
        job.customer.phone,
        confirmMsg
      );
    }
  }

  return {
    jobId,
    technicianId: techId,
    smsSent,
    confirmationSent,
  };
}
