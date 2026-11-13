import * as THREE from "three";
import { createScene } from "./scene/createScene.js";
import { createGalaxy } from "./scene/createGalaxy.js";
import { createStars } from "./scene/createStars.js";
import { createPhotoMoons } from "./scene/photoMoons.js";
import { createShootingStars } from "./scene/shootingStars.js";
import { createCameraController } from "./scene/cameraController.js";
import { createAmbientDrift } from "./core/ambientDrift.js";
import { createCameraFlight } from "./core/cameraFlight.js";
import { createVisitedStore } from "./core/visitedStore.js";
import { STAR_COUNT } from "./utils/device.js";
import { setupIntro } from "./ui/intro.js";
import { createMemoryModal } from "./ui/memoryModal.js";
import { createCenterModal } from "./ui/centerModal.js";
import { createMusicPlayer } from "./ui/musicPlayer.js";
import { createSystemNavigator } from "./ui/systemNavigator.js";
import { createSystemLabels } from "./ui/systemLabels.js";
import { createIdleChrome } from "./ui/idleChrome.js";
import { createStoryMode } from "./ui/storyMode.js";
import { createHelpCard } from "./ui/helpCard.js";

// A pointer press counts as a click only if it barely moved and was short,
// so dragging to rotate the view never opens a memory by accident.
const CLICK_MOVE_LIMIT = 7;
const CLICK_TIME_LIMIT = 520;
const CARD_OPEN_TIME = 700; // how long the card takes to grow out of its planet

export function startUniverse({ zones, memories, playlist, storageKey }, { photos } = {}) {
  const canvas = document.querySelector("#universe-canvas");
  const zonePanel = document.querySelector("#zone-panel");
  let introDone = false;

  const visited = createVisitedStore(storageKey);
  const { scene, camera, renderer, clock, resize } = createScene(canvas);
  const cameraController = createCameraController(camera, renderer.domElement);
  const controls = cameraController.controls;
  const cameraFlight = createCameraFlight(camera, controls);
  const stars = createStars({ radius: 2400, count: STAR_COUNT });
  const galaxy = createGalaxy({ zones, memories, visitedIds: visited.ids });
  const photoMoons = createPhotoMoons({ bodies: galaxy.bodies, camera, photos });
  const shootingStars = createShootingStars({ camera });
  const musicPlayer = createMusicPlayer({ playlist });
  const systemNavigator = createSystemNavigator({
    zones,
    memories,
    getVisitedIds: () => visited.ids,
    onSelect: focusZone,
    onHome: returnHome,
    onResetVisited: resetVisitedMemories,
  });
  const memoryModal = createMemoryModal({
    memories,
    onClose: onViewerClosed,
    onNavigate: travelToMemory,
    getOrigin: getMemoryScreenOrigin,
  });
  const centerModal = createCenterModal({ onClose: onViewerClosed });
  const story = createStoryMode({
    memories,
    showMemory: showMemoryInStory,
    revealNote: () => memoryModal.revealNote(),
    showCenter: showCenterInStory,
    stopViewing,
    canStart: () => !isBusy(),
  });
  const systemLabels = createSystemLabels({
    zones,
    bodies: galaxy.bodies,
    camera,
    onSelect: focusZone,
  });
  const idleChrome = createIdleChrome();
  const helpCard = createHelpCard();
  const ambientDrift = createAmbientDrift({
    camera,
    controls,
    canDrift: () => introDone && controls.enabled && !isBusy() && !story.isPlaying(),
  });
  const intro = setupIntro({
    camera,
    controls,
    onComplete: () => {
      introDone = true;
      helpCard.show();
      systemLabels.show();
      idleChrome.start();
      story.show();
      systemNavigator.show();
      musicPlayer.show();
      musicPlayer.play();
    },
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hoveredBody = null;
  let savedView = null;
  let pointerDown = null;

  scene.add(stars.group, galaxy.group, shootingStars.group);

  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", () => {
    pointerDown = null;
  });
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  animate();

  function animate() {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    intro.update(delta);
    cameraFlight.update(delta);
    ambientDrift.update(delta);
    cameraController.update(delta);
    stars.update(delta, elapsed);
    shootingStars.update(delta);
    galaxy.update(delta, elapsed);
    photoMoons.update();
    systemLabels.update();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // ── Pointer interaction ────────────────────────────────────

  function isBusy() {
    return cameraFlight.isActive() || memoryModal.isOpen() || centerModal.isOpen();
  }

  function onPointerMove(event) {
    if (isBusy()) {
      return;
    }

    const body = getBodyAt(event);

    if (body !== hoveredBody) {
      setHovered(body);

      if (body) {
        showZonePanel(body);
      } else {
        hideZonePanel();
      }
    }
  }

  function onPointerLeave() {
    pointerDown = null;
    setHovered(null);
    hideZonePanel();
  }

  function onPointerDown(event) {
    if (isBusy()) {
      return;
    }

    pointerDown = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      body: getBodyAt(event),
    };
  }

  function onPointerUp(event) {
    if (!pointerDown || pointerDown.pointerId !== event.pointerId) {
      return;
    }

    const start = pointerDown;
    pointerDown = null;

    if (isBusy() || !start.body) {
      return;
    }

    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    const elapsed = performance.now() - start.time;

    if (moved > CLICK_MOVE_LIMIT || elapsed > CLICK_TIME_LIMIT || getBodyAt(event) !== start.body) {
      return;
    }

    galaxy.setSelected(start.body);
    hideZonePanel();
    renderer.domElement.style.cursor = "default";
    focusMemoryBody(start.body);
  }

  function getBodyAt(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const [hit] = raycaster.intersectObjects(galaxy.interactiveObjects, false);

    return hit?.object.userData.body ?? null;
  }

  function setHovered(body) {
    hoveredBody = body;
    galaxy.setHovered(body);
    renderer.domElement.style.cursor = body ? "pointer" : "default";
  }

  function clearInteraction() {
    setHovered(null);
    galaxy.setSelected(null);
    hideZonePanel();
  }

  function showZonePanel(body) {
    const title = zonePanel?.querySelector("h2");

    if (title) {
      title.textContent = body.memory.title;
    }

    if (zonePanel) {
      zonePanel.style.borderColor = body.zone.color;
      zonePanel.classList.add("is-visible");
    }
  }

  function hideZonePanel() {
    zonePanel?.classList.remove("is-visible");
  }

  // ── Camera travel ──────────────────────────────────────────

  // Flies to a planet (or the center star) and opens its card.
  // `shouldOpen` lets the story skip opening if it was stopped mid-flight;
  // `onOpened` runs once the card is on screen.
  function focusMemoryBody(body, { preserveSavedView = false, shouldOpen = () => true, onOpened } = {}) {
    const isCenter = body.memory.kind === "center";
    const focusTarget = body.group.getWorldPosition(new THREE.Vector3());

    systemNavigator.setActive(body.zone.id);

    if (!preserveSavedView) {
      savedView = {
        cameraPosition: camera.position.clone(),
        target: controls.target.clone(),
      };
    }

    const viewDirection = camera.position.clone().sub(focusTarget);

    if (viewDirection.lengthSq() < 0.001) {
      viewDirection.set(0.35, 0.22, 1);
    }

    viewDirection.normalize();

    const distance = body.focusDistance ?? (isCenter ? 96 : 48);
    const lift = body.focusLift ?? (isCenter ? 24 : 11);
    const sideDirection = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), viewDirection);

    if (sideDirection.lengthSq() < 0.001) {
      sideDirection.set(1, 0, 0);
    }

    sideDirection.normalize();

    const toCamera = focusTarget
      .clone()
      .add(viewDirection.multiplyScalar(distance))
      .add(sideDirection.multiplyScalar(isCenter ? 0 : distance * 0.16))
      .add(new THREE.Vector3(0, lift, 0));

    cameraFlight.start({
      toCamera,
      toTarget: focusTarget,
      duration: cameraFlight.durationTo(toCamera, 1.1, 1.72),
      arcHeight: isCenter ? 34 : 22,
      onComplete: () => {
        if (!shouldOpen()) {
          restoreCameraView();
          return;
        }

        musicPlayer.setDucked(true);

        if (isCenter) {
          centerModal.open(body.memory);
        } else {
          markMemoryVisited(body.memory);
          memoryModal.open(body.memory);
        }

        onOpened?.();
      },
    });
  }

  function travelToMemory(memory) {
    if (!memory || cameraFlight.isActive() || centerModal.isOpen()) {
      return false;
    }

    const body = galaxy.bodies.find((item) => item.memory.id === memory.id);

    if (!body) {
      return false;
    }

    clearInteraction();
    galaxy.setSelected(body);
    focusMemoryBody(body, { preserveSavedView: true });

    return true;
  }

  function focusZone(zone) {
    if (!zone || isBusy()) {
      return false;
    }

    const zoneBodies = galaxy.bodies.filter((body) => body.zone.id === zone.id);

    if (zoneBodies.length === 0) {
      return false;
    }

    savedView = null;
    clearInteraction();

    const target = getBodiesCenter(zoneBodies);
    const radius = getBodiesRadius(target, zoneBodies);
    const viewDirection = camera.position.clone().sub(controls.target);

    if (viewDirection.lengthSq() < 0.001) {
      viewDirection.set(0.35, 0.2, 1);
    }

    viewDirection.normalize();

    const distance = zone.isCenter ? 260 : THREE.MathUtils.clamp(radius * 1.7, 140, 620);
    const lift = zone.isCenter ? 78 : THREE.MathUtils.clamp(radius * 0.34, 36, 165);
    const toCamera = target
      .clone()
      .add(viewDirection.multiplyScalar(distance))
      .add(new THREE.Vector3(0, lift, 0));

    cameraFlight.start({
      toCamera,
      toTarget: target,
      duration: cameraFlight.durationTo(toCamera, 1.05, 1.85),
      arcHeight: zone.isCenter ? 24 : 36,
      onComplete: () => {
        controls.enabled = true;
        systemNavigator.setActive(zone.id);
      },
    });

    return true;
  }

  function returnHome() {
    if (isBusy()) {
      return false;
    }

    savedView = null;
    clearInteraction();
    cameraController.goHome();

    return true;
  }

  function onViewerClosed() {
    story.stop();
    restoreCameraView();
  }

  function restoreCameraView() {
    musicPlayer.setDucked(false);

    if (!savedView) {
      controls.enabled = true;
      return;
    }

    cameraFlight.start({
      toCamera: savedView.cameraPosition,
      toTarget: savedView.target,
      duration: cameraFlight.durationTo(savedView.cameraPosition, 0.95, 1.42),
      arcHeight: 12,
      onComplete: () => {
        controls.enabled = true;
        galaxy.setSelected(null);
        savedView = null;
      },
    });
  }

  // ── Story mode ─────────────────────────────────────────────

  // Resolves once the memory's card has finished opening.
  function showMemoryInStory(memory, isCurrent) {
    const body = galaxy.bodies.find((item) => item.memory.id === memory.id);

    if (!body) {
      return Promise.resolve();
    }

    const preserveSavedView = memoryModal.isOpen();

    memoryModal.closeForTravel();
    clearInteraction();
    galaxy.setSelected(body);

    return new Promise((resolve) => {
      focusMemoryBody(body, {
        preserveSavedView,
        shouldOpen: isCurrent,
        onOpened: () => window.setTimeout(resolve, CARD_OPEN_TIME),
      });
    });
  }

  function showCenterInStory(isCurrent) {
    const body = galaxy.bodies.find((item) => item.memory.kind === "center");

    memoryModal.closeForTravel();
    clearInteraction();

    if (!body || !isCurrent()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      focusMemoryBody(body, { preserveSavedView: true, shouldOpen: isCurrent, onOpened: resolve });
    });
  }

  function stopViewing() {
    if (memoryModal.isOpen()) {
      memoryModal.close();
    } else if (centerModal.isOpen()) {
      centerModal.close();
    }
  }

  // Where a memory's photo moon is on screen, so its card can grow out of it.
  function getMemoryScreenOrigin(memory) {
    const body = galaxy.bodies.find((item) => item.memory.id === memory.id);

    if (!body?.photoSize) {
      return null;
    }

    const position = body.group.getWorldPosition(new THREE.Vector3());
    const distance = camera.position.distanceTo(position);
    const projected = position.clone().project(camera);

    if (projected.z > 1) {
      return null;
    }

    const pixelsPerUnit =
      window.innerHeight / (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));

    return {
      x: ((projected.x + 1) / 2) * window.innerWidth,
      y: ((1 - projected.y) / 2) * window.innerHeight,
      size: body.photoSize * body.group.scale.x * pixelsPerUnit,
    };
  }

  // ── Visited memories ───────────────────────────────────────

  function markMemoryVisited(memory) {
    visited.add(memory.id);
    galaxy.setVisited(memory.id, true);
    systemNavigator.refresh();
    systemNavigator.setActive(memory.zoneId);
  }

  function resetVisitedMemories() {
    visited.clear();

    for (const memory of memories) {
      if (memory.kind === "memory") {
        galaxy.setVisited(memory.id, false);
      }
    }

    return true;
  }
}

function getBodiesCenter(bodies) {
  const center = new THREE.Vector3();

  for (const body of bodies) {
    center.add(body.basePosition);
  }

  return center.divideScalar(bodies.length);
}

function getBodiesRadius(center, bodies) {
  return bodies.reduce((radius, body) => {
    const bodyRadius = body.basePosition.distanceTo(center) + (body.focusDistance || 32);

    return Math.max(radius, bodyRadius);
  }, 80);
}
