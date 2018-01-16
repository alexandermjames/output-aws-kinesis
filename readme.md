## Output Plugin: Amazon Kinesis

Writes Logagent output to Amazon Kinesis.

## Installation

Install [@sematext/logagent](https://www.npmjs.com/package/@sematext/logagent) and [output-aws-kinesis](https://www.npmjs.com/package/output-aws-kinesis) npm package:

```
npm i -g @sematext/logagent
npm i -g output-aws-kinesis
```

### Configuration

```
options:
  includeOriginalLine: false

input:
  stdin: true
  files:
    - /tmp/test.log

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
logagent --config output-aws-kineis.yaml
```
