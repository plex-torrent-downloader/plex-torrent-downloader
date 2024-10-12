import { Request, Response, NextFunction } from 'express';
import torrents from '../torrents.server';

async function addTorrents(req: Request, res: Response, next: NextFunction) {
    try {
        (req as any).torrents = await torrents.getSerialized();
        next();
    } catch(e) {
        next(e);
    }
}



export default addTorrents;
