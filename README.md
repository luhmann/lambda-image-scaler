# lambda-image-scaler

`sharp` needs to be installed in docker container in order to have the correct binaries for the AWS lambda environment:

```
docker run -e AWS_SECRET_ACCESS_KEY='<SECRET_ACCESS_KEY>' -e AWS_ACCESS_KEY_ID='<ACCESS_KEY_ID>' -v /Users/jfd/dev/lambda-image-scaler:/var/task lambci/lambda:build-nodejs6.10 ./node_modules/.bin/claudia update --version dev --use-local-dependencies
```
