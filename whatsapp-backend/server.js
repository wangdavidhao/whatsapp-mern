//importing
import express from 'express';
import mongoose from 'mongoose';

import Messages from './dbMessages.js';

import Pusher from 'pusher';

import cors from  'cors';

//App config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1100092",
  key: "e9d7162ca32add6f2cbc",
  secret: "f0a79758de5bb94e41af",
  cluster: "eu",
  useTLS: true
});

//Middleware
app.use(express.json());
app.use(cors());

app.use((rea,res,next) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});

//DB config
const connection_url = 'mongodb+srv://admin:PbDDbyZpXOkWXOmg@cluster0.iuitz.mongodb.net/whatsappdb?retryWrites=true&w=majority';

mongoose.connect(connection_url, {
    useCreateIndex : true,
    useNewUrlParser : true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB Connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);


        if(change.operationType === "insert") {
        const messageDetails = change.fullDocument;
        pusher.trigger("messages", "inserted", {
            name:messageDetails.name,
            message:messageDetails.message,
            timestamp:messageDetails.timestamp,
            received:messageDetails.received,
        });
    }else {
        console.log("Error triggering Pusher");
    }
    });

    
});

//????

//API routes
//200=OK
app.get('/', (req,res) => res.status(200).send('hello world'));

app.get('/messages/sync' , (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    });
});

//Listen
app.listen(port, () => console.log(`Listening on port : ${port}`));