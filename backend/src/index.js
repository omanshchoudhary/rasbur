import express from "express"

import { decodePipeline } from "./pipeline/decodePipeline.js";

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
    const steps = decodePipeline(input)
    res.json({
        input,
        steps
    })
})

app.listen(port, ()=>{
    console.log('Rasbur backend running on port 3000')
})