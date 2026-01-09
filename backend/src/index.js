import express from "express"
import { getDecoders } from "./registry/decoderRegistry.js";

const app = express()
const port = 3000

app.use(express.json())

app.get('/health', (req,res) => {
    res.json({status:"Rasbur backend alive"})
})

app.post('/decode', (req,res) => {
    const input = req.body?.input;

    if (!input) {
        return res.status(400).json({error: 'Input is required'})
    }
    const results =[]
    
    for(const decoder of getDecoders()){
        const confidence = decoder.confidence(input)
        if(confidence>0){
            const output = decoder.decode(input)

            if(output){
                results.push({
                    type: decoder.name,
                    confidence,
                    output,
                    explaination: decoder.explain()
                })
            }
        }
        
    }
    res.json({
        input,
        results
    })
})

app.listen(port, ()=>{
    console.log('Rasbur backend running on port 3000')
})