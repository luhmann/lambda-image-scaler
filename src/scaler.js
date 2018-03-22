const API = require('claudia-api-builder');
const AWS = require('aws-sdk');
const path = require('path');
const s3 = new AWS.S3({
  signatureVersion: 'v4',
});
const sharp = require('sharp');

const BUCKET = 'punk-api-images';
const ALLOWED_SIZES = new Set([160]);

const SRC_PATH = 'source';
const RESIZED_PATH = 'scaler';

const api = new API();

const isAllowedSize = width => ALLOWED_SIZES.has(parseInt(width, 10));

const getRenamedFilename = filename =>
  `${RESIZED_PATH}/${path.basename(filename, '.png')}.jpg`;

api.get('{width}/{imagePath}', request => {
  if (!isAllowedSize(request.pathParams.width)) {
    return new api.ApiResponse('Forbidden', { ContentType: 'text/plain' }, 403);
  }

  return s3
    .getObject({
      Bucket: BUCKET,
      Key: `${SRC_PATH}/${request.pathParams.imagePath}`,
    })
    .promise()
    .then(data => {
      return sharp(data.Body)
        .resize(parseInt(request.pathParams.width))
        .background({ r: 255, g: 255, b: 255, alpha: 1 })
        .flatten()
        .jpeg({ quality: 60, progressive: true })
        .toBuffer();
    })
    .then(buffer =>
      s3
        .putObject({
          Body: buffer,
          Bucket: BUCKET,
          ContentType: 'image/jpeg',
          Key: `${getRenamedFilename(request.pathParams.imagePath)}`,
        })
        .promise()
    )
    .then(() => {
      return new api.ApiResponse(
        '',
        {
          location: `https://s3.eu-central-1.amazonaws.com/punk-api-images/${getRenamedFilename(
            request.pathParams.imagePath
          )}`,
        },
        301
      );
    })
    .catch(err => {
      console.log('Error', err);

      return new api.ApiResponse(
        'Service Unavailable',
        { 'Content-Type': 'text/plain' },
        503
      );
    });
});

module.exports = api;
