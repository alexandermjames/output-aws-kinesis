"use strict";

const assert = require("assert");
const log = require("../lib/log.js");

const KinesisBuffer = require("../lib/kinesis-buffer.js");

describe("KinesisBuffer", function() {

  const data = {
    message: log.stringify({
      data: "This is an example."
    }),
    logSource: "unknown",
    "@timestamp": new Date().toISOString()
  };

  const stringifiedData = log.stringify(data);

  describe("write", function() {
    it("should succeed in writing record", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        partitionKey: "PartitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const records = [];

      buffer.write(records, data);

      assert(records.length, 1, "Record failed to be written.");
      assert.equal(records[0].Data, stringifiedData, "Record failed to write with correct data.");
      assert.equal(records[0].Size, Buffer.byteLength(stringifiedData) + Buffer.byteLength(options.partitionKey), "Record failed to write correct size.");
      assert.equal(records[0].PartitionKey, options.partitionKey, "Record failed to write correct partition key.");
    });

    it("should fail in writing record", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        partitionKey: "PartitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const records = [];

      const reject = Object.assign({}, data);
      reject.message = log.stringify({
        data: "a".repeat(1024*1025)
      });

      buffer.write(records, reject);
      assert.equal(records.length, 0, "Record failed to be rejected.");
    });
  });

  describe("getPartitionKey", function() {
    it("should succeed in getting json property for partition key", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        partitionKeyField: "data"
      };

      const buffer = new KinesisBuffer(options);
      const partitionKey = buffer.getPartitionKey(data);
      assert.equal(partitionKey, "This is an example.", "Failed to successfully retrieve partition key.");
    });

    it("should succeed in using static string for partition key", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000,
        partitionKey: "partitionKey"
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
  });

  describe("split", function() {
    it("should split into multiple batches when number of records greater than threshold", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 1000000,
        partitionKey: "partitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const records = [];

      for (let i = 0; i < 1000; i++) {
        buffer.write(records, {
          message: log.stringify({
            data: "This is number " + i + "."
          }),
          logSource: "unknown",
          "@timestamp": new Date().toISOString()
        });
      }

      const batches = buffer.split(records);
      assert(batches.length > 1, "Buffer failed to split to more than 1 batch.");

      batches.forEach((batch) => {
        assert(batch.Data.length <= 500, "Batch length failed to honor maxRecords.");
      });
    });

    it("should split into multiple batches when bytes greater than threshold", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 500,
        partitionKey: "partitionKey"
      };

      const buffer = new KinesisBuffer(options);
      const records = [];

      for (let i = 0; i < 1000; i++) {
        buffer.write(records, {
          message: log.stringify({
            data: "This is number " + i + "."
          }),
          logSource: "unknown",
          "@timestamp": new Date().toISOString()
        });
      }

      const batches = buffer.split(records);
      assert(batches.length > 1, "Buffer failed to split to more than 1 batch.");

      batches.forEach((batch) => {
        assert(batch.Size <= 500);
      });
    });
  });
});
