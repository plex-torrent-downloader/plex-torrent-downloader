// @ts-nocheck
import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import path from 'path';
import * as remixBuild from './build';  // Ensure you use the Remix build output

const app = express();

app.use(express.static('public'));

// Pass requests to Remix's request handler
app.all('*', createRequestHandler({
    build: remixBuild,
    mode: process.env.NODE_ENV
}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
});

