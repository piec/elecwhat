const nthChatBindings = Object.fromEntries(
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].flatMap((key, index) => [
    [`A ${key}`, { action: "OPEN_NTH_CHAT", chatIndex: index }],
    [`C ${key}`, { action: "OPEN_NTH_CHAT", chatIndex: index }],
  ])
);

export const defaultKeys = {
  "A ArrowDown": {
    whatsappAction: "GO_TO_NEXT_CHAT",
  },
  "A ArrowUp": {
    whatsappAction: "GO_TO_PREV_CHAT",
  },
  "C Tab": {
    whatsappAction: "GO_TO_NEXT_CHAT",
  },
  "CS Tab": {
    whatsappAction: "GO_TO_PREV_CHAT",
  },
  "C u": {
    whatsappAction: "TOGGLE_UNREAD",
  },
  "C ArrowUp": {
    whatsappAction: "EDIT_LAST_MESSAGE",
  },
  ...nthChatBindings,
};
