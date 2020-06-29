const bodyParser = require("body-parser");
const express = require('express');
const path = require("path");
const tmp = require("tmp");

const app = express();
const PORT = process.env.PORT || 8080;

function validateReq(req, res, next){
  if (!("image" in req.body)) {
    res.status(404).send({ message: "image GCS path not found" });
    return;
  }

  next();
}

function getPoses(req, res){
  res.status(200).send({sucess: true});
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.get("/", (_, res) => { res.send("Hello World!"); });
app.post("/get-poses", validateReq, (req, res) => {
  getPoses(req, res);
});


app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

// exports.app = app;