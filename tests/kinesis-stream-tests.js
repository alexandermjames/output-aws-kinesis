"use strict";

const assert = require("assert");

const KinesisStream = require("../lib/kinesis-stream.js");
const Logger = require("../lib/logger.js");

describe("KinesisStream", function() {
  describe("#constructor", function() {
    it("should build new instance", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "router-one-tests",
        maxRetries: 3
      });
    });

    it("should fail to build new instance when stream name is undefined", function() {
      assert.throws(() => {
        new KinesisStream({
          partitionKey: "",
          partitionKeyProperty: "",
          maxBytes: 5000000,
          maxRecords: 500,
          msFlushRate: 0,
          kinesisClient: {
            putRecords: function(data, callback) {
              return;
            }
          },
          streamName: undefined,
          maxRetries: 3
        });
      }, Error);
    });

    it("should fail to build new instance when stream name is empty", function() {
      assert.throws(() => {
        new KinesisStream({
          partitionKey: "",
          partitionKeyProperty: "",
          maxBytes: 5000000,
          maxRecords: 500,
          msFlushRate: 0,
          kinesisClient: {
            putRecords: function(data, callback) {
              return;
            }
          },
          streamName: "",
          maxRetries: 3
        });
      }, Error);
    });

    it("should reset maxBytes when less than 0", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: -1,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert.equal(kinesisStream.maxBytes, 5000000, "Max bytes was not reset properly");
    });

    it("should reset maxBytes when equal to 0", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 0,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert.equal(kinesisStream.maxBytes, 5000000, "Max bytes was not reset properly");
    });

    it("should reset maxBytes when greater than 5000000", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 500000000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert.equal(kinesisStream.maxBytes, 5000000, "Max bytes was not reset properly");
    });

    it("should reset maxRecords when less than 0", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: -1,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert.equal(kinesisStream.maxRecords, 500, "Max records was not reset properly");
    });

    it("should reset maxRecords when equal to 0", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 0,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert.equal(kinesisStream.maxRecords, 500, "Max records was not reset properly");
    });

    it("should reset maxRecords when greater than 500", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 5000,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert.equal(kinesisStream.maxRecords, 500, "Max records was not reset properly");
    });

    it("should reset maxRetries when less than 0", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: -1
      });

      assert.equal(kinesisStream.maxRetries, 3, "Max retries was not reset properly");
    });

    it("should reset maxRetries when greater than 3", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 4
      });

      assert.equal(kinesisStream.maxRetries, 3, "Max retries was not reset properly");
    });

    it("should reset msFlushRate when less than 0", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: -1,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert.equal(kinesisStream.msFlushRate, 60000, "Flush rate was not reset properly");

      assert(typeof kinesisStream.interval !== "undefined", "Interval should have been scheduled");
      kinesisStream.stop();
    });

    it("should not set interval when msFlushRate is 0", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      assert(typeof kinesisStream.interval === "undefined", "Interval should not have been scheduled");
    });
  });

  describe("#sizeOf", function() {
    it("should successfully calculate size", function() {
      const data = "dataExample";
      const partitionKey = "partitionKeyExample";
      const record = {
        Data: data,
        PartitionKey: partitionKey
      };

      const kinesisStream = new KinesisStream({
        partitionKey: "",
        partitionKeyProperty: "",
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: undefined,
        streamName: "example-stream",
        maxRetries: 3
      });

      const sizeOf = kinesisStream.sizeOf(record);
      assert.equal(sizeOf, data.length + partitionKey.length, "sizeOf failed to return correct size");
    });
  });

  describe('#convertToRecord', function() {
    it('should successfully convert to record', function() {
      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const stringifiedRecord = new Logger("KinesisStreamTests").stringify(rawRecord);

      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: undefined,
        streamName: "example-stream",
        maxRetries: 3
      });

      const record = kinesisStream.convertToRecord(rawRecord);
      assert.equal(record.PartitionKey, "examplePartitionKey", "Record partition key was not converted properly");
      assert.equal(record.Data, stringifiedRecord, "Record was not converted properly to JSON");
    });
  });

  describe('#getPartitionKey', function() {
    const rawRecord = {
      logSource: "/dev/null",
      message: "this is an example message",
      "@timestamp": new Date().toISOString()
    };

    const stringifiedRecord = new Logger("KinesisStreamTests").stringify(rawRecord);

    it('should return static partition key', function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: undefined,
        streamName: "example-stream",
        maxRetries: 3
      });

      const partitionKey = kinesisStream.getPartitionKey(rawRecord);
      assert.equal(partitionKey, "examplePartitionKey", "Expected static partition key.");
    });

    it('should return dynamic partition key', function() {
      const kinesisStream = new KinesisStream({
        partitionKey: undefined,
        partitionKeyProperty: "logSource",
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: undefined,
        streamName: "example-stream",
        maxRetries: 3
      });

      const partitionKey = kinesisStream.getPartitionKey(rawRecord);
      assert.equal(partitionKey, rawRecord.logSource, "Expected dynamic partition key.");
    });

    it('should return v4 uuid partition key', function() {
      const kinesisStream = new KinesisStream({
        partitionKey: undefined,
        partitionKeyProperty: undefined,
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: undefined,
        streamName: "example-stream",
        maxRetries: 3
      });

      const partitionKey = kinesisStream.getPartitionKey(rawRecord);
      assert(/([A-Za-z0-9\-])+/.test(partitionKey), "Expected v4 uuid partition key.");
    });
  });

  describe("#write", function() {
    it("should successfully write record", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Record failed to be written correctly");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
    });

    it("should not be writable over 1MB", function() {
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 5000000,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            return;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const data = "a".repeat(1000 * 1000);
      const rawRecord = {
        logSource: "/dev/null",
        message: data,
        "@timestamp": new Date().toISOString()
      };

      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 0, "Record should not have been written");
      assert.equal(kinesisStream.size, 0, "Stream size was incorrectly updated");
    });

    it("should always write the first record", function() {
      let callCount = 0;
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 1,
        maxRecords: 1,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            callCount += 1;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Record failed to be written correctly");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
      assert.equal(callCount, 0, "Records should not have been flushed at least once");
    });

    it("should flush when writing over byte limit", function() {
      let callCount = 0;
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 10,
        maxRecords: 500,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            callCount += 1;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Buffer was not reallocated");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
      assert.equal(callCount, 1, "Records should have been flushed at least once");
    });

    it("should flush when writing over record limit", function() {
      let callCount = 0;
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 100000,
        maxRecords: 1,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            callCount += 1;
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Buffer was not reallocated");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
      assert.equal(callCount, 1, "Records should have been flushed at least once");
    });
  });

  describe("#callback", function() {
    it("should succesfully bypass putRecords retry", function() {
      let callCount = 0;
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 100000,
        maxRecords: 1,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            callCount += 1;
            const response = {
              FailedRecordCount: 0,
              Records: []
            };

            callback(null, response);
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Buffer was not reallocated");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
      assert.equal(callCount, 1, "Records should have been flushed once");
    });

    it("should fail callback on error response", function() {
      let callCount = 0;
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 100000,
        maxRecords: 1,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            callCount += 1;
            callback(new Error("AmazonServiceException"));
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Buffer was not reallocated");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
      assert.equal(callCount, 1, "Records should have been flushed at least once");
    });

    it("should retry failed records one time", function() {
      let callCount = 0;
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 100000,
        maxRecords: 1,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            callCount += 1;
            let response = {
              FailedRecordCount: 1,
              Records: [{
                ErrorCode: "ExampleErrorCode",
                ErrorMessage: "ExampleErrorMessage"
              }]
            };

            if (callCount === 2) {
              response.FailedRecordCount = 0;
              response.Records = [];
            }

            callback(null, response);
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Buffer was not reallocated");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
      assert.equal(callCount, 2, "Records should have been flushed at twice once");
    });

    it("should hit max attempts and abandon processing", function() {
      let callCount = 0;
      const kinesisStream = new KinesisStream({
        partitionKey: "examplePartitionKey",
        partitionKeyProperty: undefined,
        maxBytes: 100000,
        maxRecords: 1,
        msFlushRate: 0,
        kinesisClient: {
          putRecords: function(data, callback) {
            callCount += 1;
            let response = {
              FailedRecordCount: 1,
              Records: [{
                ErrorCode: "ExampleErrorCode",
                ErrorMessage: "ExampleErrorMessage"
              }]
            };

            callback(null, response);
          }
        },
        streamName: "example-stream",
        maxRetries: 3
      });

      const rawRecord = {
        logSource: "/dev/null",
        message: "this is an example message",
        "@timestamp": new Date().toISOString()
      };

      const record = kinesisStream.convertToRecord(rawRecord);
      const sizeOf = kinesisStream.sizeOf(record);

      kinesisStream.write(rawRecord);
      kinesisStream.write(rawRecord);
      assert.equal(kinesisStream.buffer.length, 1, "Buffer was not reallocated");
      assert.equal(kinesisStream.size, sizeOf, "Stream size failed to be updated correctly");
      assert.equal(callCount, 4, "Records should have been attempted 4 times");
    });
  });
});
