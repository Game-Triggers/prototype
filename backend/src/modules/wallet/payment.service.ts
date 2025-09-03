import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentMethod, TransactionStatus } from '@schemas/wallet.schema';

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmationResult {
  success: boolean;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  gatewayResponse?: any;
}

export interface PayoutResult {
  success: boolean;
  transferId: string;
  amount: number;
  currency: string;
  status: string;
  gatewayResponse?: any;
}

export interface UPIPaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  status: TransactionStatus;
  upiRef?: string;
}

@Injectable()
export class PaymentService {
  private stripe: Stripe | null = null;
  private readonly isMockMode: boolean;

  constructor(private readonly configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.isMockMode =
      !stripeSecretKey || process.env.NODE_ENV === 'development';

    if (!this.isMockMode) {
      this.stripe = new Stripe(stripeSecretKey!, {
<<<<<<< HEAD
        apiVersion: '2025-07-30.basil',
=======
        apiVersion: '2025-08-27.basil',
>>>>>>> adcedc4 (Resolve all merge conflicts - keep energy pack system implementation)
      });
    }
  }

  /**
   * Create a payment intent for wallet top-up
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'inr',
    paymentMethod: PaymentMethod,
    metadata?: Record<string, string>,
  ): Promise<PaymentIntentResult> {
    try {
      if (this.isMockMode) {
        // Mock implementation for development
        return this.createMockPaymentIntent(
          amount,
          currency,
          paymentMethod,
          metadata,
        );
      }

      // Convert amount to smallest currency unit (paise for INR)
      const amountInSmallestUnit = Math.round(amount * 100);

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          paymentMethod,
          ...metadata,
        },
      };

      // Add specific payment method configurations
      if (paymentMethod === PaymentMethod.UPI) {
        paymentIntentData.payment_method_types = ['upi'];
      } else if (paymentMethod === PaymentMethod.CARD) {
        paymentIntentData.payment_method_types = ['card'];
      } else if (paymentMethod === PaymentMethod.NETBANKING) {
        paymentIntentData.payment_method_types = ['netbanking'];
      }

      const paymentIntent =
        await this.stripe!.paymentIntents.create(paymentIntentData);

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  /**
   * Confirm and retrieve payment status
   */
  async confirmPayment(
    paymentIntentId: string,
  ): Promise<PaymentConfirmationResult> {
    try {
      if (this.isMockMode) {
        // Mock implementation
        const mockAmount = 1000; // Default amount for mock
        const mockCurrency = 'inr';
        return this.createMockPaymentConfirmation(
          paymentIntentId,
          mockAmount,
          mockCurrency,
        );
      }

      const paymentIntent =
        await this.stripe!.paymentIntents.retrieve(paymentIntentId);

      let status: TransactionStatus;
      switch (paymentIntent.status) {
        case 'succeeded':
          status = TransactionStatus.COMPLETED;
          break;
        case 'processing':
          status = TransactionStatus.PENDING;
          break;
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
          status = TransactionStatus.PENDING;
          break;
        case 'canceled':
          status = TransactionStatus.FAILED;
          break;
        default:
          status = TransactionStatus.PENDING;
      }

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back from smallest unit
        currency: paymentIntent.currency,
        status,
        gatewayResponse: paymentIntent,
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new InternalServerErrorException('Failed to confirm payment');
    }
  }

  /**
   * Process payout to streamer bank account
   */
  async processPayout(
    amount: number,
    bankAccount: string,
    accountHolderName: string,
    currency: string = 'inr',
    metadata?: Record<string, string>,
  ): Promise<PayoutResult> {
    try {
      if (this.isMockMode) {
        // Mock implementation
        return this.createMockPayout(amount, currency, bankAccount);
      }

      // For Indian payouts, we would typically use Stripe Connect or a local payment processor
      // This is a simplified implementation
      const amountInSmallestUnit = Math.round(amount * 100);

      // Create a transfer (requires Stripe Connect setup)
      const transfer = await this.stripe!.transfers.create({
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        destination: bankAccount, // This would be the Connect account ID
        metadata: {
          accountHolderName,
          ...metadata,
        },
      });

      return {
        success: true,
        transferId: transfer.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        gatewayResponse: transfer,
      };
    } catch (error) {
      console.error('Error processing payout:', error);

      // If it's a Stripe error, provide more specific information
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Payout failed: ${error.message}`);
      }

      throw new InternalServerErrorException('Failed to process payout');
    }
  }

  /**
   * Handle UPI payment (simplified implementation)
   * In a real implementation, this would integrate with UPI payment processors
   */
  async processUPIPayment(
    amount: number,
    upiId: string,
    metadata?: Record<string, string>,
  ): Promise<UPIPaymentResult> {
    try {
      // Always use mock implementation for UPI
      return this.createMockUPIPayment(amount, upiId);
    } catch (error) {
      console.error('Error processing UPI payment:', error);
      throw new InternalServerErrorException('Failed to process UPI payment');
    }
  }

  /**
   * Handle bank transfer (simplified implementation)
   */
  async processBankTransfer(
    amount: number,
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
    },
    metadata?: Record<string, string>,
  ): Promise<PayoutResult> {
    try {
      // This would integrate with bank transfer APIs
      // For now, this is a simplified mock implementation

      const transferId = `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Basic validation
      if (
        !bankDetails.accountNumber ||
        !bankDetails.ifscCode ||
        !bankDetails.accountHolderName
      ) {
        throw new BadRequestException('Missing required bank details');
      }

      // Simulate processing
      const isSuccess = Math.random() > 0.05; // 95% success rate for simulation

      return {
        success: isSuccess,
        transferId,
        amount,
        currency: 'inr',
        status: isSuccess ? 'processing' : 'failed',
        gatewayResponse: {
          bankDetails,
          transferId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error processing bank transfer:', error);
      throw new InternalServerErrorException('Failed to process bank transfer');
    }
  }

  /**
   * Retrieve webhook events from Stripe
   */
  async handleWebhook(payload: string, signature: string): Promise<any> {
    try {
      if (this.isMockMode) {
        // Mock webhook handling
        return {
          id: `evt_mock_${Date.now()}`,
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_mock_payment_intent',
              status: 'succeeded',
              amount: 1000,
              currency: 'inr',
            },
          },
          created: Math.floor(Date.now() / 1000),
        };
      }

      const webhookSecret = this.configService.get<string>(
        'STRIPE_WEBHOOK_SECRET',
      );
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required');
      }

      const event = this.stripe!.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
      return event;
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Process auto top-up for wallet
   */
  async processAutoTopUp(
    userId: string,
    amount: number,
    paymentMethod: PaymentMethod = PaymentMethod.CARD,
  ): Promise<PaymentIntentResult> {
    try {
      // For now, this is a mock implementation
      // In production, this would trigger automatic payment using saved payment methods

      const paymentIntent = await this.createPaymentIntent(
        amount,
        'inr',
        paymentMethod,
        {
          userId,
          autoTopUp: 'true',
          type: 'auto_topup',
        },
      );

      return paymentIntent;
    } catch (error) {
      console.error('Error processing auto top-up:', error);
      throw new InternalServerErrorException('Failed to process auto top-up');
    }
  }

  /**
   * Mock payment intent creation for development
   */
  private createMockPaymentIntent(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    metadata?: Record<string, string>,
  ): PaymentIntentResult {
    const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockClientSecret = `${mockPaymentIntentId}_secret_mock`;

    return {
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
      amount: amount,
      currency: currency,
    };
  }

  /**
   * Mock payment confirmation for development
   */
  private createMockPaymentConfirmation(
    paymentIntentId: string,
    amount: number,
    currency: string,
  ): PaymentConfirmationResult {
    // Simulate different outcomes randomly
    const isSuccess = Math.random() > 0.1; // 90% success rate

    return {
      success: isSuccess,
      paymentIntentId,
      amount,
      currency,
      status: isSuccess
        ? TransactionStatus.COMPLETED
        : TransactionStatus.FAILED,
      gatewayResponse: {
        mock: true,
        timestamp: new Date().toISOString(),
        paymentMethod: 'mock_payment',
        status: isSuccess ? 'succeeded' : 'failed',
      },
    };
  }

  /**
   * Mock UPI payment for development
   */
  private createMockUPIPayment(
    amount: number,
    upiId: string,
  ): UPIPaymentResult {
    const isSuccess = Math.random() > 0.05; // 95% success rate
    const mockTransactionId = `UPI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: isSuccess,
      transactionId: mockTransactionId,
      amount,
      status: isSuccess
        ? TransactionStatus.COMPLETED
        : TransactionStatus.FAILED,
      upiRef: isSuccess ? `UPI${Date.now()}` : undefined,
    };
  }

  /**
   * Mock payout for development
   */
  private createMockPayout(
    amount: number,
    currency: string,
    accountId: string,
  ): PayoutResult {
    const isSuccess = Math.random() > 0.05; // 95% success rate
    const mockTransferId = `tr_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: isSuccess,
      transferId: mockTransferId,
      amount,
      currency,
      status: isSuccess ? 'completed' : 'failed',
      gatewayResponse: {
        mock: true,
        timestamp: new Date().toISOString(),
        destination: accountId,
        status: isSuccess ? 'paid' : 'failed',
      },
    };
  }
}
