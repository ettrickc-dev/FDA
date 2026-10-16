import Stripe from 'stripe';

let client;
export function stripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe key not configured');
    client = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 15000 });
  }
  return client;
}
// Tests only.
export function __setStripe(fake) { client = fake; }
