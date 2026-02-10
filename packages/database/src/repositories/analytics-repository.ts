import { query } from "../query";

export class PostgresAnalyticsRepository {

  async getSummary(merchantId: string) {
    const [row] = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status='SUCCEEDED') as successful,
        COUNT(*) FILTER (WHERE status='FAILED') as failed,
        SUM(amount) FILTER (WHERE status='SUCCEEDED') as revenue
       FROM payment_intents
       WHERE merchant_id = $1`,
      [merchantId]
    );

    return row;
  }

  async getDailyRevenue(merchantId: string) {
    return query(
      `SELECT
         DATE(created_at) as day,
         SUM(amount) as revenue
       FROM payment_intents
       WHERE merchant_id = $1
       AND status='SUCCEEDED'
       GROUP BY day
       ORDER BY day`,
      [merchantId]
    );
  }

  async getSuccessRate(merchantId: string) {
    const [row] = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status='SUCCEEDED') * 100.0 / COUNT(*) as success_rate
       FROM payment_intents
       WHERE merchant_id = $1`,
      [merchantId]
    );

    return row;
  }
}
