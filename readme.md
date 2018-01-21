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
   endpoint: https://localhost:4567 # Local Kinesalite Instance
   maxRecords: 500
   maxBytes: 5242880 # 5 MB
   msFlushRate: 5000 # 5 seconds
```

### Start logagent

```
logagent --config output-aws-kinesis.yaml
```

### Upcoming Features

Currently there is no way to define the partition key for Kinesis records. This is the next issue that will
be tackled.
