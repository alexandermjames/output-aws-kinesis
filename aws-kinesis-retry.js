"use strict";

const fastSafeStringify = require("fast-safe-stringify");

function AWSKinesisRetry(options, client, partitionableBuffer) {
  options = options || {};
  let opts = Object.assign({}, options);

  if (!opts.streamName) {
    throw Error("Kinesis stream name must be defined.");
  }

  if (!opts.maxRetries || (opts.maxRetries < 0 || opts.maxRetries > 4)) {
    throw Error("Max retries must be greater than 0 and less than or equal to 4.");
  }

  opts.msFlushRate = opts.msFlushRate || 60000;
  opts.scheduled = false;
  opts.maxLogChars = 1024;

  this.write = (record) => {
    partitionableBuffer.write(record);
  };

  this.flush = () => {
    partitionableBuffer.split().forEach((batch) => {
      console.log("Sending batch of size, %dB, with, %d records.", batch.Size, batch.Data.length);
      const reprocessFailedRecords = this._reprocessFailedRecords.bind(this, 0, batch);
      const params = {
        Records: batch.Data,
        StreamName: opts.streamName
      };

      client.putRecords(params).promise()
            .then(reprocessFailedRecords)
            .catch((err) => {
              console.error(new Date().toISOString(), err);
            });
    });

    partitionableBuffer.clear();
  };

  this._reprocessFailedRecords = (iteration, batch, res) => {
    if (iteration >= opts.maxRetries || res.FailedRecordCount == 0) {
      return;
    }

    const failedRecords = this._collectFailedRecords(batch, res);
    const reprocessFailedRecords = this._reprocessFailedRecords.bind(this, iteration + 1, batch);
    const params = {
      Records: failedRecords,
      StreamName: opts.streamName
    };

    client.putRecords(params).promise()
           .then(reprocessFailedRecords)
           .catch((err) => {
             console.error(new Date().toISOString(), err);
           });
  };

  this._collectFailedRecords = (batch, res) => {
    let failedRecords = [];
    res.Records.forEach((record, index) => {
      if (record.ErrorCode) {
        const actualRecord = batch.Data[index];
        failedRecords.push(actualRecord);
        const truncatedRecord = actualRecord.length <= opts.maxLogChars
                                    ? actualRecord
                                    : actualRecord.substring(0, opts.maxLogChars);
        console.error("Failed to submit record, %s.", truncatedRecord);
      }
    });

    return failedRecords;
  };

  this.schedule = () => {
    opts.interval = setInterval(this.flush, opts.msFlushRate);
    opts.scheduled = true;
  };

  this.shutdown = () => {
    if (opts.interval) {
      clearInterval(opts.interval);
    }
  };

  return this;
}

module.exports = AWSKinesisRetry;
