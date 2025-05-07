const axios = require("axios");
const cheerio = require("cheerio");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const puppeteer = require('puppeteer');

// dotenv
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});
// console.log(process.env)

const getBinanceRate = async (amount) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navega a la página de Instagram del perfil
  await page.goto("https://p2p.binance.com/es", {
    waitUntil: "networkidle2",
  });
  // Wait for the DOM is fully loaded wihtout any especific selector
  await page.waitForFunction(() => document.readyState === 'complete');

  // Click on #bn-tab-1
  await page.click(".bn-tab-list__segment-outline #bn-tab-1");

  // Click on bn-select-field data-single data-size-middle data-line
  await page.click(".bn-textField-suffix .bn-select-field.data-single.data-size-middle.data-line");


  // Recorre all bn-select-option icon !text-primaryText tags and console the text
  const options = await page.$$(".bn-select-option.icon");
  for (const option of options) {
    const text = await page.evaluate(el => el.innerText, option);
    // If text is "VES" then click on it
    if (text === "VES") {
      await option.click();
    }
  }


  // Type on #C2Csearchamount_searchbox_amount the amount
  await page.type("#C2Csearchamount_searchbox_amount", amount.toString());

  // Click .bn-select-field.data-multi.data-size-middle.data-line
  await page.click(".bn-select-field.data-multi.data-size-middle.data-line");


  // Await .active.bn-select-bubble .bn-select-option to be available and more than 1
  await page.waitForSelector(".active.bn-select-bubble .bn-select-option", {
    visible: true,
  });
  // Check if there are more than 1 .active.bn-select-bubble .bn-select-option
  const options2 = await page.$$(".active.bn-select-bubble .bn-select-option");
  // If there is not more than 1 then await for .5 seconds and check again
  let count = options2.length;
  while (count <= 2) {
    await setTimeout(() => {}, 500);
    const options2 = await page.$$(".active.bn-select-bubble .bn-select-option");
    count = options2.length;
  }

  console.log('count', count);
  // Iterate over all .active.bn-select-bubble .bn-select-option
  for (const option of options2) {
    const text = await page.evaluate(el => el.innerText, option);
    console.log(text);
  }


  // await browser.close();
  return "Epale que tal";
};

// Obtener argumentos de la línea de comandos
const amount = process.argv[2];

(async () => {
  if (!amount) {
    amount = 0;
  }

  // const yadioRate = await getYadioRate();
  // console.log('yadioRate', yadioRate);

  // const cambiosRyaRate = await getCambiosRyaRate();
  // console.log('cambiosRyaRate', cambiosRyaRate);

  const elDoradoRate = await getBinanceRate(amount);
  console.log('getElDoradoRate', elDoradoRate);
})();
