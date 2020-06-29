# posenet-nodejs-gcp
[**TensorFlow.js**](https://www.tensorflow.org/js)  is a JavaScript Library for training and deploying machine learning models in the browser and in Node.js.

Fortunately, **TensorFlow.js** has [ready-to-use](https://www.tensorflow.org/js/models) models that can be used by anyone, specially for developers with no knowledge of ML.

One of them is [**PoseNet**](https://github.com/tensorflow/tfjs-models/tree/master/posenet), a standalone model for running real-time pose estimation in the browser using TensorFlow.js. 

For browser PoseNet works perfectly, the challenge comes when we want to us it on the backend, I made a simple API to use the model and I want to share with you a couple of issue I have to resolve in order to deploy the API on GCP. _**(complete source at the end of the post)**_

### **TensorFlow vs Docker**
Docker is a powerful tool. However, use TensorFlow.js on a docker is little bit harder, messages like _Your CPU supports instructions that this TensorFlow binary was not compiled to use..._ are very frequently in this scenery.  

### **Production considerations**
[From documentation](https://www.tensorflow.org/js/guide/nodejs#production_considerations): The Node.js bindings provide a backend for TensorFlow.js that implements operations synchronously. That means when you call an operation, e.g. tf.matMul(a, b), it will block the main thread until the operation has completed.

For this reason, the bindings currently are well suited for scripts and offline tasks. If you want to use the Node.js bindings in a production application, like a webserver, you should set up a job queue or set up worker threads so your TensorFlow.js code will not block the main thread.

## So... How to resolve this?

Both issues has their own solution, build a detailed Dockerfile and use worker threads for example, but there is one resource that will resolve both with one shot:
## [Cloud Functions](https://cloud.google.com/functions)

1. Cloud Functions instances have already TensorFlow compiled. (One example that I found was  [_How to serve deep learning models using TensorFlow 2.0 with Cloud Functions_](https://cloud.google.com/blog/products/ai-machine-learning/how-to-serve-deep-learning-models-using-tensorflow-2-0-with-cloud-functions))

2. Each instance of a function handles only one concurrent request at a time. This means that while your code is processing one request, there is no possibility of a second request being routed to the same instance. Thus the original request can use the full amount of resources (CPU and memory) that you requested. [[Source]](https://cloud.google.com/functions/docs/concepts/exec#auto-scaling_and_concurrency)

**Some consideration to take are:**
* Set the max capacity of memory available.
* Starting a new function instance involves loading the runtime and your code. Requests that include function instance startup (cold starts) can be slower than requests hitting existing function instances.

> And... yes, the request is going to be slower than running on a Kubernetes for example. But this solution is a **Quick win** for developers, we are using a **trained model** in a **Serverless** environment. 
> Developers with no knowledge of ML can take advantage for this technology in an easy way.
> For future posts I will use the other solution: detailed Dockerfile and worker threads. Be patients :).

That's it, a start for developers into the ML world.

## *Code*
This API receives a _"gs://"_ path from Google Cloud Storage.
I made it that way because Cloud Functions can be invoked indirectly in response to an [event](https://cloud.google.com/functions/docs/writing/background) from [Cloud Storage](https://cloud.google.com/functions/docs/writing/background#cloud-storage-example) or [Pub/Sub](https://cloud.google.com/functions/docs/writing/background#cloud-pubsub-example).

To test locally you can uncomment the _app.listen()_ method
```javascript
// For localhost test
app.listen(8080, () => {
  console.log(`App listening on port 8080`);
  console.log('Press Ctrl+C to quit.');
});
```

and execute
```shell
node index.js
```

test locally

```shell
curl -X POST \
	http://localhost:8080/get-poses \
	-H 'Content-Type: application/json' \
	-d '{"image": "gs://your-bucket/karate.jpg"}'
```

deploy to Cloud Functions
```shell
gcloud functions deploy app --runtime nodejs10 --trigger-http --allow-unauthenticated
```


```