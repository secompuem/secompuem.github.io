"use strict";
function main() {
  // get canvas
  const canvas = document.querySelector("#bg");

  function setCanvasSize() {
    const dpr = window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  // tree
  const tree = document.querySelector("#tree");

  function isTreePressed() {
    return tree.matches(":active");
  }

  const redColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--red"
  );
  const yellowColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--yellow");
  const greenColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--green");

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2d context from canvas");
  }

  function linspace(start, end, steps) {
    if (steps <= 1 || steps === Infinity || steps === -Infinity) {
      return [];
    }
    const out = [];
    for (let i = 0; i < steps; i += 1) {
      const t = i / (steps - 1);
      out.push((1 - t) * start + t * end);
    }
    return out;
  }

  let pressAmount = 0.0;
  function update(dt) {
    let speed = 1;
    let tgt = 0.0;
    if (isTreePressed()) {
      tgt = 1.0;
      speed = 3.0;
    }
    pressAmount = (1 - speed * dt) * pressAmount + speed * dt * tgt;
  }

  const isReduced =
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stepSize = 10;
    const largestAxis = Math.max(canvas.width, canvas.height);
    const normalizedStepSize = stepSize / largestAxis;
    const numSteps = Math.ceil(largestAxis / stepSize / 2) * 2 + 1;
    const coords = linspace(
      -normalizedStepSize * (numSteps - 1),
      normalizedStepSize * (numSteps - 1),
      numSteps
    );

    // aspect ratio correction
    let xf = 1.0;
    let yf = 1.0;
    if (canvas.width > canvas.height) {
      yf = canvas.width / canvas.height;
    } else {
      xf = canvas.height / canvas.width;
    }

    const t = (performance.now() / 1000) * 2 * Math.PI;

    for (let i of coords) {
      for (let j of coords) {
        let x = i;
        let y = j;

        const a = 0.4;
        const b = 0.1;
        const hyperb = -(x * x) / (a * a) + (y * y) / (b * b);
        if (hyperb < 1) {
          ctx.fillStyle = yellowColor;
        } else {
          if (y < 0) {
            ctx.fillStyle = redColor;
          } else {
            ctx.fillStyle = greenColor;
          }
        }

        const speed = isReduced ? 0 : 1 / 100;
        const wavelength = 15;
        const baseradius = 3 * (1 + 2 * pressAmount);
        const amplitude = 1;
        const movefactor = -3.0;
        const spinfactor = -3.0;

        const dist = Math.sqrt(x * x + y * y);

        // wave is a sinewave in the range [0, 1], oscillating at speed Hz
        const wave =
          (Math.sin(1.7 + wavelength * 2 * Math.PI * dist - speed * t) + 1.0) /
          2.0;
        const radius = baseradius * wave * Math.exp(-2 * dist);

        const dx = amplitude * (+movefactor * x - spinfactor * y) * wave;
        const dy = amplitude * (+spinfactor * x + movefactor * y) * wave;
        x += dx;
        y += dy;

        const rx = ((-y * xf + 1) / 2) * canvas.width;
        const ry = ((x * yf + 1) / 2) * canvas.height;

        ctx.fillRect(rx - radius / 2, ry - radius / 2, radius, radius);
      }
    }
  }

  let last = performance.now();
  let accum = 0.0;
  const STEP_TIME = 1 / 60;
  function loop() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    accum += dt;

    while (accum > STEP_TIME) {
      accum -= STEP_TIME;
      update(STEP_TIME);
    }

    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
main();
