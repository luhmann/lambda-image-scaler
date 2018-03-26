# 🥒 Lambda Image Scaler

## Problem

**Responsive images**

*   source-images are huge, but not available at build-time
*   need to be different for a whole range of devices and viewports
*   is an interesting problem to be solved by serverless

    *   very common task in all content-heavy frontend-pages
    *   overkill to have a whole server-architecture in place for a rather simple task
    *   lots of tutorials
    *   interesting because of more advanced hardware-requirements and the potential need of C-based libraries

*   Implementation with claudia.js, lightweight AWS framework, seemed more approachable than something like `serverless`
*   ...and `claudia-api-builder`
*   `sharp` as the library that handles the heavy-lifting for us
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

~~https://qbu6gezys2.execute-api.eu-central-1.amazonaws.com/dev/1600/100.jpg~~ (taken offline, spin up your own if you like)

## Setup

### AWS API Access

Create a user with these permission:

*   `AWSLambdaFullAccess`
*   `IAMFullAccess`
*   `AmazonAPIGatewayAdministrator`

## Roadblocks

### Supported Node Version

The newest node version currently (2018-03) supported by AWS Lambda is `6.10.*`

### Dependencies

`sharp` needs to be installed in docker container in order to have the correct binaries for the AWS lambda environment. It is usually best to just run all claudia operations in that container to not run into any issues with claudia checking the correctly bundled dependencies:

```
docker run -e AWS_SECRET_ACCESS_KEY='<SECRET_ACCESS_KEY>' -e AWS_ACCESS_KEY_ID='<ACCESS-KEY>' -v "$PWD":/var/task lambci/lambda:build-nodejs6.10 ./node_modules/.bin/claudia create --name punk-api-scaler --region eu-central-1 --version dev --api-module src/scaler --timeout 10 --memory 1536
```

```
docker run -e AWS_SECRET_ACCESS_KEY='<SECRET_ACCESS_KEY>' -e AWS_ACCESS_KEY_ID='<ACCESS_KEY_ID>' -v "$PWD":/var/task lambci/lambda:build-nodejs6.10 ./node_modules/.bin/claudia update --version dev
```

### Permissions

#### Bucket Policy to set on the s3 bucket

*   The `principal` must be the role that claudia created for you in IAM
*   The `resource` must be the arn of the bucket with `/*` in the end to allow access to objects
*   can be created with the [policy generator](http://awspolicygen.s3.amazonaws.com/policygen.html)

```json
{
    "Id": "<some-id>",
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "<some-sid>",
            "Action": "s3:*",
            "Effect": "Allow",
            "Resource": "arn:aws:s3:::<bucket-name>/*",
            "Principal": {
                "AWS": ["<executor-role-defined-by-claudia>"]
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

*   Better Code (Modern JS, TS, tests)
*   Create scaled images whenever an image is added to the source-bucket, which is supposed to be easy if you hook the function up to s3-events
*   Try to get rid of the redirect
*   More Transformations
*   More MIME-Types (the day they want the animated gif)
*   Fancy stuff (yo crop to the face)
