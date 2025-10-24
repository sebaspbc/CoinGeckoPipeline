import pymongo
from datetime import datetime
import requests
import time
import os

# Conexión a MongoDB Atlas
uri = os.environ["MONGO_URI"]
client = pymongo.MongoClient(uri)
db = client["CoinGeckoDB"]
collection = db["Precios"]


# Lista de monedas
monedas = "bitcoin,ethereum,ripple,cardano,solana,dogecoin"

def obtener_precios():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "ids": monedas,
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": False
    }
    response = requests.get(url, params=params).json()
    
    for coin in response:
        doc = {
            "timestamp": datetime.now(),
            "coin": coin.get("id"),
            "current_price": coin.get("current_price"),
            "market_cap": coin.get("market_cap"),
            "total_volume": coin.get("total_volume"),
            "high_24h": coin.get("high_24h"),
            "low_24h": coin.get("low_24h"),
            "price_change_24h": coin.get("price_change_24h"),
            "price_change_percentage_24h": coin.get("price_change_percentage_24h"),
            "circulating_supply": coin.get("circulating_supply"),
            "ath": coin.get("ath"),
            "ath_date": coin.get("ath_date"),
            "atl": coin.get("atl"),
            "atl_date": coin.get("atl_date"),
            "market_cap_rank": coin.get("market_cap_rank")
        }
        collection.insert_one(doc)
    print(f"Datos insertados a las {datetime.now()}")

# Automatización cada minuto
while True:
    try:
        obtener_precios()
    except Exception as e:
        print(f"Error al obtener o insertar datos: {e}")
    time.sleep(60)
