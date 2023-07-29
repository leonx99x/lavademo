import React, { useEffect } from "react";

const MyComponent: React.FC = () => {
  useEffect(() => {
    // create websocket connection
    const socket = new WebSocket("wss://g.w.lavanet.xyz:443/gateway/lav1/rpc/cd735a76b298b7dca7fd0c6e44381023");

    // handle open connection
    socket.onopen = () => {
      console.log("Connection opened");

      const blockHeight = "10"; // Replace this with the actual height you want to query.

      // send data
      socket.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "block",
        params: [blockHeight],
      }));
    };

    // handle incoming message
    socket.onmessage = (message: MessageEvent) => {
      console.log("Received data: ", message.data);
    };

    // handle error
    socket.onerror = (error: Event) => {
      console.error("WebSocket error: ", error);
    };

    // handle close
    socket.onclose = (event: CloseEvent) => {
      console.log("WebSocket connection closed: ", event);
    };

    // cleanup function
    return () => {
      socket.close();
    };
  }, []); // Only run once

  return <div>WebSocket test</div>;
}

export default MyComponent;
