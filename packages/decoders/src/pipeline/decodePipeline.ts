import { Decoder, DecodeResult, DecodeStep } from '@rasbur/shared';
import { decodeRegistry } from '../registry/decodeRegistry.js';

interface DecodeOptions {
    maxDepth?: number;
    strictMode?: boolean;
    forceDecoder?: string;
}

export class DecodePipeline {
    private maxDepth = 5;

    decode(input: string, options: DecodeOptions = {}): DecodeResult {
        const steps: DecodeStep[] = [];
        let currentInput = input;
        let depth = 0;

        while (depth < (options.maxDepth || this.maxDepth)) {
            // Finding the best decoder to use

            const decoders = decodeRegistry.getAll();
            let bestDecoder: Decoder | null = null;
            let bestConfidence = 0;

            // Finding the decoder of best confidence

            for (const decoder of decoders) {
                const confidence = decoder.confidence(currentInput);
                if (confidence > bestConfidence) {
                    bestConfidence = confidence;
                    bestDecoder = decoder;
                }
            }

            // If strict mode and confidence < 0.7, we stop
            if (options.strictMode && bestConfidence < 0.7) {
                break;
            }

            // If no decoder found or confidence is 0, stop
            if (!bestDecoder || bestConfidence === 0) {
                break;
            }

            // Decode
            const output = bestDecoder.decode(currentInput);
            if (!output || output === currentInput) {
                break;
            }

            // Add Step
            steps.push({
                decoderName: bestDecoder.name,
                confidence: bestConfidence,
                input: currentInput,
                output: output,
                explanation: bestDecoder.explain(),
            });

            currentInput = output;
            depth++;
        }

        const finalOutput = steps.length > 0 ? steps[steps.length - 1]!.output : input;

        return {
            originalInput: input,
            steps,
            finalOutput,
        };
    }
}

export const decodePipeline = new DecodePipeline();
