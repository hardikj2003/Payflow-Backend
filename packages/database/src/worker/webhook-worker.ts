import axios from "axios";
import { query } from "../query";

async function processEvents() {

  const events = await query(
    `SELECT e.*, w.url, w.id as webhook_id
     FROM events e
     JOIN webhooks w ON w.merchant_id = e.merchant_id
     WHERE NOT EXISTS (
       SELECT 1 FROM webhook_deliveries d
       WHERE d.event_id = e.id
     )
     LIMIT 10`
  );

  for (const event of events) {

    try {
      const response = await axios.post(event.url, {
        id: event.id,
        type: event.type,
        data: event.data
      });

      await query(
        `INSERT INTO webhook_deliveries
         (webhook_id, event_id, status, attempts, response_code, last_attempt_at)
         VALUES ($1, $2, 'SUCCESS', 1, $3, NOW())`,
        [event.webhook_id, event.id, response.status]
      );

      console.log("Delivered event", event.id);

    } catch (err: any) {

      await query(
        `INSERT INTO webhook_deliveries
         (webhook_id, event_id, status, attempts, last_attempt_at)
         VALUES ($1, $2, 'FAILED', 1, NOW())`,
        [event.webhook_id, event.id]
      );

      console.log("Failed event", event.id);
    }
  }
}

setInterval(processEvents, 3000);
