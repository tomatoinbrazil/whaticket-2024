import AWS from 'aws-sdk'
// REACT_APP_AWS_ACCESS_KEY_ID=AKIAQ3EGVIPIDVPXA7IW
// REACT_APP_AWS_SECRET_ACCESS_KEY=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
// REACT_APP_AWS_REGION=us-east-1
// REACT_APP_S3_BUCKET_NAME=logycatecnologia

const config = new AWS.Config({
  accessKeyId: 'AKIAQ3EGVIPIDVPXA7IW',
  secretAccessKey: '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',
  region: 'us-east-1',
})
const s3 = new AWS.S3(config)

const signedUrlExpireSeconds = 400

export function getImageAws(key) {
  console.log({region: process.env.AWS_REGION})
  return s3.getSignedUrl('getObject', {
    Bucket: `logycatecnologia/uploads-flows`,
    Key: key,
    Expires: signedUrlExpireSeconds,
  })
}