/**
 * QuickBooks Online integration — queue-based, skips silently if unconfigured.
 * Tokens required: QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REFRESH_TOKEN, QBO_REALM_ID
 */

interface QboTokens {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  realmId: string;
}

interface QboInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  totalCents: number;
  lineItems: { description: string; quantity: number; unitPriceCents: number }[];
  dueDate?: string;
}

interface QboPayment {
  invoiceId: string;
  amountCents: number;
  paidAt: string;
}

export interface QboSyncResult {
  success: boolean;
  skipped: boolean;
  error?: string;
}

function getQboTokens(env: Record<string, string | undefined>): QboTokens | null {
  const { QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REFRESH_TOKEN, QBO_REALM_ID } = env;
  if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET || !QBO_REFRESH_TOKEN || !QBO_REALM_ID) {
    return null;
  }
  return {
    clientId: QBO_CLIENT_ID,
    clientSecret: QBO_CLIENT_SECRET,
    refreshToken: QBO_REFRESH_TOKEN,
    realmId: QBO_REALM_ID,
  };
}

async function refreshAccessToken(tokens: QboTokens): Promise<string | null> {
  try {
    const credentials = Buffer.from(`${tokens.clientId}:${tokens.clientSecret}`).toString(
      "base64"
    );
    const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Push an invoice to QuickBooks Online.
 * Silently skips if QBO is not configured or tokens are unavailable.
 */
export async function pushInvoice(
  invoice: QboInvoice,
  env: Record<string, string | undefined>
): Promise<QboSyncResult> {
  const tokens = getQboTokens(env);
  if (!tokens) {
    return { success: false, skipped: true };
  }

  const accessToken = await refreshAccessToken(tokens);
  if (!accessToken) {
    return { success: false, skipped: false, error: "Failed to refresh QBO access token" };
  }

  try {
    const lineItems = invoice.lineItems.map((item, i) => ({
      LineNum: i + 1,
      Description: item.description,
      Amount: (item.quantity * item.unitPriceCents) / 100,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        Qty: item.quantity,
        UnitPrice: item.unitPriceCents / 100,
      },
    }));

    const body = {
      DocNumber: invoice.invoiceNumber,
      CustomerRef: { name: invoice.customerName },
      Line: lineItems,
      ...(invoice.dueDate && { DueDate: invoice.dueDate }),
    };

    const res = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokens.realmId}/invoice`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return { success: false, skipped: false, error: `QBO API error: ${res.status} ${text}` };
    }

    return { success: true, skipped: false };
  } catch (err) {
    return {
      success: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Unknown QBO error",
    };
  }
}

/**
 * Push a payment to QuickBooks Online.
 * Silently skips if QBO is not configured.
 */
export async function pushPayment(
  payment: QboPayment,
  env: Record<string, string | undefined>
): Promise<QboSyncResult> {
  const tokens = getQboTokens(env);
  if (!tokens) {
    return { success: false, skipped: true };
  }

  const accessToken = await refreshAccessToken(tokens);
  if (!accessToken) {
    return { success: false, skipped: false, error: "Failed to refresh QBO access token" };
  }

  try {
    const body = {
      TotalAmt: payment.amountCents / 100,
      CustomerRef: { name: "Customer" },
      Line: [
        {
          Amount: payment.amountCents / 100,
          LinkedTxn: [{ TxnId: payment.invoiceId, TxnType: "Invoice" }],
        },
      ],
    };

    const res = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokens.realmId}/payment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return { success: false, skipped: false, error: `QBO API error: ${res.status} ${text}` };
    }

    return { success: true, skipped: false };
  } catch (err) {
    return {
      success: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Unknown QBO error",
    };
  }
}
