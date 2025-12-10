import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireInstructor: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVerifiedUser: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map