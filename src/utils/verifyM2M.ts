import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const client = jwksClient({
    jwksUri: process.env.AUTH0_JWKS_URI!,
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

export const verifyM2M = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token nije poslan' });

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
            if (err) return res.status(403).json({ error: 'Token nije valjan', details: err.message });
            (req as any).auth = decoded;
            next();
        }
    );
};
