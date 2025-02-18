import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GalleryOverlay } from './galleryOverlay.js';
import { EnhancedControls } from './enhancedControls.js';  // Import the new controls



export class DitheredRoom {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.viewpoints = new Map();
        this.currentViewpoint = null;
        this.interactiveObjects = [];
        this.setup();
        this.setupLighting();
        this.setupPostProcessing();


        // Add gallery overlay setup
        // this.setupOverlay();


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
        // add an eventlistener for windowresize to reset device pixel ratio
        
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.05;
        // this.controls.maxPolarAngle = Math.PI * 0.75;
        // this.controls.minDistance = 2;
        // this.controls.maxDistance = 10;
        console.log(this.camera);
        console.log(this.camera.quaternion)
        this.controls = new EnhancedControls(this.camera, this.renderer.domElement, this.scene);
        
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Add grid helper after this line:
        // this.scene = new THREE.Scene();

        // // Add these lines:
        // const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        // this.scene.add(gridHelper);

        // // Optional: Add axis helper to show X (red), Y (green), Z (blue) directions
        // const axisHelper = new THREE.AxesHelper(5);
        // this.scene.add(axisHelper);


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
                    
                    // Calculate luminance
                    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    
                    // Skip dithering for very dark areas
                    if (luminance < 0.01) {
                        gl_FragColor = vec4(0.0, 0.0, 0.0, color.a);
                        return;
                    }
                    
                    // Apply dithering to each color channel separately
                    float r = step(threshold, color.r);
                    float g = step(threshold, color.g);
                    float b = step(threshold, color.b);
                    
                    // Mix between full color and dithered color
                    float ditherStrength = 0.9; // Adjust this value to control dither intensity
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
    
        // Handle both mouse clicks and touch events
        const handleInteraction = (event) => {
            event.preventDefault();
            
            const x = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : null);
            const y = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : null);
            
            if (x === null || y === null) return;
    
            this.mouse.x = (x / window.innerWidth) * 2 - 1;
            this.mouse.y = -(y / window.innerHeight) * 2 + 1;
    
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
    
            if (intersects.length > 0) {
                // Hide the clicked sphere and its text
                const clickedObject = intersects[0].object;
                clickedObject.visible = false;
                if (clickedObject.userData.billboardText) {
                    clickedObject.userData.billboardText.visible = false;
                }
                
                // Execute the callback
                if (clickedObject.userData.callback) {
                    clickedObject.userData.callback();
                }
            } else {
                // If clicking anywhere else, show all spheres
                this.interactiveObjects.forEach(obj => {
                    console.log(obj)
                    obj.visible = true;
                    if (obj.userData.billboardText) {
                        obj.userData.billboardText.visible = true;
                    }
                });
            }
        };
    
        // Add both mouse and touch event listeners
        this.container.addEventListener('click', handleInteraction);
        this.container.addEventListener('touchstart', handleInteraction, { passive: false });
    
        // Keep the existing mousemove handler for hover effects
        this.container.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
    
            this.interactiveObjects.forEach(obj => {
                obj.userData.isHovered = false;
            });
    
            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.callback) {
                    object.userData.isHovered = true;
                }
            }
        });
    }


    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        //MORE LIGHT!!
        const ambientLight2 = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight2);
        // const ambientLight3 = new THREE.AmbientLight(0xffffff, 1);
        // this.scene.add(ambientLight3);
         //MORE LIGHT!!
        
        // Main directional light with shadows
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        
        // Point lights for room corners
        const createPointLight = (x, y, z, intensity = 0.8, color = 0xffffff) => {
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

    // async goToViewpoint(name) {
    //     const viewpoint = this.viewpoints.get(name);
    //     if (!viewpoint) return;

    //     this.currentViewpoint = name;

    //     // Apply restrictions
    //     // this.controls.minAzimuth = viewpoint.restrictions.minAzimuth;
    //     // this.controls.maxAzimuth = viewpoint.restrictions.maxAzimuth;
    //     // this.controls.minPolarAngle = viewpoint.restrictions.minPolarAngle;
    //     // this.controls.maxPolarAngle = viewpoint.restrictions.maxPolarAngle;
    //     // this.controls.minDistance = viewpoint.restrictions.minDistance;
    //     // this.controls.maxDistance = viewpoint.restrictions.maxDistance;

    //     this.controls.bounds = new THREE.Box3(
    //         new THREE.Vector3(
    //             viewpoint.position.x - viewpoint.restrictions.maxDistance,
    //             viewpoint.restrictions.minPolarAngle,
    //             viewpoint.position.z - viewpoint.restrictions.maxDistance
    //         ),
    //         new THREE.Vector3(
    //             viewpoint.position.x + viewpoint.restrictions.maxDistance,
    //             viewpoint.restrictions.maxPolarAngle,
    //             viewpoint.position.z + viewpoint.restrictions.maxDistance
    //         )
    //     );

    //     // Smoothly move camera to new position
    //     const startPos = this.camera.position.clone();
    //     // const startTarget = this.controls.target.clone();
    //     const duration = 1000; // 1 second transition
    //     const startTime = Date.now();

    //     // return new Promise((resolve) => {
    //     //     const animate = () => {
    //     //         const elapsed = Date.now() - startTime;
    //     //         const progress = Math.min(elapsed / duration, 1);
                
    //     //         // Smooth easing
    //     //         const eased = progress < 0.5 ? 
    //     //             2 * progress * progress : 
    //     //             -1 + (4 - 2 * progress) * progress;

    //     //         this.camera.position.lerpVectors(startPos, viewpoint.position, eased);
    //     //         this.controls.target.lerpVectors(startTarget, viewpoint.target, eased);
    //     //         this.controls.update();

    //     //         if (progress < 1) {
    //     //             requestAnimationFrame(animate);
    //     //         } else {
    //     //             resolve();
    //     //         }
    //     //     };
    //     //     animate();

    //     return new Promise((resolve) => {
    //         const animate = () => {
    //             const elapsed = Date.now() - startTime;
    //             const progress = Math.min(elapsed / duration, 1);
                
    //             const eased = progress < 0.5 ? 
    //                 2 * progress * progress : 
    //                 -1 + (4 - 2 * progress) * progress;

    //             this.camera.position.lerpVectors(startPos, viewpoint.position, eased);
                
    //             // Make camera look at target
    //             const lookAt = new THREE.Vector3(...viewpoint.target);
    //             this.camera.lookAt(lookAt);
    //             // console.log(lookAt)

    //             // console.log("Camera after viewpoint set:", {
    //             //     quaternion: this.camera.quaternion.clone(),
    //             //     euler: new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ')

    //             // });

    //             this.controls.updateRotation(this.camera.quaternion);
    //             if (progress < 1) {
    //                 requestAnimationFrame(animate);
    //             } else {
    //                 resolve();
    //             }
    //         };
    //         animate();
    //     });
    // }

// Replace the existing goToViewpoint method in DitheredRoom class with this improved version

    async goToViewpoint(name) {
        const viewpoint = this.viewpoints.get(name);
        if (!viewpoint) return;

        this.currentViewpoint = name;

        // Update control restrictions
        this.controls.bounds = new THREE.Box3(
            new THREE.Vector3(
                viewpoint.position.x - viewpoint.restrictions.maxDistance,
                viewpoint.restrictions.minPolarAngle,
                viewpoint.position.z - viewpoint.restrictions.maxDistance
            ),
            new THREE.Vector3(
                viewpoint.position.x + viewpoint.restrictions.maxDistance,
                viewpoint.restrictions.maxPolarAngle,
                viewpoint.position.z + viewpoint.restrictions.maxDistance
            )
        );

        // Get current camera state
        const startPos = this.camera.position.clone();
        const startQuat = this.camera.quaternion.clone();
        
        // Create target quaternion by looking at the target point
        const targetPos = new THREE.Vector3(...viewpoint.target);
        const tempCamera = new THREE.PerspectiveCamera();
        tempCamera.position.copy(viewpoint.position);
        tempCamera.lookAt(targetPos);
        const targetQuat = tempCamera.quaternion;

        // Calculate a smooth path using cubic Bezier curve
        const midPoint = startPos.clone().lerp(viewpoint.position, 0.5);
        const heightOffset = Math.min(startPos.distanceTo(viewpoint.position) * 0.25, 2);
        
        const controlPoint1 = startPos.clone().lerp(midPoint, 0.33);
        controlPoint1.y += heightOffset;
        
        const controlPoint2 = startPos.clone().lerp(midPoint, 0.66);
        controlPoint2.y += heightOffset;

        const curve = new THREE.CubicBezierCurve3(
            startPos,
            controlPoint1,
            controlPoint2,
            viewpoint.position
        );

        // Animation settings
        const duration = 1500; // 1.5 seconds
        const startTime = Date.now();

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing function
                const eased = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                // Get position along the curve
                const point = curve.getPoint(eased);
                this.camera.position.copy(point);

                // Interpolate rotation using quaternion slerp
                const resultQuat = new THREE.Quaternion();
                resultQuat.slerpQuaternions(startQuat, targetQuat, eased);
                this.camera.quaternion.copy(resultQuat);

                // Update controls to match new camera state
                this.controls.updateRotation(this.camera.quaternion);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure we end exactly at the target
                    this.camera.position.copy(viewpoint.position);
                    this.camera.quaternion.copy(targetQuat);
                    this.controls.updateRotation(this.camera.quaternion);
                    resolve();
                }
            };
            animate();
        });
    }
    
    // Add this helper method to calculate optimal control points for the Bezier curve
    calculateControlPoints(start, end, heightFactor = 0.5) {
        const midPoint = start.clone().lerp(end, 0.5);
        const distance = start.distanceTo(end);
        
        // Calculate control points that create a natural arc
        const control1 = start.clone().lerp(midPoint, 0.33);
        control1.y += distance * heightFactor;
        
        const control2 = start.clone().lerp(midPoint, 0.66);
        control2.y += distance * heightFactor;
        
        return [control1, control2];
    }

    // addInteractiveItem(position, callback, type = 'default') {
    //     const geometries = {
    //         default: new THREE.BoxGeometry(0.3, 0.3, 0.3),
    //         viewpoint: new THREE.SphereGeometry(0.2, 16, 16),
    //         info: new THREE.ConeGeometry(0.2, 0.4, 16)
    //     };

    //     const materials = {
    //         default: new THREE.MeshBasicMaterial({ 
    //             color: 0xffff00,
    //             transparent: true,
    //             opacity: 0.7
    //         }),
    //         viewpoint: new THREE.MeshBasicMaterial({ 
    //             color: 0xa32cc4, //0x8a00c2
    //             transparent: true,
    //             opacity: 1
    //         }),
    //         info: new THREE.MeshBasicMaterial({ 
    //             color: 0xff0000,
    //             transparent: true,
    //             opacity: 0.7
    //         })
    //     };

    //     const item = new THREE.Mesh(
    //         geometries[type] || geometries.default,
    //         materials[type] || materials.default
    //     );
    //     item.position.copy(position);
    //     item.userData.callback = callback;
    //     item.userData.type = type;
    //     this.scene.add(item);
    //     this.interactiveObjects.push(item);

    //     return item;
    // }

    addInteractiveItem(position, callback, type = 'default', labelText = '', textSize = null) {
        const geometries = {
            default: new THREE.BoxGeometry(0.3, 0.3, 0.3),
            viewpoint: new THREE.SphereGeometry(0.2, 32, 32), // Increased segments for smoother glow
            info: new THREE.ConeGeometry(0.2, 0.4, 32)
        };
    
        const getGlowColor = (type) => {
            switch(type) {
                case 'viewpoint': return new THREE.Color(0x8a00c2); // Purple
                case 'info': return new THREE.Color(0xff0000);      // Red
                default: return new THREE.Color(0xffff00);          // Yellow
            }
        };
    
        const material = new GlowingSphereMaterial(getGlowColor(type));
        
        const item = new THREE.Mesh(
            geometries[type] || geometries.default,
            material
        );
    
        // Add a point light to create actual light emission
        // const pointLight = new THREE.PointLight(
        //     getGlowColor(type),
        //     0.5, // Intensity
        //     1    // Distance
        // );
        // pointLight.position.copy(position);
        // this.scene.add(pointLight);
    
        // Create a bigger, transparent sphere for the glow effect
        const glowGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                glowColor: { value: getGlowColor(type) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float time;
                varying vec3 vNormal;
                
                void main() {
                    float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    gl_FragColor = vec4(glowColor, intensity * 0.5 * (0.8 + 0.2 * sin(time * 2.0)));
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
    
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        // item.add(glowMesh);

        // Add text if provided
        if (labelText) {
            // Define default sizes for different types of text
            const defaultSizes = {
                'FASHION': 0.13,
                'MUSIC': 0.18,
                'WORK': 0.18
            };
            // Use provided size, or lookup from defaults, or use general default
            const finalTextSize = textSize || defaultSizes[labelText] || 0.15;
            const maxWidth = 1.8; // Maximum width for any text
            
            const billboardText = new BillboardText(labelText, finalTextSize, maxWidth);
            billboardText.setSphereCenter(position);
            this.scene.add(billboardText);
            item.userData.billboardText = billboardText;
            // const textSize = 0.2; // Slightly larger for better visibility
            // const billboardText = new BillboardText(labelText, textSize);
            // billboardText.setSphereCenter(position);
            // this.scene.add(billboardText); // Add to scene instead of sphere
            // item.userData.billboardText = billboardText;
        }
    
        // Animate glow
        const animateGlow = () => {
            glowMaterial.uniforms.time.value = Date.now() * 0.001;
            requestAnimationFrame(animateGlow);
        };
        animateGlow();
    
        item.position.copy(position);
        item.userData.callback = callback;
        item.userData.type = type;
        
        // Add hover animation
        item.userData.originalScale = item.scale.clone();
        item.userData.targetScale = item.scale.clone().multiplyScalar(1.2);
        item.userData.currentScale = item.scale.clone();
        
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
                    // rotate the model in z axis
                    gltf.scene.rotation.y = 0.6;
                    
                    this.scene.add(gltf.scene);
                    resolve(gltf);
                },
                (progress) => {
                    
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                    // show loading percentage on the loader screen
                    const loaderScreen = document.getElementById('loadingScreen');
                    const loaderText = document.getElementById('loadingText');
                    
                    if (loaderText) {
                        // loaderScreen
                        // loaderScreen.innerText = 'Loading: ' + Math.round(progress.loaded / progress.total * 100) + '%';
                        // switch case for accessing and displaying different loadingSentences on loading screen
                        switch(Math.round(progress.loaded / progress.total * 100)) {
                            case 0:
                                loaderText.innerHTML = loadingSentences[0];
                                break;
                            case 25:
                                loaderText.innerHTML = loadingSentences[1];
                                break;
                            case 50:
                                loaderText.innerHTML = loadingSentences[2];
                                break;
                            case 75:
                                loaderText.innerHTML = loadingSentences[3];
                                break;
                            case 100:
                                loaderText.innerHTML = loadingSentences[4];
                                break;
                        }
                        // loaderScreen.innerText 
                        // show progress bar underneath
                        // create a progress bar and place it inside loaderScreen
                        // const progressBar = document.createElement('div');
                        const progressBar = document.getElementById('progressBar');
                        const progressFill = document.querySelector('#progressBar #progressFill');
                        if (progressFill) {
                            progressFill.style.width = Math.round(progress.loaded / progress.total * 100) + '%';
                        }

                    }

                },
                reject
            );
        });
    }

    // Update the animate method to include text billboard updates
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update interactive objects animations
        this.interactiveObjects.forEach(obj => {
            // Scale animation
            if (obj.userData.isHovered) {
                obj.scale.lerp(obj.userData.targetScale, 0.1);
            } else {
                obj.scale.lerp(obj.userData.originalScale, 0.1);
            }
            
            // Update billboard text
            if (obj.userData.billboardText) {
                // Update text position and orientation
                obj.userData.billboardText.update(this.camera);
                
                // Optional: Make text more visible when sphere is hovered
                const textMaterial = obj.userData.billboardText.sprite.material;
                textMaterial.opacity = obj.userData.isHovered ? 1 : 0.9;
                // make text move further out from sphere when hovered
                obj.userData.billboardText.offsetDistance =  0.3;
                
            }
        });

        if (this.controls) {
            this.controls.update();
        }
        
        this.composer.render();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        
        if (this.ditherPass) {
            this.ditherPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
            this.ditherPass.uniforms.ditherScale.value = Math.min(window.innerWidth, window.innerHeight) / 1000;
        }
    }

    // addDebugHelpers() {
    //     // Add grid helper
    //     const gridHelper = new THREE.GridHelper(10, 10);
    //     this.scene.add(gridHelper);
    
    //     // Add axes helper
    //     const axesHelper = new THREE.AxesHelper(5);
    //     this.scene.add(axesHelper);
    // }
}





////-----



    // ... (keep all other methods from the previous version)


    class GlowingSphereMaterial extends THREE.ShaderMaterial {
        constructor(color = new THREE.Color(0x8a00c2)) {
            super({
                uniforms: {
                    time: { value: 0 },
                    baseColor: { value: color },
                    glowColor: { value: new THREE.Color(0xffffff) },
                    glowIntensity: { value: 0.5 },
                    pulseSpeed: { value: 2.0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        vViewPosition = -mvPosition.xyz;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 baseColor;
                    uniform vec3 glowColor;
                    uniform float glowIntensity;
                    uniform float time;
                    uniform float pulseSpeed;
                    
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    
                    void main() {
                        float pulse = 0.5 * (1.0 + sin(time * pulseSpeed));
                        
                        // Fresnel effect for edge glow
                        vec3 normal = normalize(vNormal);
                        vec3 viewDir = normalize(vViewPosition);
                        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 1.5);
                        
                        // Combine base color with pulsing glow
                        vec3 finalColor = mix(baseColor, glowColor, fresnel * glowIntensity * pulse);
                        
                        // Add extra brightness at edges
                        float edgeGlow = pow(fresnel, 3.0) * pulse;
                        finalColor += glowColor * edgeGlow;
                        
                        gl_FragColor = vec4(finalColor, 0.8);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0
            });
    
            // Start the animation
            this.startTime = Date.now();
            this.animate = this.animate.bind(this);
            this.animate();
        }
    
        animate() {
            this.uniforms.time.value = (Date.now() - this.startTime) * 0.001;
            requestAnimationFrame(this.animate);
        }
    }
    
    // Updated BillboardText class with surface-tangent orientation
class BillboardText extends THREE.Object3D {
    constructor(text, size = 0.25, maxWidth = 1) {
        super();

        // Create canvas for text rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size with proper aspect ratio
        canvas.width = 512;
        canvas.height = 512;

        // Configure text style
        context.fillStyle = 'white';
        context.font = "bold 64px 'scandia-line-web'";
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Measure text
        const textMetrics = context.measureText(text);
        const textWidth = textMetrics.width;
        
        // Calculate scale to fit maxWidth
        const baseScale = size * (textWidth / 64);
        const finalScale = Math.min(baseScale, maxWidth);
        
        // Scale font size if needed to fit maxWidth
        const scaledFontSize = Math.floor(64 * (finalScale / baseScale));
        context.font = `bold ${scaledFontSize}px 'scandia-line-web'`;
        
        // Clear canvas and draw text
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create material with transparency
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            opacity: 0.9
        });

        // Create sprite with proper scaling
        this.sprite = new THREE.Sprite(material);
        // Maintain aspect ratio while fitting within maxWidth
        const aspectRatio = canvas.width / canvas.height;
        this.sprite.scale.set(finalScale, finalScale / aspectRatio, 1);

        this.add(this.sprite);
        
        // Store sphere center for positioning
        this.sphereCenter = new THREE.Vector3();
        this.sphereRadius = 0.2;
        this.offsetDistance = this.sphereRadius * 0.7;
    }

    update(camera) {
        // Get direction from sphere center to camera
        const directionToCamera = new THREE.Vector3().subVectors(camera.position, this.sphereCenter).normalize();
        
        // Calculate position between sphere center and camera
        const textPosition = this.sphereCenter.clone();
        textPosition.addScaledVector(directionToCamera, this.offsetDistance);
        this.position.copy(textPosition);

        // Calculate surface normal at the text position relative to sphere center
        const surfaceNormal = new THREE.Vector3().subVectors(this.position, this.sphereCenter).normalize();
        
        // Calculate tangent basis vectors
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(surfaceNormal, up).normalize();
        const tangentUp = new THREE.Vector3().crossVectors(right, surfaceNormal).normalize();
        
        // Create rotation matrix from basis vectors
        const rotationMatrix = new THREE.Matrix4().makeBasis(right, tangentUp, surfaceNormal);
        this.quaternion.setFromRotationMatrix(rotationMatrix);
    }

    setSphereCenter(center) {
        this.sphereCenter.copy(center);
    }
}

// Rest of the code remains the same