import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { db } from '../app/db.server';
import fs from 'fs';
import path from 'path';
import child_process, {exec as cpExec} from 'child_process';
import { randomUUID } from 'crypto';
import os from 'os';
import {sendMessage} from "./socketio";
import {promisify} from "util";

const router = Router();

interface HardwareAcceleration {
    decoder: string;
    encoder: string;
    hwaccel?: string;
    hwaccelDevice?: string;
    pixelFormat?: string;
}

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

async function checkFFmpeg(): Promise<boolean> {
    const exec = promisify(cpExec);
    try {
        await exec('which ffmpeg');
        return true;
    } catch (error) {
        return false;
    }
}

async function detectHardwareAcceleration(): Promise<HardwareAcceleration | null> {
    const exec = promisify(cpExec);

    try {
        const [encodersResult, hwaccelsResult, devicesResult] = await Promise.all([
            exec('ffmpeg -encoders 2>/dev/null | grep -E "(nvenc|qsv|videotoolbox|vaapi|amf)"').catch(() => ({ stdout: '' })),
            exec('ffmpeg -hwaccels 2>/dev/null').catch(() => ({ stdout: '' })),
            exec('ffmpeg -init_hw_device list 2>&1 | grep -E "(vaapi|cuda|qsv|videotoolbox|d3d11va)"').catch(() => ({ stdout: '' }))
        ]);

        const encoders = encodersResult.stdout;
        const hwaccels = hwaccelsResult.stdout;
        const devices = devicesResult.stdout;

        console.log('Available encoders:', encoders.split('\n').filter(line => line.trim()));
        console.log('Available hwaccels:', hwaccels.split('\n').filter(line => line.trim()));
        console.log('Available devices:', devices.split('\n').filter(line => line.trim()));

        if (encoders.includes('h264_vaapi') && hwaccels.includes('vaapi')) {
            try {
                await exec('ffmpeg -init_hw_device vaapi=vaapi0:/dev/dri/renderD128 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_vaapi -f null - 2>/dev/null');
                console.log('VAAPI acceleration available and working');
                return {
                    decoder: 'h264',
                    encoder: 'h264_vaapi',
                    hwaccel: 'vaapi',
                    hwaccelDevice: '/dev/dri/renderD128',
                    pixelFormat: 'vaapi'
                };
            } catch (error) {
                console.log('VAAPI test failed:', error);
            }
        }

        if (encoders.includes('h264_nvenc') && hwaccels.includes('cuda')) {
            try {
                await exec('ffmpeg -init_hw_device cuda=cuda0 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_nvenc -f null - 2>/dev/null');
                console.log('NVENC acceleration available and working');
                return {
                    decoder: 'h264_cuvid',
                    encoder: 'h264_nvenc',
                    hwaccel: 'cuda',
                    pixelFormat: 'yuv420p'
                };
            } catch (error) {
                console.log('NVENC test failed:', error);
            }
        }

        if (encoders.includes('h264_qsv') && hwaccels.includes('qsv')) {
            try {
                await exec('ffmpeg -init_hw_device qsv=qsv0 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_qsv -f null - 2>/dev/null');
                console.log('QSV acceleration available and working');
                return {
                    decoder: 'h264_qsv',
                    encoder: 'h264_qsv',
                    hwaccel: 'qsv',
                    pixelFormat: 'nv12'
                };
            } catch (error) {
                console.log('QSV test failed:', error);
            }
        }

        if (encoders.includes('h264_videotoolbox') && hwaccels.includes('videotoolbox')) {
            try {
                await exec('ffmpeg -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_videotoolbox -f null - 2>/dev/null');
                console.log('VideoToolbox acceleration available and working');
                return {
                    decoder: 'h264',
                    encoder: 'h264_videotoolbox',
                    hwaccel: 'videotoolbox',
                    pixelFormat: 'videotoolbox_vld'
                };
            } catch (error) {
                console.log('VideoToolbox test failed:', error);
            }
        }

        if (encoders.includes('h264_amf') && hwaccels.includes('d3d11va')) {
            try {
                await exec('ffmpeg -init_hw_device d3d11va=d3d11va0 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_amf -f null - 2>/dev/null');
                console.log('AMF acceleration available and working');
                return {
                    decoder: 'h264',
                    encoder: 'h264_amf',
                    hwaccel: 'd3d11va',
                    pixelFormat: 'nv12'
                };
            } catch (error) {
                console.log('AMF test failed:', error);
            }
        }

        console.log('No working hardware acceleration found, falling back to software encoding');
        return null;

    } catch (error) {
        console.log('Hardware acceleration detection failed completely:', error);
        return null;
    }
}

function buildFFmpegArgs(inputPath: string, outputPath: string, hwAccel: HardwareAcceleration | null, isHardwareFallback: boolean = false): string[] {
    const args: string[] = [];

    args.push('-i', inputPath);

    let videoFilters = 'scale=-2:720:force_original_aspect_ratio=decrease';

    if (hwAccel && !isHardwareFallback) {
        args.push('-c:v', hwAccel.encoder);

        if (hwAccel.encoder.includes('nvenc')) {
            args.push(
                '-preset', 'fast',
                '-profile:v', 'main',
                '-level', '4.0',
                '-b:v', '1500k',
                '-maxrate', '2M',
                '-bufsize', '3M',
                '-g', '30'
            );
        } else if (hwAccel.encoder.includes('qsv')) {
            args.push(
                '-preset', 'fast',
                '-profile:v', 'main',
                '-level', '4.0',
                '-b:v', '1500k',
                '-maxrate', '2M',
                '-bufsize', '3M',
                '-g', '30'
            );
        } else if (hwAccel.encoder.includes('videotoolbox')) {
            args.push(
                '-profile:v', 'main',
                '-level', '4.0',
                '-b:v', '1500k',
                '-maxrate', '2M',
                '-bufsize', '3M'
            );
        } else if (hwAccel.encoder.includes('amf')) {
            args.push(
                '-profile:v', 'main',
                '-level', '4.0',
                '-b:v', '1500k',
                '-maxrate', '2M',
                '-bufsize', '3M',
                '-g', '30'
            );
        } else if (hwAccel.encoder.includes('vaapi')) {
            videoFilters = 'format=nv12,hwupload,scale_vaapi=-2:720:force_original_aspect_ratio=decrease';
            args.push(
                '-profile:v', 'main',
                '-level', '4.0',
                '-b:v', '1500k',
                '-maxrate', '2M',
                '-bufsize', '3M'
            );
        }
    } else {
        args.push(
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-profile:v', 'main',
            '-level', '4.0',
            '-b:v', '1500k',
            '-maxrate', '2M',
            '-bufsize', '3M',
            '-g', '30',
            '-keyint_min', '30'
        );
    }

    args.push('-vf', videoFilters);

    args.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');

    if (outputPath === 'pipe:1') {
        args.push(
            '-f', 'mp4',
            '-movflags', '+frag_keyframe+empty_moov+default_base_moof',
            '-frag_duration', '500000'
        );
    } else {
        args.push(
            '-movflags', '+faststart+frag_keyframe+empty_moov',
            '-frag_duration', '500000'
        );
    }

    args.push('-avoid_negative_ts', 'make_zero');

    if (outputPath !== 'pipe:1') {
        args.push('-y');
    }

    args.push(outputPath);

    return args;
}

let hwAccelCache: HardwareAcceleration | null | undefined = undefined;

async function getHardwareAcceleration(): Promise<HardwareAcceleration | null> {
    if (hwAccelCache === undefined) {
        hwAccelCache = await detectHardwareAcceleration();
        if (hwAccelCache) {
            console.log('Hardware acceleration enabled:', hwAccelCache.encoder);
        } else {
            console.log('Using software encoding (no hardware acceleration available)');
        }
    }
    return hwAccelCache;
}

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

        const isMP4 = videoPath.toLowerCase().endsWith('.mp4');

        if (isMP4) {
            streamMP4(videoPath, req, res);
        } else {
            if (!await checkFFmpeg()) {
                sendMessage("FFmpeg is not installed", "Please install FFmpeg to transcode videos.");
                return res.status(500).json({
                    success: false,
                    error: "FFmpeg is not installed"
                });
            }

            const hwAccel = await getHardwareAcceleration();

            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Accept-Ranges', 'none');

            const message = hwAccel
                ? `Transcoding video with ${hwAccel.encoder} hardware acceleration...`
                : "Transcoding video with software encoding...";
            sendMessage("Please Wait", message);

            let ffmpegArgs = buildFFmpegArgs(videoPath, 'pipe:1', hwAccel);
            let ffmpeg = child_process.spawn('ffmpeg', ffmpegArgs);
            let hasErrored = false;
            let hasTriedFallback = false;

            ffmpeg.stdout.pipe(res);

            const handleFFmpegClose = (code: number) => {
                if (hasErrored) return;

                if (code === 0) {
                    console.log('Streaming completed successfully');
                } else if (hwAccel && !hasTriedFallback) {
                    hasTriedFallback = true;
                    console.log(`Hardware encoding failed (code: ${code}), falling back to software encoding...`);
                    sendMessage("Retrying", "Hardware acceleration failed, retrying with software encoding...");

                    const softwareArgs = buildFFmpegArgs(videoPath, 'pipe:1', null, true);
                    const softwareFFmpeg = child_process.spawn('ffmpeg', softwareArgs);

                    softwareFFmpeg.stdout.pipe(res);

                    softwareFFmpeg.on('close', (softwareCode) => {
                        if (hasErrored) return;

                        if (softwareCode === 0) {
                            console.log('Software encoding completed successfully');
                        } else {
                            console.error('Software encoding also failed with code:', softwareCode);
                            if (!res.headersSent) {
                                res.status(500).send('Video processing failed');
                            }
                        }
                    });

                    softwareFFmpeg.stderr.on('data', (data) => {
                        console.error(`Software FFmpeg stderr: ${data}`);
                    });

                    softwareFFmpeg.on('error', (err) => {
                        if (hasErrored) return;
                        hasErrored = true;
                        console.error('Software FFmpeg error:', err);
                        if (!res.headersSent) {
                            res.status(500).send('Internal Server Error');
                        }
                    });

                    res.on('close', () => {
                        hasErrored = true;
                        softwareFFmpeg.kill('SIGKILL');
                    });
                } else {
                    console.error('FFmpeg process failed with code:', code);
                    if (!res.headersSent) {
                        res.status(500).send('Video processing failed');
                    }
                }
            };

            ffmpeg.on('close', handleFFmpegClose);

            ffmpeg.stderr.on('data', (data) => {
                console.error(`FFmpeg stderr: ${data}`);
            });

            ffmpeg.on('error', (err) => {
                if (hasErrored) return;
                hasErrored = true;

                console.error('FFmpeg error:', err);
                if (!res.headersSent) {
                    res.status(500).send('Internal Server Error');
                }
            });

            res.on('close', () => {
                hasErrored = true;
                ffmpeg.kill('SIGKILL');
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
