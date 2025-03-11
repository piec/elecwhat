console.log("injected-edit.js");

// I did not find a way to trigger edit by code
// do it by simulating clicks :o
const myedit = () => {
  const rows = document.querySelectorAll("[role=row]");
  const row = rows[rows.length - 1];
  const e = row.querySelector(".message-out > div");
  e.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

  setTimeout(() => {
    row.querySelector("span[data-icon=down-context]").click();
    e.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  }, 100);

  setTimeout(() => {
    const lis = document.querySelectorAll("[role=application] li");
    if (lis.length == 9) {
      lis[7].click();
    }
  }, 300);
};
