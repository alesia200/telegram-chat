function toMs(timestamp) {
  const value = Number(timestamp);
  if (!value) return Date.now();
  return value < 1e12 ? value * 1000 : value;
}

export function messageText(messageData) {
  if (!messageData || typeof messageData !== "object") return null;
  const text =
    messageData.textMessageData?.textMessage ||
    messageData.extendedTextMessageData?.text ||
    messageData.quotedMessage?.textMessage ||
    "";
  return typeof text === "string" && text.trim() ? text : null;
}

function mapStatus(status) {
  if (status === "read" || status === "delivered") return "delivered";
  if (status === "sent") return "sent";
  if (status === "failed" || status === "noAccount") return "error";
  return "";
}

export function interpretNotification(payload) {
  const body = payload?.body;
  if (!body?.typeWebhook) return null;

  if (body.typeWebhook === "outgoingMessageStatus") {
    const status = mapStatus(body.status);
    if (!status || !body.idMessage) return null;
    return {
      kind: "status",
      idMessage: String(body.idMessage),
      status,
      error: body.description || body.statusMessage || "",
    };
  }

  const isMessage =
    body.typeWebhook === "incomingMessageReceived" ||
    body.typeWebhook === "outgoingMessageReceived" ||
    body.typeWebhook === "outgoingAPIMessageReceived";
  if (!isMessage) return null;

  const text = messageText(body.messageData);
  const chatId = body.senderData?.chatId != null ? String(body.senderData.chatId) : "";
  if (!text || !chatId) return null;

  const phone = body.senderData?.senderPhoneNumber;
  return {
    kind: "message",
    chatId,
    outgoing: body.typeWebhook !== "incomingMessageReceived",
    text,
    id: body.idMessage ? String(body.idMessage) : `in-${body.timestamp}-${chatId}`,
    timestamp: toMs(body.timestamp),
    title:
      body.senderData.senderContactName ||
      body.senderData.senderName ||
      body.senderData.chatName ||
      "",
    phone: phone != null && phone !== "" ? String(phone) : "",
  };
}
