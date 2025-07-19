import {Response, NextFunction, Router} from 'express';
import { db } from '../app/db.server';
import Scheduler from '../app/scheduler.server';
import {PTDRequest} from "~/contracts/PTDRequest";

const router = Router();

router.post('/download_next_episode/:id', async (req: PTDRequest, res: Response, next: NextFunction):Promise<any> => {
    try {
        const id = +req.params.id;
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid ID' });
        }
        const download = await db.scheduledDownloads.findUnique({where: {id}});
        if (!download) {
            return res.status(404).json({ success: false, error: 'Download not found' });
        }
        const didDownloadEpisode = await Scheduler.searchForEpisode(download);
        res.json({
            download,
            didDownloadEpisode
        });
    } catch (error) {
        next(error);
    }
});

export default router;
