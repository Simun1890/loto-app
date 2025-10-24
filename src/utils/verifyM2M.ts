import jwt, { JwtHeader } from 'jsonwebtoken';
import jwksClient, { SigningKey } from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const client = jwksClient({
    jwksUri: process.env.AUTH0_JWKS_URI!,
});

// ✅ eksplicitno tipizirani parametri
function getKey(
    header: JwtHeader,
    callback: (err: Error | null, key?: string) => void
): void {
    client.getSigningKey(header.kid as string, (err: Error | null, key?: SigningKey) => {
        if (err) {
            return callback(err);
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

export const verifyM2M = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Token nije poslan' });
        return;
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        getKey,
        {
            audience: process.env.AUTH0_M2M_AUDIENCE,
            issuer: `https://${process.env.AUTH0_DOMAIN}/`,
            algorithms: ['RS256'],
        },
        (err, decoded) => {
            if (err) {
                console.error('❌ Token nije valjan:', err.message);
                res.status(403).json({ error: 'Token nije valjan', details: err.message });
                return;
            }

            (req as any).auth = decoded;
            next();
        }
    );
};
