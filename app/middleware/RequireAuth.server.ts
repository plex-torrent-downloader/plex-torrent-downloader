import {json, redirect} from "@remix-run/node";
import BcryptWrapper from "~/bcrypt.server";
import { db } from '~/db.server';
import { Settings } from '@prisma/client';
import jwt from "jsonwebtoken";

interface PassedOn {
    request: Request;
    context: any;
    settings?: Settings;
}

export default function RequireAuth(loader) {
    return async function authLoader(input):Promise<Response> {
        const { request, context } = input;
        const settings = await db.settings.findUnique({
            where: {
                id: 1
            }
        });

        if (!settings || !settings.password) {
            return loader({ request, context, settings });
        }

        const cookies = request.headers.get('Cookie') || '';
        const authToken = decodeURIComponent(cookies.split('=').pop());

        try {
            if (!jwt.verify(authToken, settings.password)) {
                throw new Error("Invalid JWT");
            }
        } catch(e) {
            return unauthorizedResponse();
        }

        // User is authenticated, call the original loader function
        return loader({ request, context, settings });
    };
}

function unauthorizedResponse() {
    throw redirect("/login", 302);
    return json(
        { message: "Unauthorized" },
        {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Secure Area", charset="UTF-8"',
            },
        }
    );
}
