"use strict";

const KinesisStream = require("../lib/kinesis-stream.js");
const Benchmark = require("benchmark");

const suite = new Benchmark.Suite;
const kinesisStream = new KinesisStream({
  partitionKey: "examplePartitionKey",
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

const rawRecord = {
  logSource: "/dev/null",
  message: "this is an example message",
  "@timestamp": new Date().toISOString()
};

suite.add('KinesisStream#write', function() {
  kinesisStream.write(rawRecord);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });
