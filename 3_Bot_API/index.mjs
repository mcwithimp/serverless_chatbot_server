import OpenAI from "openai";

export const handler = async (event, context) => {
    const body = event.body;
    console.log("[From Client]: ", body)
    // 환경 변수에서 OpenAI API 키와 데이터베이스 연결 정보를 불러옵니다.
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let inputData;
    try {
        inputData = JSON.parse(body);
        console.log("[User Input]: ", inputData)
    } catch (error) {
        console.error('[JSON Parsing Error]:', error);
        return { statusCode: 400, body: 'Invalid JSON format' };
    }

    if (!inputData || !inputData.content) {
        console.error('[Invalid Request]: No content provided');
        return { statusCode: 400, body: 'No content provided' };
    }

    const userMessage = inputData.content;

    try {
        // OpenAI API 호출
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "user", content: userMessage }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 1000,
        });

        const gptResponse = completion.choices[0].message.content;
        console.log("[GPT Response]: ", gptResponse)

        return {
            statusCode: 200,
            body: JSON.stringify(gptResponse)

        };
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Lambda function error');
    }
};