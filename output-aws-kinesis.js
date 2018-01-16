"use strict";

const AWS = require("aws-sdk");

const PartitionableBuffer = require("./partitionable-buffer.js");
const AWSKinesisRetry = require("./aws-kinesis-retry.js");

function OutputAwsKinesis(config, eventEmitter) {
  this.eventEmitter = eventEmitter

  if (!config.region && !process.env.AWS_REGION) {
    throw Error("AWS region must be specified either through options or environment variable AWS_REGION.")
  }

  if (!config.streamName) {
    throw Error("AWS Kinesis stream name must be specified.");
  }

  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 4)) {
    throw Error("Max retries must be greater than 0 and less than or equal to 4.");
  }

  let options = {
    region: config.region,
    apiVersion: "2013-12-02",
    maxRetries: config.maxRetries || 4,
    sslEnabled: false,
    retryDelayOptions: {
      base: 100
    }
  }

  if (config.accessKeyId || process.env.AWS_ACCESS_KEY_ID) {
    options.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
  }

  if (config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY) {
    options.secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
  }

  if (config.endpoint) {
    options.endpoint = config.endpoint;
  }

  this.client = new AWSKinesisRetry(config, new AWS.Kinesis(options), new PartitionableBuffer(config));
}

OutputAwsKinesis.prototype.eventHandler = function (record, context) {
  this.client.write(record);
}

OutputAwsKinesis.prototype.start = function () {
  this.eventEmitter.on("data.parsed", this.eventHandler.bind(this))
  this.client.schedule();
}

OutputAwsKinesis.prototype.stop = function (cb) {
  this.eventEmitter.removeListener("data.parsed", this.eventHandler)
  this.client.shutdown();
  cb()
}

module.exports = OutputAwsKinesis;
