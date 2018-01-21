"use strict";

const AWS = require("aws-sdk");
const KinesisBuffer = require("./lib/kinesis-buffer.js");
const KinesisRetry = require("./lib/kinesis-retry.js");

function OutputAwsKinesis(options, eventEmitter) {
  this.eventEmitter = eventEmitter;
  this.msFlushRate = typeof options.msFlushRate == "undefined" ? 60000 : options.msFlushRate;
  this.records = [];

  let kinesisBufferOptions = {
    maxRecords: options.maxRecords,
    maxBytes: options.maxBytes,
    partitionKeyField: options.partitionKeyField,
    partitionKey: options.partitionKey
  };

  this.kinesisBuffer = new KinesisBuffer(kinesisBufferOptions);

  this.region = typeof options.region == "undefined" ? process.env.AWS_REGION : options.region;
  this.maxRetries = typeof options.maxRetries == "undefined" ? 3 : options.maxRetries;

  let kinesisOptions = {
    region: this.region,
    apiVersion: "2013-12-02",
    maxRetries: this.maxRetries,
    sslEnabled: false,
    retryDelayOptions: {
      base: 100
    }
  };

  if (typeof options.accessKeyId != "undefined" || process.env.AWS_ACCESS_KEY_ID) {
    kinesisOptions.accessKeyId = options.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
  }

  if (typeof options.secretAccessKey != "undefined" || process.env.AWS_SECRET_ACCESS_KEY) {
    kinesisOptions.secretAccessKey = options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
  }

  if (typeof options.endpoint != "undefined") {
    kinesisOptions.endpoint = options.endpoint;
  }

  this.kinesisClient = new AWS.Kinesis(kinesisOptions);

  let kinesisRetryOptions = {
    streamName: options.streamName,
    maxRetries: options.maxRetries
  };

  this.kinesisRetry = new KinesisRetry(kinesisRetryOptions);
}

OutputAwsKinesis.prototype.eventHandler = function(record, context) {
  this.kinesisBuffer.write(this.records, record);
}

OutputAwsKinesis.prototype.start = function() {
  this.eventEmitter.on("data.parsed", this.eventHandler.bind(this))
  if (!this.interval) {
    this.interval = setInterval((function(self) {
      return function() {
        const batches = self.kinesisBuffer.split(self.records);
        batches.forEach((batch) => {
          self.kinesisRetry.flush(self.kinesisClient, batch);
        });
      }
    })(this), this.msFlushRate);
  }
}

OutputAwsKinesis.prototype.stop = function(cb) {
  this.eventEmitter.removeListener("data.parsed", this.eventHandler)
  if (this.interval) {
    clearInterval(this.interval);
  }

  cb();
}

module.exports = OutputAwsKinesis;
