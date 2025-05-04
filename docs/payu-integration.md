# PayU Payment Gateway Integration

This document outlines the integration of PayU as the primary payment gateway for Retail Bandhu.

## Overview

PayU is a leading payment gateway in India that supports various payment methods including credit cards, debit cards, net banking, UPI, and wallets. This integration replaces the previous Razorpay implementation.

## Configuration

The following environment variables are required for PayU integration:

- `PAYU_MERCHANT_KEY`: Your PayU merchant key
- `PAYU_MERCHANT_SALT`: Your PayU merchant salt
- `NEXT_PUBLIC_APP_URL`: The base URL of your application (used for callback URLs)

## Payment Flow

1. **Initiate Payment**: When a user places an order, the application creates an order record and initiates a payment request to PayU.
2. **Redirect to PayU**: The user is redirected to the PayU payment page where they can select their preferred payment method.
3. **Payment Processing**: PayU processes the payment and redirects the user back to our application.
4. **Callback Handling**: Our application verifies the payment status and updates the order accordingly.
5. **Webhook Processing**: PayU sends webhooks for payment status updates, which our application processes asynchronously.

## API Endpoints

### Payment Initiation

- `POST /api/payments/payu/create`: Creates a payment request and returns the necessary parameters for redirecting to PayU.

### Callback Endpoints

- `POST /api/payments/payu/success`: Handles successful payment callbacks from PayU.
- `POST /api/payments/payu/failure`: Handles failed payment callbacks from PayU.
- `POST /api/payments/payu/webhook`: Processes webhooks from PayU for payment status updates.

## Implementation Details

### Hash Generation

PayU requires a hash parameter for all requests to ensure data integrity. The hash is generated using the following algorithm:

\`\`\`javascript
// For payment initiation
hash = sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)

// For payment verification
hash = sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
\`\`\`

### Database Schema

The payment information is stored in the following tables:

1. `payments`: Stores payment details including transaction ID, amount, status, etc.
2. `payment_webhooks`: Logs all webhook events received from PayU.

## Testing

To test the PayU integration:

1. Use the test credentials provided by PayU.
2. Make a test payment using the PayU test cards.
3. Verify that the payment status is correctly updated in the database.
4. Check that the order status is updated accordingly.

## Troubleshooting

Common issues and their solutions:

1. **Hash Mismatch**: Ensure that the hash is generated correctly using the exact format specified by PayU.
2. **Callback URL Issues**: Make sure the callback URLs are accessible from the internet and properly configured.
3. **Payment Status Not Updated**: Check the webhook logs to see if PayU is sending the status updates correctly.

## References

- [PayU Integration Documentation](https://payu.in/developer-guide)
- [PayU Test Credentials](https://payu.in/test-credentials)
- [PayU API Reference](https://payu.in/api-reference)
\`\`\`

Now, let's create the missing components for the PayU payment flow:
