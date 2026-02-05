interface PortOnePaymentRequest {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  payMethod: string;
  customer?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
  };
  customData?: Record<string, unknown>;
  redirectUrl?: string;
}

interface PortOnePaymentResponse {
  code?: string;
  message?: string;
  paymentId: string;
  transactionType?: string;
  txId?: string;
}

interface PortOneSDK {
  requestPayment(request: PortOnePaymentRequest): Promise<PortOnePaymentResponse>;
}

interface Window {
  PortOne?: PortOneSDK;
}
