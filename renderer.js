console.log("renderer.js");

function hijackNotif() {
  window.realNotification = window.Notification;

  const override = {
    construct(target, args) {
      // console.log(`Creating a ${target.name} ${args}`);
      args[0] = `elecwhat - ${args[0]}`;
      try {
        window?.rpc?.notify?.(JSON.stringify(args));
      } catch (err) {
        console.error(`rpc err: ${err}`);
      }
      const thing = new target(...args);
      thing.addEventListener("click", (ev) => {
        console.log("ev", ev);
        window?.rpc?.notifyEv?.(JSON.stringify(ev));
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
      // ipcRenderer.send("open-link", event.target.href);
      window?.rpc?.open?.(ev.target.href);
    }
  });
}

function hijack() {
  console.log("hijack");
  hijackClick();
  hijackNotif();
}

const elmap = {
  ping: () => {
    window.rpc.ping().then((ret) => {
      console.log(`ping -> ${ret}`);
    });
  },
  notify: () => {
    const n = new Notification("duhhh");
    n.addEventListener("click", (ev, o) => {
      console.log("click", ev);
    });
  },
  hijack: () => {
    hijack();
  },
};

for (const name in elmap) {
  const el = document.getElementById(name);
  if (el) {
    el.onclick = elmap[name];
  }
}

// document.addEventListener("DOMContentLoaded", () => {
// console.log("DOMContentLoaded");
// setTimeout(() => {
hijack();
// }, 1000);
// });
