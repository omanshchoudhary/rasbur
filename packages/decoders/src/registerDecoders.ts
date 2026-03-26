import { AsciiDecoder } from './decoders/AsciiDecoder.js';
import { Base32Decoder } from './decoders/Base32Decoder.js';
import { Base58Decoder } from './decoders/Base58Decoder.js';
import { Base64Decoder } from './decoders/Base64Decoder.js';
import { Base85Decoder } from './decoders/Base85Decoder.js';
import { BinaryDecoder } from './decoders/BinaryDecoder.js';
import { CaesarCipherDecoder } from './decoders/CaesarCipherDecoder.js';
import { HashIdentifier } from './decoders/HashIdentifier.js';
import { HexDecoder } from './decoders/HexDecoder.js';
import { HtmlEntityDecoder } from './decoders/HtmlEntityDecoder.js';
import { JsonStringifyDecoder } from './decoders/JsonStringifyDecoder.js';
import { JWTDecoder } from './decoders/JWTDecoder.js';
import { MorseDecoder } from './decoders/MorseDecoder.js';
import { PunycodeDecoder } from './decoders/PunycodeDecoder.js';
import { QuotedPrintableDecoder } from './decoders/QuotedPrintableDecoder.js';
import { ROT13Decoder } from './decoders/ROT13Decoder.js';
import { UnicodeEscapeDecoder } from './decoders/UnicodeEscapeDecoder.js';
import { UrlDecoder } from './decoders/UrlDecoder.js';
import { decodeRegistry } from './registry/decodeRegistry.js';

let isRegistered = false;

export const registerDecoders = (): void => {
    if (isRegistered) return;

    decodeRegistry.register(new Base64Decoder());
    decodeRegistry.register(new UrlDecoder());
    decodeRegistry.register(new HexDecoder());
    decodeRegistry.register(new BinaryDecoder());
    decodeRegistry.register(new ROT13Decoder());
    decodeRegistry.register(new AsciiDecoder());
    decodeRegistry.register(new MorseDecoder());
    decodeRegistry.register(new Base32Decoder());
    decodeRegistry.register(new JWTDecoder());
    decodeRegistry.register(new Base58Decoder());
    decodeRegistry.register(new Base85Decoder());
    decodeRegistry.register(new HtmlEntityDecoder());
    decodeRegistry.register(new PunycodeDecoder());
    decodeRegistry.register(new HashIdentifier());
    decodeRegistry.register(new UnicodeEscapeDecoder());
    decodeRegistry.register(new CaesarCipherDecoder());
    decodeRegistry.register(new QuotedPrintableDecoder());
    decodeRegistry.register(new JsonStringifyDecoder());

    isRegistered=true;
};
