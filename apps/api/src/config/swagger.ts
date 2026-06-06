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
                        requestId: {
                            type: 'string',
                            example: 'fac397c6-b443-4ca5-9350-98b2b62f290d',
                        },
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
                ApiKeyListItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '64bf78ab12cd34ef56ab7890' },
                        name: { type: 'string', example: 'My API Key' },
                        prefix: { type: 'string', example: 'rasbur_sk_1a2b3c4d' },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['decode', 'history', 'share', 'compare'],
                            },
                            example: ['decode', 'compare'],
                        },
                        expiresAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            example: '2026-07-03T18:00:00.000Z',
                        },
                        isActive: { type: 'boolean', example: true },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-06-03T18:00:00.000Z',
                        },
                    },
                },
                ApiKeyUsage: {
                    type: 'object',
                    properties: {
                        keyId: { type: 'string', example: '64bf78ab12cd34ef56ab7890' },
                        usageCount: {
                            type: 'integer',
                            example: 1543,
                            description: 'Lifetime request count',
                        },
                        today: {
                            type: 'integer',
                            example: 27,
                            description: "Requests made in today's window",
                        },
                        limit: {
                            type: 'integer',
                            example: 1000,
                            description: 'Daily request limit for the key',
                        },
                        remaining: { type: 'integer', example: 973 },
                        resetSeconds: {
                            type: 'integer',
                            example: 43200,
                            description: 'Seconds until the daily window resets',
                        },
                        lastUsedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            example: '2026-06-06T09:15:00.000Z',
                        },
                    },
                },
            },
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description:
                        'JWT access token issued on web sign-in. Send as `Authorization: Bearer <token>`.',
                },
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'Programmatic access key. Send as `X-API-Key: rasbur_sk_...`.',
                },
            },
        },
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    },
    apis: ['./src/app.ts', './src/routes/*.ts'],
});
