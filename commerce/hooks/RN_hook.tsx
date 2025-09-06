import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "@/constants";
export default function useDeliveryTracking(orderId: string) {
  const [position, setPosition] = useState<{lat:number, lng:number} | null>(null);

  useEffect(() => {
    const socket: Socket = io(`${BASE_URL}`, {
      transports: ["websocket"],
    });

    socket.emit("join_order", { order_id: orderId });

    socket.on("location_update", (data: any) => {
      if (data.order_id === orderId) {
        setPosition(data.location);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  return position;
}
