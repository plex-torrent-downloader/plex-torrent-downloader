import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { db } from '../app/db.server';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { randomUUID } from 'crypto';
import os from 'os';
import {sendMessage} from "./socketio";

const router = Router();

const streamMP4 = (videoPath: string, req: Request, res: Response) => {
    const range = req.headers.range;
    const videoSize = fs.statSync(videoPath).size;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4'
        });

        const stream = fs.createReadStream(videoPath, { start, end });
        stream.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': videoSize,
            'Content-Type': 'video/mp4'
        });
        fs.createReadStream(videoPath).pipe(res);
    }
};

// @ts-ignore
router.get('/:hash', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hash = req.params.hash;
        const download = await db.downloaded.findUnique({
            where: { hash }
        });

        if (!download) {
            return res.status(404).json({
                success: false,
                error: "Can not find history item"
            });
        }

        const baseDirectory = path.resolve(download.pathOnDisk, download.name);
        const stat = fs.statSync(baseDirectory);
        let videoPath: string;

        if (fs.existsSync(baseDirectory) && !stat.isDirectory()) {
            videoPath = baseDirectory;
        } else {
            videoPath = path.join(baseDirectory, req.query?.file?.toString() || "");
        }

        if (!videoPath.startsWith(baseDirectory)) {
            throw new Error("Invalid file path");
        }

        // Check if file is MP4
        const isMP4 = videoPath.toLowerCase().endsWith('.mp4');

        if (isMP4) {
            // Stream MP4 directly
            streamMP4(videoPath, req, res);
        } else {
            // Convert and stream other video formats
            const tempDir = os.tmpdir();
            const tempFileName = `${randomUUID()}.mp4`;
            const tempFilePath = path.join(tempDir, tempFileName);

            res.setHeader('Content-Type', 'video/mp4');

            sendMessage("Please Wait", "This video needs to be transcoded. This could take a while.");
            const ffmpeg = child_process.spawn('ffmpeg', [
                '-i', videoPath,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-preset', 'ultrafast',
                '-movflags', '+faststart',
                '-crf', '23',
                tempFilePath
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    streamMP4(tempFilePath, req, res);

                    // Clean up temp file when streaming is done
                    res.on('end', () => {
                        fs.unlink(tempFilePath, (err) => {
                            if (err) console.error('Error deleting temp file:', err);
                        });
                    });
                } else {
                    console.error('FFmpeg process failed with code:', code);
                    res.status(500).send('Video processing failed');

                    fs.unlink(tempFilePath, (err) => {
                        if (err) console.error('Error deleting temp file:', err);
                    });
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                console.error(`FFmpeg stderr: ${data}`);
            });

            ffmpeg.on('error', (err) => {
                console.error('FFmpeg error:', err);
                res.status(500).send('Internal Server Error');

                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
            });

            res.on('close', () => {
                ffmpeg.kill('SIGKILL');
                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
            });
        }

    } catch (e) {
        next(e);
    }
});

//@ts-ignore
router.get('/download/:hash', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hash = req.params.hash;
        const download = await db.downloaded.findUnique({
            where: { hash }
        });

        if (!download) {
            return res.status(404).json({
                success: false,
                error: "Can not find history item"
            });
        }

        const baseDirectory = path.resolve(download.pathOnDisk, download.name);
        const stat = fs.statSync(baseDirectory);
        let videoPath: string;

        if (fs.existsSync(baseDirectory) && !stat.isDirectory()) {
            videoPath = baseDirectory;
        } else {
            videoPath = path.join(baseDirectory, req.query?.file?.toString() || "");
        }

        if (!videoPath.startsWith(baseDirectory)) {
            throw new Error("Invalid file path");
        }
        res.download(videoPath, path.basename(videoPath));
    } catch (e) {
        next(e);
    }
});

export default router;
