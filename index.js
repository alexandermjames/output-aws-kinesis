"use strict";

const DEBUG = false;

const AWS = require("aws-sdk");
const Logger = require("./lib/logger.js");
const Router = require("./lib/router.js");
const KinesisStream = require("./lib/kinesis-stream.js");

const MAX_RETRIES = 3;

function OutputAwsKinesis(config, eventEmitter) {
  this.eventEmitter = eventEmitter;
  this.router = new Router();

  this.config = Object.assign({}, config);
  this.logger = new Logger("OutputAwsKinesis", this.config.debug);

  if (typeof this.config.maxRetries !== "undefined" && (this.config.maxRetries < 0 || this.config.maxRetries > 3)) {
    this.logger.log("WARN", {
      message: "Max retries was not in the allowable range, [0, 3]. Defaulting to 3.",
      maxRetries: this.config.maxRetries
    });

    this.config.maxRetries = MAX_RETRIES;
  } else if (typeof this.config.maxRetries !== "undefined") {
    this.config.maxRetries = MAX_RETRIES;
  } else {
    this.config.maxRetries = this.config.maxRetries || MAX_RETRIES;
  }

  this.config.region = this.config.region || process.env.AWS_REGION;
  this.config.sslEnabled = typeof this.config.sslEnabled != "undefined" ? this.config.sslEnabled : true;

  let kinesisClientOptions = {
    apiVersion: "2013-12-02",
    region: this.config.region,
    maxRetries: this.config.maxRetries,
    sslEnabled: this.config.sslEnabled,
    retryDelayOptions: {
      base: 100
    }
  };

  if (typeof this.config.accessKeyId != "undefined" || process.env.AWS_ACCESS_KEY_ID) {
    kinesisClientOptions.accessKeyId = this.config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
  }

  if (typeof this.config.secretAccessKey != "undefined" || process.env.AWS_SECRET_ACCESS_KEY) {
    kinesisClientOptions.secretAccessKey = this.config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
  }

  if (typeof this.config.endpoint != "undefined") {
    kinesisClientOptions.endpoint = this.config.endpoint;
  }

  if (this.config.streams) {
    for (const stream of this.config.streams) {
      const kinesisStreamOptions = {
        partitionKey: stream.partitionKey,
        partitionKeyProperty: stream.partitionKeyProperty,
        maxBytes: stream.maxBytes,
        msFlushRate: stream.msFlushRate,
        kinesisClient: new AWS.Kinesis(kinesisClientOptions),
        streamName: stream.streamName,
        maxRetries: stream.maxRetries,
        debug: this.config.debug
      };

      this.router.addStreamPatterns(new KinesisStream(kinesisStreamOptions), stream.files);
    }
  }
}

OutputAwsKinesis.prototype.handler = function(data, context) {
  const streams = this.router.getRoutes(data.logSource);
  for (const stream of streams) {
    stream.write(data);
  }
};

OutputAwsKinesis.prototype.start = function() {
  this.eventEmitter.on("data.parsed", this.handler.bind(this));
};

OutputAwsKinesis.prototype.stop = function(cb) {
  this.eventEmitter.removeListener("data.parsed", this.handler);
  for (const stream of this.router.getStreams()) {
    stream.stop();
  }

  cb();
};

module.exports = OutputAwsKinesis;
