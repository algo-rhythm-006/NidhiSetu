const { gsap } = require("gsap");

// In browser SVG:
// Let's create an object simulating an element
const elem = {
  tagName: "line",
  nodeType: 1,
  getAttribute(attr) {
    if (attr === "x1") return "100";
    return null;
  },
  style: {},
  setAttribute(k, v) { this[k] = v; },
};

try {
  // Test if gsap.set evaluates function in svgOrigin
  const fn = (i, t) => "50 150";
  console.log("Function returns:", fn(0, elem));
} catch (e) {
  console.error(e);
}

