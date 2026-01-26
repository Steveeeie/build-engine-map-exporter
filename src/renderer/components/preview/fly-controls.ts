import { type PerspectiveCamera, Euler, Vector3 } from "three";

/**
 * Fly-style camera controls for navigating 3D space.
 * - Scroll: Move camera towards facing direction
 * - Left click + drag: Rotate camera
 * - Shift + left drag: Pan camera
 */
class FlyControls {
  isDragging = false;
  lastMouseX = 0;
  lastMouseY = 0;
  euler = new Euler(0, 0, 0, "YXZ");

  constructor(
    public canvas: HTMLCanvasElement,
    public camera: PerspectiveCamera,
  ) {
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  rotateCamera(deltaX: number, deltaY: number) {
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= deltaX * 0.005;
    this.euler.x -= deltaY * 0.005;
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  panCamera(deltaX: number, deltaY: number) {
    const panSpeed = 0.01;
    const right = new Vector3();
    const up = new Vector3();

    right.setFromMatrixColumn(this.camera.matrix, 0);
    up.setFromMatrixColumn(this.camera.matrix, 1);
    this.camera.position.addScaledVector(right, -deltaX * panSpeed);
    this.camera.position.addScaledVector(up, deltaY * panSpeed);
  }

  handleMouseDown = (event: MouseEvent) => {
    if (event.button === 0) {
      this.isDragging = true;
    }

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  };

  handleMouseUp = () => {
    this.isDragging = false;
  };

  handleMouseMove = (event: MouseEvent) => {
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    if (this.isDragging && !event.shiftKey) {
      this.rotateCamera(deltaX, deltaY);
    }

    if (this.isDragging && event.shiftKey) {
      this.panCamera(deltaX, deltaY);
    }
  };

  handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const direction = new Vector3();
    const speed = event.deltaY * 0.01;
    this.camera.getWorldDirection(direction);
    this.camera.position.addScaledVector(direction, -speed);
  };

  dispose() {
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
  }
}

export { FlyControls };
