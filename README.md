# Plex Torrent Downloader

This is a Node.js application that enables downloading torrent files and adding them to a Plex library. 
The application uses Prisma as an ORM, Remix.js for server-side rendering, and WebTorrent for downloading torrents.

### Torrent Search Services
 - 1377x.to
 - nyaa.si

### Screenshots
[![Search Results](https://raw.githubusercontent.com/plex-torrent-downloader/plex-torrent-downloader/master/screenshots/search_results.png)](https://raw.githubusercontent.com/plex-torrent-downloader/plex-torrent-downloader/master/screenshots/search_results.png)

[See More Screenshots](https://github.com/plex-torrent-downloader/plex-torrent-downloader/blob/master/screenshots.md)

### Installer Scripts

We currently have an installer script for ubuntu. You can install this on ubuntu by running this command

```
curl https://raw.githubusercontent.com/plex-torrent-downloader/installers/master/ubuntu-installer.sh | bash
```

### Requirements
 - Node.js (v14 or later)
 - npm or yarn

### Get Started 
- Install Node with NPM
- Clone this repository: `git clone git@github.com:plex-torrent-downloader/plex-torrent-downloader.git`
- CD Into directory `cd plex-torrent-downloader`
- Install NPM packages `npm i`
- Build the Database `npx prisma db push`
- Build the app `npm run build`
- Start the App `npm run start`
- Browse to `http://localhost:3000/setup` and configure the app settings

### Usage
Browse to http://localhost:3000.

Click on the "Add torrent" button and enter the magnet URL or the path to the torrent file.

Wait for the download to finish. The downloaded files should appear in the specified directory.

Click on the "Add to Plex" button to add the downloaded files to a Plex library.

### License
This project is licensed under the terms of the MIT license. See the LICENSE file for details.
