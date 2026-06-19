import { Decoder } from '../base/Decoder.js';
import { DecodeResult, DecodeStep, DecodeOptions, IdentifyResult } from '@rasbur/shared';
import { decodeRegistry } from '../registry/decodeRegistry.js';
import { plaintextScore } from '../utils/textScore.js';

const STRICT_MODE_THRESHOLD = 0.7;
// Candidate outputs scoring below this look like garbage and are skipped
const QUALITY_GATE = 0.3;
// Upper bound on total pipeline time, checked between layers (PRD task 45)
const TIME_BUDGET_MS = 2000;

interface StepCandidate {
    decoder: Decoder;
    confidence: number;
    output: string;
}

export class DecodePipeline {
    private maxDepth = 5;

    decode(input: string, options: DecodeOptions = {}): DecodeResult {
        const steps: DecodeStep[] = [];
        let currentInput = input;
        const maxDepth = options.maxDepth ?? this.maxDepth;
        const deadline = Date.now() + TIME_BUDGET_MS;
        // Outputs already visited — prevents A -> B -> A decode cycles
        const seen = new Set<string>([input]);

        while (steps.length < maxDepth && Date.now() < deadline) {
            const best = options.forceDecoder
                ? this.runForcedDecoder(currentInput, options.forceDecoder)
                : this.findBestCandidate(currentInput, seen);

            if (!best) break;

            if (options.strictMode && best.confidence < STRICT_MODE_THRESHOLD) {
                break;
            }

            steps.push({
                decoderName: best.decoder.name,
                confidence: best.confidence,
                input: currentInput,
                output: best.output,
                explanation: best.decoder.explain(),
            });

            seen.add(best.output);
            currentInput = best.output;
        }

        const finalOutput = steps.length > 0 ? steps[steps.length - 1]!.output : input;

        return {
            originalInput: input,
            steps,
            finalOutput,
        };
    }

    // The user explicitly chose this decoder, so the output-quality gate is
    // skipped — show them exactly what their decoder produces.
    private runForcedDecoder(input: string, name: string): StepCandidate | null {
        const decoder = decodeRegistry.getByName(name);
        if (!decoder) return null;

        const output = decoder.decode(input);
        if (!output || output === input) return null;

        return { decoder, confidence: decoder.confidence(input), output };
    }

    // Trial-decode every claiming decoder and pick the best by
    // inputShape * outputQuality — a decoder that LOOKS right but produces
    // garbage loses to one that produces real text.
    private findBestCandidate(input: string, seen: Set<string>): StepCandidate | null {
        const candidates = decodeRegistry
            .getAll()
            .map((decoder) => ({ decoder, shape: decoder.confidence(input) }))
            .filter((candidate) => candidate.shape > 0)
            .sort((a, b) => b.shape - a.shape);

        let best: StepCandidate | null = null;

        for (const { decoder, shape } of candidates) {
            const output = decoder.decode(input);
            if (!output || output === input || seen.has(output)) continue;

            const quality = plaintextScore(output);
            if (quality < QUALITY_GATE) continue;

            const effective = Math.round(shape * quality * 100) / 100;
            if (!best || effective > best.confidence) {
                best = { decoder, confidence: effective, output };
            }
        }

        return best;
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
