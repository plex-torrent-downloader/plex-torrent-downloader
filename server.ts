import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import * as remixBuild from './public/build/index.js';
import cookieParser from 'cookie-parser';
import router from './api/router';
import { createServer } from 'http';
import {startSocketIo} from "./api/socketio";
import './app/scheduler.server';

const app = express();
const httpServer = createServer(app);

app.use(cookieParser());
app.use(express.static('public'));
app.use(router);

startSocketIo(httpServer);

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
httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

