import { Router } from 'express';
import catalyst from 'zcatalyst-sdk-node';
import { requireAuth } from '../middleware/auth';

const router = Router();
const TABLE = 'PushSubscriptions';

type ZcqlRow = Record<string, Record<string, string>>;

router.post('/subscriptions', requireAuth, async (req, res) => {
  const { email, endpoint, keys } = req.body as {
    email: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!email || !endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const catalystApp = catalyst.initialize(req as unknown as { [x: string]: unknown });
    const safeEndpoint = endpoint.replace(/'/g, "''");
    const existing = await catalystApp
      .zcql()
      .executeZCQLQuery(`SELECT ROWID FROM ${TABLE} WHERE endpoint = '${safeEndpoint}'`);

    if ((existing as ZcqlRow[]).length === 0) {
      await catalystApp.datastore().table(TABLE).insertRow({
        email,
        endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Subscription insert error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.delete('/subscriptions', requireAuth, async (req, res) => {
  const { endpoint } = req.body as { endpoint: string };

  if (!endpoint) {
    res.status(400).json({ error: 'endpoint is required' });
    return;
  }

  try {
    const catalystApp = catalyst.initialize(req as unknown as { [x: string]: unknown });
    const safeEndpoint = endpoint.replace(/'/g, "''");
    const rows = (await catalystApp
      .zcql()
      .executeZCQLQuery(
        `SELECT ROWID FROM ${TABLE} WHERE endpoint = '${safeEndpoint}'`
      )) as ZcqlRow[];

    if (rows.length > 0) {
      const rowId = rows[0][TABLE]?.ROWID;
      if (rowId) await catalystApp.datastore().table(TABLE).deleteRow(rowId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Subscription delete error:', err);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

export default router;
