"use strict";

const assert = require("assert");

const KinesisBuffer = require("../lib/kinesis-buffer.js");
const KinesisRetry = require("../lib/kinesis-retry.js");

describe("KinesisRetry", function() {

  const options = {
    streamName: "test-stream",
    maxRetries: 3
  };

  const data = {
    message: "{\"message\": \"This is a test.\"}",
    logSource: "test",
    "@timestamp": new Date().toISOString()
  };

  const record = {
    Data: data,
    PartitionKey: "partitionKey"
  }

  const batch = {
    Data: [record],
    Size: 1231242
  };

  describe("_collectFailedRecords", function() {
    it("should collect failed records", function() {
      const kinesisRetry = new KinesisRetry(options);
      const res = {
        FailedRecordCount: 1,
        Records: [{
            ErrorCode: "Error"
          }]
      };

      const failedRecords = kinesisRetry._collectFailedRecords(batch, res);
      assert(failedRecords.length == 1, "Failed to collect appropriate records.");
      assert(Object.is(failedRecords[0], batch.Data[0]), "Failed record was not the same.");
    });

    it("should not collect any failed records", function() {
      const kinesisRetry = new KinesisRetry(options);
      const res = {
        FailedRecordCount: 0,
        Records: [{
            SequenceNumber: 0
          }]
      };

      const failedRecords = kinesisRetry._collectFailedRecords(batch, res);
      assert(failedRecords.length == 0, "Should not have collected any records.");
    });
  });

  describe("flush", function() {

    let callCount = 0;
    const client = {
      putRecords: (req) => {
        return {
          promise: () => {
            return new Promise((resolve, reject) => {
              callCount += 1;
              resolve({FailedRecordCount: 0});
            });
          }
        };
      }
    };

    it("should flush multiple batches", function() {
      const kinesisBuffer = new KinesisBuffer({
        maxRecords: 10,
        maxBytes: 10000
      });

      const kinesisRetry = new KinesisRetry(options);

      let batches = [];
      for (let i = 0; i < 100; i++) {
        kinesisBuffer.write(batches, data);
      }

      batches.forEach((batch) => {
        kinesisRetry.flush(client, batch);
      });

      assert(callCount > 1, "Client putRecords should have been called more than one time.");
    });
  });
});
