import { testPaymentProcessingFlow } from "./src/lib/payments/test-phase6";

testPaymentProcessingFlow()
  .then(results => {
    console.log("Results:", JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  });
