## Output Plugin: Amazon Kinesis

Writes Logagent output to Amazon Kinesis.

## Installation

Install the following packages:

1. [@sematext/logagent](https://www.npmjs.com/package/@sematext/logagent)
2. [output-aws-kinesis](https://www.npmjs.com/package/output-aws-kinesis)
3. [kinesalite](https://www.npmjs.com/package/kinesalite)

```
npm i -g @sematext/logagent
npm i -g output-aws-kinesis
npm i -g kinesalite
```

### Configuration

```
options:
  includeOriginalLine: false

input:
  stdin: true

output:
  kinesis:
    module: output-aws-kinesis
    region: us-east-1
    streamName: test
    maxRetries: 3
    accessKeyId: accessKeyId
    secretAccessKey: secretAccessKey
    endpoint: http://localhost:4567
    maxRecords: 500
    maxBytes: 5242880
    msFlushRate: 1000
    defaultPartitionKey: staticPartitionKey
    defaultPartitionKeyProperty: dynamicPartitionKey
    sslEnabled: true
    logSource:
      \/tmp\/kafka.*\.log:
        partitionKey: staticPartitionKey
        partitionKeyProperty: dynamicPartitionKey
      \/tmp\/elasticsearch.*\.log:
        partitionKey: staticPartitionKey
        partitionKeyProperty: dynamicPartitionKey
```

- **region** - AWS region. Supplied either in configuration of via AWS_REGION environment variable.
- **streamName** - AWS Kinesis stream name.
- **maxRetries** - The number of time AWS Kinesis client will retry failures, including failed records.
- **accessKeyId** - AWS access key id. Supplied either in configuration of via AWS_ACCESS_KEY_ID environment variable.
- **secretAccessKey** - AWS secret access key. Supplied either in configuration of via AWS_SECRET_ACCESS_KEY environment variable.
- **endpoint** - Optional endpoint for AWS Kinesis stream. Currently used in integration testing.
- **maxRecords** - The maximum number of records sent in a batch to AWS Kinesis.
- **maxBytes** - The maximum number of bytes sent in a batch to AWS Kinesis.
- **msFlushRate** - The rate in milliseconds, at which to flush records to AWS Kinesis. If using files for input currently logagent uses a 60 second scan time.
- **defaultPartitionKey** - Default statically defined partition key for AWS Kinesis record. Can be used in harmony with logSource. If logSource pattern is not found then this partition key will be used. Either this or partitionKeyProperty should be used, but not together. If used together, partitionKeyProperty will be honored.
- **defaultPartitionKeyProperty** - Default dynamically defined partition key for AWS Kinesis record. Can be used in harmony with logSource. If logSource pattern is not found then this partition key field will be used. If supplied, the log data must be JSON parseable as this field is used to retrieve the partition key for the record.
- **sslEnabled** - Enable ssl while communicating with AWS Kinesis. Defaults to true if undefined. Should explicitly be set to true in production environments.
- **logSource** - Custom log source partition key allocation. This allows for different log sources to have different partition keys.
    - **logSourcePattern** - Log source pattern to match. This must be in escaped regex format e.g. /tmp/kafka*.log becomes \/tmp\/kafka*\.log and /tmp/elasticsearch.\*.log becomes \/tmp\/elasticsearch.\*\.log.
        - **partitionKey** - Statically defined partition key for AWS Kinesis record. Either this or partitionKeyProperty should be used, but not together. If used together, partitionKeyProperty will be honored first.
        - **partitionKeyProperty** - Dynamically defined partition key for AWS Kinesis record. If supplied, the log data must be JSON parseable as this field is used to retrieve the partition key for the record.

### Start logagent

```
logagent --config output-aws-kinesis.yaml
```

### Benchmarks

The following benchmark was running using a MacBook Pro with 2.3 GHz Intel Core i5 and 4GB RAM using Node.js v9.4.0.

```
KinesisBuffer#write - Log Source Static PartitionKey x 229,767 ops/sec ±2.94% (50 runs sampled)
KinesisBuffer#write - Static PartitionKey x 442,613 ops/sec ±3.72% (78 runs sampled)

KinesisBuffer#write - Log Source JSON Property PartitionKey x 229,666 ops/sec ±2.22% (61 runs sampled)
KinesisBuffer#write - JSON Property PartitionKey x 439,374 ops/sec ±2.07% (73 runs sampled)

KinesisBuffer#write - Log Source UUIDV4 PartitionKey x 70,105 ops/sec ±2.34% (61 runs sampled)
KinesisBuffer#write - UUIDV4 PartitionKey x 94,684 ops/sec ±1.96% (73 runs sampled)
```
