"use strict";

const assert = require("assert");
const AWS = require("aws-sdk");

const OutputAwsKinesis = require("../output-aws-kinesis.js");

describe("OutputAwsKinesis", function() {

  describe("constructor", function() {
    it("should fail when config.region is not specified", function() {
      const config = {};
      assert.throws(() => {
        new OutputAwsKinesis(config, undefined);
      }, Error);
    });

    it("should fail when config.streamName is not specified", function() {
      const config = {
        region: "us-east-1"
      };

      assert.throws(() => {
        new OutputAwsKinesis(config, undefined);
      }, Error);
    });

    it("should fail when config.maxRetries is missing", function() {
        const config = {
          streamName: "test-stream",
          msFlushRate: 1000
        };

        assert.throws(() => {
          new OutputAwsKinesis(config, undefined);
        }, Error);
    });

    it("should fail when config.maxRetries is greater than threshold", function() {
        const config = {
          streamName: "test-stream",
          msFlushRate: 1000,
          maxRetries: 5
        };

        assert.throws(() => {
          new OutputAwsKinesis(config, undefined);
        }, Error);
    });

    it("should fail when config.maxRetries is less than threshold", function() {
        const config = {
          streamName: "test-stream",
          msFlushRate: 1000,
          maxRetries: -1
        };

        assert.throws(() => {
          new OutputAwsKinesis(config, undefined);
        }, Error);
    });
  });

  // TODO: Fix end to end test

  describe("eventHandler", function() {

    let client;

    before(async function() {
      client = new AWS.Kinesis({
        region: "us-east-1",
        endpoint: "http://localhost:4567",
        accessKeyId: "accessKeyId",
        secretAccessKey: "secretAccessKey"
      });

      const createStreamResult = await client.createStream({
        ShardCount: 1,
        StreamName: "test"
      }).promise();
    });

    it("should publish single message using plugin", async function() {
      this.timeout(15000);
      const config = {
        region: "us-east-1",
        streamName: "test",
        maxRetries: 3,
        accessKeyId: "accessKeyId",
        secretAccessKey: "secretAccessKey",
        endpoint: "http://localhost:4567",
        maxRecords: 500,
        maxBytes: 5242880,
        msFlushRate: 5000
      };

      const outputAwsKinesis = new OutputAwsKinesis(config, {
        on: (arg1, arg2) => {
          return;
        },
        removeListener: (arg1, arg2) => {
          return;
        }
      });

      outputAwsKinesis.start();
      outputAwsKinesis.eventHandler("this is a message my main man", undefined);

      const timeout = new Promise((resolve, reject) => {
        setTimeout(async () => {
          outputAwsKinesis.stop(() => {});

          const describeStreamResult = await client.describeStream({
            StreamName: "test"
          }).promise();

          const getShardIteratorResult = await client.getShardIterator({
            StreamName: "test",
            ShardId: describeStreamResult.StreamDescription.Shards[0].ShardId,
            ShardIteratorType: "LATEST"
          }).promise();

          const getRecordsResult = await client.getRecords({
            ShardIterator: getShardIteratorResult.ShardIterator
          }).promise();

          assert.equal(getRecordsResult.Records.length, 1, "Record failed to be published.");
          assert.equal(getRecordsResult.Records[0].Data, "this is a message my main man", "Record was malformed as it was published.");
          resolve();
        }, 10000);
      });

      await timeout;
    });
  });
});
