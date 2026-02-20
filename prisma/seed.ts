/**
 * Seed script for OpsPilot demo data
 * Uses SQLite-compatible types: ISO strings for dates, Int cents for money, JSON strings for objects
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

function now() {
  return new Date().toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

async function main() {
  console.log("🌱 Seeding OpsPilot demo data...");

  // ── Organization ──────────────────────────────────────────────
  const orgId = "demo-org-comfort-pro-hvac";
  const org = await prisma.organization.upsert({
    where: { id: orgId },
    update: {},
    create: {
      id: orgId,
      name: "Comfort Pro HVAC",
      phone: "8135550100",
      email: "info@comfortprohvac.com",
      address: "4821 N Dale Mabry Hwy",
      city: "Tampa",
      state: "FL",
      zip: "33614",
      timezone: "America/New_York",
      plan: "PRO",
      planStatus: "ACTIVE",
      createdAt: daysAgo(120),
      updatedAt: now(),
    },
  });
  console.log("✅ Organization:", org.name);

  // ── Owner user ────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { id: "user-owner-demo" },
    update: {},
    create: {
      id: "user-owner-demo",
      organizationId: orgId,
      clerkUserId: "user_demo_owner_placeholder",
      email: "owner@comfortprohvac.com",
      firstName: "Alex",
      lastName: "Chen",
      role: "OWNER",
      createdAt: daysAgo(120),
      updatedAt: now(),
    },
  }).catch(() => null); // ignore unique constraint if already exists

  // ── Technicians ───────────────────────────────────────────────
  const techs = await Promise.all([
    prisma.technician.upsert({
      where: { id: "tech-1-carlos" },
      update: {},
      create: {
        id: "tech-1-carlos",
        organizationId: orgId,
        firstName: "Carlos",
        lastName: "Mendez",
        phone: "8135550201",
        email: "carlos@comfortprohvac.com",
        type: "EMPLOYEE",
        skillsJson: JSON.stringify(["HVAC", "Refrigeration", "Heat Pump"]),
        status: "ACTIVE",
        createdAt: daysAgo(90),
        updatedAt: now(),
      },
    }),
    prisma.technician.upsert({
      where: { id: "tech-2-mike" },
      update: {},
      create: {
        id: "tech-2-mike",
        organizationId: orgId,
        firstName: "Mike",
        lastName: "Thompson",
        phone: "8135550202",
        email: "mike@comfortprohvac.com",
        type: "EMPLOYEE",
        skillsJson: JSON.stringify(["HVAC", "Electrical", "Controls"]),
        status: "ACTIVE",
        createdAt: daysAgo(80),
        updatedAt: now(),
      },
    }),
    prisma.technician.upsert({
      where: { id: "tech-3-jose" },
      update: {},
      create: {
        id: "tech-3-jose",
        organizationId: orgId,
        firstName: "Jose",
        lastName: "Rivera",
        phone: "8135550203",
        email: "jose@comfortprohvac.com",
        type: "SUBCONTRACTOR",
        skillsJson: JSON.stringify(["HVAC", "Ductwork", "Installation"]),
        status: "ACTIVE",
        createdAt: daysAgo(60),
        updatedAt: now(),
      },
    }),
  ]);
  console.log(`✅ Technicians: ${techs.length} created`);

  // ── Customers ─────────────────────────────────────────────────
  const customerData = [
    { id: "cust-01", first: "Jennifer", last: "Martinez", phone: "8135550301", type: "RESIDENTIAL", address: "1234 Bayshore Blvd", city: "Tampa", equipment: ["Carrier 3-ton heat pump", "Air handler 2019"] },
    { id: "cust-02", first: "Robert", last: "Johnson", phone: "8135550302", type: "RESIDENTIAL", address: "5678 Kennedy Blvd", city: "Tampa", equipment: ["Trane 4-ton AC", "Gas furnace 2020"] },
    { id: "cust-03", first: "Maria", last: "Garcia", phone: "8135550303", type: "RESIDENTIAL", address: "910 Davis Islands Dr", city: "Tampa", equipment: ["Lennox 2.5-ton split", "Air handler 2021"] },
    { id: "cust-04", first: "David", last: "Williams", phone: "8135550304", type: "COMMERCIAL", address: "2345 E Busch Blvd", city: "Tampa", equipment: ["Rooftop unit 10-ton", "VAV system"] },
    { id: "cust-05", first: "Patricia", last: "Brown", phone: "8135550305", type: "RESIDENTIAL", address: "3456 W Gandy Blvd", city: "Tampa", equipment: ["Goodman 3-ton heat pump"] },
    { id: "cust-06", first: "Michael", last: "Davis", phone: "8135550306", type: "RESIDENTIAL", address: "7890 N Florida Ave", city: "Tampa", equipment: ["Rheem 3.5-ton AC 2018"] },
    { id: "cust-07", first: "Linda", last: "Rodriguez", phone: "8135550307", type: "COMMERCIAL", address: "1122 Westshore Plaza", city: "Tampa", equipment: ["4 RTUs - 5 ton each", "BAS system"] },
    { id: "cust-08", first: "James", last: "Anderson", phone: "8135550308", type: "RESIDENTIAL", address: "5544 E Hillsborough Ave", city: "Tampa", equipment: ["Carrier 2-ton mini-split"] },
    { id: "cust-09", first: "Barbara", last: "Wilson", phone: "8135550309", type: "RESIDENTIAL", address: "8877 Memorial Hwy", city: "Tampa", equipment: ["Trane 5-ton AC 2022", "Heat strip 10kw"] },
    { id: "cust-10", first: "Richard", last: "Moore", phone: "8135550310", type: "RESIDENTIAL", address: "2233 W Platt St", city: "Tampa", equipment: ["York 3-ton heat pump 2019"] },
    { id: "cust-11", first: "Susan", last: "Taylor", phone: "8135550311", type: "RESIDENTIAL", address: "4455 S MacDill Ave", city: "Tampa", equipment: ["Lennox 3-ton AC 2020"] },
    { id: "cust-12", first: "Charles", last: "Thomas", phone: "8135550312", type: "COMMERCIAL", address: "6677 N 56th St", city: "Tampa", equipment: ["Chiller 40-ton", "AHU 3 units"] },
    { id: "cust-13", first: "Margaret", last: "Jackson", phone: "8135550313", type: "RESIDENTIAL", address: "9988 Linebaugh Ave", city: "Tampa", equipment: ["Carrier 3.5-ton 2021"] },
    { id: "cust-14", first: "Daniel", last: "White", phone: "8135550314", type: "RESIDENTIAL", address: "1357 W Waters Ave", city: "Tampa", equipment: ["Goodman 2-ton mini-split"] },
    { id: "cust-15", first: "Karen", last: "Harris", phone: "8135550315", type: "RESIDENTIAL", address: "2468 E Columbus Dr", city: "Tampa", equipment: ["Trane 4-ton heat pump 2023"] },
    { id: "cust-16", first: "Thomas", last: "Clark", phone: "8135550316", type: "RESIDENTIAL", address: "3579 N Armenia Ave", city: "Tampa", equipment: ["Carrier 2.5-ton AC 2020"] },
    { id: "cust-17", first: "Nancy", last: "Lewis", phone: "8135550317", type: "RESIDENTIAL", address: "4680 W Hillsborough Ave", city: "Tampa", equipment: ["Rheem 3-ton heat pump"] },
    { id: "cust-18", first: "Steven", last: "Walker", phone: "8135550318", type: "COMMERCIAL", address: "5791 N Nebraska Ave", city: "Tampa", equipment: ["5-ton RTU", "Mini-split 18k"] },
    { id: "cust-19", first: "Betty", last: "Hall", phone: "8135550319", type: "RESIDENTIAL", address: "6802 S Dale Mabry Hwy", city: "Tampa", equipment: ["Lennox 4-ton 2021"] },
    { id: "cust-20", first: "Joseph", last: "Allen", phone: "8135550320", type: "RESIDENTIAL", address: "7913 N Habana Ave", city: "Tampa", equipment: ["Goodman 3.5-ton 2022"] },
  ];

  const customers = await Promise.all(
    customerData.map((c) =>
      prisma.customer.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          organizationId: orgId,
          firstName: c.first,
          lastName: c.last,
          phone: c.phone,
          email: `${c.last.toLowerCase()}${c.id.split("-")[1]}@example.com`,
          address: c.address,
          city: c.city,
          state: "FL",
          zip: "33601",
          type: c.type,
          equipmentJson: JSON.stringify(c.equipment),
          source: "PHONE",
          createdAt: daysAgo(Math.floor(Math.random() * 90) + 10),
          updatedAt: now(),
        },
      })
    )
  );
  console.log(`✅ Customers: ${customers.length} created`);

  // ── Jobs (spread over 90 days for chart data) ─────────────────
  const jobItems = [
    // Recent completed jobs with good revenue for charts
    { desc: "AC not cooling - refrigerant leak repair", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-01", techId: "tech-1-carlos", totalCents: 45000, daysAgoN: 2, lineItems: [{ name: "Refrigerant R-410A 3lbs", qty: 3, unitCents: 8000 }, { name: "Labor - leak repair 2hrs", qty: 2, unitCents: 10500 }] },
    { desc: "Annual HVAC tune-up + filter replacement", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-02", techId: "tech-2-mike", totalCents: 12900, daysAgoN: 3, lineItems: [{ name: "Annual maintenance", qty: 1, unitCents: 8900 }, { name: "16x20x1 filters 2-pack", qty: 1, unitCents: 4000 }] },
    { desc: "Emergency no AC - capacitor blown", category: "HVAC", priority: "EMERGENCY", status: "COMPLETED", custId: "cust-16", techId: "tech-1-carlos", totalCents: 22500, daysAgoN: 4, lineItems: [{ name: "Run capacitor 45+5 MFD", qty: 1, unitCents: 8500 }, { name: "Emergency service call", qty: 1, unitCents: 14000 }] },
    { desc: "Thermostat replacement - Nest smart install", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-08", techId: "tech-1-carlos", totalCents: 28500, daysAgoN: 5, lineItems: [{ name: "Nest Learning Thermostat 4th gen", qty: 1, unitCents: 17900 }, { name: "Installation 1hr", qty: 1, unitCents: 10600 }] },
    { desc: "Commercial RTU PM - 4 units", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-07", techId: "tech-2-mike", totalCents: 189600, daysAgoN: 6, lineItems: [{ name: "Commercial PM per RTU", qty: 4, unitCents: 47400 }] },
    { desc: "AC system diagnostic - no cool", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-03", techId: "tech-1-carlos", totalCents: 18500, daysAgoN: 7, lineItems: [{ name: "Diagnostic service call", qty: 1, unitCents: 9500 }, { name: "Capacitor replacement", qty: 1, unitCents: 9000 }] },
    { desc: "Ductwork sealing and insulation", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-09", techId: "tech-3-jose", totalCents: 55000, daysAgoN: 9, lineItems: [{ name: "Duct sealing (mastic) 5 zones", qty: 5, unitCents: 7500 }, { name: "Insulation wrap 50ft", qty: 1, unitCents: 17500 }] },
    { desc: "Heat pump not heating - defrost board", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-05", techId: "tech-1-carlos", totalCents: 67500, daysAgoN: 11, lineItems: [{ name: "Defrost control board Carrier", qty: 1, unitCents: 42000 }, { name: "Labor 2hrs", qty: 2, unitCents: 12750 }] },
    { desc: "New 3-ton Trane system installation", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-06", techId: "tech-3-jose", totalCents: 425000, daysAgoN: 13, lineItems: [{ name: "Trane XR15 3-ton heat pump", qty: 1, unitCents: 285000 }, { name: "Air handler TEM4A", qty: 1, unitCents: 95000 }, { name: "Installation labor 8hrs", qty: 8, unitCents: 5625 }] },
    { desc: "Fan motor replacement - condenser unit down", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-17", techId: "tech-2-mike", totalCents: 38500, daysAgoN: 15, lineItems: [{ name: "OEM condenser fan motor", qty: 1, unitCents: 22000 }, { name: "Labor 2hrs", qty: 2, unitCents: 8250 }] },
    { desc: "Mini-split install master bedroom", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-19", techId: "tech-3-jose", totalCents: 185000, daysAgoN: 17, lineItems: [{ name: "Mitsubishi 18k BTU mini-split", qty: 1, unitCents: 145000 }, { name: "Installation 4hrs", qty: 4, unitCents: 10000 }] },
    { desc: "Chiller PM - 40 ton commercial", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-12", techId: "tech-2-mike", totalCents: 350000, daysAgoN: 20, lineItems: [{ name: "Chiller full service PM", qty: 1, unitCents: 280000 }, { name: "Water treatment chemicals", qty: 1, unitCents: 70000 }] },
    { desc: "Air quality assessment + UV light install", category: "HVAC", priority: "LOW", status: "COMPLETED", custId: "cust-20", techId: "tech-1-carlos", totalCents: 32000, daysAgoN: 22, lineItems: [{ name: "UV germicidal light system", qty: 1, unitCents: 22000 }, { name: "Air quality assessment", qty: 1, unitCents: 10000 }] },
    { desc: "Blower motor replacement + coil cleaning", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-10", techId: "tech-2-mike", totalCents: 52000, daysAgoN: 24, lineItems: [{ name: "ECM blower motor", qty: 1, unitCents: 32000 }, { name: "Evaporator coil cleaning", qty: 1, unitCents: 20000 }] },
    { desc: "Annual maintenance - 5 unit commercial building", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-04", techId: "tech-1-carlos", totalCents: 95000, daysAgoN: 27, lineItems: [{ name: "Commercial PM - 5 systems", qty: 5, unitCents: 19000 }] },
    // Older completed jobs (30-90 days ago for chart trailing)
    { desc: "Emergency AC repair - no cool 90°F day", category: "HVAC", priority: "EMERGENCY", status: "COMPLETED", custId: "cust-11", techId: "tech-1-carlos", totalCents: 28000, daysAgoN: 30, lineItems: [{ name: "Emergency call fee", qty: 1, unitCents: 14000 }, { name: "Capacitor + contactor", qty: 1, unitCents: 14000 }] },
    { desc: "Refrigerant recharge R-410A 5lbs", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-13", techId: "tech-2-mike", totalCents: 42000, daysAgoN: 33, lineItems: [{ name: "R-410A refrigerant 5lbs", qty: 5, unitCents: 8400 }] },
    { desc: "Condenser coil replacement - corroded", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-14", techId: "tech-3-jose", totalCents: 165000, daysAgoN: 37, lineItems: [{ name: "OEM condenser coil", qty: 1, unitCents: 125000 }, { name: "Labor 4hrs", qty: 4, unitCents: 10000 }] },
    { desc: "New 4-ton system - full replacement", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-15", techId: "tech-3-jose", totalCents: 485000, daysAgoN: 42, lineItems: [{ name: "Carrier 4-ton Infinity system", qty: 1, unitCents: 365000 }, { name: "Installation labor 10hrs", qty: 10, unitCents: 12000 }] },
    { desc: "Heat pump tune-up + coil cleaning", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-16", techId: "tech-1-carlos", totalCents: 15500, daysAgoN: 45, lineItems: [{ name: "Heat pump tune-up", qty: 1, unitCents: 9500 }, { name: "Coil cleaning", qty: 1, unitCents: 6000 }] },
    // Current / upcoming jobs
    { desc: "AC not turning on - electrical fault", category: "HVAC", priority: "HIGH", status: "IN_PROGRESS", custId: "cust-10", techId: "tech-2-mike", totalCents: 0, daysAgoN: 0, lineItems: [] },
    { desc: "Annual maintenance contract service", category: "HVAC", priority: "NORMAL", status: "SCHEDULED", custId: "cust-11", techId: "tech-1-carlos", totalCents: 12900, daysAgoN: -2, lineItems: [{ name: "Annual maintenance", qty: 1, unitCents: 12900 }] },
    { desc: "New system estimate and quote walkthrough", category: "HVAC", priority: "NORMAL", status: "SCHEDULED", custId: "cust-13", techId: "tech-3-jose", totalCents: 0, daysAgoN: -3, lineItems: [] },
    { desc: "Emergency - no AC 95°F, elderly resident", category: "HVAC", priority: "EMERGENCY", status: "NEW", custId: "cust-14", techId: null, totalCents: 0, daysAgoN: 0, lineItems: [] },
    { desc: "Refrigerant leak check and recharge", category: "HVAC", priority: "NORMAL", status: "NEW", custId: "cust-15", techId: null, totalCents: 0, daysAgoN: 0, lineItems: [] },
    { desc: "Mini-split not cooling - second bedroom", category: "HVAC", priority: "NORMAL", status: "INVOICED", custId: "cust-18", techId: "tech-2-mike", totalCents: 18500, daysAgoN: 3, lineItems: [{ name: "Diagnostic + service", qty: 1, unitCents: 9500 }, { name: "Refrigerant top-off", qty: 1, unitCents: 9000 }] },
  ];

  const jobs = [];
  let jobNum = 1001;
  for (const j of jobItems) {
    const jobId = randomUUID();
    const completedAt = ["COMPLETED", "INVOICED", "PAID"].includes(j.status) ? daysAgo(Math.max(0, j.daysAgoN - 1)) : null;
    const scheduledAt = j.daysAgoN <= 0 ? daysFromNow(Math.abs(j.daysAgoN)) : daysAgo(j.daysAgoN);

    // Compute line item totals
    const lineItems = j.lineItems.map((li) => ({
      ...li,
      totalCents: li.qty * li.unitCents,
    }));
    const totalCents = lineItems.length > 0
      ? lineItems.reduce((s, li) => s + li.totalCents, 0)
      : j.totalCents;

    const job = await prisma.job.upsert({
      where: { id: jobId },
      update: {},
      create: {
        id: jobId,
        organizationId: orgId,
        jobNumber: `JOB-${jobNum++}`,
        customerId: j.custId,
        technicianId: j.techId ?? null,
        status: j.status,
        category: j.category,
        priority: j.priority,
        title: j.desc,
        description: `${j.desc}. Customer called requesting service. Technician dispatched.`,
        scheduledAt,
        scheduledWindow: "MORNING",
        completedAt,
        lineItemsJson: JSON.stringify(lineItems),
        totalCents,
        createdAt: daysAgo(j.daysAgoN + 1),
        updatedAt: now(),
      },
    });
    jobs.push(job);
  }
  console.log(`✅ Jobs: ${jobs.length} created`);

  // ── Calls with transcripts ─────────────────────────────────────
  const callData = [
    { id: "call-01", custId: "cust-01", fromPhone: "8135550301", intent: "HVAC_REPAIR", sentiment: "URGENT", transcript: "Hi, my air conditioner stopped working this morning. It's 85 degrees in my house and I have two kids. Can someone come today? It's the unit in my master bedroom.", confidence: 0.95, daysAgoN: 2, status: "COMPLETED" },
    { id: "call-02", custId: "cust-16", fromPhone: "8135550316", intent: "EMERGENCY", sentiment: "DISTRESSED", transcript: "I need emergency help! My AC is completely out and it's 95 degrees outside. I'm worried about my elderly mother who lives with me. Please come as soon as possible, I'll pay extra.", confidence: 0.98, daysAgoN: 4, status: "COMPLETED" },
    { id: "call-03", custId: "cust-02", fromPhone: "8135550302", intent: "MAINTENANCE", sentiment: "NEUTRAL", transcript: "Hello, I'd like to schedule my annual AC tune-up before the summer heat really kicks in. I usually do it around this time of year. Do you have any openings next week?", confidence: 0.92, daysAgoN: 5, status: "COMPLETED" },
    { id: "call-04", custId: "cust-07", fromPhone: "8135550307", intent: "COMMERCIAL", sentiment: "PROFESSIONAL", transcript: "This is Linda Rodriguez from Westshore Plaza. We need preventive maintenance on our four rooftop units. They're all Carrier units, about 5 tons each. When's the earliest you can schedule this?", confidence: 0.97, daysAgoN: 7, status: "COMPLETED" },
    { id: "call-05", custId: "cust-19", fromPhone: "8135550319", intent: "INSTALLATION", sentiment: "POSITIVE", transcript: "I'm interested in getting a ductless mini-split installed in my master bedroom. I've been thinking about it for a while and I'm finally ready. Can you give me a quote?", confidence: 0.90, daysAgoN: 18, status: "COMPLETED" },
    { id: "call-06", custId: "cust-09", fromPhone: "8135550309", intent: "HVAC_REPAIR", sentiment: "FRUSTRATED", transcript: "My AC is running but it's not cooling properly. It's been getting worse all week. The technician who came last year said the ductwork needed attention. I think there's a leak somewhere.", confidence: 0.88, daysAgoN: 10, status: "COMPLETED" },
    { id: "call-07", custId: null, fromPhone: "8135550401", intent: "QUOTE", sentiment: "INTERESTED", transcript: "Hi, I'm calling to get a quote for a new air conditioning system. My current unit is from 2009 and it's been struggling. My house is about 2,000 square feet. What would a new system cost?", confidence: 0.85, daysAgoN: 1, status: "COMPLETED" },
    { id: "call-08", custId: "cust-14", fromPhone: "8135550314", intent: "EMERGENCY", sentiment: "PANICKED", transcript: "It's an absolute emergency. My AC just died and it's 95 degrees in my house right now. I have a newborn baby. Please, I need someone here within the hour. Money is not an issue, just please come.", confidence: 0.99, daysAgoN: 0, status: "COMPLETED" },
    { id: "call-09", custId: "cust-12", fromPhone: "8135550312", intent: "COMMERCIAL", sentiment: "PROFESSIONAL", transcript: "Charles Thomas from the commercial building on 56th Street. We need to schedule our chiller service and I also want to talk about a preventive maintenance contract for all three of our AHUs. Can we set up a meeting?", confidence: 0.94, daysAgoN: 21, status: "COMPLETED" },
    { id: "call-10", custId: "cust-05", fromPhone: "8135550305", intent: "HVAC_REPAIR", sentiment: "CONCERNED", transcript: "My heat pump isn't working right. It's blowing air but it's not warming up the house. This is the second winter it's had trouble. Last time you said the defrost board might need replacement eventually.", confidence: 0.91, daysAgoN: 12, status: "COMPLETED" },
  ];

  let callsCreated = 0;
  for (const c of callData) {
    await prisma.call.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        organizationId: orgId,
        customerId: c.custId,
        twilioCallSid: `CA${randomUUID().replace(/-/g, "").substring(0, 32)}`,
        fromPhone: c.fromPhone,
        toPhone: "8135550100",
        status: c.status,
        duration: Math.floor(Math.random() * 180) + 60,
        transcript: c.transcript,
        aiAnalysisJson: JSON.stringify({
          intent: c.intent,
          sentiment: c.sentiment,
          confidence: c.confidence,
          summary: `Customer called about ${c.intent.replace(/_/g, " ").toLowerCase()}. Confidence: ${Math.round(c.confidence * 100)}%. Job created and tech dispatched.`,
        }),
        createdAt: daysAgo(c.daysAgoN),
        updatedAt: now(),
      },
    });
    callsCreated++;
  }
  console.log(`✅ Calls: ${callsCreated} created`);

  // ── Quotes ────────────────────────────────────────────────────
  const quoteData = [
    { id: "quote-01", custId: "cust-13", status: "DRAFT", title: "New 3-ton Heat Pump System", lineItems: [{ name: "Carrier 3-ton heat pump", qty: 1, unitCents: 265000, totalCents: 265000 }, { name: "Air handler + installation", qty: 1, unitCents: 120000, totalCents: 120000 }] },
    { id: "quote-02", custId: "cust-04", status: "SENT", title: "Commercial HVAC Maintenance Contract", lineItems: [{ name: "Annual maintenance contract 4 RTUs", qty: 4, unitCents: 210000, totalCents: 840000 }] },
    { id: "quote-03", custId: "cust-09", status: "ACCEPTED", title: "Ductwork Replacement and Insulation", lineItems: [{ name: "Flex duct replacement 200ft", qty: 1, unitCents: 280000, totalCents: 280000 }, { name: "R-8 insulation", qty: 1, unitCents: 95000, totalCents: 95000 }, { name: "Labor 12hrs", qty: 1, unitCents: 45000, totalCents: 45000 }] },
    { id: "quote-04", custId: "cust-12", status: "ACCEPTED", title: "Annual Chiller Service Agreement", lineItems: [{ name: "Annual chiller service contract", qty: 1, unitCents: 1250000, totalCents: 1250000 }] },
    { id: "quote-05", custId: "cust-06", status: "DECLINED", title: "4-ton Upgrade Option", lineItems: [{ name: "Trane 4-ton XR17 system", qty: 1, unitCents: 520000, totalCents: 520000 }] },
    { id: "quote-06", custId: "cust-19", status: "ACCEPTED", title: "Mitsubishi Mini-Split System", lineItems: [{ name: "Mitsubishi 18k BTU ductless", qty: 1, unitCents: 145000, totalCents: 145000 }, { name: "Installation + startup", qty: 1, unitCents: 40000, totalCents: 40000 }] },
  ];

  await Promise.all(
    quoteData.map((q) => {
      const subtotal = q.lineItems.reduce((s, li) => s + li.totalCents, 0);
      const taxCents = Math.round(subtotal * 0.07);
      return prisma.quote.upsert({
        where: { id: q.id },
        update: {},
        create: {
          id: q.id,
          organizationId: orgId,
          quoteNumber: `QUO-${q.id.split("-")[1]}`,
          customerId: q.custId,
          status: q.status,
          publicToken: randomUUID(),
          title: q.title,
          lineItemsJson: JSON.stringify(q.lineItems),
          subtotalCents: subtotal,
          taxRateBps: 700,
          taxCents,
          totalCents: subtotal + taxCents,
          validUntil: daysFromNow(30),
          sentAt: q.status !== "DRAFT" ? daysAgo(5) : null,
          acceptedAt: q.status === "ACCEPTED" ? daysAgo(3) : null,
          createdAt: daysAgo(7),
          updatedAt: now(),
        },
      });
    })
  );
  console.log(`✅ Quotes: ${quoteData.length} created`);

  // ── Invoices ──────────────────────────────────────────────────
  const invoiceData = [
    { id: "inv-01", custId: "cust-01", status: "PAID", totalCents: 45000, paidAgo: 1, sentAgo: 2 },
    { id: "inv-02", custId: "cust-02", status: "PAID", totalCents: 12900, paidAgo: 2, sentAgo: 3 },
    { id: "inv-03", custId: "cust-16", status: "PAID", totalCents: 22500, paidAgo: 3, sentAgo: 4 },
    { id: "inv-04", custId: "cust-08", status: "PAID", totalCents: 28500, paidAgo: 4, sentAgo: 5 },
    { id: "inv-05", custId: "cust-07", status: "PAID", totalCents: 189600, paidAgo: 5, sentAgo: 6 },
    { id: "inv-06", custId: "cust-03", status: "PAID", totalCents: 18500, paidAgo: 6, sentAgo: 7 },
    { id: "inv-07", custId: "cust-09", status: "PAID", totalCents: 55000, paidAgo: 8, sentAgo: 9 },
    { id: "inv-08", custId: "cust-05", status: "PAID", totalCents: 67500, paidAgo: 10, sentAgo: 11 },
    { id: "inv-09", custId: "cust-06", status: "PAID", totalCents: 425000, paidAgo: 12, sentAgo: 13 },
    { id: "inv-10", custId: "cust-17", status: "PAID", totalCents: 38500, paidAgo: 14, sentAgo: 15 },
    { id: "inv-11", custId: "cust-19", status: "PAID", totalCents: 185000, paidAgo: 16, sentAgo: 17 },
    { id: "inv-12", custId: "cust-12", status: "PAID", totalCents: 350000, paidAgo: 19, sentAgo: 20 },
    { id: "inv-13", custId: "cust-04", status: "PAID", totalCents: 95000, paidAgo: 26, sentAgo: 27 },
    { id: "inv-14", custId: "cust-10", status: "PAID", totalCents: 52000, paidAgo: 23, sentAgo: 24 },
    { id: "inv-15", custId: "cust-20", status: "PAID", totalCents: 32000, paidAgo: 21, sentAgo: 22 },
    { id: "inv-16", custId: "cust-11", status: "PAID", totalCents: 28000, paidAgo: 29, sentAgo: 30 },
    { id: "inv-17", custId: "cust-13", status: "PAID", totalCents: 42000, paidAgo: 32, sentAgo: 33 },
    { id: "inv-18", custId: "cust-14", status: "PAID", totalCents: 165000, paidAgo: 36, sentAgo: 37 },
    { id: "inv-19", custId: "cust-15", status: "PAID", totalCents: 485000, paidAgo: 41, sentAgo: 42 },
    { id: "inv-20", custId: "cust-16", status: "PAID", totalCents: 15500, paidAgo: 44, sentAgo: 45 },
    { id: "inv-21", custId: "cust-18", status: "SENT", totalCents: 18500, paidAgo: null, sentAgo: 2 },
    { id: "inv-22", custId: "cust-07", status: "SENT", totalCents: 189600, paidAgo: null, sentAgo: 4 },
    { id: "inv-23", custId: "cust-09", status: "OVERDUE", totalCents: 55000, paidAgo: null, sentAgo: 25 },
  ];

  await Promise.all(
    invoiceData.map((inv, i) =>
      prisma.invoice.upsert({
        where: { id: inv.id },
        update: {},
        create: {
          id: inv.id,
          organizationId: orgId,
          invoiceNumber: `INV-${2001 + i}`,
          customerId: inv.custId,
          status: inv.status,
          publicToken: randomUUID(),
          lineItemsJson: JSON.stringify([{ name: "Services rendered", qty: 1, unitCents: inv.totalCents, totalCents: inv.totalCents }]),
          subtotalCents: inv.totalCents,
          taxRateBps: 0,
          taxCents: 0,
          totalCents: inv.totalCents,
          amountPaidCents: inv.status === "PAID" ? inv.totalCents : 0,
          dueDate: inv.status === "OVERDUE" ? daysAgo(20) : daysFromNow(30),
          sentAt: daysAgo(inv.sentAgo),
          paidAt: inv.paidAgo !== null ? daysAgo(inv.paidAgo) : null,
          createdAt: daysAgo(inv.sentAgo + 1),
          updatedAt: now(),
        },
      })
    )
  );
  console.log(`✅ Invoices: ${invoiceData.length} created`);

  // ── Audit log entries ─────────────────────────────────────────
  const auditEntries = [
    { action: "job.create", entityType: "Job", daysAgo: 0 },
    { action: "job.create", entityType: "Job", daysAgo: 0 },
    { action: "invoice.send", entityType: "Invoice", daysAgo: 1 },
    { action: "job.status_change", entityType: "Job", daysAgo: 1 },
    { action: "invoice.mark_paid", entityType: "Invoice", daysAgo: 2 },
    { action: "quote.send", entityType: "Quote", daysAgo: 3 },
    { action: "customer.create", entityType: "Customer", daysAgo: 3 },
    { action: "job.status_change", entityType: "Job", daysAgo: 4 },
    { action: "invoice.mark_paid", entityType: "Invoice", daysAgo: 5 },
    { action: "job.create", entityType: "Job", daysAgo: 6 },
  ];

  await Promise.all(
    auditEntries.map((entry) =>
      prisma.auditLog.create({
        data: {
          id: randomUUID(),
          organizationId: orgId,
          userId: "user-owner-demo",
          action: entry.action,
          entityType: entry.entityType,
          entityId: randomUUID(),
          changesJson: null,
          createdAt: daysAgo(entry.daysAgo),
        },
      })
    )
  );
  console.log("✅ Audit log: 10 entries created");

  console.log("\n🎉 Seed complete!");
  console.log("   Organization: Comfort Pro HVAC");
  console.log(`   Technicians: ${techs.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Jobs: ${jobs.length}`);
  console.log(`   Calls: ${callsCreated}`);
  console.log(`   Quotes: ${quoteData.length}`);
  console.log(`   Invoices: ${invoiceData.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
