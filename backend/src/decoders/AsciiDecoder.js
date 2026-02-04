import Decoder from "./Decoder";

export default class AsciiDecoder extends Decoder{
    name="ASCII"

    confidence(input){
        if(!input) return 0
        const asciiRegex = /^(\d{1,3})(\s+\d{1,3})*$/
        return asciiRegex.test(input.trim()) ? 0.7 : 0
    }

    decode(input){
        try{
            const codes = input.trim().split(/\s+/).map(Number)
            if(codes.some(c => c<0 || c>127)) return null
            return String.fromCharCode(...codes)
        } catch{
            return null
        }
    }
    
    explain() {
        return "ASCII encoding represents characters as decimal numbers (0-127)."
    }
}