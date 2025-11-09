import amqp from "amqplib";
import { ExchangePerilDirect, ExchangePerilTopic, GameLogSlug, PauseKey } from "../internal/routing/routing.js";
import { publishJSON } from "../internal/pubsub/publish.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/subscribe.js";


async function main() {
  const rabbitURL = "amqp://guest:guest@localhost:5672/";
  const connection = await amqp.connect(rabbitURL);
  console.log("Connected to RabbitMQ successfully");
  printServerHelp()
  const channel = await connection.createConfirmChannel()
  await channel.assertExchange(ExchangePerilDirect, "direct", { durable: true })

  await declareAndBind(connection, ExchangePerilTopic, GameLogSlug, "game_logs.*", SimpleQueueType.Durable)

  while (true) {
    const [command] = await getInput()
    if (!command) {
      continue
    }
    if (command === "pause") {
      console.log("Game is paused")
      await publishJSON(channel, ExchangePerilDirect, PauseKey, {
        isPaused: true
      }
      )
    }
    if (command === "resume") {
      console.log("resuming game")
      await publishJSON(channel, ExchangePerilDirect, PauseKey, {
        isPaused: false
      })
    }
    if (command === "quit") {
      console.log("exiting the game")
      break
    }
    if (command !== "pause" && command !== "resume" && command !== "quit") {
      console.log("invalid command")
    }
  }
  try {
    // Wait for Ctrl+C to close gracefully
    process.on("SIGINT", async () => {
      console.log("\nClosing RabbitMQ connection...");
      await connection.close();
      console.log("Connection closed. Exiting...");
      process.exit(0);
    });

    console.log("Server running. Press Ctrl+C to exit.");

    await new Promise(() => { });
  } catch (err) {
    console.error("Connection to RabbitMQ failed:", err);
  }
}
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
