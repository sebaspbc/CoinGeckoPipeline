const axios = require("axios");
const { MongoClient } = require("mongodb");
const cron = require("node-cron");

// URI de MongoDB Atlas desde variable de entorno
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// Lista de monedas a capturar
const monedasArray = [
  "bitcoin",
  "ethereum",
  "ripple",
  "cardano",
  "solana",
  "dogecoin"
];

// Función sleep para esperar entre requests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para obtener precios de una sola moneda
async function obtenerPrecioDe(coin) {
  const response = await axios.get(
    "https://api.coingecko.com/api/v3/coins/markets",
    {
      params: {
        vs_currency: "usd",
        ids: coin,
        order: "market_cap_desc",
        per_page: 1,
        page: 1,
        sparkline: false
      }
    }
  );

  return response.data[0];
}

// Función principal con manejo de errores
async function obtenerPrecios() {
  try {
    await client.connect();
    const db = client.db("CoinGeckoDB");
    const collection = db.collection("Precios");

    const timestamp = new Date();

    for (const coin of monedasArray) {
      try {
        const data = await obtenerPrecioDe(coin);
        await collection.insertOne({
          timestamp,
          coin: data.id,
          current_price: data.current_price,
          market_cap: data.market_cap,
          total_volume: data.total_volume,
          high_24h: data.high_24h,
          low_24h: data.low_24h,
          price_change_24h: data.price_change_24h,
          price_change_percentage_24h: data.price_change_percentage_24h,
          circulating_supply: data.circulating_supply,
          ath: data.ath,
          ath_date: data.ath_date,
          atl: data.atl,
          atl_date: data.atl_date,
          market_cap_rank: data.market_cap_rank
        });
        console.log(`Datos de ${coin} insertados a las ${timestamp}`);
        await sleep(1000); 
      } catch (err) {
        if (err.response && err.response.status === 429) {
          console.log(`Exceso de requests para ${coin}, reintentando en 60s...`);
          await sleep(60000);
        } else {
          console.error(`Error al obtener datos de ${coin}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("Error general de conexión o inserción:", err.message);
  } finally {
    await client.close();
  }
}


cron.schedule("*/5 * * * *", () => {
  console.log("Iniciando tarea programada...");
  obtenerPrecios();
});


obtenerPrecios();
