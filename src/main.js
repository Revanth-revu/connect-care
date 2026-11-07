import * as THREE from 'three';

// 1. Setup Scene, Camera, and Renderer
const canvas = document.getElementById('bg');
const scene = new THREE.Scene();
// Set background to black (as per TODO)
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 as per TODO

// 2. Create the Particle System
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;

const posArray = new Float32Array(particlesCount * 3);

// Create a twisted ring/organic shape
for (let i = 0; i < particlesCount * 3; i += 3) {
  const r = Math.random() * 2 + 1;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 2;

  // Spherical to Cartesian coordinates with a twist
  posArray[i] = Math.sin(theta) * Math.cos(phi) * r;     // x
  posArray[i + 1] = Math.sin(theta) * Math.sin(phi) * r; // y
  posArray[i + 2] = Math.cos(theta) * r * 0.5;           // z (flattened)
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.02,
  color: 0xaaaaaa, // White-grey
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// 3. Fluid-like Cursor Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX) * 0.001;
  mouseY = (event.clientY - windowHalfY) * 0.001;
});

// 4. Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Subtle rotation
  particlesMesh.rotation.y = elapsedTime * 0.05;

  // Fluid motion dampening toward mouse
  targetX = mouseX * 0.5;
  targetY = mouseY * 0.5;
  particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
  particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
  
  // Camera pan
  camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
  camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  // Morphing effect
  particlesMesh.position.y = Math.sin(elapsedTime * 0.5) * 0.2;

  renderer.render(scene, camera);
}

// 5. Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();