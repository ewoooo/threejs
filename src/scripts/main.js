import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FlakesTexture } from "three/addons/textures/FlakesTexture.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import "../stylesheets/main.css";
import gsap from "gsap";

// SET-UP
let scene, camera, renderer, controls, pointlight, targetHelper;
const loader = new GLTFLoader();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let clickableMeshes = [];

function initScene() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        1,
        1000,
    );
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function addLights() {
    const pointlight = new THREE.PointLight(0xffffff, 1, 100);
    pointlight.position.set(200, 200, 200);
    scene.add(pointlight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // controls.autoRotate = true;
}

function loadHDR() {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load("/hdr/docklands_01_1k.hdr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    });
}

function createCarPaintMaterial() {
    const flakesTexture = new THREE.CanvasTexture(new FlakesTexture());
    flakesTexture.wrapS = THREE.RepeatWrapping;
    flakesTexture.wrapT = THREE.RepeatWrapping;
    flakesTexture.repeat.set(10, 10);

    const material = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 1,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        normalMap: flakesTexture,
        normalScale: new THREE.Vector2(0.05, 0.05),
    });

    return material;
}

function focusPart(targetPart) {
    if (targetPart) {
        console.log("Target part found:", targetPart.name);
        const targetPos = new THREE.Vector3();
        targetPart.getWorldPosition(targetPos);

        camera.position.set(0, 1, 1); // 카메라 위치는 적절히 조정
        camera.lookAt(targetPos);
        controls.target.copy(targetPos);
        controls.update();

        // Debug
        const targetHelper = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        );
        targetHelper.position.copy(targetPos);
        scene.add(targetHelper);
    } else {
        console.warn("Not Founded");
    }
}

function loadModel() {
    const url = "/models/kia-stonic/scene.gltf";

    loader.load(
        url,
        (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0);
            model.scale.set(1, 1, 1);
            scene.add(model);

            const paintMaterial = createCarPaintMaterial();
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = paintMaterial;
                    clickableMeshes.push(child); // Find Clickable Meshes
                }
            });

            // Camera Focus
            // const target = model.getObjectByName("mesh_18_72nr");
            // focusPart(target);

            // Debug
            // const box = new THREE.BoxHelper(model, 0xffff00);
            // const axes = new THREE.AxesHelper(5);
            // scene.add(box);
            // scene.add(axes);

            console.log("Model loaded:", model);
        },
        undefined,
        (error) => {
            console.error("GLTF Load Error:", error);
        },
    );
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function start() {
    initScene();
    loadHDR();
    addLights();
    setupControls();
    loadModel();
    animate();
}

console.log(clickableMeshes);
start();

window.addEventListener("click", onMouseClick);
function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(clickableMeshes);

    if (intersects.length > 0) {
        const targetMesh = intersects[0].object;

        const targetPos = new THREE.Vector3();
        targetMesh.getWorldPosition(targetPos);

        // 📌 카메라와 타겟 사이 거리 유지하면서 카메라도 같이 이동
        const direction = new THREE.Vector3()
            .subVectors(camera.position, controls.target)
            .normalize();
        const distance = camera.position.distanceTo(controls.target);

        const newCameraPos = targetPos
            .clone()
            .add(direction.multiplyScalar(distance));

        // 📌 부드러운 이동
        gsap.to(camera.position, {
            duration: 1,
            x: newCameraPos.x,
            y: newCameraPos.y,
            z: newCameraPos.z,
        });

        gsap.to(controls.target, {
            duration: 1,
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            onUpdate: () => controls.update(),
        });

        if (!targetHelper) {
            targetHelper = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            );
            scene.add(targetHelper);
        }
        targetHelper.position.copy(targetPos);

        console.log("Clicked on:", targetMesh.name || "Unnamed Mesh");
    }
}
