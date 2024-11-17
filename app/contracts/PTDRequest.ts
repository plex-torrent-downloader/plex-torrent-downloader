import { Request } from 'express';
import {Settings} from "@prisma/client";
import {WebTorrent} from './WebTorrentInterface';

export interface PTDRequest extends Request {
    settings?: Settings;
    torrents?: WebTorrent[];
}
