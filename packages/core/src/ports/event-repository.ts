export interface EventRecord {
  id: string;
  merchant_id: string;
  type: string;
  data: any;
  created_at: Date;
}

export interface EventRepository {
  getEventsSince(merchantId: string, since: Date): Promise<EventRecord[]>;
  getEventById(id: string): Promise<EventRecord | null>;
}
