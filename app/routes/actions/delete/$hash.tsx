import {json, LoaderFunction} from "@remix-run/node";
import torrentManager from "~/torrents.server";
import RequireAuth from "~/middleware/RequireAuth.server";

export const action = async (input) => {
    const ft = RequireAuth(async ({params}) => {
        const hash: string = params.hash;
        if (hash.length != 40) {
            throw new Error("Invalid hash provided.");
        }
        await torrentManager.deleteTorrent(hash);
        return json({success: true});
    });
    return ft(input);
};