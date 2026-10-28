/** Stripe is hidden for now; set NEXT_PUBLIC_STRIPE_ENABLED=true at build time to bring it back. */
export const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
