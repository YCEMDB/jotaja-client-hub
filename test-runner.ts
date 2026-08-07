import { testPaymentProcessingFlow } from "./src/lib/payments/test-phase6";

async function run() {
  try {
    const results = await testPaymentProcessingFlow();
    console.log("Results:", JSON.stringify(results, null, 2));
    if (results.test1Passed && results.test2Passed) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

run();
