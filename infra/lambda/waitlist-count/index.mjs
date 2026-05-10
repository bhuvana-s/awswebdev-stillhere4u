import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const COUNTER_KEY = '__counter__';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=30',
};

export const handler = async () => {
  try {
    const r = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { email: COUNTER_KEY },
    }));
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ count: r.Item?.count ?? 0 }),
    };
  } catch (err) {
    console.error('get count failed', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'server error' }),
    };
  }
};
