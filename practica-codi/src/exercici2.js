// Importacions
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Constants
const DATA_SUBFOLDER = 'steamreviews';
const CSV_GAMES_FILE_NAME = 'games.csv';
const CSV_REVIEWS_FILE_NAME = 'reviews.csv';
const OUTPUT_FILE = 'exercici2_resposta.json';

// Funció per llegir el CSV de forma asíncrona
async function readCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Funció per fer la petició a Ollama amb més detalls d'error
async function analyzeSentiment(text) {
    try {
        const response = await fetch(`${process.env.CHAT_API_OLLAMA_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: process.env.CHAT_API_OLLAMA_MODEL_TEXT,
                prompt: `Sentiment (one word: positive, negative, neutral) of: "${text}"`,
                stream: false
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

        const data = await response.json();
        if (!data || !data.response) return 'error';
        return data.response.trim().toLowerCase();
    } catch (error) {
        console.error('Error en analyzeSentiment:', error.message);
        return 'error';
    }
}

async function main() {
    try {
        const dataPath = process.env.DATA_PATH;
        if (!dataPath) throw new Error('DATA_PATH no està definida');

        // Rutas a los CSV
        const gamesFilePath = path.join(__dirname, dataPath, DATA_SUBFOLDER, CSV_GAMES_FILE_NAME);
        const reviewsFilePath = path.join(__dirname, dataPath, DATA_SUBFOLDER, CSV_REVIEWS_FILE_NAME);

        if (!fs.existsSync(gamesFilePath) || !fs.existsSync(reviewsFilePath)) {
            throw new Error('Algun dels fitxers CSV no existeix');
        }

        const games = await readCSV(gamesFilePath);
        const reviews = await readCSV(reviewsFilePath);

        // Tomamos los dos primeros juegos
        const gamesToProcess = games.slice(0, 2);

        const result = {
            timestamp: new Date().toISOString(),
            games: []
        };

        for (const game of gamesToProcess) {
            // Reviews de este juego (filtramos por appid) y tomamos las 2 primeras
            const gameReviews = reviews.filter(r => r.app_id === game.appid).slice(0, 2);

            const statistics = { positive: 0, negative: 0, neutral: 0, error: 0 };

            for (const review of gameReviews) {
                const sentiment = await analyzeSentiment(review.content);
                if (statistics[sentiment] !== undefined) {
                    statistics[sentiment]++;
                } else {
                    statistics.error++;
                }
            }

            result.games.push({
                appid: game.appid,
                name: game.name,
                statistics
            });
        }

        // Guardar JSON
        const outputDir = path.join(__dirname, dataPath, 'data');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(path.join(outputDir, OUTPUT_FILE), JSON.stringify(result, null, 2));

        console.log(`Estadístiques generades i guardades a ${OUTPUT_FILE}`);
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error durant l\'execució:', error.message);
    }
}

// Ejecutamos la función principal
main();
