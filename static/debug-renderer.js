console.log("debug-renderer.js");

if (window?.rpc?.debug) {
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
}
