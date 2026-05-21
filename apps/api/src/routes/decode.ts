import { Router } from 'express';
import { decodePipeline, decodeRegistry, registerDecoders } from '@rasbur/decoders';
import { batchDecodeRequestSchema, decodeRequestSchema, identifyRequestSchema } from '@rasbur/shared';
import { validate } from '../middleware/validate.js';
import { usageLimitMiddleware } from '../middleware/usageLimit.js';

export const decodeRouter = Router();

/**
 * @openapi
 * /api/decoders:
 *   get:
 *     summary: List available decoders
 *     tags:
 *       - Decode
 *     responses:
 *       200:
 *         description: List of supported decoders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DecoderInfo'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
decodeRouter.get('/decoders', (_req, res) => {
    registerDecoders();
    const decoders = decodeRegistry.getAll().map((decoder) => ({
        name: decoder.name,
        description: decoder.explain(),
    }));
    res.status(200).json(decoders);
});

/**
 * @openapi
 * /api/decode:
 *   post:
 *     summary: Decode a single input string
 *     tags:
 *       - Decode
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DecodeRequest'
 *     responses:
 *       200:
 *         description: Decoded result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DecodeResult'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
decodeRouter.post('/decode',usageLimitMiddleware, validate({ body: decodeRequestSchema }), (req, res) => {
    registerDecoders();
    const result = decodePipeline.decode(req.body.input, req.body.options);

    res.status(200).json(result);
});

/**
 * @openapi
 * /api/identify:
 *   post:
 *     summary: Identify likely encoding formats without decoding
 *     tags:
 *       - Decode
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IdentifyRequest'
 *     responses:
 *       200:
 *         description: Ranked decoder matches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IdentifyResult'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
decodeRouter.post('/identify',usageLimitMiddleware, validate({ body: identifyRequestSchema }), (req, res) => {
    registerDecoders();
    const result = decodePipeline.identify(req.body.input);
    res.status(200).json(result);
});

/**
 * @openapi
 * /api/decode/batch:
 *   post:
 *     summary: Decode multiple input strings in one request
 *     tags:
 *       - Decode
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchDecodeRequest'
 *     responses:
 *       200:
 *         description: Batch decode results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchDecodeResult'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
decodeRouter.post('/decode/batch', validate({ body: batchDecodeRequestSchema }), (req, res) => {
    registerDecoders();

    const items = req.body.inputs.map((input: string) => ({
        input,
        result: decodePipeline.decode(input),
    }));

    res.status(200).json({ items });
});
