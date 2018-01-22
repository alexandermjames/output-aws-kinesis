#!/bin/bash
set -e

export AWS_ACCESS_KEY_ID="awsAccessKeyId"
export AWS_SECRET_ACCESS_KEY="awsSecretAccessKey"

# The purpose of this integration test suite is to verify end to end functionality
# absent of the mocha test framework.

# Set common variables
STREAM_NAME="test"
SHARD_COUNT=1
COMMON_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_DIRECTORY="${COMMON_PATH}/.."
LOG_MESSAGE="{\"message\": \"This is an example\", \"dynamicPartitionKey\": \"hello how are you\"}"

# Start Kinesalite
kinesalite --port 4567 --createStreamMs 10 &

# Save PID
KINESALITE_PID=`echo $!`

# Create "test" stream
aws kinesis create-stream --region us-east-1 --stream-name $STREAM_NAME --shard-count $SHARD_COUNT --endpoint-url "http://localhost:4567"

# Start Logagent
logagent -c "${CONFIG_DIRECTORY}"/output-aws-kinesis.yaml <<< $LOG_MESSAGE &

# Save PID
LOGAGENT_PID=`echo $!`

# Verify message was sent correctly
SHARD_ID=$(aws kinesis describe-stream --region us-east-1 --stream-name 'test' --query 'StreamDescription.Shards[0].ShardId' --endpoint-url 'http://localhost:4567')
SHARD_ID=$(eval echo $SHARD_ID)
SHARD_ITERATOR=$(aws kinesis get-shard-iterator --region us-east-1 --shard-id $SHARD_ID --shard-iterator-type LATEST --stream-name 'test' --query 'ShardIterator' --endpoint-url 'http://localhost:4567')
SHARD_ITERATOR=$(eval echo $SHARD_ITERATOR)
RECORD_DATA=$(aws kinesis get-records --region us-east-1 --shard-iterator $SHARD_ITERATOR --query 'Records[0].Data' --endpoint-url 'http://localhost:4567')
RECORD_DATA=$(eval echo $RECORD_DATA | base64 --decode)

# Cleanup
kill $KINESALITE_PID
kill $LOGAGENT_PID

# Verify results
if [[ "$RECORD_DATA" == *"This is an example"* ]]; then
  echo "The retrieved record data contained the original log message."
  exit 0
else
  echo "The original log message did not match the retrieved record data."
  echo "Record data: $RECORD_DATA"
  exit 1
fi
