console.log("injected.js");

function hijackNotif(prefix) {
  window.realNotification = window.Notification;

  const override = {
    construct(target, args) {
      args[0] = `${prefix}${args[0]}`;
      const thing = new target(...args);
      thing.addEventListener("click", (ev) => {
        console.log("ev", ev);
        window?.ipc?.notifyEv?.(JSON.stringify(ev));
      });

      return thing;
    },
  };

  window.Notification = new Proxy(window.realNotification, override);
}

function hijackClick() {
  document.body.addEventListener("click", (ev) => {
    if (!(ev.target instanceof HTMLAnchorElement)) return;
    if (ev.target.tagName === "A" && ev.target.getAttribute("target") === "_blank") {
      ev.preventDefault();
      window?.ipc?.open?.(ev.target.href);
    }
  });
}

function ewDoWhatsappAction(whatsappAction) {
  if (ewDoWhatsappAction.wa == null) {
    if (importDefault) {
      ewDoWhatsappAction.wa = importDefault("WAWebKeyboardRun");
    }
  }
  ewDoWhatsappAction.wa?.(whatsappAction);
}

async function ewSetupKeys() {
  const keys = await window?.ipc?.stateGet("keys");
  const kMap = await navigator.keyboard?.getLayoutMap?.();

  const parsedCache = {};
  function parseBinding(binding) {
    if (binding in parsedCache) {
      return parsedCache[binding];
    }
    const [modifiers, key] = binding.split(" ");
    let mapped;
    // if key is digit, use correct key for other keyboard layouts (like azerty)
    if (kMap && key.length == 1 && key >= "0" && key <= "9") {
      mapped = kMap.get(`Digit${key}`);
      console.debug("mapped", key, "to", mapped);
    }

    const parsed = {
      key: mapped ?? key,
      ctrlKey: modifiers.includes("C"),
      shiftKey: modifiers.includes("S"),
      altKey: modifiers.includes("A"),
      metaKey: modifiers.includes("M"),
    };
    parsedCache[binding] = parsed;
    return parsed;
  }

  console.debug("keys", keys);

  function doAction(effect) {
    ({
      OPEN_NTH_CHAT: (effect) => openNthChat(effect.chatIndex),
      // TODO Add more custom actions
    })[effect.action]?.(effect);
  }

  function openNthChat(chatIndex) {
    doAction.WAWebCmd ??= require("WAWebCmd");
    doAction.WAWebChatCollection ??= require("WAWebChatCollection");

    let skip = 0;
    for (let i = 0; i <= chatIndex; i++) {
      while (doAction.WAWebChatCollection?.ChatCollection._models[i + skip]?.__x_archive) {
        skip++;
      }
    }
    const chat = doAction.WAWebChatCollection?.ChatCollection._models[chatIndex + skip] ?? null;

    if (chat !== null) {
      chat.chat = chat;
      doAction.WAWebCmd?.Cmd.openChatBottom(chat);
    }
  }

  addEventListener("keydown", (ev) => {
    for (let [binding, effect] of Object.entries(keys)) {
      const parsed = parseBinding(binding);
      let match = true;
      // console.log("parsed", parsed);
      for (let [k, v] of Object.entries(parsed)) {
        // console.log("k", k, "v", v);
        match &&= ev?.[k] == v;
      }
      if (match) {
        console.log("effect", effect);
        if (typeof effect?.whatsappAction === "string") {
          ewDoWhatsappAction(effect.whatsappAction);
        } else if (typeof effect?.action === "string") {
          doAction(effect);
        }
      }
    }
  });
}

async function ewSetup() {
  console.log("hijack");
  hijackClick();

  const prefix = await window?.ipc?.stateGet?.("notifPrefix");
  hijackNotif(prefix);

  await ewSetupKeys();
}

void ewSetup();

function ewCloseChat() {
  ewDoWhatsappAction("CLOSE_CHAT");
}
