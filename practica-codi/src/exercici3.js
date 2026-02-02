// Importacions
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const IMAGES_SUBFOLDER = 'imatges/animals';
const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif'];
const OLLAMA_URL = process.env.CHAT_API_OLLAMA_URL;
const OLLAMA_MODEL = process.env.CHAT_API_OLLAMA_MODEL_VISION;

// Funció per llegir un fitxer i convertir-lo a Base64
async function imageToBase64(imagePath) {
    try {
        const data = await fs.readFile(imagePath);
        return Buffer.from(data).toString('base64');
    } catch (error) {
        console.error(`Error al llegir o convertir la imatge ${imagePath}:`, error.message);
        return null;
    }
}

// Funció per fer la petició a Ollama amb timeout ampliat
async function queryOllama(base64Image, prompt, timeout = 60000) { // 60s timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const requestBody = { model: OLLAMA_MODEL, prompt, images: [base64Image], stream: false };

    try {
        const response = await fetch(`${OLLAMA_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(id);

        if (!response.ok) throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data || !data.response) throw new Error('Resposta d\'Ollama inesperada');

        return data.response;
    } catch (error) {
        clearTimeout(id);
        console.error('Error en la petició a Ollama:', error);
        return null;
    }
}

// Funció principal
async function main() {
    try {
        if (!process.env.DATA_PATH) throw new Error('La variable DATA_PATH no està definida.');
        if (!OLLAMA_URL) throw new Error('La variable CHAT_API_OLLAMA_URL no està definida.');
        if (!OLLAMA_MODEL) throw new Error('La variable CHAT_API_OLLAMA_MODEL no està definida.');

        const imagesFolderPath = path.join(__dirname, process.env.DATA_PATH, IMAGES_SUBFOLDER);
        await fs.access(imagesFolderPath);

        const animalDirectories = await fs.readdir(imagesFolderPath);
        const result = { analisis: [] };

        // Solo el primer animal
        const firstAnimalDir = animalDirectories[0];
        const animalDirPath = path.join(imagesFolderPath, firstAnimalDir);
        const stats = await fs.stat(animalDirPath);
        if (!stats.isDirectory()) throw new Error(`No és un directori: ${animalDirPath}`);

        const imageFiles = await fs.readdir(animalDirPath);

        for (const imageFile of imageFiles) {
            const imagePath = path.join(animalDirPath, imageFile);
            const ext = path.extname(imagePath).toLowerCase();
            if (!IMAGE_TYPES.includes(ext)) continue;

            const base64String = await imageToBase64(imagePath);
            if (!base64String) continue;

            console.log(`Processant imatge: ${imagePath}`);

            // Prompt
            const prompt = `
Analitza aquesta imatge i retorna un JSON amb aquesta estructura:

{
  "imatge": { "nom_fitxer": "nom_del_fitxer.jpg" },
  "analisi": {
    "nom_comu": "...",
    "nom_cientific": "...",
    "taxonomia": {
      "classe": "...",
      "ordre": "...",
      "familia": "..."
    },
    "habitat": {
      "tipus": ["..."],
      "regioGeografica": ["..."],
      "clima": ["..."]
    },
    "dieta": {
      "tipus": "...",
      "aliments_principals": ["..."]
    },
    "caracteristiques_fisiques": {
      "mida": {
        "altura_mitjana_cm": "...",
        "pes_mitja_kg": "..."
      },
      "colors_predominants": ["..."],
      "trets_distintius": ["..."]
    },
    "estat_conservacio": {
      "classificacio_IUCN": "...",
      "amenaces_principals": ["..."]
    }
  }
}

Nom del fitxer: ${imageFile}
`;

            const response = await queryOllama(base64String, prompt, 120000); // 2 minutos de timeout
            if (!response) {
                console.error(`No s'ha pogut obtenir resposta per ${imageFile}`);
                continue;
            }

            try {
                const jsonResponse = JSON.parse(response);
                result.analisis.push(jsonResponse);
                console.log(`Informació obtinguda per ${imageFile}`);
            } catch (err) {
                console.error(`Error al parsejar JSON per ${imageFile}:`, err.message);
                console.log('Resposta crua:', response);
            }
        }

        // Guardar el resultat
        const outputPath = path.join(__dirname, process.env.DATA_PATH, 'exercici3_resposta.json');
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(`Anàlisi complet guardat a: ${outputPath}`);

    } catch (error) {
        console.error('Error durant l\'execució:', error.message);
    }
}

main();
