import axios from "axios";
import cheerio from "cheerio";
import {Torrent} from "~/search.server";
import parallel from 'async/parallel';

export default async function search(term: string):Promise<Torrent[]> {
    const {data} = await axios(`https://www.1377x.to/search/${encodeURIComponent(term)}/1/`, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; M1 Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36'
        }
    });
    let $ = cheerio.load(data);
    const entries = $('table tr').map(function() {
        return {
            name: $('td.name a:last-child', this).text().trim(),
            link: 'https://www.1377x.to/' + $('td.name a:last-child', this).attr('href'),
            seeders: +$('td.seeds', this).text(),
            leechers: +$('td.leeches', this).text(),
            hash: null,
            magnet: null,
            fileSize: $('td.size', this).text()
        };
    }).toArray();

    await parallel(entries.map((result) => async () => {
        const response = await axios(result.link);
        $ = cheerio.load(response.data);
        result.hash = $('.infohash-box').text().split(':').pop().trim();
        result.magnet = $('.torrentdown1').attr('href');
    }));

    entries.splice(0, 1);
    return entries;
}
