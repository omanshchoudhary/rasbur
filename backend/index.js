import express from "express"
const app = express()
const port = 3000

app.use(express.json())

app.get('/health', (req,res) => {
    res.json({status:"Rasbur backend alive"})
})

app.post('/decode', (req,res) => {
    console.log(req.body)
    const input = req.body?.input;
    if (!input) {
        return res.status(400).json({error: 'Input is required'})
    }
    res.json({
        received: input,
        message: 'Decoder pipeline coming soon'
    })
})

app.listen(port, ()=>{
    console.log('Rasbur backend running on port 3000')
})