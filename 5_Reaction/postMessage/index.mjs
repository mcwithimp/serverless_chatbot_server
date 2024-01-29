import OpenAI from "openai";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({});

export const handler = async (event, context) => {
  const body = event.body;
  console.log("[From Client]: ", body);
  // 환경 변수에서 OpenAI API 키와 데이터베이스 연결 정보를 불러옵니다.
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const inputData = JSON.parse(body);
    if (!inputData) {
      throw new Error("No content provided");
    }

    // User Input DB 저장
    await client.send(
      new PutItemCommand({
        TableName: "chat-messages",
        Item: {
          id: { N: String(inputData.id) },
          timestamp: {
            N: String(inputData.timestamp),
          },
          text: { S: inputData.text },
          sender: { S: "user" },
        },
      })
    );

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: inputData.text }],
      model: "gpt-3.5-turbo",
      max_tokens: 1000,
    });

    const gptResponse = completion.choices[0].message.content;
    console.log("[GPT Response]: ", gptResponse);

    // GPT Output DB 저장
    const newId = inputData.id + 1;
    const newTimestamp = new Date().getTime();
    await client.send(
      new PutItemCommand({
        TableName: "chat-messages",
        Item: {
          id: { N: String(newId) },
          timestamp: {
            N: String(newTimestamp),
          },
          text: { S: gptResponse },
          sender: { S: "bot" },
        },
      })
    );

    return done(null, {
      id: newId,
      timestamp: newTimestamp,
      sender: "bot",
      text: gptResponse,
    });
  } catch (err) {
    return done(err);
  }
};

function done(err, res) {
  if (err) {
    console.error(err);
  }
  return {
    statusCode: err ? "400" : "200",
    body: err ? JSON.stringify(err) : JSON.stringify(res),
    headers: {
      "Content-Type": "application/json",
    },
  };
}
