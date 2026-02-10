import { PaymentStatus } from "./payment-status";

export class Payment {
  constructor(
    public id: string,
    public status: PaymentStatus,
  ) {}

  transition(next: PaymentStatus) {
    const allowed = this.allowedTransitions();

    if (!allowed.includes(next)) {
      throw new Error(`Invalid payment transition: ${this.status} -> ${next}`);
    }

    this.status = next;
  }

  private allowedTransitions(): PaymentStatus[] {
    switch (this.status) {
      case "INITIATED":
        return ["REQUIRES_ACTION", "FAILED"];

      case "REQUIRES_ACTION":
        return ["PROCESSING", "FAILED"];

      case "PROCESSING":
        return ["SUCCEEDED", "FAILED"];

      case "SUCCEEDED":
        return ["REFUNDED"];

      default:
        return [];
    }
  }
}
