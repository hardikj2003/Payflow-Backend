import axios from "axios";
import { query } from "../query";
import { signPayload } from "../webhook/signature";

const RETRY_DELAYS = [0, 10000, 30000, 120000, 600000, 3600000];

async function processEvents() {
  const jobs = await query(
    `SELECT e.*, w.url, w.secret, w.id as webhook_id,
            d.id as delivery_id,
            COALESCE(d.attempts,0) as attempts,
            d.max_attempts,
            d.next_retry_at
     FROM events e
     JOIN webhooks w ON w.merchant_id = e.merchant_id
     LEFT JOIN webhook_deliveries d ON d.event_id = e.id
     WHERE (
        d.id IS NULL
        OR (d.status = 'FAILED' AND d.next_retry_at <= NOW())
     )
     LIMIT 10`,
  );

  for (const job of jobs) {
    const attempt = job.attempts + 1;

    try {
      const body = JSON.stringify({
        id: job.id,
        type: job.type,
        data: job.data,
      });

      const signature = signPayload(body, job.secret);

      const res = await axios.post(job.url, body, {
        headers: {
          "Content-Type": "application/json",
          "x-payflow-signature": signature,
        },
        timeout: 3000,
      });

      await query(
        `INSERT INTO webhook_deliveries
         (webhook_id, event_id, status, attempts, response_code, last_attempt_at)
         VALUES ($1,$2,'SUCCESS',$3,$4,NOW())
         ON CONFLICT (event_id)
         DO UPDATE SET
           status='SUCCESS',
           attempts=$3,
           response_code=$4,
           last_attempt_at=NOW()`,
        [job.webhook_id, job.id, attempt, res.status],
      );

      console.log("Delivered", job.id);
    } catch {
      if (attempt >= job.max_attempts) {
        console.log("Permanent failure", job.id);
        continue;
      }

      const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
      const nextRetry = new Date(Date.now() + delay);

      await query(
        `INSERT INTO webhook_deliveries
         (webhook_id, event_id, status, attempts, next_retry_at, last_attempt_at)
         VALUES ($1,$2,'FAILED',$3,$4,NOW())
         ON CONFLICT (event_id)
         DO UPDATE SET
           attempts=$3,
           status='FAILED',
           next_retry_at=$4,
           last_attempt_at=NOW()`,
        [job.webhook_id, job.id, attempt, nextRetry],
      );

      console.log(`Retry ${attempt} scheduled in ${delay / 1000}s`);
    }
  }
}

setInterval(processEvents, 3000);
