import { getExpiringMembers, getTodaysFollowUps, getReviewPrompts } from './lib/actions/dashboard';

async function run() {
  try {
    console.log("Fetching Expiring Members...");
    await getExpiringMembers();
    console.log("Success!");
  } catch (e) {
    console.error("Expiring Members Error:", e);
  }

  try {
    console.log("Fetching Follow Ups...");
    await getTodaysFollowUps();
    console.log("Success!");
  } catch (e) {
    console.error("Follow Ups Error:", e);
  }

  try {
    console.log("Fetching Review Prompts...");
    await getReviewPrompts();
    console.log("Success!");
  } catch (e) {
    console.error("Review Prompts Error:", e);
  }
}

run();
