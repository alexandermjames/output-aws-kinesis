"use strict";

const stringify = require("fast-safe-stringify");

function Logger(metadata, debug) {
  this.metadata = metadata;
  this.debug = debug;
}

Logger.prototype.trace = function(label, data) {
  if (!this.debug) {
    return;
  }

  this.log(label, data);
}

Logger.prototype.log = function(label, data) {
  let log = {
    label: label,
    metadata: this.metadata,
  };

  if (data instanceof Error) {
    log.error = data;
    log.stack = data.stack;
    return console.error(stringify(log));
  }

  if (typeof data === "string" || data instanceof String) {
    try {
      log.data = JSON.parse(data);
    } catch (e) {
      log.data = data;
    }
  } else {
    log.data = data;
  }

  console.error(stringify(log));
};

Logger.prototype.stringify = stringify;

module.exports = Logger;
