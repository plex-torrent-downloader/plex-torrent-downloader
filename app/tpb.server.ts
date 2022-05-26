import axios from "axios";
import cheerio from "cheerio";

export interface Torrent {
    name: string;
    seeders: number;
    leechers: number;
    hash: string;
    fileSize: string;
    link?: string;
}

async function tpb(term: string):Promise<Torrent[]> {
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
            fileSize: $('td.size', this).text()
        };
    }).toArray();
    for (let result of entries) {
        const response = await axios(result.link);
        $ = cheerio.load(response.data);
        result.hash = $('.infohash-box').text().split(':').pop().trim();
    }
    entries.splice(0, 1);
    return entries;
}
export { tpb };
