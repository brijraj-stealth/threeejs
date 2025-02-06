import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { TextureLoader } from 'three';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 10);
controls.update();

// Environment Map
const hdrLoader = new RGBELoader();
hdrLoader.load('path/to/your/hdr_environment.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Floor with High-Quality Texture
const textureLoader = new TextureLoader();
const floorTexture = textureLoader.load('path/to/floor_texture.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(4, 4);

const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.6 });
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// DJ Booth with Metallic Look
const djBoothMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8, roughness: 0.3 });
const djBoothGeometry = new THREE.BoxGeometry(1.5, 0.7, 2.5);
const djBooth = new THREE.Mesh(djBoothGeometry, djBoothMaterial);
djBooth.position.set(-3, 0.35, -3);
djBooth.castShadow = true;
scene.add(djBooth);

// Zones with Glass-Like Material
const zones = [];
const zoneMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00ff00,
    metalness: 0.4,
    roughness: 0.2,
    transparent: true,
    opacity: 0.7
});

const zonePositions = [
    { x: -2, z: -2, w: 2, d: 2 },
    { x: 2, z: -2, w: 3, d: 2 },
    { x: -4, z: 1, w: 3, d: 3 },
    { x: 1, z: 1, w: 2, d: 3 },
    { x: -2, z: 3, w: 2, d: 2 },
    { x: 3, z: 3, w: 3, d: 2 }
];

zonePositions.forEach((pos) => {
    const geometry = new THREE.BoxGeometry(pos.w, 0.2, pos.d);
    const zone = new THREE.Mesh(geometry, zoneMaterial);
    zone.position.set(pos.x, 0.1, pos.z);
    zone.castShadow = true;
    zone.receiveShadow = true;
    scene.add(zone);
    zones.push(zone);
});

// Raycaster for Click Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetPosition = new THREE.Vector3();
let isMoving = false;

document.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(zones, true);
    if (intersects.length > 0) {
        targetPosition.copy(intersects[0].object.position);
        targetPosition.y = 2;
        isMoving = true;
    }
});

// Smooth Camera Movement
const moveSpeed = 0.08;
function moveCamera() {
    if (!isMoving) return;

    camera.position.lerp(targetPosition, moveSpeed);
    camera.lookAt(djBooth.position);

    if (camera.position.distanceTo(targetPosition) < 0.1) isMoving = false;
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    moveCamera();
    controls.update();
    renderer.render(scene, camera);
}
animate();
