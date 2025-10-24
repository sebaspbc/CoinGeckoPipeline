const axios = require('axios');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');

// Usar variable de entorno para la URI de MongoDB
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

// Lista de criptomonedas
const monedas = "bitcoin,ethereum,ripple,cardano,solana,dogecoin";

async function obtenerPrecios() {
    try {
        await client.connect();
        const db = client.db("CoinGeckoDB");
        const collection = db.collection("Precios");

        // Limpiar colección al iniciar (opcional)
        // await collection.deleteMany({});

        const response = await axios.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            { params: { vs_currency: "usd", ids: monedas, order: "market_cap_desc", per_page: 100, page: 1, sparkline: false } }
        );

        const timestamp = new Date();
        for (const coin of response.data) {
            await collection.insertOne({
                timestamp,
                coin: coin.id,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                total_volume: coin.total_volume,
                high_24h: coin.high_24h,
                low_24h: coin.low_24h,
                price_change_24h: coin.price_change_24h,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                circulating_supply: coin.circulating_supply,
                ath: coin.ath,
                ath_date: coin.ath_date,
                atl: coin.atl,
                atl_date: coin.atl_date,
                market_cap_rank: coin.market_cap_rank
            });
        }

        console.log(`Datos insertados a las ${timestamp}`);
    } catch (err) {
        console.error("Error al obtener o insertar datos:", err);
    } finally {
        await client.close();
    }
}

// Ejecutar cada minuto
cron.schedule('* * * * *', () => {
    obtenerPrecios();
});
