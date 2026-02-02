const axios = require('axios');
const { SentimentAnalysis } = require('../models');
const { logger } = require('../config/logger');

// Constants de configuració
const OLLAMA_API_URL = process.env.CHAT_API_OLLAMA_URL;
const DEFAULT_OLLAMA_MODEL = process.env.CHAT_API_OLLAMA_MODEL;

/**
 * Realitza anàlisi de sentiment d'un text
 * @route POST /api/chat/sentiment-analysis
 */
const analyzeSentiment = async (req, res, next) => {
    try {
        const { text, userId, model = DEFAULT_OLLAMA_MODEL } = req.body;

        logger.info('Nova sol·licitud d\'anàlisi de sentiment', {
            userId,
            model,
            textLength: text?.length
        });

        // Validacions inicials
        if (!text?.trim()) {
            logger.warn('Intent d\'analitzar text buit');
            return res.status(400).json({ 
                message: 'El camp "text" és obligatori' 
            });
        }

        if (!userId?.trim()) {
            logger.warn('Intent d\'analitzar sense userId');
            return res.status(400).json({ 
                message: 'El camp "userId" és obligatori' 
            });
        }

        // Crear prompt especialitzat per anàlisi de sentiment
        const sentimentPrompt = `
        Analitza el sentiment del següent text i respon ÚNICAMENT amb un objecte JSON vàlid amb aquesta estructura exacta:
        {
            "sentiment": "positive" o "negative" o "neutral",
            "confidence": número entre 0.0 i 1.0
        }
        
        Text a analitzar: "${text.trim()}"
        
        Recorda: Respon ÚNICAMENT amb l'objecte JSON, sense cap text addicional.
        `;

        logger.debug('Enviant petició a Ollama per anàlisi de sentiment', {
            model,
            promptLength: sentimentPrompt.length
        });

        // Enviar petició a Ollama
        const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
            model,
            prompt: sentimentPrompt,
            stream: false
        }, {
            timeout: 30000
        });

        // Processar resposta
        const ollamaResponse = response.data.response.trim();
        
        try {
            // Intentar extreure JSON de la resposta
            const jsonMatch = ollamaResponse.match(/\{[\s\S]*\}/);
            const sentimentData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(ollamaResponse);
            
            logger.debug('Resposta d\'Ollama processada', { sentimentData });

            // Validar l'estructura de la resposta
            if (!sentimentData.sentiment || !['positive', 'negative', 'neutral'].includes(sentimentData.sentiment)) {
                throw new Error('Format de resposta invàlid de l\'API d\'Ollama');
            }

            // Emmagatzemar a la base de dades
            const analysis = await SentimentAnalysis.create({
                userId: userId.trim(),
                text: text.trim(),
                sentiment: sentimentData.sentiment,
                confidence: sentimentData.confidence || null,
                model
            });

            logger.info('Anàlisi de sentiment registrada correctament', {
                analysisId: analysis.id,
                userId,
                sentiment: sentimentData.sentiment,
                confidence: sentimentData.confidence
            });

            // Retornar resposta
            res.status(201).json({
                analysisId: analysis.id,
                userId: analysis.userId,
                text: analysis.text,
                sentiment: analysis.sentiment,
                confidence: analysis.confidence,
                model: analysis.model,
                timestamp: analysis.createdAt
            });

        } catch (parseError) {
            logger.error('Error processant la resposta d\'Ollama', {
                error: parseError.message,
                ollamaResponse
            });
            
            // Crear registre amb sentiment neutral en cas d'error
            const fallbackAnalysis = await SentimentAnalysis.create({
                userId: userId.trim(),
                text: text.trim(),
                sentiment: 'neutral',
                confidence: null,
                model
            });

            logger.warn('Resposta fallback utilitzada per anàlisi de sentiment', {
                analysisId: fallbackAnalysis.id
            });

            res.status(201).json({
                analysisId: fallbackAnalysis.id,
                userId: fallbackAnalysis.userId,
                text: fallbackAnalysis.text,
                sentiment: 'neutral',
                confidence: null,
                model: fallbackAnalysis.model,
                timestamp: fallbackAnalysis.createdAt,
                note: 'Anàlisi utilitzant resposta fallback'
            });
        }

    } catch (error) {
        logger.error('Error en el procés d\'anàlisi de sentiment', {
            error: error.message,
            stack: error.stack
        });
        
        if (error.response) {
            // Error de l'API d'Ollama
            res.status(500).json({
                message: 'Error en el servei d\'anàlisi de sentiment',
                error: error.response.data.error || 'Error desconegut'
            });
        } else {
            next(error);
        }
    }
};

/**
 * Obté l'historial d'anàlisis per usuari
 * @route GET /api/chat/sentiment-analysis/:userId
 */
const getSentimentHistory = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        logger.debug('Sol·licitud d\'historial d\'anàlisis de sentiment', {
            userId,
            limit,
            offset
        });

        const { count, rows } = await SentimentAnalysis.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        logger.info('Historial d\'anàlisis recuperat correctament', {
            userId,
            count: rows.length,
            total: count
        });

        res.json({
            userId,
            total: count,
            analyses: rows.map(analysis => ({
                analysisId: analysis.id,
                text: analysis.text.substring(0, 100) + (analysis.text.length > 100 ? '...' : ''),
                sentiment: analysis.sentiment,
                confidence: analysis.confidence,
                model: analysis.model,
                timestamp: analysis.createdAt
            }))
        });

    } catch (error) {
        logger.error('Error en recuperar historial d\'anàlisis', {
            error: error.message,
            userId: req.params.userId
        });
        next(error);
    }
};

module.exports = {
    analyzeSentiment,
    getSentimentHistory
};