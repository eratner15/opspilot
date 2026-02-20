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
          email: `${c.last.toLowerCase()}@example.com`,
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

  // ── Jobs ──────────────────────────────────────────────────────
  const jobItems = [
    { desc: "AC not cooling - refrigerant leak", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-01", techId: "tech-1-carlos", totalCents: 45000, daysAgoN: 25, lineItems: [{ name: "Refrigerant R-410A 3lbs", qty: 3, unitCents: 8000, totalCents: 24000 }, { name: "Labor - Refrigerant leak repair", qty: 2, unitCents: 10500, totalCents: 21000 }] },
    { desc: "Annual HVAC tune-up and filter replacement", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-02", techId: "tech-2-mike", totalCents: 12900, daysAgoN: 20, lineItems: [{ name: "Annual maintenance visit", qty: 1, unitCents: 8900, totalCents: 8900 }, { name: "16x20x1 air filter (2-pack)", qty: 1, unitCents: 4000, totalCents: 4000 }] },
    { desc: "Heat pump not heating - defrost board issue", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-05", techId: "tech-1-carlos", totalCents: 67500, daysAgoN: 18, lineItems: [{ name: "Defrost control board Carrier", qty: 1, unitCents: 42000, totalCents: 42000 }, { name: "Labor - Board replacement 2hrs", qty: 2, unitCents: 12750, totalCents: 25500 }] },
    { desc: "New AC installation - 3 ton Trane", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-06", techId: "tech-3-jose", totalCents: 425000, daysAgoN: 15, lineItems: [{ name: "Trane 3-ton XR15 Heat Pump", qty: 1, unitCents: 285000, totalCents: 285000 }, { name: "Air handler TEM4A0C36S21MB", qty: 1, unitCents: 95000, totalCents: 95000 }, { name: "Installation labor 8hrs", qty: 8, unitCents: 5625, totalCents: 45000 }] },
    { desc: "Commercial RTU preventive maintenance - 4 units", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-07", techId: "tech-2-mike", totalCents: 189600, daysAgoN: 12, lineItems: [{ name: "Commercial PM per RTU", qty: 4, unitCents: 47400, totalCents: 189600 }] },
    { desc: "Thermostat replacement - smart Nest", category: "HVAC", priority: "LOW", status: "COMPLETED", custId: "cust-08", techId: "tech-1-carlos", totalCents: 28500, daysAgoN: 10, lineItems: [{ name: "Nest Learning Thermostat 4th gen", qty: 1, unitCents: 17900, totalCents: 17900 }, { name: "Installation and programming 1hr", qty: 1, unitCents: 10600, totalCents: 10600 }] },
    { desc: "AC system diagnostic - no cool", category: "HVAC", priority: "HIGH", status: "INVOICED", custId: "cust-03", techId: "tech-1-carlos", totalCents: 18500, daysAgoN: 7, lineItems: [{ name: "Diagnostic service call", qty: 1, unitCents: 9500, totalCents: 9500 }, { name: "Capacitor replacement", qty: 1, unitCents: 9000, totalCents: 9000 }] },
    { desc: "Ductwork sealing and insulation", category: "HVAC", priority: "NORMAL", status: "INVOICED", custId: "cust-09", techId: "tech-3-jose", totalCents: 55000, daysAgoN: 5, lineItems: [{ name: "Duct sealing (mastic) per zone", qty: 5, unitCents: 7500, totalCents: 37500 }, { name: "Insulation wrap 50ft", qty: 1, unitCents: 17500, totalCents: 17500 }] },
    { desc: "AC not turning on - electrical issue", category: "HVAC", priority: "HIGH", status: "IN_PROGRESS", custId: "cust-10", techId: "tech-2-mike", totalCents: 0, daysAgoN: 1, lineItems: [] },
    { desc: "Annual maintenance contract service", category: "HVAC", priority: "NORMAL", status: "SCHEDULED", custId: "cust-11", techId: "tech-1-carlos", totalCents: 12900, daysAgoN: -2, lineItems: [{ name: "Annual maintenance visit", qty: 1, unitCents: 12900, totalCents: 12900 }] },
    { desc: "New system install estimate and quote", category: "HVAC", priority: "NORMAL", status: "SCHEDULED", custId: "cust-13", techId: "tech-3-jose", totalCents: 0, daysAgoN: -3, lineItems: [] },
    { desc: "Emergency call - no AC 95° day", category: "HVAC", priority: "EMERGENCY", status: "NEW", custId: "cust-14", techId: null, totalCents: 0, daysAgoN: 0, lineItems: [] },
    { desc: "Refrigerant recharge and leak check", category: "HVAC", priority: "NORMAL", status: "NEW", custId: "cust-15", techId: null, totalCents: 0, daysAgoN: 0, lineItems: [] },
    { desc: "Chiller preventive maintenance - 40 ton", category: "HVAC", priority: "NORMAL", status: "COMPLETED", custId: "cust-12", techId: "tech-2-mike", totalCents: 350000, daysAgoN: 30, lineItems: [{ name: "Chiller PM - full service", qty: 1, unitCents: 280000, totalCents: 280000 }, { name: "Water treatment chemicals", qty: 1, unitCents: 70000, totalCents: 70000 }] },
    { desc: "Fan motor replacement - unit not running", category: "HVAC", priority: "HIGH", status: "COMPLETED", custId: "cust-04", techId: "tech-1-carlos", totalCents: 38500, daysAgoN: 35, lineItems: [{ name: "OEM condenser fan motor", qty: 1, unitCents: 22000, totalCents: 22000 }, { name: "Labor 2hrs", qty: 2, unitCents: 8250, totalCents: 16500 }] },
  ];

  const jobs = [];
  let jobNum = 1001;
  for (const j of jobItems) {
    const jobId = randomUUID();
    const completedAt = ["COMPLETED", "INVOICED", "PAID"].includes(j.status) ? daysAgo(j.daysAgoN - 1) : null;
    const scheduledAt = j.daysAgoN <= 0 ? daysFromNow(Math.abs(j.daysAgoN)) : daysAgo(j.daysAgoN);

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
        description: j.desc,
        scheduledAt,
        scheduledWindow: "MORNING",
        completedAt,
        lineItemsJson: JSON.stringify(j.lineItems),
        totalCents: j.totalCents,
        createdAt: daysAgo(j.daysAgoN + 1),
        updatedAt: now(),
      },
    });
    jobs.push(job);
  }
  console.log(`✅ Jobs: ${jobs.length} created`);

  // ── Quotes ────────────────────────────────────────────────────
  const quoteData = [
    { id: "quote-01", custId: "cust-13", status: "DRAFT", title: "New 3-ton Heat Pump System", totalCents: 385000, lineItems: [{ name: "Carrier 3-ton heat pump", qty: 1, unitCents: 265000, totalCents: 265000 }, { name: "Air handler installation", qty: 1, unitCents: 85000, totalCents: 85000 }, { name: "Labor and installation 8hrs", qty: 1, unitCents: 35000, totalCents: 35000 }] },
    { id: "quote-02", custId: "cust-04", status: "SENT", title: "Commercial HVAC Maintenance Contract", totalCents: 840000, lineItems: [{ name: "Annual maintenance contract 4 RTUs", qty: 4, unitCents: 210000, totalCents: 840000 }] },
    { id: "quote-03", custId: "cust-09", status: "ACCEPTED", title: "Ductwork Replacement and Insulation", totalCents: 420000, lineItems: [{ name: "Flex duct replacement 200ft", qty: 1, unitCents: 280000, totalCents: 280000 }, { name: "R-8 insulation wrap", qty: 1, unitCents: 95000, totalCents: 95000 }, { name: "Labor 12hrs", qty: 1, unitCents: 45000, totalCents: 45000 }] },
    { id: "quote-04", custId: "cust-12", status: "ACCEPTED", title: "Chiller Service Agreement", totalCents: 1250000, lineItems: [{ name: "Annual chiller service contract", qty: 1, unitCents: 1250000, totalCents: 1250000 }] },
    { id: "quote-05", custId: "cust-06", status: "DECLINED", title: "4-ton Upgrade Option", totalCents: 520000, lineItems: [{ name: "Trane 4-ton XR17 system", qty: 1, unitCents: 520000, totalCents: 520000 }] },
  ];

  await Promise.all(
    quoteData.map((q) =>
      prisma.quote.upsert({
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
          subtotalCents: q.totalCents,
          taxRateBps: 700, // 7% FL sales tax
          taxCents: Math.round(q.totalCents * 0.07),
          totalCents: q.totalCents + Math.round(q.totalCents * 0.07),
          validUntil: daysFromNow(30),
          sentAt: q.status !== "DRAFT" ? daysAgo(5) : null,
          acceptedAt: q.status === "ACCEPTED" ? daysAgo(3) : null,
          createdAt: daysAgo(7),
          updatedAt: now(),
        },
      })
    )
  );
  console.log(`✅ Quotes: ${quoteData.length} created`);

  // ── Invoices ──────────────────────────────────────────────────
  const invoiceData = [
    { id: "inv-01", custId: "cust-01", status: "PAID", totalCents: 45000, paidAgo: 22 },
    { id: "inv-02", custId: "cust-02", status: "PAID", totalCents: 12900, paidAgo: 17 },
    { id: "inv-03", custId: "cust-05", status: "PAID", totalCents: 67500, paidAgo: 15 },
    { id: "inv-04", custId: "cust-06", status: "PAID", totalCents: 425000, paidAgo: 10 },
    { id: "inv-05", custId: "cust-07", status: "SENT", totalCents: 189600, paidAgo: null },
    { id: "inv-06", custId: "cust-08", status: "PAID", totalCents: 28500, paidAgo: 7 },
    { id: "inv-07", custId: "cust-03", status: "SENT", totalCents: 18500, paidAgo: null },
    { id: "inv-08", custId: "cust-09", status: "OVERDUE", totalCents: 55000, paidAgo: null },
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
          sentAt: inv.status !== "DRAFT" ? daysAgo(10) : null,
          paidAt: inv.paidAgo !== null ? daysAgo(inv.paidAgo) : null,
          createdAt: daysAgo(12),
          updatedAt: now(),
        },
      })
    )
  );
  console.log(`✅ Invoices: ${invoiceData.length} created`);

  console.log("\n🎉 Seed complete!");
  console.log("   Organization: Comfort Pro HVAC");
  console.log(`   Technicians: ${techs.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Jobs: ${jobs.length}`);
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
