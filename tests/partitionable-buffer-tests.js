"use strict";

const assert = require("assert");
const PartitionableBuffer = require("../partitionable-buffer.js");

describe("PartitionableBuffer", function() {

  describe("constructor", function() {
    it("should fail when opts.maxRecords > 500", function() {
        const options = {
          maxRecords: 600
        };

        assert.throws(() => {
          new PartitionableBuffer(options);
        }, Error);
    });

    it("should fail when opts.maxBytes > 5242880", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 1000000000000
      };

      assert.throws(() => {
        new PartitionableBuffer(options);
      }, Error);
    });

    it("should succeed when opts are in proper order", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      new PartitionableBuffer(options);
    });
  });

  describe("write", function() {
    it("should succeed in writing record", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const buffer = new PartitionableBuffer(options);
      buffer.write("this is a message");
      assert(buffer.split().length, 1, "Record failed to be written.");
    });

    it("should fail in writing record", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const buffer = new PartitionableBuffer(options);
      buffer.write("a".repeat(1024*1025));
      assert.equal(buffer.split().length, 0, "Record failed to be rejected.");
    });
  });

  describe("clear", function() {
    it("should succeed in clearing records", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 10000
      };

      const buffer = new PartitionableBuffer(options);
      buffer.write("this is a message");
      buffer.clear();
      assert.equal(buffer.split().length, 0, "Records were not cleared successfully.");
    });
  });

  describe("split", function() {
    it("should split into multiple batches when number of records greater than threshold", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 1000000
      };

      const buffer = new PartitionableBuffer(options);
      for (let i = 0; i < 1000; i++) {
        buffer.write("message" + i);
      }

      assert(buffer.split().length > 1, "Buffer failed to split.");
    });

    it("should split into multiple batches when bytes greater than threshold", function() {
      const options = {
        maxRecords: 500,
        maxBytes: 100
      };

      const buffer = new PartitionableBuffer(options);
      for (let i = 0; i < 1000; i++) {
        buffer.write("message" + i);
      }

      const partitions = buffer.split();
      assert(partitions.length > 1, "Buffer failed to split.");
      partitions.forEach((partition) => {
        assert(partition.Size <= 100);
      });
    });
  });
});
