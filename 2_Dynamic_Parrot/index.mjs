export const handler = async (event, context) => {
  const body = event.body;
  console.log("[From Client]: ", body);

  let inputData;
  try {
    inputData = JSON.parse(body);
    console.log("[User Input]: ", inputData);
  } catch (error) {
    console.error("[JSON Parsing Error]:", error);
    return { statusCode: 400, body: "Invalid JSON format" };
  }

  if (!inputData || !inputData.content) {
    console.error("[Invalid Request]: No content provided");
    return { statusCode: 400, body: "No content provided" };
  }

  const parrotResponse = "안녕하세요. 무엇을 도와드릴까요?";
  return {
    statusCode: 200,
    body: JSON.stringify(parrotResponse),
  };
};
