import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { VerifyTokenPayload } from "@/lib/types";

export async function verifyInboundToken(
  token: string,
  operatorSecret: string
): Promise<VerifyTokenPayload> {
  const secret = new TextEncoder().encode(operatorSecret);
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  const p = payload as JWTPayload & Partial<VerifyTokenPayload>;
  if (!p.email || !p.event_id) {
    throw new Error("Token missing required fields");
  }

  return {
    email: p.email,
    event_id: p.event_id,
    iat: p.iat ?? 0,
    exp: p.exp ?? 0,
  };
}

// Used server-side for generating test tokens in development / operator dashboard
export async function signTestToken(
  email: string,
  eventId: string,
  operatorSecret: string,
  expiresInSeconds = 60 * 60 * 24 // 24 hours
): Promise<string> {
  const secret = new TextEncoder().encode(operatorSecret);
  return new SignJWT({ email, event_id: eventId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secret);
}
