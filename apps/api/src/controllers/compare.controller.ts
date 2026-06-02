import type { Request, Response } from 'express';
import { decodePipeline, registerDecoders } from '@rasbur/decoders';
import { diffChars } from 'diff';

export async function compareInputs(req: Request, res: Response) {
    try {
        const { inputA, inputB, options } = req.body;

        registerDecoders();
        const resultA = decodePipeline.decode(inputA, options);
        const resultB = decodePipeline.decode(inputB, options);

        const diff = diffChars(resultA.finalOutput, resultB.finalOutput);

        return res.status(200).json({
            ok: true,
            resultA,
            resultB,
            diff
        });
    } catch (error: any) {
        return res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
}
