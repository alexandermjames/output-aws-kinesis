"use strict";

const assert = require("assert");

const Router = require("../lib/router.js");
const KinesisStream = require("../lib/kinesis-stream.js");

const streamOne = new KinesisStream({
  partitionKey: "",
  partitionKeyProperty: "",
  maxBytes: 5000000,
  maxRecords: 500,
  msFlushRate: 0,
  kinesisClient: undefined,
  streamName: "router-one-tests",
  maxRetries: 3
});

const streamTwo = new KinesisStream({
  partitionKey: "",
  partitionKeyProperty: "",
  maxBytes: 5000000,
  maxRecords: 500,
  msFlushRate: 0,
  kinesisClient: undefined,
  streamName: "router-two-tests",
  maxRetries: 3
});

describe("Router", function() {
  describe("#constructor", function() {
    it("should return new instance", function() {
      new Router();
    });
  });

  describe("#addStreamPatterns", function() {
    it("should associate stream to patterns", function() {
      const regexps = ["example", "oh-yeah"];
      const router = new Router();
      router.addStreamPatterns(streamOne, regexps);
      for (const regexp of regexps) {
        const streams = router.getRoutes(regexp);
        assert.equal(streams.has(streamOne), true, "streamOne should have been returned but was not");
      }
    });

    it("should associate multiple streams to same patterns", function() {
      const regexps = ["example", "oh-yeah"];
      const router = new Router();
      router.addStreamPatterns(streamOne, regexps);
      router.addStreamPatterns(streamTwo, regexps);
      for (const regexp of regexps) {
        const streams = router.getRoutes(regexp);
        assert.equal(streams.has(streamOne), true, "streamOne should have been returned but was not");
        assert.equal(streams.has(streamTwo), true, "streamTwo should have been returned but was not");
      }
    });
  });

  describe("#getStreams", function() {
    it("should return associated stream when route exists", function() {
      const regexps = ["/dev/null"];
      const router = new Router();
      router.addStreamPatterns(streamOne, regexps);
      const streams = router.getRoutes("/dev/null");
      assert.equal(streams.has(streamOne), true, "streamOne should have been returned but was not");
    });

    it("should route to empty set when route does not exist", function() {
      const router = new Router();
      const streams = router.getRoutes("/dev/null");
      assert.equal(streams.size, 0, "Returned unexpected stream");
    });

    it("should return all streams when no argument is passed", function() {
      const regexps = ["/dev/null"];
      const router = new Router();
      router.addStreamPatterns(streamOne, regexps);
      const streams = router.getStreams();
      assert.equal(streams.has(streamOne), true, "streamOne should have been returned but was not");
    });
  });
});
