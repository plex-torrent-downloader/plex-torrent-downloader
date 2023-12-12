import {json} from "@remix-run/node";
import RequireAuth from "~/middleware/RequireAuth.server";
import {db} from '../../../../db.server';

export const action = async (input) => {
    const ft = RequireAuth(async ({params}) => {
        const id: number = +params.id;
        if (isNaN(id)) {
            throw new Error("Invalid ID provided.");
        }
        await db.downloaded.delete({
            where: {id}
        });
        return json({success: true});
    });
    return ft(input);
};