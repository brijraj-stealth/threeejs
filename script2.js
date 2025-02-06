import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { TextureLoader } from 'three';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
const canvas = document.getElementById('threeCanvas');  // Target the canvas element
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Resize event listener
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 10, 20);
controls.update();

// Environment Map
const hdrLoader = new RGBELoader();
hdrLoader.load('path/to/your/hdr_environment.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
topLight.position.set(0, 20, 0);
topLight.castShadow = true;
scene.add(topLight);

// Modern Floor Texture
const textureLoader = new TextureLoader();
const floorTexture = textureLoader.load('path/to/floor_texture.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(6, 6);
const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.4 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// DJ Booth (Now Grey with DJ Elements)
const djBoothMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 });
const djBooth = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 2), djBoothMaterial);
djBooth.position.set(1.93, 0.75, -6);
djBooth.castShadow = true;
scene.add(djBooth);

// Add Logo to DJ Booth Front Side
const logoTextureLoader = new THREE.TextureLoader();
logoTextureLoader.load('path/to/your/logo_image.jpg', (logoTexture) => {
    // Apply logo texture only to the front face of the DJ booth
    const djBoothFrontMaterial = new THREE.MeshStandardMaterial({ map: logoTexture });
    const djBoothGeometry = new THREE.BoxGeometry(3, 1.5, 2);
    const djBoothMaterials = [
        djBoothMaterial, // right
        djBoothMaterial, // left
        djBoothMaterial, // top
        djBoothMaterial, // bottom
        djBoothFrontMaterial, // front
        djBoothMaterial  // back
    ];
    djBooth.geometry = djBoothGeometry;
    djBooth.material = djBoothMaterials;
});

// Modern Nightclub Floor Colors
const modernPlateColors = [
    0x1a1a2e, 0x16213e, 0x0f3460, 0xe94560, 0x533483,
    0x3a0ca3, 0x7209b7, 0x560bad, 0x480ca8, 0x3f37c9
];

// Floor Plate Data
const normalizedPlates = [
    { x: 1.93, z: -12.925, width: 11.42, depth: 4.15 },
    { x: -5.71, z: -7.57, width: 3.86, depth: 6.56 },
    { x: -9.57, z: -7.57, width: 3.86, depth: 6.56 },
    { x: 9.57, z: -7.57, width: 3.86, depth: 6.56 },
    { x: -1.93, z: 0.47, width: 19.14, depth: 9.52 },
    { x: -1.93, z: 10.37, width: 19.14, depth: 10.28 },
    { x: 9.57, z: 5.61, width: 3.86, depth: 19.8 },
];

const plates = [];
normalizedPlates.forEach((pos, index) => {
    const plateMaterial = new THREE.MeshStandardMaterial({ color: modernPlateColors[index], metalness: 0.6, roughness: 0.4 });
    const plateGeometry = new THREE.BoxGeometry(pos.width, 1, pos.depth);
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.set(pos.x, 0.5, pos.z);
    plate.castShadow = true;
    scene.add(plate);
    plates.push(plate);
});

// Table & Sofa Settings
const tableHeight = 1.2;
const sofaHeight = 1.0;
const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.5, roughness: 0.3 });
const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x292929, metalness: 0.4, roughness: 0.5 });

// Tables & Sofas
normalizedPlates.forEach((pos) => {
    // Table (Smaller & Raised)
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 20), tableMaterial);
    table.position.set(pos.x, tableHeight, pos.z);
    scene.add(table);

    // Modern Sofas (Curved & Stylish)
    const sofaGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.6);
    const sofaPositions = [
        { x: pos.x + 1.2, z: pos.z },
        { x: pos.x - 1.2, z: pos.z },
        { x: pos.x, z: pos.z + 1.2 },
        { x: pos.x, z: pos.z - 1.2 }
    ];

    sofaPositions.forEach(({ x, z }) => {
        const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
        sofa.position.set(x, sofaHeight, z);
        sofa.rotation.y = Math.PI / 6; // Slight rotation for modern look
        scene.add(sofa);
    });
});

// Camera Movement
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetPosition = new THREE.Vector3();
let isMoving = false;

document.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(plates, true);
    if (intersects.length > 0) {
        targetPosition.copy(intersects[0].object.position);
        targetPosition.y = 5;
        isMoving = true;
    }
    if (raycaster.intersectObject(djBooth).length > 0) {
        targetPosition.copy(djBooth.position);
        targetPosition.y = 5;
        isMoving = true;
    }
});

const moveSpeed = 0.05;
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
