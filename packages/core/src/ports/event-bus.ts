export interface EventBus {
  publish(event: {
    type: string;
    merchantId: string;
    data: any;
  }): Promise<void>;
}
