import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { db } from "~/db.server";
import { Downloaded } from '@prisma/client';
import { Download, Play, Menu, X } from "lucide-react";
import fs from 'fs';
import path from 'path';
import { useState, useRef, useEffect } from "react";

interface LoaderData extends Record<string, unknown> {
  download: Downloaded;
  files: string[];
  hash: string;
}

export const meta = (args) => ({
  charset: "utf-8",
  title: "Watch",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({params}) => {
  const hash = params.hash;
  const download = await db.downloaded.findUnique({
    where: { hash }
  });

  if (!download) {
    throw new Error("Can not find history item");
  }

  const diskLocation = path.resolve(download.pathOnDisk, download.name);

  let files: string[];
  const stat = fs.statSync(diskLocation);
  if (fs.existsSync(diskLocation) && !stat.isDirectory()) {
    files = [diskLocation];
  } else {
    files = fs.readdirSync(diskLocation);
  }

  files = files.map(f => path.basename(f));

  return json({ hash, files, download });
};

const truncateFilename = (filename: string) => {
  if (filename.length <= 40) return filename;
  const extension = path.extname(filename);
  const nameWithoutExt = path.basename(filename, extension);
  const episodeMatch = nameWithoutExt.match(/[Ee][Pp]?[. -]?\d+|[Ss]\d+[Ee]\d+|\d+/);

  if (episodeMatch) {
    const epNumber = episodeMatch[0];
    const start = nameWithoutExt.slice(0, 20);
    return `${start}... ${epNumber}${extension}`;
  }
  return `${nameWithoutExt.slice(0, 30)}...${extension}`;
};

const VideoPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
        } catch (error) {
          console.log('Autoplay prevented:', error);
        }
      }
    };
    playVideo();
  }, [src]);

  return (
      <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
          autoPlay
          key={src}
          src={src}
      >
        Your browser does not support the video tag.
      </video>
  );
};

export default function Watch() {
  const { hash, files, download } = useLoaderData() as unknown as LoaderData;
  const [selectedFile, setSelectedFile] = useState<string>(files.length === 1 ? files[0] : null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when a file is selected on mobile
  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    setIsSidebarOpen(false);
  };

  return (
      <div className="relative h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-lg">
          <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 dark:text-gray-300"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate px-4">
            {selectedFile ? truncateFilename(selectedFile) : download.name}
          </h2>
        </div>

        {/* Sidebar */}
        <div className={`
        fixed md:relative
        w-full md:w-80
        h-full md:h-auto
        z-50 md:z-auto
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-white dark:bg-gray-800
        shadow-lg
        overflow-y-auto
      `}>
          <div className="hidden md:block p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
              {download.name}
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file) => (
                <div
                    key={file}
                    className={`p-4 flex items-center space-x-3 ${
                        selectedFile === file
                            ? 'bg-blue-50 dark:bg-blue-900'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <button
                      className="flex items-center min-w-0 flex-1 text-left"
                      onClick={() => handleFileSelect(file)}
                  >
                    <Play className={`flex-shrink-0 w-4 h-4 mr-2 ${
                        selectedFile === file
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <span className={`truncate ${
                        selectedFile === file
                            ? 'text-blue-900 dark:text-blue-50'
                            : 'text-gray-700 dark:text-gray-300'
                    }`}
                          title={file}
                    >
                  {truncateFilename(file)}
                </span>
                  </button>
                  <a
                      href={`/transcode/download/${hash}?file=${encodeURIComponent(file)}&download=true`}
                      download
                      className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      title={`Download ${file}`}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
            ))}
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 bg-black">
          {selectedFile ? (
              <div className="h-full">
                <VideoPlayer src={`/transcode/${hash}?file=${encodeURIComponent(selectedFile)}`} />
              </div>
          ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Select a file to play</p>
              </div>
          )}
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
            <div
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}
      </div>
  );
}
