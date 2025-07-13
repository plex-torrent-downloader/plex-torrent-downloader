import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import cheerio from "cheerio";
import zlib from "zlib";
import { decompress } from "fzstd";
import {Torrent} from "~/search.server";
import parallel from 'async/parallel';

const instance = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    },
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (status) => status < 400,
});

instance.interceptors.request.use((config) => {
    if (!config.headers['Cookie'] && process.env.CF_CLEARANCE_COOKIE) {
        config.headers['Cookie'] = process.env.CF_CLEARANCE_COOKIE;
    }

    config.responseType = 'arraybuffer';

    return config;
});

instance.interceptors.response.use(
    (response: AxiosResponse) => {
        try {
            const buffer = Buffer.from(response.data);
            const contentEncoding = response.headers['content-encoding'];

            let decompressedData: string;

            if (contentEncoding === 'gzip') {
                decompressedData = zlib.gunzipSync(buffer).toString('utf8');
            } else if (contentEncoding === 'deflate') {
                decompressedData = zlib.inflateSync(buffer).toString('utf8');
            } else if (contentEncoding === 'br') {
                decompressedData = zlib.brotliDecompressSync(buffer).toString('utf8');
            } else if (contentEncoding === 'zstd') {
                const decompressed = decompress(buffer);
                decompressedData = Buffer.from(decompressed).toString('utf8');
            } else {
                decompressedData = buffer.toString('utf8');
            }

            response.data = decompressedData;

            return response;
        } catch (error) {
            console.error('Decompression failed:', error);
            response.data = Buffer.from(response.data).toString('utf8');
            return response;
        }
    },
    (error) => {
        if (error.response) {
            console.error(`HTTP ${error.response.status}:`, error.response.statusText);

            if (error.response.data) {
                try {
                    const buffer = Buffer.from(error.response.data);
                    const contentEncoding = error.response.headers['content-encoding'];

                    let decompressedData: string;

                    if (contentEncoding === 'gzip') {
                        decompressedData = zlib.gunzipSync(buffer).toString('utf8');
                    } else if (contentEncoding === 'deflate') {
                        decompressedData = zlib.inflateSync(buffer).toString('utf8');
                    } else if (contentEncoding === 'br') {
                        decompressedData = zlib.brotliDecompressSync(buffer).toString('utf8');
                    } else if (contentEncoding === 'zstd') {
                        const decompressed = decompress(buffer);
                        decompressedData = Buffer.from(decompressed).toString('utf8');
                    } else {
                        decompressedData = buffer.toString('utf8');
                    }

                    error.response.data = decompressedData;
                } catch (decompressionError) {
                    error.response.data = Buffer.from(error.response.data).toString('utf8');
                }
            }
        }

        return Promise.reject(error);
    }
);

export default async function search(term: string): Promise<Torrent[]> {
    const {data} = await instance.get(`https://www.1377x.to/srch?search=${encodeURIComponent(term)}`);
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
        const response = await instance(result.link);
        $ = cheerio.load(response.data);
        result.hash = $('.infohash-box').text().split(':').pop()?.trim() || null;
        result.magnet = $('.torrentdown1').attr('href') || null;
    }));

    entries.splice(0, 1);
    return entries;
}
