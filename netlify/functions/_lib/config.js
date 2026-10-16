// Owner decisions (spec Section 0) read from environment variables.
// Blank values are PLACEHOLDERS: the app shows "[not set]" and refuses to take payment,
// rather than inventing a number.
const int = (name) => {
  const v = process.env[name];
  if (v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

export function ownerConfig() {
  return {
    priceCents: int('PRICE_CENTS'),
    accessDays: int('ACCESS_DAYS'),
    refundDays: int('REFUND_DAYS'),
    // Shown after the account-level descriptor on card statements. Keep it neutral (max 22 chars total).
    statementSuffix: (process.env.STRIPE_STATEMENT_DESCRIPTOR || '').trim().slice(0, 22) || null,
    supportEmail: process.env.SUPPORT_EMAIL || 'ettrickc@gmail.com',
    currency: 'usd',
  };
}

// What still has to be decided before payment can be taken.
export function missingForCheckout(c = ownerConfig()) {
  const missing = [];
  if (!c.priceCents) missing.push('PRICE_CENTS');
  if (c.accessDays === null || c.accessDays === 0) missing.push('ACCESS_DAYS');
  if (c.refundDays === null) missing.push('REFUND_DAYS');
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  return missing;
}

export const isLiveKey = () => String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_');
