import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import {auth, logout} from "./authRoutes";
import addTorrents from "./addTorrentsRoute";
import torrents from "../app/torrents.server";
import { db } from '../app/db.server';
const router = Router();

router.use(auth);
router.use(addTorrents);

router.get('/logout', logout);

router.post('/add', async (req: Request, res: Response, next: NextFunction) => {
    let postData = '';
    req.on('data', chunk => {
        postData += chunk.toString();
    });
    req.on('end', async () => {
        try {
            const { hash, path, magnet } = JSON.parse(postData);
            if (magnet) {
                await torrents.addMagnet(magnet, path);
            } else {
                await torrents.addInfohash(hash, path);
            }
            res.json({ success: true });
        } catch (e) {
            next(e);
        }
    });
});

router.post('/actions/delete/:hash', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let hash:string = req.params.hash;
        await torrents.deleteTorrent(hash);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

router.post('/actions/remove/:hash', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let hash:string = req.params.hash;
        await torrents.removeTorrent(hash);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

router.delete('/history/:id', async (req: Request, res: Response, next: NextFunction) => {
    if (isNaN(+req.params.id)) {
        return next(new Error('Invalid ID'));
    }
    try {
        await db.downloaded.delete({
            where: {id: parseInt(req.params.id)}
        });
    } catch (e) {
        return next(e);
    }
    res.json({ success: true });
});

router.use(async (error: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({
        error: error.message
    });
});

export default router;
