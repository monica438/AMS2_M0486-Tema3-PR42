const express = require('express');
const router = express.Router();
const { registerPrompt, getConversation, listOllamaModels } = require('../controllers/chatController');

/**
 * @swagger
 * /api/chat/prompt:
 *   post:
 *     summary: Crear o afegir prompt a una conversa
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PromptRequest'
 *           examples:
 *             nova_conversa:
 *               value:
 *                 prompt: "Hola! Com estàs?"
 *                 model: "qwen2.5vl:7b"
 *             conversa_existent:
 *               value:
 *                 conversationId: "550e8400-e29b-41d4-a716-446655440000"
 *                 prompt: "I tu què en penses?"
 *     responses:
 *       201:
 *         description: Prompt processat correctament
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromptResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/prompt', registerPrompt);

/**
 * @swagger
 * /api/chat/conversation/{id}:
 *   get:
 *     summary: Obtenir conversa amb historial complet
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversa
 *     responses:
 *       200:
 *         description: Conversa trobada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/conversation/:id', getConversation);

/**
 * @swagger
 * /api/chat/models:
 *   get:
 *     summary: Llistar models disponibles
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Llista de models
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelsList'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/models', listOllamaModels);

module.exports = router;