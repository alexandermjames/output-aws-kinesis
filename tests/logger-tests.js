"use strict";

const assert = require("assert");

const Logger = require("../lib/logger.js");

describe("Logger", function() {
  describe("#constructor", function() {
    it("should return new instance", function() {
      new Logger("LoggerTests");
    });
  });

  describe("#stringify", function() {
    it("should return same stringify as JSON.stringify", function() {
      const logger = new Logger("LoggerTests");
      const record = {
        Data: "Data",
        PartitionKey: "PartitionKey"
      };

      assert.equal(JSON.stringify(record), logger.stringify(record), "Entities did not match");
    });
  });
});
