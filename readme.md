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
    endpoint: https://localhost:4567
    maxRecords: 500
    maxBytes: 5242880
    msFlushRate: 5000
    partitionKey: staticPartitionKey
    partitionKeyField: dynamicPartitionKey
```

- **region** - AWS region. Supplied either in configuration of via AWS_REGION environment variable.
- **streamName** - AWS Kinesis stream name.
- **maxRetries** - The number of time AWS Kinesis client will retry failures, including failed records.
- **accessKeyId** - AWS access key id. Supplied either in configuration of via AWS_ACCESS_KEY_ID environment variable.
- **secretAccessKey** - AWS secret access key. Supplied either in configuration of via AWS_SECRET_ACCESS_KEY environment variable.
- **endpoint** - Optional endpoint for AWS Kinesis stream. Currently used in integration testing.
- **maxRecords** - The maximum number of records sent in a batch to AWS Kinesis.
- **maxBytes** - The maximum number of bytes sent in a batch to AWS Kinesis.
- **msFlushRate** - The rate in milliseconds, at which to flush records to AWS Kinesis.
- **partitionKey** - Statically defined partition key for AWS Kinesis record.
- **partitionKeyField** - Dynamically defined partition key for AWS Kinesis record. If supplied, the log data must be JSON parseable as this field is used to retrieve the partition key for the record.

### Start logagent

```
logagent --config output-aws-kinesis.yaml
```

### Benchmarks

```
KinesisBuffer#write - JSON Property PartitionKey x 130,800 ops/sec ±4.42% (57 runs sampled)
KinesisBuffer#split - Less Records, More Bytes x 339 ops/sec ±3.84% (67 runs sampled)
KinesisBuffer#write - Static PartitionKey x 176,793 ops/sec ±3.09% (70 runs sampled)
KinesisBuffer#write - UUIDV4 PartitionKey x 59,972 ops/sec ±5.27% (69 runs sampled)
```
