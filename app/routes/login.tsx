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

export const action = async ({request, context}) => {
  const { settings } = context;
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
  const settings = await db.settings.findFirst();

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
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full space-y-8">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left side - Image */}
              <div className="hidden lg:block lg:w-1/2">
                <div
                    className="h-full bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('/loginimage.png')`,
                      minHeight: '600px'
                    }}
                />
              </div>

              {/* Right side - Login Form */}
              <div className="w-full lg:w-1/2">
                <div className="p-8 sm:p-12">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
                  </div>

                  <form method="post" action="/login" className="space-y-6">
                    <div>
                      <label htmlFor="username" className="sr-only">
                        Username
                      </label>
                      <input
                          data-testid="username"
                          id="username"
                          name="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                          placeholder="Username"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="sr-only">
                        Password
                      </label>
                      <input
                          data-testid="password"
                          id="password"
                          name="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                          placeholder="Password"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        Remember me
                      </label>
                    </div>

                    <div>
                      <button
                          data-testid="submit"
                          type="submit"
                          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Login
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
