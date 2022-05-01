import { MongoClient } from "mongodb";
import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import cors from "cors";
import joi from "joi";
import dayjs from "dayjs";

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
const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required(),
});

app.post("/participants", async (req, res) => {
    const {name} = req.body;
    let nameAlreadyExist = [];

    const validation = userSchema.validate({name}, {abortEarly: false});
    if(validation.error){
        console.log(validation.error.details.map(detail => detail.message)); // TODO: erase me
        return res.status(422).send("Nome deve ser string não vazio!");
    }

    try{
        nameAlreadyExist = await db.collection("participants").findOne({name});
        if(nameAlreadyExist){
            return res.status(409).send("O nome escolhido já existe!");
        }

        await db.collection("messages").insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss')
        });

        await db.collection("participants").insertOne({name, lastStatus: Date.now()});
        res.sendStatus(201);
    }catch(e){
        console.log("Error on POST /participants", e);
        res.sendStatus(500);
    }
});

app.get("/participants", async (req, res) => {
    try{
        const participants = await db.collection("participants").find().toArray();
        res.status(200).send(participants);
    }catch(e){
        console.log("Error on GET /participants", e);
        res.send(500);
    }
});

app.post("/messages", async (req, res) => {
    const {to, text, type} = req.body;
    const {user: from} = req.headers;
    let participantExists = {};

    const validation = messageSchema.validate({from, to, text, type}, {abortEarly: false});
    if(validation.error || (type !== "private_message" && type !== "message")){
        return res.status(422).send("Erro ao enviar mensagem!");
    }

    try{
        participantExists = await db.collection("participants").findOne({name: from});
        if(!participantExists){
            return res.status(422).send("Não foi possível enviar a mensagem pois você não está logado!");
        }
        await db.collection("messages").insertOne({
            from,
            to,
            text,
            type,
            time: dayjs().format('HH:mm:ss')
        });
        res.sendStatus(201);
    }catch(e){
        console.log("Error on POST /messages", e);
        res.sendStatus(500);
    }
});

app.get("/messages", async (req, res) => {
    const { user } = req.headers;
    const limit = parseInt(req.query.limit);
    
    // gabriel: 10     enviou:7     recebeu:3
    // didi:    7      enviou:5     recebeu:2
    // ana:     3      enviou:1     recebeu:2
    // julia:   3      enviou:1     recebeu:1
    // gus:     1      enviou:1     recebeu:0

    try{
        const allMessages = await db.collection("messages").find({ $or: [ { from: user }, { to: user }, { to: "Todos" }, { type: "message" } ] }).toArray();
        // const allMessages = await db.collection("messages").find({}).toArray();

        console.log("allMessages: ", allMessages.length)// TODO:erase me
        allMessages.reverse();
        if(!limit){
            console.log("No limit") // TODO:erase me
            return res.status(200).send(allMessages);
        }else{
            const messages = [];
            for(let i = 0; (i < allMessages.length && i < limit); i++){
                messages.push(allMessages[i]);
            }
            console.log(`Limit ${limit}`) // TODO:erase me
            return res.status(200).send(messages);
        }
    }catch(e){
        console.log("Error on GET/messages", e);
        res.send(500);
    }
});

app.post("/status", async (req, res) => {
    const {user: name} = req.headers;
    console.log(name);////////////////

    const validation = userSchema.validate({name}, {abortEarly: false});
    if(validation.error){
        return res.status(422).send("Erro ao atualizar status do usuário!");
    }

    try{
        const participantExists = await db.collection("participants").findOne({name});
        if(!participantExists){
            return res.sendStatus(404);
        }
        console.log(participantExists)
        // await db.collection("messages").insertOne({
        //     from,
        //     to,
        //     text,
        //     type,
        //     time: dayjs().format('HH:mm:ss')
        // });
        res.sendStatus(200);
    }catch(e){
        console.log("Error on POST /messages", e);
        res.sendStatus(500);
    }
});