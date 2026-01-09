import BaseDecoder from "../decoders/Decoder"

const decoders = []

export function registerDecoder(decoder){
    if(!(decoder instanceof BaseDecoder)){
        throw new Error("Invalid Decoder")
    }
    decoders.push(decoder)
}

export function getDecoders(){
    return decoders
}