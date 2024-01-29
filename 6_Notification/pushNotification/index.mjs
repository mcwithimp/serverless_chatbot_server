import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const client = new SNSClient({});

export const handler = async (event, context, callback) => {
  event.Records.forEach(async (record) => {
    console.log("Stream record: ", JSON.stringify(record, null, 2));

    if (record.eventName == "MODIFY") {
      const disliked = record.dynamodb.NewImage.disliked !== undefined;
      if (disliked === true) {
        const text = record.dynamodb.NewImage.text.S;
        const messageId = record.dynamodb.NewImage.id.N;
        const input = {
          Subject: "GPT response got disliked!",
          Message: "GPT response:  \n" + text,
          TopicArn: "arn:aws:sns:ap-northeast-2:601277122387:Dislike",
        };
        const command = new PublishCommand(input);

        try {
          const response = await client.send(command);
          console.log(
            "Results from sending message: ",
            JSON.stringify(response, null, 2)
          );
        } catch (err) {
          console.error(
            "Unable to send message. Error JSON:",
            JSON.stringify(err, null, 2)
          );
        }
      }
    }
  });
  callback(null, `Successfully processed ${event.Records.length} records.`);
};
