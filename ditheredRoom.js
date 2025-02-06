import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';

export class DitheredRoom {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.setup();
    }

    setup() {
        // Basic Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111); // Dark gray background
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Add camera controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Set initial camera position
        this.camera.position.set(0, 2, 5);
        this.controls.update();

        // Add window resize handling
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Debug helpers
        this.addDebugHelpers();
    }

    addDebugHelpers() {
        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    loadModel(url) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            
            loader.load(
                url,
                (gltf) => {
                    console.log('Model loaded successfully:', gltf);
                    
                    // Center the model
                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    
                    console.log('Model dimensions:', {
                        width: size.x,
                        height: size.y,
                        depth: size.z
                    });
                    
                    // Adjust model position to center
                    gltf.scene.position.x -= center.x;
                    gltf.scene.position.y -= center.y;
                    gltf.scene.position.z -= center.z;
                    
                    this.scene.add(gltf.scene);
                    resolve(gltf);
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    }

    addInteractiveItem(position, callback) {
        // Make the cube smaller and semi-transparent for testing
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
        });
        const item = new THREE.Mesh(geometry, material);
        item.position.copy(position);
        item.userData.callback = callback;
        this.scene.add(item);
    }

    setupInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        this.container.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children, true);

            if (intersects.length > 0 && intersects[0].object.userData.callback) {
                intersects[0].object.userData.callback();
            }
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}