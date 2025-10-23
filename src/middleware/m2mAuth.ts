import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const jwksUri = process.env.AUTH0_JWKS_URI as string;
const issuer = process.env.AUTH0_ISSUER_BASE_URL as string;
const audience = (process.env.AUTH0_M2M_AUDIENCE || process.env.AUTH0_AUDIENCE) as string;

const client = jwksClient({ jwksUri });

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export function requireM2M(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });
  jwt.verify(token, getKey, {
    audience,
    issuer,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    // Optionally check scopes if needed
    (req as any).auth = decoded;
    next();
  });
}
