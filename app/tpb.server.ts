import puppeteer from "puppeteer";
import cheerio from "cheerio";
import os from "os";

export interface Torrent {
    name: string;
    seeders: number;
    leechers: number;
    hash: string;
    fileSize: string;
}

async function tpb(term: string):Promise<Torrent[]> {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: os.platform() === 'linux' ? '/usr/bin/chromium-browser' : undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width:1000,
            height:1000
        }
    });
    try {
        const page = await browser.newPage();
        await page.goto('https://thepiratebay.org/search.php?q=' + encodeURIComponent(term) + '&all=on&search=Pirate+Search&page=0&orderby=');
        let bodyHTML = await page.evaluate(() =>  document.documentElement.outerHTML);
        const $ = cheerio.load(bodyHTML);
        const entries = $('.list-entry').map(function() {
            return {
                name: $('span.item-title', this).text(),
                seeders: +$('span.item-seed', this).text(),
                leechers: +$('span.item-leach', this).text(),
                hash: $('.item-icons a', this).attr('href').substr(20, 40),
                fileSize: $('.item-size', this).text()
            };
        }).toArray();
        return entries;
    } catch(e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
export { tpb };
