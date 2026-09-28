(function () {
    'use strict';

    const OBJECT_COLORS = {
        tower: { main: 0xd9a75f, light: 0xf4d08b },
        tree: { main: 0x4fa574, light: 0x9ddc9d },
        cube: { main: 0x6e9eea, light: 0xb4d0ff },
        person: { main: 0xd57964, light: 0xffb18f }
    };

    function createShadowLab(canvas) {
        if (!window.THREE) return null;

        const THREE = window.THREE;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x243d52);
        scene.fog = new THREE.Fog(0x243d52, 24, 45);
        const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(15, 11, 17);
        camera.lookAt(0, 3, 0);

        const orbit = { azimuth: 0.72, polar: 1.05, radius: 23, dragging: false, x: 0, y: 0 };
        const target = new THREE.Vector3(0, 3, 0);
        function updateCamera() {
            const sinPolar = Math.sin(orbit.polar);
            camera.position.set(
                target.x + orbit.radius * sinPolar * Math.sin(orbit.azimuth),
                target.y + orbit.radius * Math.cos(orbit.polar),
                target.z + orbit.radius * sinPolar * Math.cos(orbit.azimuth)
            );
            camera.lookAt(target);
        }
        canvas.addEventListener('pointerdown', (event) => {
            orbit.dragging = true;
            orbit.x = event.clientX;
            orbit.y = event.clientY;
            canvas.setPointerCapture(event.pointerId);
        });
        canvas.addEventListener('pointermove', (event) => {
            if (!orbit.dragging) return;
            orbit.azimuth -= (event.clientX - orbit.x) * 0.008;
            orbit.polar = Math.max(0.38, Math.min(1.48, orbit.polar + (event.clientY - orbit.y) * 0.006));
            orbit.x = event.clientX;
            orbit.y = event.clientY;
            updateCamera();
        });
        canvas.addEventListener('pointerup', () => { orbit.dragging = false; });
        canvas.addEventListener('pointercancel', () => { orbit.dragging = false; });
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            orbit.radius = Math.max(9, Math.min(32, orbit.radius + event.deltaY * 0.018));
            updateCamera();
        }, { passive: false });

        scene.add(new THREE.HemisphereLight(0xdceeff, 0x39281f, 1.6));
        const fillLight = new THREE.DirectionalLight(0xbad7ff, 1.15);
        fillLight.position.set(-8, 14, 8);
        scene.add(fillLight);

        const sun = new THREE.DirectionalLight(0xffd18a, 4.2);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = -18;
        sun.shadow.camera.right = 18;
        sun.shadow.camera.top = 18;
        sun.shadow.camera.bottom = -18;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 55;
        sun.shadow.bias = -0.00025;
        scene.add(sun);
        scene.add(sun.target);

        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3b3a36, roughness: 0.92, metalness: 0.02 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        const grid = new THREE.GridHelper(44, 44, 0xc19c70, 0x806d59);
        grid.position.y = 0.012;
        grid.material.transparent = true;
        grid.material.opacity = 0.3;
        scene.add(grid);

        const horizon = new THREE.Mesh(
            new THREE.CylinderGeometry(15, 15, 0.8, 64),
            new THREE.MeshStandardMaterial({ color: 0x1b292c, roughness: 1 })
        );
        horizon.position.y = -0.42;
        horizon.receiveShadow = true;
        scene.add(horizon);

        let objectGroup = new THREE.Group();
        scene.add(objectGroup);

        function material(color) {
            return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.04 });
        }

        function addPart(geometry, color, position, cast = true) {
            const mesh = new THREE.Mesh(geometry, material(color));
            mesh.position.set(...position);
            mesh.castShadow = cast;
            mesh.receiveShadow = true;
            objectGroup.add(mesh);
            return mesh;
        }

        function buildObject(type, height) {
            objectGroup.clear();
            const colors = OBJECT_COLORS[type] || OBJECT_COLORS.tower;
            if (type === 'tower') {
                addPart(new THREE.CylinderGeometry(0.62, 0.8, height, 6), colors.main, [0, height / 2, 0]);
                addPart(new THREE.ConeGeometry(0.75, height * 0.16, 6), colors.light, [0, height + height * 0.08, 0]);
            } else if (type === 'cube') {
                addPart(new THREE.BoxGeometry(1.5, height, 1.5), colors.main, [0, height / 2, 0]);
                addPart(new THREE.BoxGeometry(1.52, 0.05, 1.52), colors.light, [0, height * 0.76, 0]);
            } else if (type === 'tree') {
                addPart(new THREE.CylinderGeometry(0.28, 0.45, height * 0.48, 10), 0x70482f, [0, height * 0.24, 0]);
                addPart(new THREE.ConeGeometry(1.3, height * 0.5, 12), colors.main, [0, height * 0.62, 0]);
                addPart(new THREE.ConeGeometry(1.05, height * 0.42, 12), colors.light, [0, height * 0.83, 0]);
            } else {
                addPart(new THREE.CylinderGeometry(0.25, 0.34, height * 0.44, 12), colors.main, [0, height * 0.34, 0]);
                addPart(new THREE.SphereGeometry(height * 0.085, 20, 14), colors.light, [0, height * 0.78, 0]);
                const limb = new THREE.MeshStandardMaterial({ color: colors.main, roughness: 0.75 });
                [-0.22, 0.22].forEach((x) => {
                    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, height * 0.34, 10), limb);
                    leg.position.set(x, height * 0.11, 0);
                    leg.castShadow = true;
                    objectGroup.add(leg);
                });
            }
            objectGroup.position.y = 0;
        }

        function update(state) {
            const height = Math.max(2, Number(state.height) || 8);
            const azimuth = (Number(state.azimuth) || 0) * Math.PI / 180;
            const elevation = Math.max(8, Number(state.elevation) || 28) * Math.PI / 180;
            buildObject(state.object || 'tower', height);
            const distance = 22;
            sun.position.set(Math.sin(azimuth) * distance, Math.sin(elevation) * distance, Math.cos(azimuth) * distance);
            sun.target.position.set(0, 0, 0);
            sun.shadow.camera.updateProjectionMatrix();
            updateCamera();
        }

        function resize() {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (!width || !height) return;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        }

        function animate() {
            updateCamera();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        buildObject('tower', 8);
        updateCamera();
        resize();
        animate();
        return { update, resize };
    }

    window.MathwareShadow3D = { create: createShadowLab };
})();
