// Import axios (ensure you have it installed via `bun add axios`)
import axios from "axios";

// Number of requests to perform for each test
const iterations = 50;
// Your test endpoint (ensure this is fast and consistent)
const testUrl = "https://a-pro.ai";

async function testAxios() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await axios.get(testUrl);
  }
  const end = performance.now();
  console.log(`Axios: ${iterations} requests took ${end - start} ms`);
}

async function testFetch() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fetch(testUrl);
  }
  const end = performance.now();
  console.log(`Fetch: ${iterations} requests took ${end - start} ms`);
}

async function runTests() {
  console.log("Running Axios benchmark...");
  await testAxios();

  console.log("Running Fetch benchmark...");
  await testFetch();
}

runTests();