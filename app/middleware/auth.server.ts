import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.server';

async function auth(req: Request, res: Response, next: NextFunction) {
    const settings = await db.settings.findUnique({
        where: { id: 1 }
    });
    (req as any).settings = settings;

    if (['/login', '/setup'].indexOf(req.path.toLowerCase()) !== -1) {
        return next(null);
    }

    if (!settings || !settings.password) {
        return next();
    }

    const authToken = req.cookies?.auth;

    if (!authToken) {
        return unauthorizedResponse(req, res);
    }

    jwt.verify(authToken, settings.password, (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
            return unauthorizedResponse(req, res);
        }

        const newToken = jwt.sign({}, settings.password, { expiresIn: '1w' });

        const isSecure = req.secure;
        res.cookie('auth', newToken, {
            httpOnly: true,
            secure: isSecure,
            path: '/'
        });

        next();
    });
}

function unauthorizedResponse(req: Request, res: Response) {
    return res.redirect(302, '/login');
}

export default auth;
