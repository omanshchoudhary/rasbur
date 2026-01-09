export default class Decoder {
    name ="Unknown"

    confidence(input){
        throw new Error("confidence() not implemented")
    }

    decode(input){
        throw new Error("decode() not implemented");
    }

    explain(){
        return ""
    }
}