// Express
const bodyParser = require("body-parser");
const express = require('express');
const app = express();

// Utils
const path = require("path");
const os = require('os');
const fs = require('fs');

// GCS 
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

// Tensorflow
const tf = require('@tensorflow/tfjs-node');
const posenet = require('@tensorflow-models/posenet');
const { createCanvas, Image } = require('canvas');

/**
 * Validates that the request body has the "image" attr.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 * @param {Function} next Function to be execute after validateReq
 */
function validateReq(req, res, next) {
  if (!("image" in req.body)) {
    res.status(404).send({ message: "image GCS path not found" });
    return;
  }

  next();
}

/**
 * Estimate the poses from an image.
 * 
 * @param {String} imagePath Image local path
 * 
 * @returns {Object} poses estimations
 */
async function estimatePose(imagePath) {
  
  const net = await posenet.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75
  });

  const img = new Image();
  img.src = imagePath;
  
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const input = tf.browser.fromPixels(canvas);
  return await net.estimateSinglePose(input, { flipHorizontal: false });
} 

/**
 * Request Handler.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
async function getPose(req, res){
  
  // Getting Image path, Cloud use a Regex
  const attrs = req.body.image.split('/');
  const bucketName = attrs[2];
  const filename = attrs[attrs.length - 1];
  const imageGCS = req.body.image.replace(`gs://${bucketName}/`, "");
  const imagePath = path.join(os.tmpdir(), filename);

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

  const pose = await estimatePose(imagePath);
  
  // Remove image
  fs.unlinkSync(imagePath);
  res.status(200).send(pose);
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.get("/", (_, res) => { res.send("Hello World!"); });
app.post("/get-poses", validateReq, (req, res) => {
  getPose(req, res);
});
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send({message: "Something went wrong"})
})

app.listen(8080, () => {
  console.log(`App listening on port 8080`);
  console.log('Press Ctrl+C to quit.');
});

// exports.app = app;