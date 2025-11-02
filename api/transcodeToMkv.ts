import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {sendMessage} from "./socketio";
import path from "path";
import {stat, readdir, unlink} from "node:fs/promises";
import {spawn} from "child_process";
import type {Socket} from "socket.io";
import {checkFFmpeg, getHardwareAcceleration, type HardwareAcceleration} from "./ffmpegHelpers";
import async from "async";
import {Downloaded} from "@prisma/client";
import torrents from "../app/torrents.server";
import { Server } from 'socket.io';

const videoExtensions = ["3gp", "3g2", "asf", "avi", "divx", "flv", "f4v", "f4p", "f4a", "f4b", "m4v", "mov", "mp4", "mpe", "mpeg", "mpg", "mpv", "m1v", "m2v", "ogv", "ogx", "qt", "rm", "rmvb", "ts", "vob", "webm", "wmv"];

interface TranscodeTask {
    torrent: WebTorrent|Downloaded;
    socket: Server;
}

// Create a queue with concurrency of 1 (only one transcode at a time)
const transcodeQueue = async.queue<TranscodeTask, Error>(async (task: TranscodeTask, callback) => {
    try {
        await processTranscode(task.torrent, task.socket);
        callback();
    } catch (error) {
        callback(error as Error);
    }
}, 1);

function buildTranscodeArgs(filePath: string, outputPath: string, hwAccel: HardwareAcceleration | null): string[] {
    const args: string[] = ['-i', filePath];

    if (hwAccel) {
        // Hardware-accelerated encoding to H.264 in MKV
        args.push('-c:v', hwAccel.encoder);

        if (hwAccel.encoder.includes('nvenc')) {
            args.push('-preset', 'fast', '-crf', '23');
        } else if (hwAccel.encoder.includes('qsv')) {
            args.push('-preset', 'fast', '-global_quality', '23');
        } else if (hwAccel.encoder.includes('videotoolbox')) {
            args.push('-b:v', '5M');
        } else if (hwAccel.encoder.includes('amf')) {
            args.push('-quality', 'balanced');
        } else if (hwAccel.encoder.includes('vaapi')) {
            args.push('-vf', 'format=nv12,hwupload', '-qp', '23');
        }
    } else {
        // Software encoding fallback (H.264 is faster than H.265)
        args.push(
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23'
        );
    }

    // Audio and subtitle settings
    args.push(
        '-c:a', 'aac',
        '-b:a', '192k',
        '-c:s', 'copy',
        '-map', '0',
        '-y',
        outputPath
    );

    return args;
}

async function transcode(filePath: string, socket: Server, hwAccel: HardwareAcceleration | null): Promise<string> {
    const isFfmegInstalled = await checkFFmpeg();
    if (!isFfmegInstalled) {
        throw new Error("FFmpeg is not installed. Please install FFmpeg to use the transcoding feature.");
    }
    const outputPath = filePath.replace(/\.[^/.]+$/, '.mkv');
    const fileName = path.basename(filePath);

    const encoderName = hwAccel ? hwAccel.encoder : 'libx264 (CPU)';

    return new Promise((resolve, reject) => {
        const args = buildTranscodeArgs(filePath, outputPath, hwAccel);
        const ffmpeg = spawn('ffmpeg', args);

        let duration: number | null = null;
        let stderr = '';

        ffmpeg.stderr.on('data', (data: Buffer) => {
            const output = data.toString();
            stderr += output;

            // Parse duration from ffmpeg output
            if (!duration) {
                const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                if (durationMatch) {
                    const hours = parseInt(durationMatch[1]);
                    const minutes = parseInt(durationMatch[2]);
                    const seconds = parseFloat(durationMatch[3]);
                    duration = hours * 3600 + minutes * 60 + seconds;
                }
            }

            // Parse progress
            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
            if (timeMatch && duration) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseFloat(timeMatch[3]);
                const currentTime = hours * 3600 + minutes * 60 + seconds;
                const progress = Math.min(Math.round((currentTime / duration) * 100), 100);

                socket.emit('transcode:progress', {
                    fileName,
                    progress,
                    status: 'transcoding'
                });
            }
        });

        ffmpeg.on('close', async (code: number) => {
            if (code === 0) {
                socket.emit('transcode:progress', {
                    fileName,
                    progress: 100,
                    status: 'completed'
                });

                try {
                    await unlink(filePath);
                } catch (deleteError) {
                    console.error(`Failed to delete original file ${filePath}:`, deleteError);
                }

                resolve(outputPath);
            } else {
                console.error(`FFmpeg failed with code ${code}`);
                console.error('FFmpeg stderr:', stderr);
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });

        ffmpeg.on('error', (error: Error) => {
            console.error('FFmpeg error:', error);
            reject(error);
        });
    });
}

async function processTranscode(torrent: WebTorrent|Downloaded, socket: Server): Promise<void> {
    // Detect hardware acceleration
    const hwAccel = await getHardwareAcceleration();
    const encoderMessage = hwAccel
        ? `Transcoding ${torrent.name} to MKV with ${hwAccel.encoder}...`
        : `Transcoding ${torrent.name} to MKV with CPU encoding...`;

    sendMessage("Transcoding started", encoderMessage);
    const pathOnDisk = 'path' in torrent
        ? path.join(torrent.path, torrent.name)
        : path.join(torrent.pathOnDisk, torrent.name);
    const isDirectory = await stat(pathOnDisk).then(stats => stats.isDirectory()).catch(() => false);

    //stop seeding torrent that will be transcoded
    try {
        await torrents.removeTorrent(torrent.hash);
    } catch(e) {
        console.error(`Failed to remove torrent ${torrent.hash} before transcoding:`, e);
    }

    try {
        if (!isDirectory) {
            const ext:string = torrent.name.split('.').pop();
            if (videoExtensions.includes(ext || '')){
                await transcode(pathOnDisk, socket, hwAccel);
                sendMessage("Transcoding completed", `Successfully transcoded ${torrent.name} to MKV format.`);
            } else {
                throw new Error("The torrent does not contain a valid video file for transcoding.");
            }
        } else {
            const files = await readdir(pathOnDisk);
            let transcoded:number = 0;
            for (const file of files) {
                const fullFilePath = path.join(pathOnDisk, file);
                let ext = file.split('.').pop();
                if (videoExtensions.includes(ext)) {
                    await transcode(fullFilePath, socket, hwAccel);
                    transcoded++;
                }
            }
            if (!transcoded) {
                throw new Error("The torrent does not contain any valid video files for transcoding.");
            }
            sendMessage("Transcoding completed", `Successfully transcoded ${transcoded} file(s) to MKV format.`);
        }
    } catch(e) {
        sendMessage("Transcoding failed", e.message);
    }
}

export async function transcodeToMkv(torrent: WebTorrent|Downloaded, socket: Server): Promise<void> {
    transcodeQueue.push({ torrent, socket });
}
