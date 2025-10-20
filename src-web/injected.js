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

async function ewSetupKeys() {
  const keys = await window?.ipc?.stateGet("keys");

  const parsedCache = {};
  function parseBinding(binding) {
    if (binding in parsedCache) {
      return parsedCache[binding];
    }
    const [modifiers, key] = binding.split(" ");
    const parsed = {
      key,
      ctrlKey: modifiers.includes("C"),
      shiftKey: modifiers.includes("S"),
      altKey: modifiers.includes("A"),
      metaKey: modifiers.includes("M"),
    };
    parsedCache[binding] = parsed;
    return parsed;
  }

  console.debug("keys", keys);

  function doWhatsappAction(whatsappAction) {
    if (doWhatsappAction.wa == null) {
      if (importDefault) {
        doWhatsappAction.wa = importDefault("WAWebKeyboardRun");
      }
    }
    doWhatsappAction.wa?.(whatsappAction);
  }
  function doAction(action) {
    console.error("unknown action", action);
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
          doWhatsappAction(effect.whatsappAction);
        } else if (typeof effect?.action === "string") {
          doAction(effect.action);
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

function closeChat() {
  closeChat.WAKeyboardRun ??= importDefault("WAWebKeyboardRun");
  closeChat.WAKeyboardRun?.('CLOSE_CHAT');
}
