import axios from "axios";
import cheerio from "cheerio";
import {Torrent} from "~/search.server";

export default async function search(term: string):Promise<Torrent[]> {
    const {data} = await axios(`https://nyaa.si/?f=0&c=1_2&q=${encodeURIComponent(term)}`, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; M1 Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36'
        }
    });
    let $ = cheerio.load(data);
    const entries = $('tr.default').map(function() {
        const magnet = $('td:nth-child(3) a:last-child', this).attr('href');
        return {
            name: $('td:nth-child(2) a:last-child', this).text().trim(),
            link: null,
            seeders: +$('td:nth-child(6)', this).text().trim(),
            leechers: +$('td:nth-child(7)', this).text().trim(),
            hash: magnet.substr(20, 40),
            magnet,
            fileSize: $('td:nth-child(4)', this).text().trim(),
        };
    }).toArray();
    return entries;
}
