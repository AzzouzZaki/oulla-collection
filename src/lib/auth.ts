import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production'
  );

/**
 * Signs a JWT with the given payload. Expires in 7 days.
 */
export async function signToken(payload: object): Promise<string> {
  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

/**
 * Verifies the admin_token cookie on an incoming request.
 * Returns the JWT payload if valid, or throws a 401 NextResponse.
 */
export async function verifyAdmin(request: NextRequest): Promise<JWTPayload> {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
