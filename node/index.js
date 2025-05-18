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

const getYadioRate = async () => {
  const response = await axios.get("https://api.yadio.io/exrates/USD");
  return response.data.USD.VES;
};

const getCambiosRyaRate = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navega a la página de Instagram del perfil
  await page.goto("https://www.instagram.com/cambiosrya", {
    waitUntil: "networkidle2",
  });

  // Espera a que aparezca el contenedor de los posts (ajusta el selector si es necesario)
  await page.waitForSelector("article h2");

  // Extrae el segundo enlace dentro del contenedor de posts
  const rateText = await page.evaluate(() => {
    const postLinks = document.querySelectorAll("article h2");
    for(let i = 0; i < postLinks.length; i++) {
      // Check if the text contains the rate "Dolar en Bogotá" in span}
      if (postLinks[i].innerText.includes("Dolar en Bogotá")) {
        return postLinks[i].innerText;
      }
    }
    return "";
  });

  await browser.close();

  let rate = 0;
  if(rateText) {
    // get text between "Dolar en Bogotá" and "Bs"
    rate = rateText.split("Dolar en Bogotá")[1].split("Bs")[0].trim();
    rate = rate.replace(/,/g, ".");
    rate = rate.includes(" ") ? rate.split(" ")[1] : rate;
    // Convert to float
    rate = parseFloat(rate);

  }

  return rate;

};




const getBCVRate = async () => {
  try {
    const response = await axios.get("https://www.bcv.org.ve/", {
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    const $ = cheerio.load(response.data);

    // Buscar el elemento con el tipo de cambio del dólar
    const rateText = $("#dolar strong").text().trim();

    // Convertir el texto a número, reemplazando la coma por punto
    const rate = parseFloat(rateText.replace(",", "."));

    return rate;
  } catch (error) {
    console.error("Error al obtener el tipo de cambio del BCV:", error.message);
    return null;
  }
};



module.exports = {
  getYadioRate,
  getCambiosRyaRate,
  getBCVRate
};
