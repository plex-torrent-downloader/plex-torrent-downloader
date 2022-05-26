#!/usr/bin/bash
sudo echo "Deploying Plex Torrent Downloader.."
git pull origin master
npm ci
npm run build
sudo systemctl restart torrentdownloader
echo "Deploy Completed.";

