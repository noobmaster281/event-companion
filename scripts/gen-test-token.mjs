// Generates a test token for local development.
// Usage: node scripts/gen-test-token.mjs your@email.com
//
// Matches the seed data in supabase/seed/dev_seed.sql

import { SignJWT } from "jose";

const EMAIL = process.argv[2] ?? "test@example.com";
const EVENT_ID = "00000000-0000-0000-0000-000000000002";
const SECRET = "dev-secret-key-change-in-prod";

const token = await new SignJWT({ email: EMAIL, event_id: EVENT_ID })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("24h")
  .sign(new TextEncoder().encode(SECRET));

console.log("\nTest token generated for:", EMAIL);
console.log("\nOpen this URL in your browser:");
console.log(`\nhttp://localhost:3000/join?token=${token}\n`);
