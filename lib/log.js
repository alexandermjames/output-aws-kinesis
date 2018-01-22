"use strict";

const stringify = require("fast-safe-stringify");

let meta = {};

function init(obj) {
  meta = obj;
}

function log(label, data) {
  let log = {
    label: label,
    meta: meta,
  };

  if (data instanceof Error) {
    log.error = data;
    log.stack = data.stack;
    return console.error(stringify(log)); // return to early exit function
  }

  // see if it's already been stringified so we don't double-stringify
  // add as "input" property if it's just a regular old string
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

module.exports = {
  log: log,
  init: init,
  stringify: stringify,
};
