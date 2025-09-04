class EarthGlobe extends HTMLElement {
    #scene;
    #camera;
    #renderer;
    #mount;
    #globe;
    #isDragging = false;
    #lastX = 0;
    #lastY = 0;
    #autoSpin = true;
    #spinSpeed = 0.002;
    #onPointerDown;
    #onPointerMove;
    #onPointerUp;
    #onWheel;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.#mount = document.createElement("div");
        this.#mount.style.position = "relative";
        this.#mount.style.width = "100%";
        this.#mount.style.height = "100%";
        this.#mount.style.display = "block";
        this.shadowRoot.appendChild(this.#mount);
    }

    connectedCallback() {
        this.#initializeScene();
        this.#addLightsAndMesh();
        this.#addEventListeners();

        const hasWidth = this.style.width && this.style.width !== "";
        const hasHeight = this.style.height && this.style.height !== "";

        if (hasWidth && hasHeight) {
            // User-specified size → fit inside container
            const width = parseFloat(this.style.width);
            const height = parseFloat(this.style.height);
            this.#fitToContainer(width, height);
        } else {
            // No custom size → fullscreen
            this.#fitToScreen();
        }

        this.#animate();
    }

    disconnectedCallback() {
        this.#removeEventListeners();
        this.#renderer?.dispose();
    }

    #initializeScene() {
        const width = this.offsetWidth || 400;
        const height = this.offsetHeight || 400;

        this.#scene = new THREE.Scene();
        this.#camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
        this.#camera.position.z = 1.5;

        this.#renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.#renderer.setSize(width, height);
        this.#renderer.domElement.style.display = "block";
        this.#renderer.domElement.style.cursor = "grab";
        this.#renderer.domElement.style.touchAction = "none";
        this.#mount.appendChild(this.#renderer.domElement);
    }

    #addLightsAndMesh() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.#scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 3, 5);
        this.#scene.add(directionalLight);

        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const texture = new THREE.TextureLoader().load(
            "https://raw.githubusercontent.com/shin-noda/earth-model/main/public/textures/earth.jpg"
        );
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0,
        });
        const earthMesh = new THREE.Mesh(geometry, material);

        this.#globe = new THREE.Group();
        this.#globe.add(earthMesh);
        this.#scene.add(this.#globe);
    }

    #addEventListeners() {
        this.#onPointerDown = (e) => {
            this.#isDragging = true;
            this.#autoSpin = false;
            this.#lastX = e.clientX;
            this.#lastY = e.clientY;
            this.#renderer.domElement.style.cursor = "grabbing";
            this.#renderer.domElement.setPointerCapture?.(e.pointerId);
        };

        this.#onPointerMove = (e) => {
            if (!this.#isDragging) return;
            const dx = e.clientX - this.#lastX;
            const dy = e.clientY - this.#lastY;
            const rotSpeed = 0.005;
            this.#globe.rotation.y += dx * rotSpeed;
            this.#globe.rotation.x += dy * rotSpeed;
            const maxPitch = Math.PI * 0.45;
            this.#globe.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.#globe.rotation.x));
            this.#lastX = e.clientX;
            this.#lastY = e.clientY;
        };

        this.#onPointerUp = (e) => {
            this.#isDragging = false;
            this.#renderer.domElement.style.cursor = "grab";
            this.#renderer.domElement.releasePointerCapture?.(e.pointerId);
        };

        this.#onWheel = (e) => {
            e.preventDefault();
            const zoomSpeed = 0.05;
            this.#camera.position.z += e.deltaY * zoomSpeed;
            this.#camera.position.z = Math.max(0.5, Math.min(10, this.#camera.position.z));
        };

        const canvas = this.#renderer.domElement;
        canvas.addEventListener("pointerdown", this.#onPointerDown);
        canvas.addEventListener("pointermove", this.#onPointerMove);
        canvas.addEventListener("pointerup", this.#onPointerUp);
        canvas.addEventListener("pointerleave", this.#onPointerUp);
        canvas.addEventListener("wheel", this.#onWheel);
        window.addEventListener("resize", this.#handleResize);
    }

    #fitToContainer(width, height) {
        this.#mount.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            position: relative;
            display: block;
        `;

        this.#renderer.setSize(width, height);
        this.#camera.aspect = width / height;

        // Adjust camera distance proportional to container size
        const fov = this.#camera.fov * (Math.PI / 180);
        const globeRadius = 1;
        const minDimension = Math.min(width, height);
        const scaleFactor = minDimension / 400; // 400px reference

        this.#camera.position.z = 1.8;
        this.#camera.updateProjectionMatrix();
    }

    #removeEventListeners() {
        const canvas = this.#renderer?.domElement;
        if (!canvas) return;
        canvas.removeEventListener("pointerdown", this.#onPointerDown);
        canvas.removeEventListener("pointermove", this.#onPointerMove);
        canvas.removeEventListener("pointerup", this.#onPointerUp);
        canvas.removeEventListener("pointerleave", this.#onPointerUp);
        canvas.removeEventListener("wheel", this.#onWheel);
        window.removeEventListener("resize", this.#handleResize);
    }

    #handleResize = () => {
        const style = window.getComputedStyle(this);
        let width = parseFloat(style.width);
        let height = parseFloat(style.height);

        if (width === 0 || height === 0) {
            width = window.innerWidth;
            height = window.innerHeight;
        }

        this.#renderer.setSize(width, height);
        this.#camera.aspect = width / height;

        const fov = this.#camera.fov * (Math.PI / 180);
        const globeRadius = 1;
        const minDimension = Math.min(width, height);
        const scaleFactor = minDimension / 400;

        this.#camera.position.z = 1.8;
        this.#camera.updateProjectionMatrix();
    };

    #fitToScreen() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.#mount.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${width}px;
            height: ${height}px;
            z-index: 999;
        `;
        this.#renderer.setSize(width, height);
        this.#camera.aspect = width / height;

        const fov = this.#camera.fov * (Math.PI / 180);
        const globeRadius = 1;
        const fitDistance = globeRadius / Math.tan(fov / 2);
        this.#camera.position.z = fitDistance * 1.4;
        this.#camera.updateProjectionMatrix();
    }

    #animate = () => {
        requestAnimationFrame(this.#animate);
        if (this.#autoSpin && !this.#isDragging) {
            this.#globe.rotation.y += this.#spinSpeed;
        }
        this.#renderer.render(this.#scene, this.#camera);
    };

    spinEarth(speed = 0.002) {
        if (this.#autoSpin) {
            this.#spinSpeed = speed;
        }
    }
}

// Load Three.js then define element
const loadThreeJsAndDefineElement = () => {
    if (!window.THREE) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/three@0.152.1/build/three.min.js";
        script.onload = () => customElements.define("earth-globe", EarthGlobe);
        document.head.appendChild(script);
    } else {
        customElements.define("earth-globe", EarthGlobe);
    }
};

loadThreeJsAndDefineElement();