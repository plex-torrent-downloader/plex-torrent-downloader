import {json, LoaderFunction} from "@remix-run/node";
import torrentManager from "~/torrents.server";

export const action = async ({params}) => {
    const hash: string = params.hash;
    if (hash.length != 40) {
        throw new Error("Invalid hash provided.");
    }
    await torrentManager.deleteTorrent(hash);
    return json({success: true});
};
