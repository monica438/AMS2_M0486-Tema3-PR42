'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SentimentAnalyses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sentiment: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'qwen2.5vl:7b'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Afegir índex per millorar les consultes per userId
    await queryInterface.addIndex('SentimentAnalyses', ['userId']);
    await queryInterface.addIndex('SentimentAnalyses', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('SentimentAnalyses');
  }
};