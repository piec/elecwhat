export const toggleVisibility = function (window) {
  console.debug("toggleVisibility");
  const vis = window.isVisible();
  if (vis) {
    window.hide();
  } else {
    window.show();
  }
  return !vis;
};

export const isDebug = process?.env?.DEBUG == 1;
