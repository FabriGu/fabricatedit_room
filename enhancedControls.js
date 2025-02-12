import * as THREE from 'three';

export class EnhancedControls {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;

        // Core movement settings
        this.moveSpeed = 0.005;
        this.rotateSpeed = 0.003;
        this.zoomSpeed = 0.8;  // Adjusted for smoother zoom

        // Camera rotation limits (in radians)
        this.maxPolarAngle = Math.PI * 0.4;
        this.minPolarAngle = -Math.PI * 0.4;

        // Current rotation angles
        this.rotationX = 0;
        this.rotationY = 0;

        // State management
        this.isMoving = false;
        this.lastTouch = null;
        this.touchStartDistance = 0;
        
        // Only bound horizontal movement
        this.bounds = new THREE.Box3(
            new THREE.Vector3(-3, -Infinity, -3),
            new THREE.Vector3(3, Infinity, 3)
        );

        this.setupControls();
    }

    setupControls() {
        // Touch controls for mobile/tablet
        this.domElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
        this.domElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);
        this.domElement.addEventListener('touchend', () => this.handleTouchEnd(), false);

        // Mouse controls for desktop
        this.domElement.addEventListener('mousedown', (e) => this.handleMouseDown(e), false);
        this.domElement.addEventListener('mousemove', (e) => this.handleMouseMove(e), false);
        this.domElement.addEventListener('mouseup', () => this.handleMouseUp(), false);
        this.domElement.addEventListener('wheel', (e) => this.handleWheel(e), false);

        // Prevent context menu on right click
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault(), false);
    }

    handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 1) {
            this.lastTouch = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        } else if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.touchStartDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        }
    }

    handleTouchMove(event) {
        event.preventDefault();

        if (event.touches.length === 1 && this.lastTouch) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.lastTouch.x;
            const deltaY = touch.clientY - this.lastTouch.y;

            this.rotateCamera(deltaX * this.rotateSpeed, deltaY * this.rotateSpeed);

            this.lastTouch = {
                x: touch.clientX,
                y: touch.clientY
            };
        } else if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            
            const newDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            const zoomDelta = newDistance - this.touchStartDistance;
            this.zoom(zoomDelta * 0.01);
            
            this.touchStartDistance = newDistance;

            const avgX = (touch1.clientX + touch2.clientX) / 2;
            const avgY = (touch1.clientY + touch2.clientY) / 2;
            
            if (this.lastTouch) {
                const deltaX = avgX - this.lastTouch.x;
                const deltaY = avgY - this.lastTouch.y;
                this.moveCamera(deltaX * this.moveSpeed, -deltaY * this.moveSpeed);
            }

            this.lastTouch = { x: avgX, y: avgY };
        }
    }

    handleTouchEnd() {
        this.lastTouch = null;
        this.touchStartDistance = 0;
    }

    handleMouseDown(event) {
        this.isMoving = true;
        this.lastTouch = {
            x: event.clientX,
            y: event.clientY
        };
    }

    handleMouseMove(event) {
        if (!this.isMoving) return;

        const deltaX = event.clientX - this.lastTouch.x;
        const deltaY = event.clientY - this.lastTouch.y;

        if (event.buttons === 1) { // Left click
            this.rotateCamera(deltaX * this.rotateSpeed, deltaY * this.rotateSpeed);
        } else if (event.buttons === 2) { // Right click
            this.moveCamera(deltaX * this.moveSpeed, -deltaY * this.moveSpeed);
        }

        this.lastTouch = {
            x: event.clientX,
            y: event.clientY
        };
    }

    handleMouseUp() {
        this.isMoving = false;
    }

    handleWheel(event) {
        event.preventDefault();
        this.zoom(event.deltaY * 0.001);
    }

    rotateCamera(deltaX, deltaY) {
        // Update rotation angles
        this.rotationX -= deltaX;
        this.rotationY -= deltaY;

        // Clamp vertical rotation to prevent over-rotation
        this.rotationY = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.rotationY));

        // Create the rotation quaternion
        const rotation = new THREE.Euler(this.rotationY, this.rotationX, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(rotation);
    }

    moveCamera(deltaX, deltaY) {
        // Get forward and right vectors from camera
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        forward.y = 0; // Keep movement horizontal
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        right.y = 0; // Keep movement horizontal
        right.normalize();

        // Calculate new position
        const moveVector = new THREE.Vector3();
        moveVector.addScaledVector(right, deltaX);
        moveVector.addScaledVector(forward, deltaY);

        const newPosition = this.camera.position.clone().add(moveVector);

        // Only check horizontal bounds
        const horizontalBounds = new THREE.Box3(
            new THREE.Vector3(this.bounds.min.x, -Infinity, this.bounds.min.z),
            new THREE.Vector3(this.bounds.max.x, Infinity, this.bounds.max.z)
        );

        if (horizontalBounds.containsPoint(newPosition)) {
            this.camera.position.copy(newPosition);
        }
    }

    zoom(delta) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        
        // Apply zoom speed and direction
        forward.multiplyScalar(delta * this.zoomSpeed);
        
        // Update camera position without bounds checking for zoom
        this.camera.position.add(forward);
    }

    update() {
        // Add any per-frame updates here if needed
    }

    set bounds(newBounds) {
        this._bounds = newBounds;
    }

    get bounds() {
        return this._bounds;
    }
}