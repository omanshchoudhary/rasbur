import { Router } from 'express';
import { decodePipeline, decodeRegistry, registerDecoders } from '@rasbur/decoders';
import { batchDecodeRequestSchema, decodeRequestSchema, identifyRequestSchema } from '@rasbur/shared';
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

decodeRouter.post('/identify', validate({ body: identifyRequestSchema }), (req, res) => {
    registerDecoders();
    const result = decodePipeline.identify(req.body.input);
    res.status(200).json(result);
});
decodeRouter.post('/decode/batch', validate({ body: batchDecodeRequestSchema }), (req, res) => {
    registerDecoders();

    const items = req.body.inputs.map((input: string) => ({
        input,
        result: decodePipeline.decode(input),
    }));

    res.status(200).json({ items });
});
