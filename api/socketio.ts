import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { parse } from 'cookie';
import jwt from "jsonwebtoken";
import {db} from "../app/db.server";
import torrents from "../app/torrents.server";
import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {transcodeToMkv} from "./transcodeToMkv";
import {Downloaded} from "@prisma/client";

let io: Server;

export function startSocketIo(server: HttpServer) {

    io = new Server(server, {
        cors: {
            origin: '*',
        },
    });

    io.use(async (socket, next) => {
        try {
            const settings = await db.settings.findUnique({
                where: { id: 1 }
            });
            if (!settings?.password) {
                return next();
            }
            const cookieHeader = socket.handshake.headers.cookie;
            if (!cookieHeader) {
                return next(new Error('Authentication required'));
            }

            const cookies = parse(cookieHeader);
            const authToken = cookies.auth;

            if (!authToken) {
                return next(new Error('Authentication required'));
            }

            await new Promise<void>((resolve, reject) => {
                jwt.verify(authToken, settings?.password, (err: Error) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            })

            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        socket.on('transcodeToMkv', async (torrent: WebTorrent|Downloaded) => {
            transcodeToMkv(torrent, io);
        });
    });

    setInterval(async () => {
        io.emit('queue:update', await torrents.getSerialized());
    }, 1000);

    return io;
}

export function sendMessage(title: string, message: string):void {
    io?.emit('message', { title, message });
}
