## Output Plugin: Amazon Kinesis

Writes Logagent output to Amazon Kinesis.

## Installation

The following packages are required for successful usage:

1. [@sematext/logagent](https://www.npmjs.com/package/@sematext/logagent)
2. [output-aws-kinesis](https://www.npmjs.com/package/output-aws-kinesis)

These packages can be installed by running:

```
npm i -g @sematext/logagent
npm i -g output-aws-kinesis
```

## Integration Test Dependencies

Running integration tests, if desired, requires that the repository be cloned and that the npm package 'kinesalite' be installed. Please set 'sslEnabled' configuration property appropriately.

```
npm i -g kinesalite
```

Execute integration tests in the following manner:

```
npm run-script integration-test
```

### Configuration

Following is a sample configuration for correctly using output-aws-kinesis:

```
options:
  suppress: true
  geoipEnabled: true
  diskBufferDir: /tmp
  printStats: 60

input:
  stdin: true

output:
  kinesis:
    module: output-aws-kinesis
    debug: false
    endpoint: "http://localhost:4567"
    accessKeyId: yourAccessKeyId
    secretAccessKey: yourSecretAccessKey
    region: us-east-1
    sslEnabled: false
    maxRetries: 3
    streams:
      - streamName: "nginx-access"
        maxRecords: 500
        maxBytes: 5000000
        msFlushRate: 1000
        maxRetries: 3
        partitionKeyProperty: "X-TraceId"
        files:
          - ".*access.*"
      - streamName: "nginx-error"
        partitionKey: "ef9f6756-b3f0-4389-b045-99cc4c74d394"
        files:
          - ".*error.*"
```
- **debug**
  - Required: false
  - Default: false
  - Description:
    - Debug flag for enabling debug logging.
- **endpoint**
  - Required: false
  - Description:
    - Endpoint for AWS Kinesis stream. Currently used in integration testing.
- **accessKeyId**
  - Required: false
  - Description:
    - AWS access key id. Supplied either in configuration, via AWS_ACCESS_KEY_ID environment variable, or AWS EC2 Instance Profile.
- **secretAccessKey**
  - Required: false
  - Description:
    - AWS secret access key. Supplied either in configuration, via AWS_SECRET_ACCESS_KEY environment variable, or AWS EC2 Instance Profile.
- **region**
  - Required: false
  - Description:
    - AWS region. Supplied either in configuration or via AWS_REGION environment variable.
- **sslEnabled**
  - Required: false
  - Default: true
  - Description:
    - Enable SSL for communicating with AWS Kinesis. This must be set to false for integration tests unless kinesalite is enabled with SSL. For communicating with AWS Kinesis this setting must be set to true.
- **maxRetries**
  - Required: false
  - Max: 3
  - Min: 0
  - Default: 3
  - Description:
    - The number of times the AWS Kinesis client will retry failures, including failed records.
- **streams**
  - Required: false
  - Description:
    - Kinesis stream configurations. This allows for different streams to have different partition keys and streams.
  - Type: Array
  - Fields:
    - **streamName**
      - Required: true
      - Description:
        - The default AWS Kinesis stream name. Log records will be sent to this stream if no matching logSource entry is found.
    - **maxRecords**
      - Required: false
      - Max: 500
      - Min: 1
      - Default: 500
      - Description:
        - The maximum number of records sent in a batch to AWS Kinesis.
    - **maxBytes**
      - Required: false
      - Max: 5MB
      - Min: 1
      - Default: 5MB
      - Description:
        - The maximum number of bytes sent in a batch to AWS Kinesis.
    - **msFlushRate**
      - Required: false
      - Max: Number.MAX_SAFE_INTEGER
      - Min: 0
      - Default: 60000
      - Description:
        - The rate, in milliseconds, at which to flush records to AWS Kinesis.
    - **partitionKey**
      - Required: false
      - Description:
        - Default, statically defined, partition key for AWS Kinesis record. One of partitionKey, partitionKeyProperty or both undefined should be used. If partitionKey and partitionKeyProperty are used together, partitionKeyProperty will be honored first. If both are not defined a dynamically generated V4 UUID will be used for the partition key for each record.
    - **partitionKeyProperty**
      - Required: false
      - Description:
        - Default, dynamically defined, partition key for AWS Kinesis record. If supplied, the log data must be JSON parseable as this field is used to retrieve the partition key from the log record. See partitionKey description for further details.
    - **files**
      - Required: false
      - Description:
        - Array of regex file patterns to associate to the Kinesis stream.

### Start logagent

```
logagent --config output-aws-kinesis.yaml
```

### Benchmarks

The following benchmark was running using a MacBook Pro with 2.3 GHz Intel Core i5 and 4GB RAM using Node.js v9.4.0.

```
npm run-script benchmark-kinesis

KinesisStream#write x 481,796 ops/sec ±3.12% (79 runs sampled)
```
