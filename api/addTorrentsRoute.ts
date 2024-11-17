import { Response, NextFunction } from 'express';
import torrents from '../app/torrents.server';
import {PTDRequest} from "~/contracts/PTDRequest";

async function addTorrents(req: PTDRequest, res: Response, next: NextFunction) {
    try {
        req.torrents = await torrents.getSerialized();
        next();
    } catch(e) {
        next(e);
    }
}



export default addTorrents;
