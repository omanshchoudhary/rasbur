import { Router } from 'express';
import { decodePipeline, Decoder, decodeRegistry, registerDecoders } from '@rasbur/decoders';
import { decodeRequestSchema } from '@rasbur/shared';
import { validate } from '../middleware/validate.js';

export const decodeRouter = Router();

decodeRouter.get('/decoders', (_req, res) => {
    registerDecoders();
    const decoders = decodeRegistry.getAll().map((decoder) => ({
        name: decoder.name,
        description: decoder.explain(),
    }));
    res.status(200).json(decoders);
});

decodeRouter.post('/decode', validate({ body: decodeRequestSchema }), (req, res) => {
    registerDecoders();
    const result = decodePipeline.decode(req.body.input, req.body.options);

    res.status(200).json(result);
});
