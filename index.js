const express = require('express');
const app = express()
require('dotenv').config();
const cors = require('cors')

// const cookieParser = require('cookie-parser')

// const jwt = require('jsonwebtoken')
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;

//middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,
  }

app.use(cors(corsOptions))
app.use(express.json())
// app.use(cookieParser())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lblkdq0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    const db = client.db('Contestify')
    const advertiseCollection = db.collection('promotion')


    
    app.get('/promotion', async (req,res)=>{
        const result = await advertiseCollection.find().toArray();
        console.log(result)
        res.send(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello there from contestify..')
  })


app.listen(port, () => {
    console.log(`StayVista is running on port ${port}`)
  })