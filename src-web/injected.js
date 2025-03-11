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

async function hijack() {
  console.log("hijack");
  hijackClick();

  const prefix = await window?.ipc?.stateGet?.("notification-prefix");
  hijackNotif(prefix);
}

const addedKeys = [
  {
    key: "ArrowDown",
    ctrlKey: false,
    shiftKey: false,
    altKey: true,
    handler: () => {
      importDefault("WAWebKeyboardRun")("GO_TO_NEXT_CHAT");
    },
  },
  {
    key: "ArrowUp",
    ctrlKey: false,
    shiftKey: false,
    altKey: true,
    handler: () => {
      importDefault("WAWebKeyboardRun")("GO_TO_PREV_CHAT");
    },
  },
  {
    key: "Tab",
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    handler: () => {
      importDefault("WAWebKeyboardRun")("GO_TO_NEXT_CHAT");
    },
  },
  {
    key: "Tab",
    ctrlKey: true,
    shiftKey: true,
    altKey: false,
    handler: () => {
      importDefault("WAWebKeyboardRun")("GO_TO_PREV_CHAT");
    },
  },
  {
    key: "u",
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    handler: () => {
      importDefault("WAWebKeyboardRun")("TOGGLE_UNREAD");
    },
  },
  {
    key: "ArrowUp",
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    handler: () => {
      myedit();
    },
  },
];

addEventListener("keydown", (e) => {
  for (const key of addedKeys) {
    if (e.key == key.key && e.ctrlKey == key.ctrlKey && e.shiftKey == key.shiftKey && e.altKey == key.altKey) {
      key.handler(e);
    }
  }
});

void hijack();
