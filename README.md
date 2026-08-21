# Potato Hut Loyalty

Digital loyalty card for Potato Hut Watford. Customers collect **7 paid stamps**, then redeem the free meal (8th yellow potato is a permanent UI marker). Hosted on Cloudflare Workers via OpenNext.

## Stamp rules

| Action | Effect |
|--------|--------|
| Square payment `COMPLETED` with `reference_id` = customer id and amount ≥ threshold | +1 stamp (capped at 7), once per `payment.id` |
| Square refund for a previously stamped payment | −1 stamp (floor 0) |
| Staff `POST /api/redeem` when stamps = 7 | Reset to 0 |

- **DB `stamps`**: integer **0–7**
- **UI**: black potato stamps fill slots 1–7 from that count; the **yellow FREE potato is always visible** in slot 8
- **Threshold**: `LOYALTY_STAMP_THRESHOLD_CENTS` (default `500` = £5.00)

## Customer identity

- Card URL: `/?customerId=YOUR-ID` (QR currently encodes this same id)
- Square: put that id in the payment **`reference_id`** when ringing up (scan the QR)
- Without a query param, the demo id `SQ-USER-987654321` is used

Per-user QR generation is deferred; keep using `customerId` as the QR value for now.

## Setup

1. Create a Supabase project (or use the existing Potato Hut one).
2. Run the SQL migration in the Supabase SQL editor:

   `supabase/migrations/20260821170000_loyalty_stamps.sql`

3. Copy `.env.example` → `.env.local` (local) and set Cloudflare Worker secrets/vars for production (see below).
4. `npm install && npm run dev`

## API

### Square webhook — `POST /api/square`

Point Square webhooks for `payment.updated` (and ideally `refund.created`) at:

`https://<your-loyalty-host>/api/square`

Optional header if `SQUARE_WEBHOOK_SECRET` is set:

`x-loyalty-webhook-secret: <secret>`

### Redeem — `POST /api/redeem`

Staff/tooling only (requires `LOYALTY_REDEEM_SECRET`):

```bash
curl -X POST https://<host>/api/redeem \
  -H "Content-Type: application/json" \
  -H "x-loyalty-redeem-secret: $LOYALTY_REDEEM_SECRET" \
  -d '{"customerId":"SQ-USER-987654321"}'
```

## Cloudflare env vars / secrets

Set these on the `potatohut-loyalty` Worker (Dashboard → Settings → Variables, or `wrangler secret put`):

| Name | Required | Notes |
|------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server writes / RPCs — **secret** |
| `LOYALTY_STAMP_THRESHOLD_CENTS` | no | Default `500` |
| `LOYALTY_REDEEM_SECRET` | yes for redeem | **secret** |
| `SQUARE_WEBHOOK_SECRET` | recommended | **secret** |

Local Cloudflare preview: copy `.dev.vars.example` → `.dev.vars`.

## Deploy

```bash
npm run deploy
```

Git push to `origin/main` on [StickySites/potatoHut-loyalty](https://github.com/StickySites/potatoHut-loyalty) keeps Cloudflare’s connected deploy in sync if CI is configured.

## Schema (summary)

- `loyalty_cards(customer_id, stamps 0–7, updated_at)`
- `loyalty_payment_events` — idempotent credit/debit per Square payment
- `loyalty_redemptions` — redeem audit log
- RPCs: `ensure_loyalty_card`, `increment_stamp`, `apply_loyalty_payment_credit`, `apply_loyalty_payment_debit`, `redeem_loyalty_reward`
