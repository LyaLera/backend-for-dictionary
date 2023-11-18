const express = require("express");
const app = express();
const { validationResult, body, param } = require("express-validator");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const connectionStringOfDB = process.env.DATABASE_CONNECTION;
const client = new MongoClient(connectionStringOfDB);
const port = 3333;
app.use(express.json());
app.use(cors());

client
  .connect()
  .then(() => {
    console.log("Connection to database successfull");
  })
  .catch((error) => {
    console.log("Connection failed");
  });

app.get("/", (req, res) => {
  res.send("Hello backend!");
});

app.get("/dictionary", async (req, res, next) => {
  try {
    let databaseWords = await client
      .db("dictionary")
      .collection("words")
      .find()
      .toArray();
    console.log(databaseWords);
    res.status(200).json({
      success: true,
      data: databaseWords.data,
    });
  } catch (err) {
    console.log(err);
    let errReport = new Error("Could not get words from DB");
    next(errReport);
  }
});

const validWord = [
  body("name")
    .notEmpty()
    .withMessage("Please type your word")
    .isLength({ min: 2, max: 60 })
    .matches(/^[A-Za-z\s]+$/)
    .trim()
    .escape(),
  body("partOfTheLang")
    .notEmpty()
    .withMessage("Please choose the part of the language")
    .matches(/^[A-Za-z\s]+$/)
    .trim()
    .escape(),
  body("gender")
    .notEmpty()
    .withMessage("Please choose the gender of the name")
    .matches(/^[A-Za-z\s]+$/)
    .trim()
    .escape(),
  body("plural")
    .notEmpty()
    .withMessage("Please type the plural form of the name")
    .matches(/^[A-Za-z\s]+$/)
    .trim()
    .escape(),
  body("topic")
    .notEmpty()
    .withMessage("Please choose the topic")
    .matches(/^[A-Za-z\s]+$/)
    .trim()
    .escape(),
  body("id").notEmpty().isUUID().trim().escape(),
];

app.post("/dictionary", validWord, async (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    try {
      let newWordDB = await client
        .db("dictionary")
        .collection("words")
        .insertOne({
          name: req.body.name,
          partOfTheLang: req.body.partOfTheLang,
          gender: req.body.gender,
          plural: req.body.plural,
          topic: req.body.topic,
          id: req.body.id,
        });
      res.status(201).json({
        success: true,
        message: "New word was saved",
      });
    } catch (err) {
      let errReport = new Error("Could not post new word to DB");
      next(errReport);
    }
  } else {
    res.status(500).send({ errors: result.array() });
  }
});

app.put(
  "/dictionary/:id",
  param("id").isUUID(),
  validWord,
  async (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      try {
        let editedWordDB = await client
          .db("dictionary")
          .collection("words")
          .updateOne(
            { id: req.params.id },
            {
              $set: {
                name: req.body.name,
                partOfTheLang: req.body.partOfTheLang,
                gender: req.body.gender,
                plural: req.body.plural,
                topic: req.body.topic,
              },
            }
          );
        if (editedWordDB.modifiedCount) {
          res.status(201).json({
            success: true,
            message: "Word was updated",
          });
        } else {
          throw new Error("Could not edit word in a DB");
        }
      } catch (err) {
        let errReport = new Error("Could not edit word in a DB");
        next(errReport);
      }
    } else {
      res.status(500).send({ errors: result.array() });
    }
  }
);

app.delete("/dictionary/:id", param("id").isUUID(), async (req, res, next) => {
  try {
    let deletedWordInDB = await client
      .db("dictionary")
      .collection("words")
      .deleteOne({ id: req.params.id });
    if (deletedWordInDB.deletedCount) {
      res.status(200).json({
        success: true,
        message: "Ward was deleted.",
      });
    } else {
      throw new Error("Could not delete word in a Database");
    }
  } catch (err) {
    let errReport = new Error("Could not delete word in a DB");
    next(errReport);
  }
});

app.listen(port, () => {
  `I'm listening port ${port}`;
});

app.all("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  (err.status = "fail"), (err.statusCode = 404);

  next(err);
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});
