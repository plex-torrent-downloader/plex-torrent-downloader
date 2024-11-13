import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import * as remixBuild from './build';
import cookieParser from 'cookie-parser';
import router from './api/router';
import './app/scheduler.server';

const app = express();

app.use(cookieParser());
app.use(express.static('public'));
app.use(router);

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

