import { runPhase7Tests } from "./test-phase7";

async function main() {
  try {
    const results = await runPhase7Tests();
    const allPassed = results.every(r => r.status === 'PASS');
    
    if (allPassed) {
      console.log("\n✅ ALL PHASE 7 TESTS PASSED\n");
      process.exit(0);
    } else {
      console.error("\n❌ SOME PHASE 7 TESTS FAILED\n");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test runner error:", err);
    process.exit(1);
  }
}

main();
