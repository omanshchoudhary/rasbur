import type { DecodeResult } from '@rasbur/shared';

type DecodePipelineProps = {
    steps: DecodeResult['steps'];
};

function getConfidenceTone(confidence: number): string {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.5) return 'confidence-mid';
    return 'confidence-low';
}

function getConfidenceTier(confidence: number): 'high' | 'mid' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'mid';
    return 'low';
}

export default function DecodePipeline({ steps }: DecodePipelineProps) {
    if (steps.length === 0) {
        return <p className="result-empty-text">No decoding steps were applied.</p>;
    }

    return (
        <ol className="pipeline-list">
            {steps.map((step, index) => {
                const tier = getConfidenceTier(step.confidence);

                return (
                    <li
                        key={`${step.decoderName}-${index}`}
                        className={`pipeline-item pipeline-item--${tier}`}
                    >
                    <div className="pipeline-connector" aria-hidden="true" />

                        <div className={`pipeline-card pipeline-card--${tier}`}>
                        <div className="pipeline-top">
                            <div className="pipeline-title-group">
                                <span className="pipeline-index">Step {index + 1}</span>
                                <strong>{step.decoderName}</strong>
                            </div>

                            <span
                                className={`confidence-chip ${getConfidenceTone(step.confidence)}`}
                            >
                                {step.confidence.toFixed(2)}
                            </span>
                        </div>

                        <div className="pipeline-grid">
                            <div className="pipeline-block">
                                <p className="block-label">Input</p>
                                <pre>{step.input}</pre>
                            </div>

                            <div className="pipeline-block">
                                <p className="block-label">Output</p>
                                <pre>{step.output}</pre>
                            </div>
                        </div>

                        <div className="pipeline-block">
                            <p className="block-label">Explanation</p>
                            <p className="step-copy">{step.explanation}</p>
                        </div>
                    </div>
                    </li>
                );
            })}
        </ol>
    );
}
