const express = require('express');
const app = express()
require('dotenv').config();
const cors = require('cors')
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


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


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const contestCollection = db.collection('contest')
    const userCollection = db.collection('user')
    const requestCollection = db.collection('Requested')
    const bookingCollection = db.collection('bookings')


    //PAYMENT INTENT

    app.post('/create-payment-intent', async (req, res)=>{
      const price = req.body.price;
      const priceInCent = parseFloat(price)*100;

      if(!price || priceInCent <1) return 
      //generate pay clientSecret

      const {client_secret} = await stripe.paymentIntents.create({
        amount: priceInCent,
        currency: "usd",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      })

      res.send({clientSecret: client_secret});
      


    })

    app.put('/user', async (req, res) => {
      try {
          const user = req.body;
          const query = { email: user?.email };
          const existingUser = await userCollection.findOne(query);
  
          if (existingUser) {
            
              return res.send(existingUser);
          }
  
          const newUser = {
              ...user,
              role: 'user', 
              status: 'Verified',
              timestamp: Date.now(),
          };
          const options = { upsert: true };
          const updateDoc = { $set: newUser };
          const result = await userCollection.updateOne(query, updateDoc, options);
  
          res.send(result);
      } catch (error) {
          console.error(error);
          res.status(500).send('Failed to save user');
      }
  });


    app.put('/comment', async (req,res) =>{
      try {
        const { _id, text } = req.body;
      

        const query = { _id: new ObjectId(_id) };
        const updateDoc = {
          $push: {
            comment: text,
          }
        };
        const result = await contestCollection.updateOne(query, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Failed to add comment');
      }
    
    })


    // updating stuff going on here
    app.patch('/users/update', async (req, res) => {
      try {


        const { email, role } = req.body; 
        const query = { email: email };
        const updateDoc = {
          $set: {
            role: role,
            timestamp: Date.now(),
          }
        };
        const result = await userCollection.updateOne(query, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Failed to update user role');
      }
    });


    app.patch('/status/update/:id', async (req,res) =>{
      const id = req.params.id;
      
      const query = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: 'Approved',
          timestamp: Date.now(),
        }
      };
      const result = await contestCollection.updateOne(query, updateDoc);
      res.send(result);
    })


    app.patch('/count/update/:id', async (req,res)=>{
      const id = req.params.id;
      const {addCount} = req.body;
      console.log('count from server', addCount);
      const query = {_id: new ObjectId(id)};
      const updateDoc = {
        $set:{
          participantsCount: addCount,

        }

        
      }

      const result = await contestCollection.updateOne(query, updateDoc);
      res.send(result);
    })
    

    // we post here 
    app.post('/AddContest',async (req, res) =>{
      const contest = req.body;
      const result = await contestCollection.insertOne(contest)
      res.send(result);
    })
    app.post('/booking',async (req, res) =>{
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData)
      res.send(result);
    })


    app.post('/AddRequest',async (req, res) =>{
      const contest = req.body;
      const result = await requestCollection.insertOne(contest)
      res.send(result);
    })





    //delete operation here

    app.delete('/delete/:id', async (req,res)=>{
      const id = req.params.id;
      console.log(id);

      const result = await contestCollection.deleteOne({_id: new ObjectId(id)});
      res.send(result);
    })


    app.get('/users', async (req, res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    
    })

    app.get('/user/:email', async (req, res) =>{
      const email = req.params.email;
      const result = await userCollection.findOne({email: email});
      res.send(result);
    })


    app.get('/promotion', async (req, res) => {
      const result = await advertiseCollection.find().toArray();
      
      res.send(result);
    })
    app.get('/AllContest/id/:id', async (req, res) => {
      const params = req.params.id;
      
      const result = await contestCollection.find({_id: new ObjectId(params)}).toArray();
    
      
      res.send(result);
    })

    app.get('/AllContest/:search', async (req, res) =>{
      const search = req.params.search;
      console.log(search);
      const result = await contestCollection.find({Category: search}).toArray()
      res.send(result)
    
    })

    app.get('/AllContest', async (req,res) =>{
      const result = await contestCollection.find().toArray()
      res.send(result)
    
    })

    app.get('/MyCreatedContest/:email', async (req,res)=>{
      const email = req.params.email;
      console.log(email)

      const result = await contestCollection.find({CreatorEmail: email}).toArray();
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
  console.log(`Contestify is running on port ${port}`)
})