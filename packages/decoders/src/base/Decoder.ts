// Main Base Decoder As Abstract Class

export abstract class Decoder {
  abstract readonly name: string;

  abstract confidence(input: string): number;

  // Failure During Decoding Leads To NULL
  abstract decode(input: string): string | null;

  abstract explain(): string;
}
