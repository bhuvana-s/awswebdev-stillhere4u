import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const COUNTER_KEY = '__counter__';

const ROLES = ['Parent', 'Child abroad', 'Caregiver', 'Insurance', 'Employer', 'Just curious'];

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const headers = event.headers || {};
  const provided = headers['x-admin-token'] || headers['X-Admin-Token'] || '';

  if (!ADMIN_TOKEN || provided !== ADMIN_TOKEN) {
    return respond(401, { error: 'unauthorized' });
  }

  const items = [];
  let exclusiveStartKey;
  try {
    do {
      const r = await ddb.send(new ScanCommand({
        TableName: TABLE,
        ExclusiveStartKey: exclusiveStartKey,
      }));
      for (const item of r.Items || []) {
        if (item.email !== COUNTER_KEY) items.push(item);
      }
      exclusiveStartKey = r.LastEvaluatedKey;
    } while (exclusiveStartKey);
  } catch (err) {
    console.error('scan failed', err);
    return respond(500, { error: 'server error' });
  }

  const totals = Object.fromEntries(ROLES.map((r) => [r, 0]));
  for (const it of items) {
    if (it.role && totals[it.role] !== undefined) totals[it.role] += 1;
  }

  items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  return respond(200, {
    total: items.length,
    totals,
    signups: items.map((it) => ({
      email: it.email,
      role: it.role || '',
      timestamp: it.timestamp || '',
      source: it.source || '',
    })),
  });
};
