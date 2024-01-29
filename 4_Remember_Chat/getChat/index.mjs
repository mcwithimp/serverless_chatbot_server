import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({});

export const handler = async function (event) {
  try {
    const command = new ScanCommand({
      // 테이블 이름을 지정합니다.
      TableName: "chat-messages",
      // 커맨드의 대상 속성(attribute)지정합니다.
      // 보통은 속성의 이름을 나열하면 되지만
      // DynamoDB에서 예약어(a reserved keyword)로 사용하는 키워드가 있습니다.
      // 이 경우 해당 속성의 이름 대신 임시 이름을 생성합니다.
      // 임시 이름은 앞에 #을 붙여 사용하고, (예. #TXT)
      // ExpressionAttributeNames에서 이 임시 이름이 테이블의 어떤 속성을 뜻하는지 명시해야 합니다.
      // 추천. #TXT를 text로 변경하고 실행해 보세요.
      // 크롬 개발자 도구 -> 콘솔 탭에서 에러 메시지를 확인할 수 있습니다.
      ProjectionExpression: "id, sender, #TXT, #TIME",
      // 'text' is a reserved keyword
      ExpressionAttributeNames: {
        "#TXT": "text",
        "#TIME": "timestamp",
      },
    });

    const result = await client.send(command);
    const items =
      result.Items?.map((item) => {
        return {
          // 다이나모 디비는 데이터의 타입과 상관없이 모든 데이터를 문자열(string) 저장합니다.
          // 따라서 사용자에게 데이터 타입을 알려주어야 하는데
          // command의 결과 데이터(query response)에 데이터 타입을 표기합니다.
          // 예를 들어 사용자가 아래 4개의 속성을 지정한 상황을 생각해 봅시다.
          // 속성: id, sender, text, timestamp
          // 타입: number, string, string, number
          // 사용자가 인식하는 값: 1, 'user', 'What is AWS?', 123456789
          // 다이나모디비에 저장된 값: '1', 'user', 'What is AWS?', '123456789'
          // 한편, 사용자가 다이나모 디비로부터 데이터를 조회하는 경우 얻게 되는 결과는 아래와 같습니다.
          //
          // const dataRetrieved = {
          //   id: {
          //     N: "1",
          //   },
          //   sender: {
          //     S: "user",
          //   },
          //   text: {
          //     S: "What is AWS?",
          //   },
          //   timestamp: {
          //     N: "12345678",
          //   },
          // };
          // 타입과 관계없이 문자열로 저장되어 있는 데이터.
          // 이 데이터의 타입을 지정하기 위해 형식 지정자(Data type descriptors)를 함께 보내줍니다.
          // Data type descriptors는 아래 링크에서 확인하실 수 있습니다.(페이지의 가장 하단부 위치)
          // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.DataTypeDescriptors

          // 다소 비효율적으로 보이지만 다이나모 디비를 설계한 사람의 의도가 있겠죠
          // 데이터를 저장할 때 모든 데이터를 문자열로 저장하면 관리가 보다 용이합니다.
          // 데이터를 취급하는 쪽에서는 형식 지정자를 통해 데이터의 타입을 명확하게 인지할 수 있습니다.
          // 예를 들어, 바로 아래 id의 경우 item.id.N은 마치 'item의 id는 N 타입이다'로 읽을 수 있습니다.
          id: Number(item.id.N),
          sender: item.sender.S,
          text: item.text.S,
          timestamp: Number(item.timestamp.N),
        };
      }) || [];
    return done(null, items);
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
