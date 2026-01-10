import Decoder from "./Decoder.js";

export default class UrlDecoder extends Decoder {
    name = "URL Encoding"

    confidence(input) {
        if (!input) return 0;

        const urlPattern = /%[0-9A-Fa-f]{2}/g
        const matches = input.match(urlPattern)

        if (!matches) return 0

        const ratio = matches.length / input.length
        return ratio > 0.05 ? 0.7 : 0.4;
    }

    decode(input) {
        try {
            const decoded = decodeURIComponent(input)

            if (decoded === input) return null;

            return decoded
        } catch {
            return null
        }
    }

    explain() {
        return "URL encoding replaces reserved or unsafe characters using % followed by hexadecimal values.";
    }

}