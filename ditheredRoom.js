
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class DitheredRoom {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.viewpoints = new Map();
        this.currentViewpoint = null;
        this.interactiveObjects = [];
        this.setup();
        this.setupLighting();
        this.setupPostProcessing();
        this.setupInteractionSystem();
    }

    setup() {
        // Previous setup code remains the same...
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Disable antialiasing for better dithering effect
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI * 0.75;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }


    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const ditherShader = {
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                ditherPattern: { value: this.createDitherPattern() }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 resolution;
                uniform sampler2D ditherPattern;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec2 ditherCoord = gl_FragCoord.xy / 8.0;
                    float threshold = texture2D(ditherPattern, mod(ditherCoord, 1.0)).r;
                    
                    // Apply dithering to each color channel separately
                    float r = step(threshold, color.r);
                    float g = step(threshold, color.g);
                    float b = step(threshold, color.b);
                    
                    // Mix between full color and dithered color
                    float ditherStrength = 0.3; // Adjust this value to control dither intensity
                    vec3 ditheredColor = mix(
                        color.rgb,
                        vec3(r, g, b),
                        ditherStrength
                    );
                    
                    gl_FragColor = vec4(ditheredColor, color.a);
                }
            `
        };

        const ditherPass = new ShaderPass(ditherShader);
        this.composer.addPass(ditherPass);
    }



    createDitherPattern() {
        const pattern = [
            0, 32, 8, 40, 2, 34, 10, 42,
            48, 16, 56, 24, 50, 18, 58, 26,
            12, 44, 4, 36, 14, 46, 6, 38,
            60, 28, 52, 20, 62, 30, 54, 22,
            3, 35, 11, 43, 1, 33, 9, 41,
            51, 19, 59, 27, 49, 17, 57, 25,
            15, 47, 7, 39, 13, 45, 5, 37,
            63, 31, 55, 23, 61, 29, 53, 21
        ].map(x => x / 64);

        const texture = new THREE.DataTexture(
            new Float32Array(pattern),
            8, 8,
            THREE.RedFormat,
            THREE.FloatType
        );
        texture.needsUpdate = true;
        return texture;
    }


    setupInteractionSystem() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.container.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.callback) {
                    object.userData.callback();
                }
            }
        });

        // Hover effect
        this.container.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

            this.interactiveObjects.forEach(obj => {
                if (obj.material) {
                    obj.material.opacity = 0.7;
                }
            });

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.material) {
                    object.material.opacity = 1;
                }
            }
        });
    }


    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Main directional light with shadows
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        
        // Point lights for room corners
        const createPointLight = (x, y, z, intensity = 0.5, color = 0xffffff) => {
            const light = new THREE.PointLight(color, intensity);
            light.position.set(x, y, z);
            light.castShadow = true;
            return light;
        };

        this.scene.add(createPointLight(-2, 2, -2, 0.5, 0xffe0b3)); // Warm light
        this.scene.add(createPointLight(2, 2, 2, 0.5, 0xb3e0ff));  // Cool light
    }

    addViewpoint(name, position, target, restrictions = {}) {
        this.viewpoints.set(name, {
            position: new THREE.Vector3(...position),
            target: new THREE.Vector3(...target),
            restrictions: {
                minAzimuth: restrictions.minAzimuth || -Infinity,
                maxAzimuth: restrictions.maxAzimuth || Infinity,
                minPolarAngle: restrictions.minPolarAngle || 0,
                maxPolarAngle: restrictions.maxPolarAngle || Math.PI,
                minDistance: restrictions.minDistance || 2,
                maxDistance: restrictions.maxDistance || 10
            }
        });
    }

    async goToViewpoint(name) {
        const viewpoint = this.viewpoints.get(name);
        if (!viewpoint) return;

        this.currentViewpoint = name;

        // Apply restrictions
        this.controls.minAzimuth = viewpoint.restrictions.minAzimuth;
        this.controls.maxAzimuth = viewpoint.restrictions.maxAzimuth;
        this.controls.minPolarAngle = viewpoint.restrictions.minPolarAngle;
        this.controls.maxPolarAngle = viewpoint.restrictions.maxPolarAngle;
        this.controls.minDistance = viewpoint.restrictions.minDistance;
        this.controls.maxDistance = viewpoint.restrictions.maxDistance;

        // Smoothly move camera to new position
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const duration = 1000; // 1 second transition
        const startTime = Date.now();

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing
                const eased = progress < 0.5 ? 
                    2 * progress * progress : 
                    -1 + (4 - 2 * progress) * progress;

                this.camera.position.lerpVectors(startPos, viewpoint.position, eased);
                this.controls.target.lerpVectors(startTarget, viewpoint.target, eased);
                this.controls.update();

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    addInteractiveItem(position, callback, type = 'default') {
        const geometries = {
            default: new THREE.BoxGeometry(0.3, 0.3, 0.3),
            viewpoint: new THREE.SphereGeometry(0.2, 16, 16),
            info: new THREE.ConeGeometry(0.2, 0.4, 16)
        };

        const materials = {
            default: new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                transparent: true,
                opacity: 0.7
            }),
            viewpoint: new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 0.7
            }),
            info: new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.7
            })
        };

        const item = new THREE.Mesh(
            geometries[type] || geometries.default,
            materials[type] || materials.default
        );
        item.position.copy(position);
        item.userData.callback = callback;
        item.userData.type = type;
        this.scene.add(item);
        this.interactiveObjects.push(item);

        return item;
    }

    setupUI() {
        const ui = document.createElement('div');
        ui.style.position = 'fixed';
        ui.style.bottom = '20px';
        ui.style.left = '20px';
        ui.style.padding = '10px';
        ui.style.background = 'rgba(0, 0, 0, 0.7)';
        ui.style.color = 'white';
        ui.style.borderRadius = '5px';
        ui.style.fontFamily = 'Arial, sans-serif';
        
        this.viewpoints.forEach((_, name) => {
            const button = document.createElement('button');
            button.textContent = name;
            button.style.margin = '5px';
            button.style.padding = '5px 10px';
            button.addEventListener('click', () => this.goToViewpoint(name));
            ui.appendChild(button);
        });
        
        this.container.appendChild(ui);
    }

    

    loadModel(url) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                url,
                (gltf) => {
                    gltf.scene.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    
                    gltf.scene.position.x -= center.x;
                    gltf.scene.position.y -= center.y;
                    gltf.scene.position.z -= center.z;
                    
                    this.scene.add(gltf.scene);
                    resolve(gltf);
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                reject
            );
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        
        // Use composer instead of renderer for dithering effect
        this.composer.render();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        
        // Update dither resolution uniform
        const ditherPass = this.composer.passes[1];
        if (ditherPass.uniforms.resolution) {
            ditherPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        }
    }
}



////-----



    // ... (keep all other methods from the previous version)

    
