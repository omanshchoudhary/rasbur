import Decoder from "./Decoder.js"

export default class Base64Decoder extends Decoder {
    name = "Base64"

    confidence(input) {
        if (!input) return 0;
        const cleanInput = input.replace(/\s+/g, '');
        if (cleanInput.length % 4 !== 0) return 0;
        const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
        return base64Regex.test(cleanInput) ? 0.8 : 0;
    }

    decode(input) {
        try {
            const cleanInput = input.replace(/\s+/g, '');
            const decoded = Buffer.from(cleanInput, 'base64').toString('utf-8')
            if (!decoded || decoded.includes('\ufffd')) {
                return null
            }
            return decoded
        } catch {
            return null
        }
    }

    explain() {
        return "Base64 encodes binary data into ASCII characters so it can be safely transmitted over text-based systems.";
    }

}