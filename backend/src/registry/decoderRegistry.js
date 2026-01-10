import BaseDecoder from "../decoders/Decoder.js"
import Base64Decoder from "../decoders/Base64Decoder.js"
import UrlDecoder from "../decoders/UrlDecoder.js";

const decoders = []

registerDecoder(new Base64Decoder());
registerDecoder(new UrlDecoder())
export function registerDecoder(decoder){
    if(!(decoder instanceof BaseDecoder)){
        throw new Error("Invalid Decoder")
    }
    decoders.push(decoder)
}

export function getDecoders(){
    return decoders
}