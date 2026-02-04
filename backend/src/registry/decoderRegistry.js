import Decoder from "../decoders/Decoder.js"
import Base64Decoder from "../decoders/Base64Decoder.js"
import UrlDecoder from "../decoders/UrlDecoder.js";
import HexDecoder from "../decoders/HexDecoder.js";
import BinaryDecoder from "../decoders/BinaryDecoder.js";
import ROT13Decoder from "../decoders/ROT13Decoder.js";

const decoders = []

registerDecoder(new Base64Decoder())
registerDecoder(new UrlDecoder())
registerDecoder(new HexDecoder())
registerDecoder(new BinaryDecoder())
registerDecoder(new ROT13Decoder())

export function registerDecoder(decoder){
    if(!(decoder instanceof Decoder)){
        throw new Error("Invalid Decoder")
    }
    decoders.push(decoder)
}

export function getDecoders(){
    return decoders
}