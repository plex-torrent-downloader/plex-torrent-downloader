#!/usr/bin/bash
sudo echo "Deploying Plex Torrent Downloader.."
git pull origin master
npm ci
prisma db push
npm run build
sudo systemctl restart torrentdownloader
echo "Deploy Completed.";

