"use strict";

const log = require("./log.js");

function KinesisRetry(options) {
  this.streamName = options.streamName;
  this.maxRetries = typeof options.maxRetries == "undefined" ? 4 : options.maxRetries;
}

KinesisRetry.prototype.flush = async function(kinesisClient, batch) {
  log.log("INFO", {
    message: "Sending batch.",
    batchSizeInBytes: batch.Size,
    batchSizeInRecords: batch.Data.length
  });

  try {
    let putRecordsResult = await kinesisClient.putRecords({
      Records: batch.Data,
      StreamName: this.streamName
    }).promise();

    let retryCount = 0;
    while (putRecordsResult.FailedRecordCount > 0 && retryCount <= this.maxRetries) {
      const failedRecords = this._collectFailedRecords(batch, res);
      putRecordsResult = await kinesisClient.putRecords({
        Records: failedRecords,
        StreamName: this.streamName
      }).promise();
      retryCount += 1;
    }
  } catch (err) {
    log.log("ERROR", err);
  }
}

KinesisRetry.prototype._collectFailedRecords = function(batch, res) {
  let failedRecords = [];
  res.Records.forEach((record, index) => {
    if (record.ErrorCode) {
      const actualRecord = batch.Data[index];
      failedRecords.push(actualRecord);
      log.log("ERROR", {
        errorCode: record.ErrorCode,
        errorMessage: record.ErrorMessage,
        record: actualRecord
      });
    }
  });

  return failedRecords;
}

module.exports = KinesisRetry;
