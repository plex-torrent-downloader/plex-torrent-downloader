# Plex Torrent Downloader

This is a Node.js application that enables downloading torrent files and adding them to a Plex library. 
The application uses Prisma as an ORM, Remix.js for server-side rendering, and WebTorrent for downloading torrents.

#### Why Should I use this?

 - Prevent Malware by not having to navigate to torrent sites
 - Keep your NAS organized (if you use collections!)
 - Designed for binge-watchers

#### Unique Features

 - JWT / Bcrypt Password Auth built in
 - Download History
 - Search History, including query history
 - Ability to manage download locations via collections
 - Ability to abort torrents, and either keep or delete the downloaded data
 - Will stream first episode first, second episode second and so on
 - Search History shows up in search, so you won't download the same thing twice
 - Download Scheduler (Automatically Download new episodes)
 - Full coverage cypress tests with type checking throughout the codebase``

#### Torrent Search Services
 - 1377x.to``
 - nyaa.si
 - The Pirate Bay

### Screenshots
[![Search Results](https://raw.githubusercontent.com/plex-torrent-downloader/plex-torrent-downloader/master/screenshots/search_results.png)](https://raw.githubusercontent.com/plex-torrent-downloader/plex-torrent-downloader/master/screenshots/search_results.png)

[See More Screenshots](https://github.com/plex-torrent-downloader/plex-torrent-downloader/blob/master/screenshots.md)

### Installer Scripts

We currently have an installer script for ubuntu. You can install this on ubuntu by running this command

```
curl https://raw.githubusercontent.com/plex-torrent-downloader/installers/master/ubuntu-installer.sh | bash
```

### Requirements
 - Node.js (v18 or later)
 - npm or yarn

### Get Started 
- Install Node with NPM
- Clone this repository: `git clone git@github.com:plex-torrent-downloader/plex-torrent-downloader.git`
- CD Into directory `cd plex-torrent-downloader`
- Install NPM packages `npm i`
- Setup env file `cp .env.example .env`
- Build the Database `npx prisma migrate deploy`
- Generate Prisma Client `npx prisma generate`
- To run for development, `npm run build && npm run start` HMR is temporarily unavailable
- OR to build the app for production `npm run build`
- then run  `npm run start`
- Browse to `http://localhost:3000/setup` and configure the app settings

### Usage
Browse to http://localhost:3000.

Click on the "Add torrent" button and enter the magnet URL or the path to the torrent file.

Wait for the download to finish. The downloaded files should appear in the specified directory.

Click on the "Add to Plex" button to add the downloaded files to a Plex library.

# Docker Setup

## Quick Start

1. **Update paths in `docker-compose.yml`**

   Edit the volume paths to match your media directories:
   ```yaml
   volumes:
     - "/path/to/your/movies:/mount"
   ```

2. **Run the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the app**

   Open `http://localhost:3000`

## Configuration

- **Different port**: Change `"3000:3000"` to `"8080:3000"` in docker-compose.yml
- **View logs**: `docker-compose logs -f`
- **Stop**: `docker-compose down`

### License
This project is licensed under the terms of the MIT license. See the LICENSE file for details.
