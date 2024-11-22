import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {db} from './db.server';
import webtorrent from "./webtorrent.server";
import {Torrent} from "webtorrent";
import {sendMessage} from "../api/socketio";

class torrentsManager {

    trackers:string[] = [
        "http://nyaa.tracker.wf:7777/announce",
        "http://tracker.opentrackr.org:1337/announce",
        "udp://open.demonii.com:1337/announce",
        "udp://ttk2.nbaonlineservice.com:6969/announce",
        "udp://tracker.torrent.eu.org:451/announce",
        "udp://tracker1.bt.moack.co.kr:80/announce",
        "udp://tracker.tiny-vps.com:6969/announce",
        "udp://tracker.theoks.net:6969/announce",
        "udp://tracker.0x7c0.com:6969/announce",
        "udp://tracker-udp.gbitt.info:80/announce",
        "udp://retracker01-msk-virt.corbina.net:80/announce",
        "udp://opentracker.io:6969/announce",
        "udp://new-line.net:6969/announce",
        "udp://isk.richardsw.club:6969/announce",
        "udp://explodie.org:6969/announce",
        "https://tracker.tamersunion.org:443/announce",
        "http://tracker1.bt.moack.co.kr:80/announce",
        "http://tr.kxmp.cf:80/announce",
        "udp://tracker2.dler.org:80/announce",
        "udp://tracker1.myporn.club:9337/announce",
        "udp://run.publictracker.xyz:6969/announce",
        "udp://retracker.lanta.me:2710/announce",
        "udp://p4p.arenabg.com:1337/announce",
        "udp://open.demonoid.ch:6969/announce",
        "udp://moonburrow.club:6969/announce",
        "udp://leet-tracker.moe:1337/announce",
        "udp://bt2.archive.org:6969/announce",
        "udp://bt1.archive.org:6969/announce",
        "udp://bt.ktrackers.com:6666/announce",
        "https://tracker.renfei.net:443/announce",
        "http://tracker2.dler.org:80/announce",
        "http://tracker.renfei.net:8080/announce",
        "udp://wepzone.net:6969/announce",
        "udp://tracker.tryhackx.org:6969/announce",
        "udp://tracker.jamesthebard.net:6969/announce",
        "udp://tracker.fnix.net:6969/announce",
        "udp://tracker.filemail.com:6969/announce",
        "udp://tracker.farted.net:6969/announce",
        "udp://tracker.edkj.club:6969/announce",
        "udp://tracker.deadorbit.nl:6969/announce",
        "udp://tracker.ccp.ovh:6969/announce",
        "udp://tracker.bittor.pw:1337/announce",
        "udp://tamas3.ynh.fr:6969/announce",
        "udp://ryjer.com:6969/announce",
        "udp://public.publictracker.xyz:6969/announce",
        "udp://p2p.publictracker.xyz:6969/announce",
        "udp://open.u-p.pw:6969/announce",
        "udp://open.publictracker.xyz:6969/announce",
        "udp://open.dstud.io:6969/announce",
        "udp://odd-hd.fr:6969/announce",
        "udp://martin-gebhardt.eu:25/announce",
        "udp://jutone.com:6969/announce",
        "udp://evan.im:6969/announce",
        "udp://epider.me:6969/announce",
        "udp://d40969.acod.regrucolo.ru:6969/announce",
        "udp://amigacity.xyz:6969/announce",
        "udp://1c.premierzal.ru:6969/announce",
        "https://www.peckservers.com:9443/announce",
        "https://trackers.run:443/announce",
        "https://tracker.yemekyedim.com:443/announce",
        "https://tracker.pmman.tech:443/announce",
        "https://tracker.lilithraws.org:443/announce",
        "https://tracker.cloudit.top:443/announce",
        "http://www.peckservers.com:9000/announce",
        "http://wepzone.net:6969/announce",
        "http://tracker.qu.ax:6969/announce",
        "http://tracker.mywaifu.best:6969/announce",
        "http://tracker.ipv6tracker.org:80/announce",
        "http://tracker.files.fm:6969/announce",
        "http://tracker.edkj.club:6969/announce",
        "http://tracker.dler.org:6969/announce",
        "http://tracker.bt4g.com:2095/announce",
        "http://t1.aag.moe:17715/announce",
        "http://t.overflow.biz:6969/announce",
        "http://ch3oh.ru:6969/announce",
        "udp://u.peer-exchange.download:6969/announce",
        "udp://tracker.srv00.com:6969/announce",
        "udp://tracker.darkness.services:6969/announce",
        "udp://torrents.artixlinux.org:6969/announce",
        "udp://mail.artixlinux.org:6969/announce",
        "udp://ipv4.rer.lol:2710/announce",
        "udp://concen.org:6969/announce",
        "udp://bittorrent-tracker.e-n-c-r-y-p-t.net:1337/announce",
        "udp://aegir.sexy:6969/announce",
        "https://tracker.ipfsscan.io:443/announce",
        "https://tracker.gcrenwp.top:443/announce",
        "https://tracker-zhuqiy.dgj055.icu:443/announce",
        "http://tracker1.itzmx.com:8080/announce",
        "http://tracker-zhuqiy.dgj055.icu:80/announce",
        "http://canardscitrons.nohost.me:6969/announce",
        "http://bvarf.tracker.sh:2086/announce",
        "http://bittorrent-tracker.e-n-c-r-y-p-t.net:1337/announce",
        "udp://open.stealth.si:80/announce",
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://public.popcorn-tracker.org:6969/announce",
        "udp://tracker.dler.org:6969/announce",
        "udp://tracker.cyberia.is:6969/announce",
        "udp://exodus.desync.com:6969",
        "udp://open.demonii.com:1337/announce",
    ];
    async torrents():Promise<Torrent[]> {
        return (await webtorrent())?.torrents;
    }
    async removeTorrent(hash: string):Promise<void> {
        const torrent = (await this.torrents()).find(t => t.infoHash === hash);

        if (!torrent) {
            throw new Error(`Torrent for hash ${hash} does not exist.`);
        }

        torrent.destroy();
        sendMessage('Torrent Stopped', `${torrent?.name} has been stopped and removed from the queue.`);
    }
    async deleteTorrent(hash: string):Promise<void> {
        const torrent = (await this.torrents()).find(t => t.infoHash === hash);

        if (!torrent) {
            throw new Error(`Torrent for hash ${hash} does not exist.`);
        }

        torrent.destroy({destroyStore: true});
        sendMessage('Torrent Deleted', `${torrent?.name} has been deleted.`);
        try {
            await db.downloaded.update({
                data: {
                    deletedAt: new Date()
                },
                where: {
                    hash
                }
            });
        } catch(e) {
            console.warn(e);
        }
    }
    private serialize(torrent: any):WebTorrent {
        return {
            name: torrent.name,
            hash: torrent.infoHash,
            seeders: torrent.seeders,
            leechers: torrent.leechers,
            downloadSpeed: torrent.downloadSpeed,
            uploadSpeed: torrent.uploadSpeed,
            progress: (torrent.progress * 100).toFixed(1) + '%',
            progressPercent: Math.round(torrent.progress * 100),
            numPeers: torrent.numPeers,
            path: torrent.path,
            done: !!torrent.done,
            class: (torrent.done ? 'table-success' : 'table-danger')
        }
    }

    async addMagnet(magnet: string, path: string) {
        const wt = await webtorrent();
        wt.add(magnet, { path }, (async (torrent) => {
            const {saveDownloadHistory} = await db.settings.findUnique({
                where: {id: 1}
            });
            if (!saveDownloadHistory) {
                return;
            }
            const {id} = await db.downloaded.upsert({
                where: {
                    hash: torrent.infoHash
                },
                create: {
                    name: torrent.name,
                    hash: torrent.infoHash,
                    pathOnDisk: path
                },
                update: {
                    deletedAt: null,
                    completedAt: torrent.progress ? new Date() : null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            sendMessage('Download started', `Downloading ${torrent.name}`);

            torrent.on('done', async () => {
                sendMessage('Download Complete', `${torrent.name} has finished downloading`);
                await db.downloaded.update({
                    data: {
                        completedAt: new Date(),
                        deletedAt: null
                    },
                    where: {
                        id
                    }
                })
            });
        }).bind(this));
    }

    async addInfohash(infoHash: string, path: string) {
        await this.addMagnet(`magnet:?xt=urn:btih:${infoHash}?` + this.trackers.map(tracker => `&tr=${encodeURIComponent(tracker)}`).join(''), path);
    }
    async getSerialized():Promise<WebTorrent[]> {
        return (await this.torrents()).map(this.serialize);
    }
}


export default new torrentsManager();
