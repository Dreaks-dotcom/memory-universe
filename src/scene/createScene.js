import * as THREE from "three";
import { getPixelRatio } from "../utils/device.js";

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020205);
  scene.fog = new THREE.FogExp2(0x020205, 0.00022);

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.1,
    6200,
  );
  camera.position.set(0, 140, 760);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(getPixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
  const keyLight = new THREE.PointLight(0xffdca3, 3.1, 1500);
  const rimLight = new THREE.PointLight(0x9ed9ff, 1.8, 1200);

  keyLight.position.set(-120, 70, 80);
  rimLight.position.set(180, -70, -160);

  scene.add(ambientLight, keyLight, rimLight);

  const clock = new THREE.Clock();

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(getPixelRatio());
  }

  return {
    scene,
    camera,
    renderer,
    clock,
    resize,
  };
}
