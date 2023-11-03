import {db} from '../db.server';
import {useState} from "react";
import bcrypt from "../bcrypt.server";
import jwt from '../jwt.server';
import {redirect} from "@remix-run/node";

export function meta() {
  return {
    charset: "utf-8",
    title: "Setup",
    viewport: "width=device-width,initial-scale=1",
  };
}

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

  const authToken = jwt.sign({}, settings?.password, { expiresIn: '1w' });

  const isSecure = request.protocol === 'https';

  const secureFlag = isSecure ? '; Secure' : '';
  return redirect("/search", {
    headers: {
      "Set-Cookie": `auth=${encodeURIComponent(authToken)}${secureFlag}; SameSite=Lax; HttpOnly; Path=/`,
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

  return <div className="row justify-content-center">
    <div className="col-xl-10 col-lg-12 col-md-9">
      <div className="card o-hidden border-0 shadow-lg my-5">
        <div className="card-body p-0">
          <div className="row">
            <div className="col-lg-6 d-none d-lg-block bg-login-image" />
            <div className="col-lg-6">
              <div className="p-5">
                <div className="text-center">
                  <h1 className="h4 text-gray-900 mb-4">Welcome Back!</h1>
                </div>
                <form method="post" action="/login">
                  <div className="form-group">
                    <input
                        type="text"
                        className="form-control form-control-user"
                        placeholder="Username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <input
                        type="password"
                        className="form-control form-control-user"
                        id="exampleInputPassword"
                        placeholder="Password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <div className="custom-control custom-checkbox small">
                      <input
                          type="checkbox"
                          className="custom-control-input"
                          id="customCheck"
                      />
                      <label
                          className="custom-control-label"
                          htmlFor="customCheck"
                      >
                        Remember Me
                      </label>
                    </div>
                  </div>
                  <input type="submit"
                         value="Login"
                         className="btn btn-primary btn-user btn-block"/>
                  <hr />
                </form>
                <hr />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}

