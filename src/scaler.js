const API = require('claudia-api-builder');
const AWS = require('aws-sdk');
const path = require('path');
const s3 = new AWS.S3({
  signatureVersion: 'v4',
});
const sharp = require('sharp');

const BUCKET = 'image-scaler';
const ALLOWED_SIZES = new Set([160, 495, 768, 1200, 1600, 1920, 2560]);

const SRC_PATH = 'source';
const RESIZED_PATH = 'resized';

const api = new API();

const isAllowedSize = width => ALLOWED_SIZES.has(parseInt(width, 10));

const getRenamedFilename = (size, filename) =>
  `${RESIZED_PATH}/${size}_${path.basename(filename)}`;

const getResizeResponse = (width, filename) =>
  new api.ApiResponse(
    '',
    {
      location: `https://s3.eu-central-1.amazonaws.com/${BUCKET}/${getRenamedFilename(
        width,
        filename
      )}`,
    },
    301
  );

api.get('{width}/{imagePath}', request => {
  if (!isAllowedSize(request.pathParams.width)) {
    return new api.ApiResponse('Forbidden', { ContentType: 'text/plain' }, 403);
  }

  return s3
    .headObject({
      Bucket: BUCKET,
      Key: getRenamedFilename(
        request.pathParams.width,
        request.pathParams.imagePath
      ),
    })
    .promise()
    .then(data => {
      console.log('Found resized object, last modified at', data.LastModified);
      return getResizeResponse(
        request.pathParams.width,
        request.pathParams.imagePath
      );
    })
    .catch(err => {
      console.log('No resized image found', err);
      return s3
        .getObject({
          Bucket: BUCKET,
          Key: `${SRC_PATH}/${request.pathParams.imagePath}`,
        })
        .promise()
        .then(data => {
          console.log('received source image');
          return sharp(data.Body)
            .resize(parseInt(request.pathParams.width))
            .background({ r: 255, g: 255, b: 255, alpha: 1 })
            .flatten()
            .jpeg({ quality: 60, progressive: true })
            .toBuffer();
        })
        .then(buffer => {
          console.log('transformed image');
          return s3
            .putObject({
              Body: buffer,
              Bucket: BUCKET,
              ContentType: 'image/jpeg',
              Key: `${getRenamedFilename(
                request.pathParams.width,
                request.pathParams.imagePath
              )}`,
              ACL: 'public-read',
            })
            .promise()
            .catch(err => {
              console.log('error in saving resized image', err);
              throw err;
            });
        })
        .then(() =>
          getResizeResponse(
            request.pathParams.width,
            request.pathParams.imagePath
          )
        )
        .catch(err => {
          console.log('Error', err);

          return new api.ApiResponse(
            'Service Unavailable',
            { 'Content-Type': 'text/plain' },
            503
          );
        });
    });
});

module.exports = api;
