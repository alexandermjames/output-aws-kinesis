"use strict";

const assert = require("assert");
const log = require("../lib/log.js");

const KinesisBuffer = require("../lib/kinesis-buffer.js");

describe("KinesisBuffer", function() {

  const data = {
    message: "This is an example.",
    logSource: "unknown",
    "@timestamp": new Date().toISOString()
  };

  const stringifiedData = log.stringify(data);

  describe("write", function() {
    it("should succeed in writing record", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        defaultPartitionKey: "partitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const batches = [];

      buffer.write(batches, data);

      assert.equal(batches.length, 1, "Record failed to be written.");
      assert.equal(batches[0].Data[0].Data, stringifiedData, "Record failed to write with correct data.");
      assert.equal(batches[0].Size, Buffer.byteLength(stringifiedData + options.defaultPartitionKey), "Record failed to write correct size.");
      assert.equal(batches[0].Data[0].PartitionKey, options.defaultPartitionKey, "Record failed to write correct partition key.");
    });

    it("should fail in writing record", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        defaultPartitionKey: "partitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const records = [];

      const reject = Object.assign({}, data);
      reject.message = {
        data: "a".repeat(1024*1025)
      };

      buffer.write(records, reject);
      assert.equal(records.length, 0, "Record failed to be rejected.");
    });

    it("should write into multiple batches when number of records are greater than threshold", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 1000000,
        defaultPartitionKey: "partitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const batches = [];

      for (let i = 0; i < 1000; i++) {
        buffer.write(batches, {
          message: {
            data: "This is number " + i + "."
          },
          logSource: "unknown",
          "@timestamp": new Date().toISOString()
        });
      }

      assert(batches.length > 1, "Buffer failed to split to more than 1 batch.");

      batches.forEach((batch) => {
        assert(batch.Data.length <= 500, "Batch length failed to honor maxRecords.");
      });
    });

    it("should write into multiple batches when bytes are greater than threshold", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 500,
        defaultPartitionKey: "partitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const batches = [];

      for (let i = 0; i < 1000; i++) {
        buffer.write(batches, {
          message: {
            data: "This is number " + i + "."
          },
          logSource: "unknown",
          "@timestamp": new Date().toISOString()
        });
      }

      assert(batches.length > 1, "Buffer failed to split to more than 1 batch.");

      batches.forEach((batch) => {
        assert(batch.Size <= 500);
      });
    });
  });

  describe("getPartitionKey", function() {
    it("should succeed in getting json property for partition key", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        defaultPartitionKeyProperty: "message"
      };

      const buffer = new KinesisBuffer(options);
      const partitionKey = buffer.getPartitionKey(data);
      assert.equal(partitionKey, "This is an example.", "Failed to successfully retrieve partition key.");
    });

    it("should succeed in using static string for partition key", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        defaultPartitionKey: "partitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const partitionKey = buffer.getPartitionKey(data);
      assert.equal(partitionKey, "partitionKey", "Failed to use supplied partition key.");
    });

    it("should succeed in generating uuid for partition key", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const buffer = new KinesisBuffer(options);
      const partitionKey = buffer.getPartitionKey(data);
      assert(partitionKey.substring("-") != -1, "Failed to generate successful partition key.");
    });

    it("should succeed in generating uuid for partition key for known logSource", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        logSource: {
          "\/tmp\/kafka.*\.log": {

          }
        }
      };

      const buffer = new KinesisBuffer(options);
      let message = Object.assign({}, data);
      message.logSource = "/tmp/kafka-beta.log";
      const partitionKey = buffer.getPartitionKey(message);
      assert(partitionKey.substring("-") != -1, "Failed to generate successful partition key.");
    });

    it("should succeed in using static partition key for known logSource", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        defaultPartitionKey: "defaultPartitionKey",
        logSource: {
          "\/tmp\/kafka.*\.log": {
            partitionKey: "kafkaPartitionKey"
          }
        }
      };

      const buffer = new KinesisBuffer(options);
      let message = Object.assign({}, data);
      message.logSource = "/tmp/kafka-beta.log";
      const partitionKey = buffer.getPartitionKey(message);
      assert.equal(partitionKey, "kafkaPartitionKey", "Failed to use static partition key.");
    });

    it("should succeed in using static partition key for known logSource", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        defaultPartitionKey: "defaultPartitionKey",
        logSource: {
          "\/tmp\/kafka.*\.log": {
            partitionKeyProperty: "message"
          }
        }
      };

      const buffer = new KinesisBuffer(options);
      let message = Object.assign({}, data);
      message.logSource = "/tmp/kafka-beta.log";
      const partitionKey = buffer.getPartitionKey(message);
      assert.equal(partitionKey, "This is an example.", "Failed to use dynamic partition key.");
    });

    it("should use undefined when property is not available", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        defaultPartitionKey: "defaultPartitionKey",
        logSource: {
          "\/tmp\/kafka.*\.log": {
            partitionKeyProperty: "hello"
          }
        }
      };

      const buffer = new KinesisBuffer(options);
      let message = Object.assign({}, data);
      message.logSource = "/tmp/kafka-beta.log";
      const partitionKey = buffer.getPartitionKey(message);
      assert.equal(partitionKey, "undefined", "Failed to use undefined as partition key.");
    });
  });
});
