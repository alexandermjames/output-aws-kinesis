"use strict";

const Router = require("../lib/router.js");
const Benchmark = require("benchmark");
const KinesisStream = require("../lib/kinesis-stream");

const suite = new Benchmark.Suite;

const router = new Router();

const stream = new KinesisStream({
  partitionKey: "",
  partitionKeyProperty: "",
  maxBytes: 5000000,
  msFlushRate: undefined,
  kinesisClient: undefined,
  streamName: "router-one-tests",
  maxRetries: 3
});

suite.add('Router#getRoutes', function() {
  router.getRoutes("/var/log/nginx/access.log");
}).on('cycle', function(event) {
  console.log(String(event.target));
}).on('start', function() {
  router.addStreamPatterns(stream, ["^/var/log/\\w+/\\w+\.log$"]);
}).run({ 'async': true });
