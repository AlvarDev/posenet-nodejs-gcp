const bodyParser = require("body-parser");
const express = require('express');
const path = require("path");
const os = require('os');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

function validateReq(req, res, next){
  if (!("image" in req.body)) {
    res.status(404).send({ message: "image GCS path not found" });
    return;
  }

  next();
}

async function getPoses(req, res){
  
  // Getting Image path, Cloud use a Regex
  const attrs = req.body.image.split('/');
  const bucketName = attrs[2];
  const filename = attrs[attrs.length - 1];
  const imageGCS = req.body.image.replace(`gs://${bucketName}/`, "");
  const imagePath = path.join(os.tmpdir(), filename);

  console.log(`
    bucketName: ${bucketName}
    fileName: ${filename}
    imageCGS: ${imageGCS}
    imagePath: ${imagePath}
  `);

  // Downlaod from GCS
  try {
    await storage
      .bucket(bucketName)
      .file(imageGCS)
      .download({ destination: imagePath });

  } catch (err) {
    console.log(err.message);
    res.status(404).send({ message: "File not found" });
    return;
  }

  fs.unlinkSync(imagePath);
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