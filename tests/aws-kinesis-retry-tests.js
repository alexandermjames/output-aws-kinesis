"use strict";

const assert = require("assert");
const fastSafeStringify = require("fast-safe-stringify");

const PartitionableBuffer = require("../partitionable-buffer.js");
const AWSKinesisRetry = require("../aws-kinesis-retry.js");

describe("AWSKinesisRetry", function() {

  describe("constructor", function() {
    it("should fail when opts.streamName is missing", function() {
        const options = {
          maxRecords: 500,
          maxBytes: 10000
        };

        const config = {};
        assert.throws(() => {
          new AWSKinesisRetry(config, undefined, new PartitionableBuffer(options));
        }, Error);
    });

    it("should fail when opts.maxRetries is missing", function() {
        const options = {
          maxRecords: 500,
          maxBytes: 10000
        };

        const config = {
          streamName: "test-stream",
          msFlushRate: 1000
        };

        assert.throws(() => {
          new AWSKinesisRetry(config, undefined, new PartitionableBuffer(options));
        }, Error);
    });

    it("should fail when opts.maxRetries is greater than threshold", function() {
        const options = {
          maxRecords: 500,
          maxBytes: 10000
        };

        const config = {
          streamName: "test-stream",
          msFlushRate: 1000,
          maxRetries: 5
        };

        assert.throws(() => {
          new AWSKinesisRetry(config, undefined, new PartitionableBuffer(options));
        }, Error);
    });

    it("should fail when opts.maxRetries is less than threshold", function() {
        const options = {
          maxRecords: 500,
          maxBytes: 10000
        };

        const config = {
          streamName: "test-stream",
          msFlushRate: 1000,
          maxRetries: -1
        };
        
        assert.throws(() => {
          new AWSKinesisRetry(config, undefined, new PartitionableBuffer(options));
        });
    });

    it("should succeed when opts are in proper order", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const config = {
        streamName: "test-stream",
        msFlushRate: 1000,
        maxRetries: 3
      };

      new AWSKinesisRetry(config, undefined, new PartitionableBuffer(options));
    });
  });

  describe("write", function() {
    it("should successfully write", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const config = {
        streamName: "test-stream",
        msFlushRate: 100000,
        maxRetries: 3
      };

      const partitionableBuffer = new PartitionableBuffer(options);
      const awsKinesisRetry = new AWSKinesisRetry(config, undefined, partitionableBuffer);
      awsKinesisRetry.write("this is an example");

      assert(partitionableBuffer.split().length, 1, "Record failed to be written.");
    });
  });

  describe("_reprocessFailedRecords", function() {

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

    it("should not reprocess any failed records when no failed records", function() {
      callCount = 0;

      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const config = {
        streamName: "test-stream",
        maxRetries: 3,
        msFlushRate: 100000
      };

      const partitionableBuffer = new PartitionableBuffer(options);
      const awsKinesisRetry = new AWSKinesisRetry(config, undefined, partitionableBuffer);

      const batch = {
        Data: [fastSafeStringify({
          Data: "Example Data",
          PartitionKey: "Example Key"
        })],
        Size: 22342
      };

      awsKinesisRetry._reprocessFailedRecords(0, batch, {FailedRecordCount: 0});
      assert.equal(callCount, 0, "Client putRecords should not have been called.");
    });

    it("should not reprocess any failed records when greater than threshold", function() {
      callCount = 0;

      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const config = {
        streamName: "test-stream",
        maxRetries: 3,
        msFlushRate: 100000
      };

      const partitionableBuffer = new PartitionableBuffer(options);
      const awsKinesisRetry = new AWSKinesisRetry(config, undefined, partitionableBuffer);

      const batch = {
        Data: [fastSafeStringify({
          Data: "Example Data",
          PartitionKey: "Example Key"
        })],
        Size: 22342
      };

      awsKinesisRetry._reprocessFailedRecords(5, batch, {FailedRecordCount: 10});
      assert.equal(callCount, 0, "Client putRecords should not have been called.");
    });

    it("should call reprocess once with failed records", function() {
      callCount = 0;

      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const config = {
        streamName: "test-stream",
        maxRetries: 3,
        msFlushRate: 100000
      };

      const partitionableBuffer = new PartitionableBuffer(options);
      const awsKinesisRetry = new AWSKinesisRetry(config, client, partitionableBuffer);

      const batch = {
        Data: [fastSafeStringify({
          Data: "Example Data",
          PartitionKey: "Example Key"
        })],
        Size: 22342
      };

      const res = {
        FailedRecordCount: 1,
        Records: [{
            ErrorCode: "Error"
          }]
      };

      awsKinesisRetry._reprocessFailedRecords(0, batch, res);
      assert.equal(callCount, 1, "Client putRecords should have been called one time.");
    });
  });

  describe("_collectFailedRecords", function() {
    it("should collect failed records", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const config = {
        streamName: "test-stream",
        msFlushRate: 100000,
        maxRetries: 3
      };

      const partitionableBuffer = new PartitionableBuffer(options);
      const awsKinesisRetry = new AWSKinesisRetry(config, undefined, partitionableBuffer);

      const batch = {
          Data: [fastSafeStringify({
            Data: "Example Data",
            PartitionKey: "Example Key"
          })],
          Size: 22342
        };

      const res = {
        FailedRecordCount: 1,
        Records: [{
            ErrorCode: "Error"
          }]
      };

      const failedRecords = awsKinesisRetry._collectFailedRecords(batch, res);
      assert(failedRecords.length == 1, "Failed to collect appropriate records.");
      assert(Object.is(failedRecords[0], batch.Data[0]), "Failed record was not the same.");
    });

    it("should not collect any failed records", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const config = {
        streamName: "test-stream",
        msFlushRate: 100000,
        maxRetries: 3
      };

      const partitionableBuffer = new PartitionableBuffer(options);
      const awsKinesisRetry = new AWSKinesisRetry(config, undefined, partitionableBuffer);

      const batch = {
          Data: [fastSafeStringify({
            Data: "Example Data",
            PartitionKey: "Example Key"
          })],
          Size: 22342
        };

      const res = {
        FailedRecordCount: 0,
        Records: [{
            SequenceNumber: 0
          }]
      };

      const failedRecords = awsKinesisRetry._collectFailedRecords(batch, res);
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
      const options = {
        maxRecords: 10,
        maxBytes: 200
      };

      const config = {
        streamName: "test-stream",
        maxRetries: 3,
        msFlushRate: 100000
      };

      const partitionableBuffer = new PartitionableBuffer(options);
      const awsKinesisRetry = new AWSKinesisRetry(config, client, partitionableBuffer);

      for (let i = 0; i < 100; i++) {
        awsKinesisRetry.write("this is an example");
      }

      awsKinesisRetry.flush();
      assert(callCount > 1, "Client putRecords should have been called more than one time.");
      assert(partitionableBuffer.split().length == 0, "Buffer should have been cleared.");
    });
  });
});
