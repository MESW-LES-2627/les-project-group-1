import { httpServer, io } from "./app";
import { env } from "./config/env";
import { startAuctionTimer } from "./services/auction.service";

startAuctionTimer(io);
httpServer.listen(env.port, () => {
  console.log(`Bid server running on http://localhost:${env.port}`);
});
