import { Decoder } from '../base/Decoder.js';
import { DecodeResult, DecodeStep, DecodeOptions, IdentifyResult } from '@rasbur/shared';
import { decodeRegistry } from '../registry/decodeRegistry.js';

const STRICT_MODE_THRESHOLD = 0.7;

export class DecodePipeline {
    private maxDepth = 5;

    decode(input: string, options: DecodeOptions = {}): DecodeResult {
        const steps: DecodeStep[] = [];
        let currentInput = input;
        let depth = 0;
        const maxDepth = options.maxDepth ?? this.maxDepth;

        while (depth < maxDepth) {
            // Finding the best decoder to use

            const decoders = decodeRegistry.getAll();
            let bestDecoder: Decoder | null = null;
            let bestConfidence = 0;

            if (options.forceDecoder) {
                const forcedDecoder = decodeRegistry.getByName(options.forceDecoder);
                if (!forcedDecoder) {
                    break;
                }

                bestDecoder = forcedDecoder;
                bestConfidence = forcedDecoder.confidence(currentInput);
            } else {
                // Finding the decoder of best confidence
                for (const decoder of decoders) {
                    const confidence = decoder.confidence(currentInput);
                    if (confidence > bestConfidence) {
                        bestConfidence = confidence;
                        bestDecoder = decoder;
                    }
                }
            }

            // If strict mode and confidence < 0.7, we stop
            if (options.strictMode && bestConfidence < STRICT_MODE_THRESHOLD) {
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
    identify(input: string): IdentifyResult {
        const matches = decodeRegistry
            .getAll()
            .map((decoder) => ({
                name: decoder.name,
                confidence: decoder.confidence(input),
                description: decoder.explain(),
            }))
            .filter((decoder) => decoder.confidence > 0)
            .sort((a, b) => b.confidence - a.confidence);
        return {
            input,
            matches,
        };
    }
}

export const decodePipeline = new DecodePipeline();
