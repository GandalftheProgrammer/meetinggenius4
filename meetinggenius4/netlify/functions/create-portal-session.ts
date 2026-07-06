
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  const { uid } = await req.json();

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

  const store = getStore({ name: "user-profiles", consistency: "strong" });
  const profile = await store.get(uid, { type: "json" }) as any;

  if (!profile?.stripeCustomerId) {
    return new Response(JSON.stringify({ error: "No Stripe subscription found for this account" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = new URLSearchParams({
    customer: profile.stripeCustomerId,
    return_url: `${req.headers.get('origin')}/`
  });

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  const session = await res.json();
  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" }
  });
};
