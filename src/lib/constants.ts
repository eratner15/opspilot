import {
  LayoutDashboard,
  Briefcase,
  Users,
  HardHat,
  FileText,
  Receipt,
  Phone,
  BarChart3,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Technicians",
    href: "/technicians",
    icon: HardHat,
  },
  {
    title: "Quotes",
    href: "/quotes",
    icon: FileText,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
  },
  {
    title: "Calls",
    href: "/calls",
    icon: Phone,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const JOB_STATUSES = [
  "NEW",
  "SCHEDULED",
  "EN_ROUTE",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
  "PAID",
  "CANCELLED",
  "ON_HOLD",
] as const;

export const JOB_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  SCHEDULED: "Scheduled",
  EN_ROUTE: "En Route",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold",
};

export const JOB_PRIORITIES = ["LOW", "NORMAL", "HIGH", "EMERGENCY"] as const;

export const JOB_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  EMERGENCY: "Emergency",
};

export const JOB_CATEGORIES = [
  "HVAC",
  "PLUMBING",
  "ELECTRICAL",
  "ROOFING",
  "OTHER",
] as const;

export const QUOTE_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
] as const;

export const INVOICE_STATUSES = [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;

export const CUSTOMER_TYPES = ["RESIDENTIAL", "COMMERCIAL"] as const;

export const TECH_STATUSES = ["ACTIVE", "INACTIVE", "ON_LEAVE"] as const;

export const PAGINATION_DEFAULTS = {
  pageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
};

export const DEMO_ORG_ID = "demo-org-comfort-pro-hvac";
