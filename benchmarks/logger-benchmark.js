"use strict";

const Logger = require("../lib/logger.js");
const Benchmark = require("benchmark");

const LOGGER = new Logger("LoggerBenchmark");

const suite = new Benchmark.Suite;

const record = {
  error: "example",
  timestamp: new Date().toISOString()
};

suite.add('Logger#stringify', function() {
  LOGGER.stringify(record);
}).on('cycle', function(event) {
  console.log(String(event.target));
}).run({ 'async': true });
