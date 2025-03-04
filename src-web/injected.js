console.log("injected.js");

function hijackNotif() {
  window.realNotification = window.Notification;

  const override = {
    construct(target, args) {
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
      window?.rpc?.open?.(ev.target.href);
    }
  });
}

function hijack() {
  console.log("hijack");
  hijackClick();
  hijackNotif();
}

hijack();
