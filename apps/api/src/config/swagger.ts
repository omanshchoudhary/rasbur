import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Rasbur API',
            version: '0.1.0',
            description: 'API for identifying and decoding encoded or obfuscated strings.',
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}`,
            },
        ],
        components: {
            schemas: {
                HealthResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        uptime: { type: 'number', example: 12.34 },
                        timestamp: { type: 'string', format: 'date-time' },
                        environment: {
                            type: 'string',
                            enum: ['development', 'production', 'test'],
                            example: 'development',
                        },
                        requestId: { type: 'string', example: 'fac397c6-b443-4ca5-9350-98b2b62f290d' },
                    },
                },
                DecoderInfo: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'Base64' },
                        description: { type: 'string' },
                    },
                },
                DecodeOptions: {
                    type: 'object',
                    properties: {
                        maxDepth: { type: 'integer', minimum: 1, maximum: 10, example: 5 },
                        strictMode: { type: 'boolean', example: false },
                        forceDecoder: { type: 'string', example: 'Base64' },
                    },
                },
                DecodeRequest: {
                    type: 'object',
                    required: ['input'],
                    properties: {
                        input: { type: 'string', example: 'SGVsbG8=' },
                        options: {
                            $ref: '#/components/schemas/DecodeOptions',
                        },
                    },
                },
                DecodeStep: {
                    type: 'object',
                    properties: {
                        decoderName: { type: 'string', example: 'Base64' },
                        confidence: { type: 'number', example: 0.9 },
                        input: { type: 'string', example: 'SGVsbG8=' },
                        output: { type: 'string', example: 'Hello' },
                        explanation: { type: 'string' },
                    },
                },
                DecodeResult: {
                    type: 'object',
                    properties: {
                        originalInput: { type: 'string', example: 'SGVsbG8=' },
                        steps: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/DecodeStep' },
                        },
                        finalOutput: { type: 'string', example: 'Hello' },
                    },
                },
                IdentifyRequest: {
                    type: 'object',
                    required: ['input'],
                    properties: {
                        input: { type: 'string', example: 'SGVsbG8=' },
                    },
                },
                IdentifyMatch: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'Base64' },
                        confidence: { type: 'number', example: 0.9 },
                        description: { type: 'string' },
                    },
                },
                IdentifyResult: {
                    type: 'object',
                    properties: {
                        input: { type: 'string', example: 'SGVsbG8=' },
                        matches: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/IdentifyMatch' },
                        },
                    },
                },
                BatchDecodeRequest: {
                    type: 'object',
                    required: ['inputs'],
                    properties: {
                        inputs: {
                            type: 'array',
                            minItems: 1,
                            maxItems: 50,
                            items: { type: 'string', example: 'SGVsbG8=' },
                        },
                    },
                },
                BatchDecodeItem: {
                    type: 'object',
                    properties: {
                        input: { type: 'string', example: 'SGVsbG8=' },
                        result: { $ref: '#/components/schemas/DecodeResult' },
                    },
                },
                BatchDecodeResult: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/BatchDecodeItem' },
                        },
                    },
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'Validation error' },
                        errors: {
                            type: 'array',
                            items: { type: 'object' },
                        },
                        requestId: { type: 'string' },
                    },
                },
                RateLimitError: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'Too many requests' },
                        requestId: { type: 'string' },
                    },
                },
            },
        },
    },
    apis: ['./src/app.ts', './src/routes/*.ts'],
});
