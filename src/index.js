import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

let db = null;
const mongoClient = MongoClient(process.env.MONGO_URI);
mongoClient.connect();
db = mongoClient.db(process.env.DATABASE)

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