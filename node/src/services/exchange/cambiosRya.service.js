const puppeteer = require('puppeteer');

class CambiosRyaService {
    constructor() {
        this.instagramUrl = 'https://www.instagram.com/cambiosrya';
    }

    async getRate() {
        let browser;
        try {
            browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            await page.goto(this.instagramUrl, {
                waitUntil: "networkidle2",
            });

            await page.waitForSelector("article h2");

            const rateText = await page.evaluate(() => {
                const postLinks = document.querySelectorAll("article h2");
                for(let i = 0; i < postLinks.length; i++) {
                    if (postLinks[i].innerText.includes("Dolar en Bogotá")) {
                        return postLinks[i].innerText;
                    }
                }
                return "";
            });

            if (!rateText) {
                throw new Error('No se encontró la tasa en el post');
            }

            let rate = rateText.split("Dolar en Bogotá")[1].split("Bs")[0].trim();
            rate = rate.replace(/,/g, ".");
            rate = rate.includes(" ") ? rate.split(" ")[1] : rate;

            return parseFloat(rate);
        } catch (error) {
            console.error('Error al obtener tasa de Cambios Rya:', error.message);
            throw new Error('Error al obtener tasa de Cambios Rya');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

module.exports = new CambiosRyaService();
