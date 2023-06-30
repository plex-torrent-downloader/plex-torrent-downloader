import {json, MetaFunction, redirect} from "@remix-run/node";
import {db} from '../db.server';
import ControlPanel from "~/components/ControlPanel";
import {useState} from "react";
import bcrypt from "../bcrypt.server";
import jwt from '../jwt.server';
export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Setup",
  viewport: "width=device-width,initial-scale=1",
});

export const action = async ({request}) => {
  const settings = await db.settings.findUnique({
    where: {
      id: 1
    }
  });
  const formData = await request.formData();
  const password: string = formData.get('password');

  if (!settings) {
    throw new Error("No settings defined");
  }

  if (!settings?.password) {
    return null;
  }

  if (!(await bcrypt.comparePassword(password, settings?.password))) {
    return null;
  }

  const authToken = jwt.sign({}, settings?.password);

  return redirect("/search", {
    headers: {
      "Set-Cookie": `auth=${encodeURIComponent(authToken)};`,
    },
  });
};

export const loader = async ({request}) => {
  const settings = await db.settings.findUnique({
    where: {
      id: 1
    }
  });

  if (!settings) {
    return redirect("/setup");
  }

  const cookies = request.headers.get('Cookie') || '';
  const authToken = decodeURIComponent(cookies.split('=').pop());

  try {
    if (!jwt.verify(authToken, settings.password)) {
      throw new Error("Invalid JWT");
    }
  } catch(e) {
    return null;
  }
  throw redirect('/Search');

};

export default function Login() {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');

  return (
      <ControlPanel name="Login" subtext="Please Login">
        <form method="post" action="/login">
          <table className="table text-white">
            <tbody>
            <tr>
              <td>Username</td>
              <td>
                <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Password</td>
              <td>
                <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <input type="submit" value="Log in" className="btn btn-primary w-100" />
              </td>
            </tr>
            </tbody>
          </table>
        </form>
      </ControlPanel>
  );
}

