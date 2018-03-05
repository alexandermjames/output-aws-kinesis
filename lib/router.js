"use strict";

function Router() {
  this.cache = new Map();
  this.streams = new Map();
};

Router.prototype.addStreamPatterns = function(stream, patterns) {
  if (!this.streams.get(stream)) {
    this.streams.set(stream, new Set());
  }

  const current = this.streams.get(stream);
  for (const pattern of patterns) {
    current.add(new RegExp(pattern));
  }
};

Router.prototype.getStreams = function() {
  return new Set(this.streams.keys());
};

Router.prototype.getRoutes = function(logSource) {
  let streams = this.cache.get(logSource);
  if (streams) {
    return streams;
  }

  streams = new Set();
  for (const [stream, regexps] of this.streams.entries()) {
    for (const regexp of regexps) {
      if (regexp.test(logSource)) {
        streams.add(stream);
      }
    }
  }

  this.cache.set(logSource, streams);
  return streams;
};

module.exports = Router;
