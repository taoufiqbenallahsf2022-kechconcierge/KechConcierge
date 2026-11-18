import "dotenv/config";
import app from "./app";
import { startChatAgentWorker } from "./services/chat-agent.service";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  startChatAgentWorker();
});
