// Tracks WASD keydown/keyup state and mouse position/button over the canvas.
// Exposes a Set of currently held keys (lowercased) and a mouse object so
// entities/systems can query them each frame.

const held = new Set();

const canvas = document.getElementById("game-canvas");
const mouse = { x: 0, y: 0, down: false, over: false };

function onKeyDown(e) {
  const key = e.key.toLowerCase();
  if (["w", "a", "s", "d", " "].includes(key)) {
    held.add(key);
    e.preventDefault();
  }
}

function onKeyUp(e) {
  held.delete(e.key.toLowerCase());
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  mouse.over =
    mouse.x >= 0 && mouse.x <= canvas.width && mouse.y >= 0 && mouse.y <= canvas.height;
}

function onMouseDown(e) {
  if (e.button === 0) mouse.down = true;
}

function onMouseUp(e) {
  if (e.button === 0) mouse.down = false;
}

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup", onMouseUp);

export function getHeldKeys() {
  return held;
}

export function getMouse() {
  return mouse;
}
