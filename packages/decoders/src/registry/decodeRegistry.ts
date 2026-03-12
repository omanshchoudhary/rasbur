import { Decoder } from '@rasbur/shared';

class DecodeRegistry {
  private decoders: Decoder[] = [];
  register(decoder: Decoder): void {
    this.decoders.push(decoder);
  }
  getAll(): Decoder[] {
    return this.decoders;
  }
  getByName(name: string): Decoder | undefined {
    return this.decoders.find(d => d.name === name);
  }
}
export const decodeRegistry = new DecodeRegistry();