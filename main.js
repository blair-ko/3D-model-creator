import { OrbitControls } from "./lib/OrbitControls.js";
import * as BufferGeometryUtils from "./lib/BufferGeometryUtils.js";
import * as THREE from './lib/three.module.js';
import { STLExporter } from './lib/STLExporter.js';

THREE.BufferGeometryUtils = BufferGeometryUtils;
const viewer = document.getElementById('viewer');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
viewer.appendChild(renderer.domElement);

const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(5, 10, 7);
scene.add(light1);
scene.add(new THREE.AmbientLight(0x404040));

const controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(20, 20, 20);
controls.update();

let mesh;
function buildMesh() {
    if (mesh) scene.remove(mesh);
    const type = document.getElementById('type').value;
    const wall = parseFloat(document.getElementById('wall').value);
    const height = parseFloat(document.getElementById('height').value);
    if (type === 'box') {
        const width = parseFloat(document.getElementById('width').value);
        const depth = parseFloat(document.getElementById('depth').value);
        const geometries = [];
        const bottom = new THREE.BoxGeometry(width, wall, depth);
        bottom.translate(0, -height / 2 + wall / 2, 0);
        geometries.push(bottom);
        const left = new THREE.BoxGeometry(wall, height, depth - 2 * wall);
        left.translate(-width / 2 + wall / 2, 0, 0);
        geometries.push(left);
        const right = left.clone();
        right.translate(width - wall, 0, 0);
        geometries.push(right);
        const front = new THREE.BoxGeometry(width, height, wall);
        front.translate(0, 0, -depth / 2 + wall / 2);
        geometries.push(front);
        const back = front.clone();
        back.translate(0, 0, depth - wall);
        geometries.push(back);
        const geometry = THREE.BufferGeometryUtils.mergeGeometries(geometries, false);
        mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x2194ce }));
    } else {
        const radius = parseFloat(document.getElementById('radius').value);
        const shape = new THREE.Shape();
        shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
        const hole = new THREE.Path();
        hole.absarc(0, 0, radius - wall, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        const wallGeo = new THREE.ExtrudeGeometry(shape, { depth: height - wall, bevelEnabled: false });
        wallGeo.translate(0, wall, 0);
        const bottom = new THREE.CylinderGeometry(radius, radius, wall, 32);
        bottom.translate(0, wall / 2, 0);
        const geometry = THREE.BufferGeometryUtils.mergeGeometries([wallGeo, bottom], false);
        mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x2194ce }));
    }
    scene.add(mesh);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

function update() { buildMesh(); }
['type', 'width', 'depth', 'height', 'radius', 'wall'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', update);
});

update();

const exporter = new STLExporter();
document.getElementById('download').addEventListener('click', () => {
    const stl = exporter.parse(mesh, { binary: false });
    const blob = new Blob([stl], { type: 'model/stl' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'container.stl';
    link.click();
});

document.getElementById('save').addEventListener('click', () => {
    const params = {
        type: document.getElementById('type').value,
        width: document.getElementById('width').value,
        depth: document.getElementById('depth').value,
        height: document.getElementById('height').value,
        radius: document.getElementById('radius').value,
        wall: document.getElementById('wall').value
    };
    localStorage.setItem('containerParams', JSON.stringify(params));
});

document.getElementById('load').addEventListener('click', () => {
    const params = JSON.parse(localStorage.getItem('containerParams') || '{}');
    Object.entries(params).forEach(([k, v]) => {
        const el = document.getElementById(k);
        if (el) el.value = v;
    });
    update();
});

window.addEventListener('resize', () => {
    camera.aspect = viewer.clientWidth / viewer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
});
