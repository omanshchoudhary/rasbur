import { getDecoders } from "../registry/decoderRegistry.js";

const MAX_DEPTH = 2;

export function decodePipeline(input) {
    const steps = []
    let current = input

    for (let depth = 0; depth < MAX_DEPTH; depth++) {
        let bestResult = null

        for (let decoder of getDecoders()) {
            const confidence = decoder.confidence(current)

            if (confidence <= 0) continue

            const output = decoder.decode(current)
            if (!output || output === current) continue

            if (!bestResult || bestResult.confidence < confidence) {
                bestResult = {
                    type: decoder.name,
                    confidence,
                    input: current,
                    output,
                    explanation: decoder.explain()
                }
            }

        }
        if (!bestResult) break;
        steps.push(bestResult)
        current=bestResult.output
    }
    return steps;    
}