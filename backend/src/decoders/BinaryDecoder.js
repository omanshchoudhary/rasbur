import Decoder from "./Decoder.js";

export default class BinaryDecoder extends Decoder {
    name = "Binary"

    confidence(input) {
        if (!input) return 0

        const cleanInput = input.trim()
        const binaryRegex = /^([01]{8})(\s+[01]{8})+$/;
        if (!binaryRegex.test(cleanInput)) return 0;
        return 0.85
    }

    decode(input) {
        try {
            const bytes = input.trim().split(/\s+/).map(b => {
                if (b.length !== 8) return NaN;
                return parseInt(b, 2)
            })
                
            if (bytes.some(b => isNaN(b))) return null;

            const decoded = String.fromCharCode(...bytes);
            if (!decoded || decoded.includes('\uFFFD')) {
                return null;
            }

            return decoded;
        } catch{
            return null
        }
    }


    explain() {
        return "Binary encoding represents characters as sequences of 8-bit binary values.";
    }
}

