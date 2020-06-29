# posenet-nodejs-gcp
A simple way to use Posenet on backend (NodeJS) using Cloud Functions

```shell
curl -X POST \
	http://localhost:8080/get-poses \
	-H 'Content-Type: application/json' \
	-d '{"image": "gs://architect-demos-images/karate.jpg"}'
```
