const express = require("express")
const app = express()
const { validationResult, body, param } = require("express-validator")
const cors = require("cors")
const { MongoClient } = require("mongodb")
require("dotenv").config()
const connectionStringOfDB = process.env.DATABASE_CONNECTION
const client = new MongoClient(connectionStringOfDB)
const port = 3333
app.use(express.json())
app.use(cors())

app.listen(port, () => {
    `I'm listening port ${port}`
})