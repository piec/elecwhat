console.log("debug-renderer.js");

if (window?.ipc?.debug) {
  const elmap = {
    ping: () => {
      window.ipc.ping().then((ret) => {
        console.log(`ping -> ${ret}`);
      });
    },
    notify: () => {
      const n = new Notification("My notification");
      n.addEventListener("click", (ev, o) => {
        console.log("click", ev);
      });
    },
    but1: () => {
      console.log("but1");
    },
  };

  for (const name in elmap) {
    const el = document.getElementById(name);
    if (el) {
      el.onclick = elmap[name];
    }
  }
}

addEventListener("keydown", (e) => {
  console.debug("key", e);
});
