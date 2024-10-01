import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import * as remixBuild from './build';  // Ensure you use the Remix build output
import auth from './app/middleware/auth.server';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(express.static('public'));
app.use(auth);

app.all('*', createRequestHandler({
    build: remixBuild,
    mode: process.env.NODE_ENV,
    getLoadContext(req) {
        return {
            settings: (req as any).settings
        };
    }
}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
});

