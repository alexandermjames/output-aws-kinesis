"use strict";

const Logger = require("./logger.js");
const EventEmitter = require("events");
const uuidV4 = require("uuid/v4");

const RETRIES = 3;
const MAX_BYTES = 5000000;
const MAX_RECORDS = 500;
const MS_FLUSH_RATE = 60000;
const MAX_RECORD_BYTES = 1000000;

function KinesisStream(options) {
  let opts = Object.assign({}, options);

  this.logger = new Logger("KinesisStream", opts.debug);
  this.emitter = new EventEmitter();
  this.emitter.on("buffer.full", this.flush.bind(this));

  if (typeof opts.maxRecords !== "undefined" && (opts.maxRecords <= 0 || opts.maxRecords > MAX_RECORDS)) {
    this.logger.log("WARN", {
      message: "Max records was not in the allowed range, (0, 500]. Defaulting to 500.",
      maxRecords: opts.maxRecords
    });

    this.maxRecords = MAX_RECORDS;
  } else {
    this.maxRecords = opts.maxRecords || MAX_RECORDS;
  }

  if (typeof opts.maxBytes !== "undefined" && (opts.maxBytes <= 0 || opts.maxBytes > MAX_BYTES)) {
    this.logger.log("WARN", {
      message: "Max bytes was not in the allowed range, (0, 5000000]. Defaulting to 5,000,000.",
      maxBytes: opts.maxBytes
    });

    this.maxBytes = MAX_BYTES;
  } else {
    this.maxBytes = opts.maxBytes || MAX_BYTES;
  }

  if (typeof opts.maxRetries !== "undefined" && (opts.maxRetries < 0 || opts.maxRetries > RETRIES)) {
    this.logger.log("WARN", {
      message: "Max retries was not in the allowed range, [0, 3]. Defaulting to 3.",
      maxRetries: opts.maxRetries
    });

    this.maxRetries = RETRIES;
  } else if (typeof opts.maxRetries === "undefined") {
    this.maxRetries = RETRIES;
  } else {
    this.maxRetries = opts.maxRetries;
  }

  if (typeof opts.streamName == "undefined" || !opts.streamName) {
    throw new Error({
      message: "Required value, \"streamName\", was not defined.",
      streamName: opts.streamName
    });
  }

  if (typeof opts.msFlushRate !== "undefined" && opts.msFlushRate < 0) {
    this.logger.log("WARN", {
      message: "Flush rate was not in valid range, [0, Number.MAX_SAFE_INTEGER]. Defaulting to 60,000.",
      msFlushRate: opts.msFlushRate
    });

    this.msFlushRate = MS_FLUSH_RATE;
  } else if (typeof opts.msFlushRate === "undefined") {
    this.msFlushRate = MS_FLUSH_RATE;
  } else {
    this.msFlushRate = opts.msFlushRate;
  }

  this.partitionKey = opts.partitionKey;
  this.partitionKeyProperty = opts.partitionKeyProperty;
  this.kinesisClient = opts.kinesisClient;
  this.streamName = opts.streamName;
  this.buffer = [];
  this.size = 0;

  this.interval =
      this.msFlushRate > 0 ? setInterval(this.scheduledFlush.bind(this), this.msFlushRate) : undefined;
}

KinesisStream.prototype.write = function(data) {
  const record = this.convertToRecord(data);
  const sizeOf = this.sizeOf(record);
  if (sizeOf > MAX_RECORD_BYTES) {
    this.logger.log("WARN", {
      message: "Record data and partition key size combined were greater than 1MB. Ignoring.",
      recordSizeInBytes: sizeOf
    });

    return;
  }

  if ((this.buffer.length + 1) > this.maxRecords || ((this.size + sizeOf > this.maxBytes) && this.size !== 0)) {
    this.emitter.emit("buffer.full", this.buffer, this.size);
    this.buffer = [];
    this.size = 0;
  }

  this.buffer.push(record);
  this.size += sizeOf;
};

KinesisStream.prototype.convertToRecord = function(data) {
  return {
    Data: this.logger.stringify(data),
    PartitionKey: this.getPartitionKey(data)
  };
};

KinesisStream.prototype.getPartitionKey = function(data) {
  if (this.partitionKeyProperty) {
    let partitionKey = data[this.partitionKeyProperty];
    if (typeof partitionKey === "undefined") {
      this.logger.log("WARN", {
        message: "The specified partitionKeyProperty was undefined.",
        partitionKeyProperty: this.partitionKeyProperty,
        data: data
      });

      partitionKey = "undefined";
    }

    if (typeof partitionKey !== "string") {
      this.logger.log("WARN", {
        message: "The retrieved partitionKey was not a string.",
        partitionKeyProperty: this.partitionKeyProperty,
        partitionKey: partitionKey,
        data: data
      });

      partitionKey = this.logger.stringify(partitionKey);
    }

    return partitionKey;
  }

  return this.partitionKey || uuidV4();
};

KinesisStream.prototype.scheduledFlush = function() {
  if (this.buffer.length == 0) {
    return;
  }

  this.flush(this.buffer, this.size);
  this.buffer = [];
  this.size = 0;
};

KinesisStream.prototype.flush = function(records, size) {
  const batchId = uuidV4();
  this.logger.trace("INFO", {
    message: "Sending batch to Kinesis.",
    batchSizeInRecords: this.buffer.length,
    batchSizeInBytes: this.size,
    batchId: batchId
  });

  this.kinesisClient.putRecords({
    Records: records,
    StreamName: this.streamName
  }, this.callback.bind(this, batchId, records, 0));
};

KinesisStream.prototype.callback = function(batchId, records, attempt, err, data) {
  if (err) {
    this.logger.log("ERROR", err);
    return;
  }

  if (data.FailedRecordCount > 0 && attempt < this.maxRetries) {
    let failedRecords = [];
    data.Records.forEach((record, index) => {
      if (record.ErrorCode) {
        const actual = records[index];
        failedRecords.push(actual);
        this.logger.log("ERROR", {
          message: "Record failed to be delivered successfully.",
          errorCode: record.ErrorCode,
          errorMessage: record.ErrorMessage,
          record: actual,
          batchId: batchId,
          requestId: data.requestId
        });
      }
    });

    this.kinesisClient.putRecords({
      Records: failedRecords,
      StreamName: this.streamName
    }, this.callback.bind(this, batchId, failedRecords, attempt + 1));
  } else {
    this.logger.trace("INFO", {
      message: "Finished sending batch to Kinesis.",
      batchId: batchId,
      attempts: attempt,
      failed: (attempt == this.maxRetries)
    });
  }
};

KinesisStream.prototype.stop = function() {
  if (typeof this.interval !== "undefined") {
    clearInterval(this.interval);
  }

  this.emitter.removeListener("buffer.full", this.flush);
};

KinesisStream.prototype.sizeOf = function(record) {
  return Buffer.byteLength(record.Data + record.PartitionKey);
};

module.exports = KinesisStream;
