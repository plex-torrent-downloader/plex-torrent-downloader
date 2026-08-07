import { Router, Request, Response, NextFunction } from 'express';
import { testConnection } from '../app/jellyfin.server';

const router = Router();

router.post('/test/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        const result = await testConnection(id);
        res.json(result);
    } catch (e) {
        next(e);
    }
});

export default router;