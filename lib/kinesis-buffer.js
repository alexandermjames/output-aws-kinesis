"use strict";

const uuidV4 = require("uuid/v4");
const log = require("./log.js");

function KinesisBuffer(options) {
  if (typeof options.defaultPartitionKeyProperty != "undefined") {
    this.defaultPartitionKeyProperty = options.defaultPartitionKeyProperty;
  }

  if (typeof options.defaultPartitionKey != "undefined") {
    this.defaultPartitionKey = options.defaultPartitionKey;
  }

  if (typeof options.logSource != "undefined") {
    this.logSource = options.logSource;
  }

  this.maxRecords = options.maxRecords || 500;
  this.maxBytes = options.maxBytes || 5242880;
  this.maxRecordSize = 1048576;

  log.init("KinesisBuffer");
}

KinesisBuffer.prototype.write = function(batches, record) {
  const data = log.stringify(record);
  const partitionKey = this.getPartitionKey(record);
  const recordSizeInBytes = Buffer.byteLength(data + partitionKey);
  if (recordSizeInBytes > this.maxRecordSize) {
    log.log("ERROR", {
      message: "Record data and partition key size combined were greater than 1MB. Ignoring.",
      recordSizeInBytes: recordSizeInBytes
    });

    return;
  }

  if (batches.length == 0) {
    batches.push({
      Data: [{
        Data: data,
        PartitionKey: partitionKey
      }],
      Size: recordSizeInBytes
    });

    return;
  }

  let currentBatch = batches[batches.length - 1];
  if (currentBatch.Data.length + 1 > this.maxRecords || (currentBatch.Size + recordSizeInBytes) > this.maxBytes) {
    batches.push({
      Data: [{
        Data: data,
        PartitionKey: partitionKey
      }],
      Size: recordSizeInBytes
    });

    return;
  }

  currentBatch.Data.push({
    Data: data,
    PartitionKey: partitionKey
  });

  currentBatch.Size += recordSizeInBytes;
};

KinesisBuffer.prototype.getPartitionKey = function(record) {
  if (typeof this.logSource != "undefined") {
    for (let key of Object.keys(this.logSource)) {
      if (record.logSource.match(key)) {
        return this.getPartitionKeyForLogSource(this.logSource[key], record);
      }
    }
  }

  if (typeof this.defaultPartitionKeyProperty != "undefined") {
    return record[this.defaultPartitionKeyProperty];
  }

  if (typeof this.defaultPartitionKey != "undefined") {
    return this.defaultPartitionKey;
  }

  return uuidV4();
};

KinesisBuffer.prototype.getPartitionKeyForLogSource = function(logSource, record) {
  if (typeof logSource.partitionKeyProperty != "undefined") {
    let partitionKey = record[logSource.partitionKeyProperty];
    if (typeof partitionKey == "undefined") {
      log.log("ERROR", {
        message: "Log line did not contain partitionKeyProperty.",
        record: record,
        partitionKeyProperty: logSource.partitionKeyProperty
      });

      partitionKey = "undefined";
    }

    return partitionKey;
  }

  if (typeof logSource.partitionKey != "undefined") {
    return logSource.partitionKey;
  }

  return uuidV4();
};

module.exports = KinesisBuffer;
