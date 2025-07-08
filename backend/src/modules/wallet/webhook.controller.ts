import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { WalletService } from './wallet.service';
import { TransactionType, PaymentMethod } from '@schemas/wallet.schema';

/**
 * Webhook Controller
 *
 * Handles webhook events from payment providers
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Handle Stripe webhook events
   */
  @Post('stripe')
  @ApiOperation({
    summary: 'Handle Stripe webhook',
    description: 'Process webhook events from Stripe payment gateway',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleStripeWebhook(
    @Body() rawBody: string,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const event = await this.paymentService.handleWebhook(rawBody, signature);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'transfer.paid':
          await this.handleTransferPaid(event.data.object);
          break;

        case 'transfer.failed':
          await this.handleTransferFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    try {
      const { id, amount, currency, metadata } = paymentIntent;
      const userId = metadata?.userId;

      if (!userId) {
        console.error('Missing userId in payment intent metadata');
        return;
      }

      // Convert amount from smallest unit to main unit
      const amountInMainUnit = amount / 100;

      // Add funds to wallet
      await this.walletService.addFunds(
        userId,
        amountInMainUnit,
        PaymentMethod.CARD,
        id,
        `Wallet top-up via Stripe - ${id}`,
      );

      console.log(
        `Payment succeeded: ${id}, Amount: ${amountInMainUnit} ${currency}, User: ${userId}`,
      );
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    try {
      const { id, amount, currency, metadata } = paymentIntent;
      const userId = metadata?.userId;

      if (!userId) {
        console.error('Missing userId in payment intent metadata');
        return;
      }

      // Convert amount from smallest unit to main unit
      const amountInMainUnit = amount / 100;

      // Create a failed transaction record
      const wallet = await this.walletService.getWalletByUserId(userId);
      if (wallet) {
        await this.walletService.createTransaction({
          walletId: wallet._id!,
          transactionType: TransactionType.DEPOSIT,
          amount: amountInMainUnit,
          paymentMethod: PaymentMethod.CARD,
          description: `Failed wallet top-up via Stripe - ${id}`,
          metadata: {
            paymentIntentId: id,
            currency,
            status: 'failed',
          },
          createdBy: userId,
        });
      }

      console.log(
        `Payment failed: ${id}, Amount: ${amountInMainUnit} ${currency}, User: ${userId}`,
      );
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  /**
   * Handle successful transfer (payout)
   */
  private async handleTransferPaid(transfer: any): Promise<void> {
    try {
      const { id, amount, currency, metadata } = transfer;
      const userId = metadata?.userId;

      if (!userId) {
        console.error('Missing userId in transfer metadata');
        return;
      }

      // Convert amount from smallest unit to main unit
      const amountInMainUnit = amount / 100;

      // Update transaction status to completed
      // This would typically involve finding the transaction and updating it
      console.log(
        `Transfer paid: ${id}, Amount: ${amountInMainUnit} ${currency}, User: ${userId}`,
      );
    } catch (error) {
      console.error('Error handling transfer paid:', error);
    }
  }

  /**
   * Handle failed transfer (payout)
   */
  private async handleTransferFailed(transfer: any): Promise<void> {
    try {
      const { id, amount, currency, metadata, failure_code, failure_message } =
        transfer;
      const userId = metadata?.userId;

      if (!userId) {
        console.error('Missing userId in transfer metadata');
        return;
      }

      // Convert amount from smallest unit to main unit
      const amountInMainUnit = amount / 100;

      // Handle failed transfer - this might involve refunding to wallet
      console.log(
        `Transfer failed: ${id}, Amount: ${amountInMainUnit} ${currency}, User: ${userId}, Reason: ${failure_message}`,
      );
    } catch (error) {
      console.error('Error handling transfer failed:', error);
    }
  }
}
