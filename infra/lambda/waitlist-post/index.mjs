import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const COUNTER_KEY = '__counter__';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set([
  'Parent',
  'Child abroad',
  'Caregiver',
  'Doctor',
  'Insurance',
  'Employer',
  'Just curious',
]);

const respond = (statusCode, body) => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, { error: 'invalid json' });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const role = String(payload.role || '').trim();
  const source = String(payload.source || 'landing-page').slice(0, 64);

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return respond(400, { error: 'invalid email' });
  }
  if (!ALLOWED_ROLES.has(role)) {
    return respond(400, { error: 'invalid role' });
  }

  const timestamp = new Date().toISOString();
  let inserted = false;

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { email, role, timestamp, source },
      ConditionExpression: 'attribute_not_exists(email)',
    }));
    inserted = true;
  } catch (err) {
    if (err.name !== 'ConditionalCheckFailedException') {
      console.error('put failed', err);
      return respond(500, { error: 'server error' });
    }
  }

  let count = 0;
  try {
    if (inserted) {
      const r = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { email: COUNTER_KEY },
        UpdateExpression: 'ADD #c :one',
        ExpressionAttributeNames: { '#c': 'count' },
        ExpressionAttributeValues: { ':one': 1 },
        ReturnValues: 'UPDATED_NEW',
      }));
      count = r.Attributes?.count ?? 1;
    } else {
      const r = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { email: COUNTER_KEY },
        ConsistentRead: true,
      }));
      count = r.Item?.count ?? 0;
    }
  } catch (err) {
    console.error('counter update failed', err);
  }

  return respond(200, { count, alreadySignedUp: !inserted });
};
