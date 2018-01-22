"use strict";

const log = require("../lib/log.js");

const KinesisBuffer = require("../lib/kinesis-buffer.js");
const Benchmark = require("benchmark");

// Setup

const data = {
  message: "This is an example.",
  logSource: "unknown",
  "@timestamp": new Date().toISOString()
};

let logSourceData = Object.assign({}, data);
logSourceData.logSource = "/tmp/kafka-beta.log";

// Test UUID default partition key

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

// Test static default partition key

const staticKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024,
  defaultPartitionKey: "partitionKey"
});

const staticPartitionKeySuite = new Benchmark.Suite;
staticPartitionKeySuite.add('KinesisBuffer#write - Static PartitionKey', function() {
  staticKinesisBuffer.write([], data);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });

// Test dynamic default partition key

const jsonPropertyKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024,
  defaultPartitionKeyProperty: "message"
});

const jsonPropertyPartitionKeySuite = new Benchmark.Suite;
jsonPropertyPartitionKeySuite.add('KinesisBuffer#write - JSON Property PartitionKey', function() {
  jsonPropertyKinesisBuffer.write([], data);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });

// Test UUID log source partition key

const generatedLogSourceKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024,
  logSource: {
    "\/tmp\/kafka.*\.log": {

    }
  }
});

const generatedLogSourcePartitionKeySuite = new Benchmark.Suite;
generatedLogSourcePartitionKeySuite.add('KinesisBuffer#write - Log Source UUIDV4 PartitionKey', function() {
  generatedLogSourceKinesisBuffer.write([], logSourceData);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });

// Test static log source partition key

const staticLogSourceKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024,
  logSource: {
    "\/tmp\/kafka.*\.log": {
      partitionKey: "partitionKey"
    }
  }
});

const staticLogSourcePartitionKeySuite = new Benchmark.Suite;
staticLogSourcePartitionKeySuite.add('KinesisBuffer#write - Log Source Static PartitionKey', function() {
  staticLogSourceKinesisBuffer.write([], logSourceData);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });

// Test dynamic log source partition key

const jsonPropertyLogSourceKinesisBuffer = new KinesisBuffer({
  maxRecords: 500,
  maxBytes: 1024,
  logSource: {
    "\/tmp\/kafka.*\.log": {
      partitionKeyProperty: "message"
    }
  }
});

const jsonPropertyLogSourcePartitionKeySuite = new Benchmark.Suite;
jsonPropertyLogSourcePartitionKeySuite.add('KinesisBuffer#write - Log Source JSON Property PartitionKey', function() {
  jsonPropertyLogSourceKinesisBuffer.write([], logSourceData);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });
