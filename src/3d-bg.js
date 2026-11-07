import * as THREE from 'three';

const canvas = document.getElementById('bg');
if (canvas) {
  const scene = new THREE.Scene();
  
  // 1. Camera & Renderer
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 15;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 2. Create the Neural Network Sphere
  const particleCount = 300;
  const radius = 8;
  
  // Geometry for the points
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  // Geometry for the lines connecting points
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = [];

  // Generate points in a sphere shape
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Connect this point to nearby points
    for (let j = 0; j < i; j++) {
      const dx = x - positions[j * 3];
      const dy = y - positions[j * 3 + 1];
      const dz = z - positions[j * 3 + 2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      // If points are close enough, draw a line
      if (dist < 3.5) {
        linePositions.push(x, y, z);
        linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
      }
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

  // 3. Materials
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    color: 0x00BFA5, // Neon Teal
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00BFA5,
    transparent: true,
    opacity: 0.15
  });

  // 4. Meshes
  const particlesMesh = new THREE.Points(geometry, particlesMaterial);
  const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  
  // Group them so they move together
  const networkGroup = new THREE.Group();
  networkGroup.add(particlesMesh);
  networkGroup.add(linesMesh);
  scene.add(networkGroup);

  // 5. Mouse Interaction
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  // 6. Animation Loop
  let lastTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    // Constant slow rotation
    networkGroup.rotation.y += 0.1 * delta;
    networkGroup.rotation.x += 0.05 * delta;

    // Mouse interactive tilt
    networkGroup.rotation.y += mouseX * 0.5 * delta;
    networkGroup.rotation.x += mouseY * 0.5 * delta;

    // Breathing effect (scale)
    const scale = 1 + Math.sin(now * 0.001) * 0.05;
    networkGroup.scale.set(scale, scale, scale);

    renderer.render(scene, camera);
  }

  // 7. Handle Window Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}