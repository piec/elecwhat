// setTimeout(() => {
console.log("renderer.js");
// debugger;

function hijack() {
  console.log("hijack");
  window.oldNotification = window.Notification;

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

  window.Notification = new Proxy(window.oldNotification, override);
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
hijack();
// });
// }, 2000);
