declare module "razorpay" {
  interface Orders {
    create(params: {
      amount: number;
      currency: string;
      receipt?: string;
      notes?: Record<string, any>;
      partial_payment?: boolean;
    }): Promise<{
      id: string;
      entity: string;
      amount: number;
      amount_paid: number;
      amount_due: number;
      currency: string;
      receipt: string;
      status: string;
      attempts: number;
      notes: Record<string, any>;
      created_at: number;
    }>;
    fetch(orderId: string): Promise<any>;
  }

  interface Payments {
    fetch(paymentId: string): Promise<any>;
    capture(paymentId: string, amount: number, currency: string): Promise<any>;
  }

  export default class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    orders: Orders;
    payments: Payments;
  }
}
