import { MongoClient } from "mongodb";
import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import cors from "cors";
import joi from "joi";

// Server configurations
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.listen(process.env.PORT, () => console.log(chalk.bold.green(`Server online on port ${process.env.PORT}!`)));

// Database configurations
let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect()
.then(() => {
    db = mongoClient.db(process.env.DATABASE);
    console.log(chalk.bold.green("Connected to database!"));
})
.catch((error) => console.log(chalk.bold.red("Could't connet to database!"), error));
        
// Joi schemas
const userSchema = joi.object({
    name: joi.string().required()
});

app.post("/participants", async (req, res) => {
    const {name} = req.body;

    const validation = userSchema.validate({name}, {abortEarly: false});
    if(validation.error){
        console.log(validation.error.details.map(detail => detail.message)); // TODO: erase me
        return res.status(422).send("name deve ser string não vazio!");
    }

    try{
        await db.collection("participants").insertOne({name});
        res.sendStatus(201);
    }catch(e){
        console.log("Error on POST /participants", e);
        res.sendStatus(500);
    }
});



    // const participants = {
    //    name: 'João',
    //    lastStatus: 12313123
    // }
    
    // const messages = {
    //     from: 'João',
    //     to: 'Todos',
    //     text: 'oi galera',
    //     type: 'message',
    //     time: '20:04:37'
    // }