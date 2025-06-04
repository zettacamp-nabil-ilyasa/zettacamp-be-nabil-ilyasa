// *************** IMPORT LIBRARY *************** 
const express = require('express')

// *************** IMPORT MODULE *************** 
const ConnectDB = require('./utils/mongoose')

const app = express()

async function startServer(){
    try {
        await ConnectDB()
        console.log('✅ MongoDB connected successfully')
    
        
    app.get('/', (req, res) => {
        res.send('Hello World!')
    })
    
    app.listen(3000, () => {
        console.log('Listening on port 3000!')
    })
    }
    catch (err) {
        console.log(err)
    }
}

startServer()



