export const getCanvas = (): HTMLCanvasElement => {
  const canvas = document.getElementById("demo-canvas");

  if (canvas === null) {
    throw new Error("Canvas is not found in html layout");
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("No html canvas element.");
  }

  return canvas;
};
