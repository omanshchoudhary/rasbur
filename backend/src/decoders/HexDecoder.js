import Decoder from "./Decoder.js";

export default class HexDecoder extends Decoder {
    name = "Hexadecimal"

    confidence(input) {
        if (!input) return 0;

        const cleanInput = input.replace(/\s+/g, '');

        if (cleanInput.length % 2 !== 0) return 0

        const hexRegex = /^[0-9a-fA-F]+$/;
        return hexRegex.test(cleanInput) ? 0.75 : 0;
    }

    decode(input) {
        try {
            const cleanInput = input.replace(/\s+/g, '');
            let result = '';

            for (let i = 0; i < cleanInput.length; i += 2) {
                const byte = parseInt(cleanInput.slice(i, i + 2), 16)
                if (isNaN(byte)) return null;
                result += String.fromCharCode(byte)
            }
            if (!result || result.includes('\u0000')) return null;

            return result;
        } catch {
            return null
        }
    }


    explain() {
        return "Hexadecimal encoding represents raw bytes using base-16 values (0–9, A–F).";
    }

}