import { Client } from "appwrite";

export const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6af18b620028fbfccf7a");

client.ping().then(() => {
  // eslint-disable-next-line no-console
  console.log("[appwrite] ping: connection established");
}).catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[appwrite] ping failed:", error);
});
