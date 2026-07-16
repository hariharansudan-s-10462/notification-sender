import { Router } from 'express';
import catalyst from 'zcatalyst-sdk-node';
import webpush from '../services/webpush';
import { requireAuth } from '../middleware/auth';

const router = Router();
const TABLE = 'PushSubscriptions';

type ZcqlRow = Record<string, Record<string, string>>;

router.post('/send-notification', requireAuth, async (req, res) => {
  const { recipientEmail, title, body } = req.body as {
    recipientEmail: string;
    title: string;
    body: string;
  };

  if (!recipientEmail || !title || !body) {
    res.status(400).json({ error: 'recipientEmail, title, and body are required' });
    return;
  }

  try {
    const catalystApp = catalyst.initialize(req as unknown as { [x: string]: unknown });
    const safeEmail = recipientEmail.replace(/'/g, "''");
    const rows = (await catalystApp
      .zcql()
      .executeZCQLQuery(
        `SELECT ROWID, endpoint, p256dh, auth_key FROM ${TABLE} WHERE email = '${safeEmail}'`
      )) as ZcqlRow[];

    console.log(`Found ${rows.length} subscription(s) for ${recipientEmail}`);
    let sent = 0;
    let failed = 0;
    const staleRowIds: string[] = [];

    await Promise.allSettled(
      rows.map(async (row) => {
        const record = row[TABLE];
        try {
          await webpush.sendNotification(
            {
              endpoint: record.endpoint,
              keys: { p256dh: record.p256dh, auth: record.auth_key },
            },
            JSON.stringify({ title, body })
          );
          sent++;
        } catch (err) {
          const pushErr = err as { statusCode?: number; body?: string; message?: string };
          console.error('webpush failed:', pushErr.statusCode, pushErr.body ?? pushErr.message);
          if (pushErr.statusCode === 410 && record.ROWID) {
            staleRowIds.push(record.ROWID);
          }
          failed++;
        }
      })
    );

    if (staleRowIds.length > 0) {
      await Promise.allSettled(
        staleRowIds.map((id) => catalystApp.datastore().table(TABLE).deleteRow(id))
      );
    }

    res.json({ sent, failed });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

export default router;
