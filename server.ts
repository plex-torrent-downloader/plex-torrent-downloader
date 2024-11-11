import express, {NextFunction, Request, Response} from 'express';
import { createRequestHandler } from '@remix-run/express';
import * as remixBuild from './build';
import {auth, logout} from './app/middleware/auth.server';
import addTorrents from './app/middleware/add_torrents.server';
import torrents from './app/torrents.server';
import cookieParser from 'cookie-parser';
import './app/scheduler.server';

const app = express();

app.use(cookieParser());
app.use(express.static('public'));
app.use(auth);
app.use(addTorrents);

app.get('/logout', logout);

app.post('/add', async (req: Request, res: Response, next: NextFunction) => {
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

app.post('/actions/delete/:hash', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let hash:string = req.params.hash;
        await torrents.deleteTorrent(hash);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

app.post('/actions/remove/:hash', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let hash:string = req.params.hash;
        await torrents.removeTorrent(hash);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

app.all('*', createRequestHandler({
    build: remixBuild,
    mode: process.env.NODE_ENV,
    getLoadContext(req) {
        return {
            settings: (req as any).settings,
            torrents: (req as any).torrents,
        };
    }
}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
});

