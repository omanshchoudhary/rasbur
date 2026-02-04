import Decoder from "./Decoder";

export default class Base32Decoder extends Decoder {
    name = "Base32";

    confidence(input) {
        if (!input) return 0;
        const cleanInput = input.replace(/\s+/g, "").toUpperCase();
        if (cleanInput.length % 8 !== 0) return 0;
        const base32Regex = /^[A-Z2-7]+=*$/;
        return base32Regex.test(cleanInput) ? 0.8 : 0;
    }

    decode(input) {
        try {
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            const cleanInput = input
                .replace(/\s+/g, "")
                .toUpperCase()
                .replace(/=+$/, "");
            let bits = "";
            for (const char of cleanInput) {
                const val = alphabet.indexOf(char);
                if (val === -1) return null;
                bits += val.toString(2).padStart(5, "0");
            }
            const bytes = bits.match(/.{1,8}/g) || [];
            const result = bytes
                .map((b) => String.fromCharCode(parseInt(b.padEnd(8, "0"), 2)))
                .join("");
            return result || null;
        } catch {
            return null;
        }
    }

    explain() {
        return "Base32 encodes binary data using 32 characters (A-Z and 2-7) for systems that struggle with special characters.";
    }
}
