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

        const widthAttr = this.getAttribute("width");
        const heightAttr = this.getAttribute("height");
        const posXAttr = this.getAttribute("position-x");
        const posYAttr = this.getAttribute("position-y");

        if (widthAttr && heightAttr) {
            const width = parseFloat(widthAttr);
            const height = parseFloat(heightAttr);
            const posX = posXAttr ? parseFloat(posXAttr) : null;
            const posY = posYAttr ? parseFloat(posYAttr) : null;
            this.#fitToContainerWithPosition(width, height, posX, posY);
        } else {
            this.#fitToScreenResponsive();
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
            "https://raw.githubusercontent.com/shin-noda/earth-globe/images/earth.jpg"
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

    #fitToContainerWithPosition(width, height, posX = null, posY = null) {
        let style = `width: ${width}px; height: ${height}px; position: absolute; display: block;`;
        if (posX !== null) style += ` left: ${posX}px;`;
        if (posY !== null) style += ` top: ${posY}px;`;
        this.#mount.style.cssText = style;

        this.#renderer.setSize(width, height);
        this.#camera.aspect = width / height;
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
        const widthAttr = this.getAttribute("width");
        const heightAttr = this.getAttribute("height");
        if (widthAttr && heightAttr) {
            const width = parseFloat(widthAttr);
            const height = parseFloat(heightAttr);
            const posX = this.getAttribute("position-x") ? parseFloat(this.getAttribute("position-x")) : null;
            const posY = this.getAttribute("position-y") ? parseFloat(this.getAttribute("position-y")) : null;
            this.#fitToContainerWithPosition(width, height, posX, posY);
        } else {
            this.#fitToScreenResponsive();
        }
    };

    #fitToScreenResponsive() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const size = Math.min(screenWidth, screenHeight);
        const leftOffset = (screenWidth - size) / 2;

        this.#mount.style.cssText = `
            position: relative;
            width: ${size}px;
            height: ${size}px;
            margin-left: ${leftOffset}px;
            display: block;
        `;

        this.#renderer.setSize(size, size);
        this.#camera.aspect = 1;
        const fov = this.#camera.fov * (Math.PI / 180);
        const globeRadius = 1;
        const distance = globeRadius / Math.tan(fov / 2);
        this.#camera.position.z = distance * 1.4;
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
        if (this.#autoSpin) this.#spinSpeed = speed;
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