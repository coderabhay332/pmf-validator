
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PMF Checker API',
            version: '1.0.0',
            description: 'API documentation for PMF Checker Backend',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        token: { type: 'string' },
                    },
                },
                Task: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        browserUseId: { type: 'string' },
                        prompt: { type: 'string' },
                        status: { type: 'string', enum: ['STARTED', 'DONE', 'ERROR', 'FINALIZING'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./index.ts', './dist/index.js'], // files containing annotations as above
};

export const specs = swaggerJsdoc(options);
