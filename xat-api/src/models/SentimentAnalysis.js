const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SentimentAnalysis = sequelize.define('SentimentAnalysis', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    sentiment: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['positive', 'negative', 'neutral']]
        }
    },
    confidence: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: 0.0,
            max: 1.0
        }
    },
    model: {
        type: DataTypes.STRING,
        defaultValue: process.env.CHAT_API_OLLAMA_MODEL,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = SentimentAnalysis;