import { auth } from 'express-openid-connect';
import type { ConfigParams } from 'express-openid-connect';

const config: ConfigParams = {
    authRequired: false,
    auth0Logout: true,
    idpLogout: true,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    baseURL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
    clientID: process.env.AUTH0_CLIENT_ID,
    secret: process.env.SESSION_SECRET,
    routes: {
        login: false,          
        callback: '/callback', 
    },
};

export const oidc = auth(config);
console.log('✅ Auth0 middleware loaded with baseURL:', process.env.BASE_URL);