# lambda-image-scaler

*   Implementation with claudia.js
*   ...and api

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

*   Solved by redirect

### Scalability

*   Much undersized
