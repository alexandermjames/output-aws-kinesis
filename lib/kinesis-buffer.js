"use strict";

const uuid = require("./uid.js");
const log = require("./log.js");

function KinesisBuffer(options) {
  if (typeof options.partitionKeyField != "undefined") {
    this.partitionKeyField = options.partitionKeyField;
  }

  if (typeof options.partitionKey != "undefined") {
    this.partitionKey = options.partitionKey;
  }

  this.maxRecords = options.maxRecords || 500;
  this.maxBytes = options.maxBytes || 5242880;
  this.maxRecordSize = 1048576;

  log.init("KinesisBuffer");
}

KinesisBuffer.prototype.write = function(records, record) {
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

  records.push({
    Data: data,
    PartitionKey: partitionKey,
    Size: recordSizeInBytes
  });
}

KinesisBuffer.prototype.getPartitionKey = function(record) {
  if (typeof this.partitionKeyField != "undefined") {
    const rawRecord = JSON.parse(record.message);
    return rawRecord[this.partitionKeyField];
  }

  if (typeof this.partitionKey != "undefined") {
    return this.partitionKey;
  }

  return uuid.v4();
}

KinesisBuffer.prototype.split = function(records) {
  let batches = [], batch = [], batchSizeInBytes = 0;
  records.forEach((record) => {
    if (batch.length + 1 > this.maxRecords || (batchSizeInBytes + record.Size) > this.maxBytes) {
      batches.push({
        Data: batch,
        Size: batchSizeInBytes
      });

      batch = [];
      batchSizeInBytes = 0;
    }

    batchSizeInBytes += record.Size;
    delete record.Size;
    batch.push(record);
  });

  if (batch.length > 0) {
    batches.push({
      Data: batch,
      Size: batchSizeInBytes
    });
  }

  return batches;
}

module.exports = KinesisBuffer;
