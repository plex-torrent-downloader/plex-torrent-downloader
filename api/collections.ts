import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { db } from '../app/db.server';
import {Settings} from "@prisma/client";
import {promises as fs} from 'fs'
const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
        try {
            //@ts-ignore
            const settings = req.settings as Settings;
            const formData = JSON.parse(body);
            const { collections } = formData;
            for (const collection of collections) {
                try {
                    await fs.access(collection.location.replace('[content_root]', settings.fileSystemRoot));
                } catch(e) {
                    throw new Error(`Invalid FS location: ${collection.location}: ${e.message}`);
                }
            }

            const existingCollections = await db.collections.findMany();
            const existingIds = new Set(existingCollections.map(c => c.id));

            const operations = [];

            for (const collection of collections) {
                if (collection.id && existingIds.has(collection.id)) {
                    operations.push(
                        db.collections.update({
                            where: { id: collection.id },
                            data: {
                                name: collection.name,
                                location: collection.location
                            }
                        })
                    );
                    existingIds.delete(collection.id);
                } else {
                    // Create new collection
                    operations.push(
                        db.collections.create({
                            data: {
                                name: collection.name,
                                location: collection.location
                            }
                        })
                    );
                }
            }

            if (existingIds.size > 0) {
                operations.push(
                    db.collections.deleteMany({
                        where: {
                            id: {
                                in: Array.from(existingIds)
                            }
                        }
                    })
                );
            }

            await db.$transaction(operations);

            res.json({success: true});
        } catch (e) {
            console.error(e);
            next(e);
        }
    });
});
export default router;
