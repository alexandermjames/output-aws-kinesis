"use strict";

const log = require("../lib/log.js");

const KinesisBuffer = require("../lib/kinesis-buffer.js");
const Benchmark = require("benchmark");

const data = {
  message: log.stringify({
    data: "This is an example."
  }),
  logSource: "unknown",
  "@timestamp": new Date().toISOString()
};

let records = [];
for (let i = 0; i < 10000; i++) {
  records.push(data);
}

const splitKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024
});

const splitBenchmarkSuite = new Benchmark.Suite;
splitBenchmarkSuite.add('KinesisBuffer#split - Less Records, More Bytes', function() {
  splitKinesisBuffer.split(records);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });

const generatedKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024
});

const generatedPartitionKeySuite = new Benchmark.Suite;
generatedPartitionKeySuite.add('KinesisBuffer#write - UUIDV4 PartitionKey', function() {
  generatedKinesisBuffer.write([], data);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });

const staticKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024,
  partitionKey: "partitionKey"
});

const staticPartitionKeySuite = new Benchmark.Suite;
staticPartitionKeySuite.add('KinesisBuffer#write - Static PartitionKey', function() {
  staticKinesisBuffer.write([], data);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });

const jsonPropertyKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024,
  partitionKeyField: "data"
});

const jsonPropertyPartitionKeySuite = new Benchmark.Suite;
jsonPropertyPartitionKeySuite.add('KinesisBuffer#write - JSON Property PartitionKey', function() {
  jsonPropertyKinesisBuffer.write([], data);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });
