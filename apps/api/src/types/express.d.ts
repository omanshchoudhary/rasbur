import 'express';

// This will avoid errors as now TS nows default Express Request object has apiKey and authType fields as well.
declare global {
    namespace Express {
        interface Request {
            apiKey?: { id: string; permissions: string[]; rateLimit: number };
            authType?: 'jwt' | 'apikey';
        }
    }
}
