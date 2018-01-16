"use strict";

const fastSafeStringify = require("fast-safe-stringify");
const uuidV4 = require("uuid/v4");

function PartitionableBuffer(options) {
  options = options || {};
  let opts = Object.assign({}, options);

  if (opts.maxRecords && (opts.maxRecords <= 0 || opts.maxRecords > 500)) {
    throw Error("Max records must be greater than 0 and less than or equal to 500.");
  }

  if (opts.maxBytes && (opts.maxBytes <= 0 || opts.maxBytes > 5242880)) {
    throw Error("Max bytes must be greater than 0 and less than or equal to 5242880 i.e. 5MB.")
  }

  opts.maxRecords = opts.maxRecords || 500;
  opts.maxBytes = opts.maxBytes || 5242880;
  opts.maxRecordSize = 1048576;
  opts.records = [];

  this.write = (record) => {
    const _record = {
      Data: record,
      PartitionKey: uuidV4(),
    };

    const length = Buffer.byteLength(_record.Data) + Buffer.byteLength(_record.PartitionKey);
    if (length > opts.maxRecordSize) {
      console.warn("Stringified size, %d, was greater than 1MB. Ignoring.", length);
      return;
    }

    opts.records.push(_record);
  };

  this.split = () => {
    let result = [], current = [], recordLength = 0;

    opts.records.forEach((record) => {
      const currentRecordLength = Buffer.byteLength(record.Data) + Buffer.byteLength(record.PartitionKey);
      if (current.length + 1 > opts.maxRecords || (recordLength + currentRecordLength) > opts.maxBytes) {
        result.push({
          Data: current,
          Size: recordLength
        });

        current = [];
        recordLength = 0;
      }

      current.push(record);
      recordLength += currentRecordLength;
    });

    if (current.length > 0) {
      result.push({
        Data: current,
        Size: recordLength
      });
    }

    return result;
  };

  this.clear = () => {
    opts.records = [];
  }

  return this;
}

module.exports = PartitionableBuffer;
