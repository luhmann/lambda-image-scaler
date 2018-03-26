# lambda-image-scaler

## Problem

Responsive images

*   source-images are huge
*   need to be different for a whole range of devices and viewports
*   is an interesting problem to be solved by serverless

    *   very common task in all content-heavy frontend-pages
    *   overkill to have a whole server-architecture in place for a rather simple task
    *   lots of tutorials
    *   interesting because of more advanced hardware-requirements and the potential need of C-based libraries

*   Implementation with claudia.js, lightweight AWS framework, seemed more approachable than something like `serverless`
*   ...and `claudia-api-builder`
*   what it does for you is
    *   creating the necessary roles to execute the function, every lambda-function is run with some role and shares the same permissions as that role, which makes permission handling rather easy but not straightforward
    *   creates the function for you,
        *   handles uploading,
        *   versioning and
        *   managing different stages for your function, eg. dev, stage, test,
        *   allows you to manage resources for the function
    *   and with claudia-api-builder it creates `API Gateway` configs for you that make parameter-handling in your functions more straightforward

## Implementation

*   Source Images in S3
*   One image-transformation as url-paramater configured in API Gateway
*   Lookup if transformed images exist
*   if not do the transformation
*   save the resized image in another s3 bucket
*   301 redirect to a different url

## Demo

*   https://qbu6gezys2.execute-api.eu-central-1.amazonaws.com/dev/1600/100

## Roadblocks

### Dependencies

`sharp` needs to be installed in docker container in order to have the correct binaries for the AWS lambda environment:

```
docker run -e AWS_SECRET_ACCESS_KEY='<SECRET_ACCESS_KEY>' -e AWS_ACCESS_KEY_ID='<ACCESS_KEY_ID>' -v /Users/jfd/dev/lambda-image-scaler:/var/task lambci/lambda:build-nodejs6.10 ./node_modules/.bin/claudia update --version dev --use-local-dependencies
```

### Permissions

#### Bucket Policy to set on the s3 bucket

*   The `principal` must be the role that claudia created for you in IAM
*   The `resource` must be the arn of the bucket with `/*` in the end to allow access to objects

```json
{
    "Id": "Policy1521800101848",
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1521800097305",
            "Action": "s3:*",
            "Effect": "Allow",
            "Resource": "arn:aws:s3:::image-scaler/*",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::774843948343:role/punk-api-scaler-executor"
                ]
            }
        }
    ]
}
```

### Binary Response Types

#### Problem

> Similarly, although the documentation suggests that multiple content types can be specified in the Accept header for binary responses, it seems that this breaks the conversion. This makes the current implementation useless for browsers, which by default request complex Accept headers. This means that it’s currently not possible to use the API Gateway/AWS_PROXY integration to return images that can be just included into a web page using the img tag. [ref](https://claudiajs.com/tutorials/binary-content.html)

#### Solution

*   For now solved by redirect

### Scalability

*   Much undersized

### Further Development

*   Better Code
*   Create scaled images whenever an image is added to the source-bucket, which is supposed to be easy if you hook the function up to s3-events
*   Try to get rid of the redirect
