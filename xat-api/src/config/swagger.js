const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Xat API',
            version: '1.0.0',
            description: 'API per gestionar converses i prompts amb Ollama'
        },
        servers: [
            {
                url: 'http://127.0.0.1:3000',
                description: 'Servidor de desenvolupament'
            }
        ],
        components: {
            schemas: {
                Conversation: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        prompts: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Prompt'
                            }
                        }
                    }
                },
                Prompt: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        prompt: {
                            type: 'string'
                        },
                        response: {
                            type: 'string'
                        },
                        model: {
                            type: 'string'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        conversationId: {
                            type: 'string',
                            format: 'uuid'
                        }
                    }
                },
                PromptRequest: {
                    type: 'object',
                    required: ['prompt'],
                    properties: {
                        conversationId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID de conversa existent (opcional)'
                        },
                        prompt: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 5000
                        },
                        model: {
                            type: 'string',
                            default: 'qwen2.5vl:7b'
                        },
                        stream: {
                            type: 'boolean',
                            default: false
                        }
                    }
                },
                PromptResponse: {
                    type: 'object',
                    properties: {
                        conversationId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        promptId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        prompt: {
                            type: 'string'
                        },
                        response: {
                            type: 'string'
                        },
                        model: {
                            type: 'string'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string'
                        },
                        error: {
                            type: 'string'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                ModelsList: {
                    type: 'object',
                    properties: {
                        total_models: {
                            type: 'integer'
                        },
                        models: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    modified_at: { type: 'string', format: 'date-time' },
                                    size: { type: 'integer' },
                                    digest: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                BadRequest: {
                    description: 'Dades invàlides',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'Recurs no trobat',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                ServerError: {
                    description: 'Error intern del servidor',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Prompts',
                description: 'Gestió de prompts i respostes'
            },
            {
                name: 'Conversations',
                description: 'Gestió de converses'
            },
            {
                name: 'Chat',
                description: 'Configuració i models'
            }
        ]
    },
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);