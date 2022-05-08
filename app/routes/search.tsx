import {useLoaderData} from "@remix-run/react";
import { redirect } from "@remix-run/node";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import ControlPanel from "~/components/ControlPanel";

type LoaderData = {
  settings?: Settings;
};

export const loader: LoaderFunction = async ({ request }) => {
  const settings = await db.settings.findUnique({
    where: {
      id : 1
    }
  });
  if (!settings) {
    throw redirect("/setup", 302);
  }
  return json({
    settings
  });
};

export default function Search() {
  const settings:LoaderData = useLoaderData();
  return <ControlPanel name="HOME" subtext="Please come back later">
    <h4>Please come back later</h4>
  </ControlPanel>
}
