// Tracks WASD keydown/keyup state and mouse/touch position and state over the canvas.
// Exposes a Set of currently held keys (lowercased) and a mouse object so
// entities/systems can query them each frame.

const held = new Set();

const canvas = document.getElementById("game-canvas");
const mouse = { x: 0, y: 0, down: false, over: false };
let clicked = false;

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

function updatePointerPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = clientX - rect.left;
  mouse.y = clientY - rect.top;
  mouse.over =
    mouse.x >= 0 && mouse.x <= canvas.width && mouse.y >= 0 && mouse.y <= canvas.height;
}

function onMouseMove(e) {
  updatePointerPosition(e.clientX, e.clientY);
}

function onMouseDown(e) {
  if (e.button === 0) mouse.down = true;
}

function onMouseUp(e) {
  if (e.button === 0) mouse.down = false;
}

function onClick(e) {
  if (e.button === 0) {
    updatePointerPosition(e.clientX, e.clientY);
    clicked = true;
  }
}

// Touch Event Handlers
function onTouchStart(e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    updatePointerPosition(touch.clientX, touch.clientY);
    mouse.down = true;
    e.preventDefault(); // Prevents emulated mouse events and page scrolling
  }
}

function onTouchMove(e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    updatePointerPosition(touch.clientX, touch.clientY);
    e.preventDefault();
  }
}

function onTouchEnd(e) {
  if (e.touches.length === 0) {
    mouse.down = false;
    mouse.over = false;
  } else {
    // If other fingers are still touching, update position to the primary touch
    const touch = e.touches[0];
    updatePointerPosition(touch.clientX, touch.clientY);
  }
}

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("click", onClick);
window.addEventListener("mouseup", onMouseUp);

// Touch listeners
canvas.addEventListener("touchstart", onTouchStart, { passive: false });
canvas.addEventListener("touchmove", onTouchMove, { passive: false });
window.addEventListener("touchend", onTouchEnd);
window.addEventListener("touchcancel", onTouchEnd);

export function getHeldKeys() {
  return held;
}

export function getMouse() {
  return mouse;
}

export function consumeClick() {
  const wasClicked = clicked;
  clicked = false;
  return wasClicked ? { x: mouse.x, y: mouse.y } : null;
}