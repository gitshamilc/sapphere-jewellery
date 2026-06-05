import { supabase } from "./supabase/client.js";



class JewelryEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Smooth Lerp State Targets
        this.state = {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            targetPosition: new THREE.Vector3(0, 0, 0),
            targetRotation: new THREE.Vector3(0.3, 0.5, 0.2),
            targetScale: new THREE.Vector3(1.5, 1.5, 1.5)
        };

        // User Interactive Drag Coordinates
        this.interactive = {
            active: false,
            isDragging: false,
            pointerX: 0,
            pointerY: 0,
            targetRotX: 0.3,
            targetRotY: 0.5,
            rotX: 0.3,
            rotY: 0.5,
            dragVelocityX: 0,
            dragVelocityY: 0
        };

        this.clock = new THREE.Clock();
        this.initScene();
        this.initLights();
        this.createJewelry();
        this.createParticles();
        this.addEventListeners();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.z = 8;

        // Renderer configuration - mobile-optimized pixel ratio cap to prevent GPU overheating
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.width, this.height);
        
        // Cap device pixel ratio at 1.5 on mobile devices to preserve high frame rates
        const isMobile = window.innerWidth < 768;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
        
        this.renderer.shadowMap.enabled = !isMobile; // disable shadows on mobile for performance
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;
    }

    initLights() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
        this.scene.add(this.ambientLight);

        // Warm Key Studio Light - champagne tone
        this.keyLight = new THREE.DirectionalLight(0xd4af37, 2.5);
        this.keyLight.position.set(5, 5, 4);
        this.scene.add(this.keyLight);

        // Cool Rim Light - sharp diamond sheen
        this.rimLight = new THREE.DirectionalLight(0xa5cbf7, 1.8);
        this.rimLight.position.set(-5, 3, -2);
        this.scene.add(this.rimLight);

        // Front Fill Light - clean platinum
        this.fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.fillLight.position.set(0, -3, 3);
        this.scene.add(this.fillLight);

        // Interactive Spotlight - links to user cursor/touch for sapphire sparkles
        this.cursorLight = new THREE.PointLight(0xffffff, 4.0, 10, 1.5);
        this.cursorLight.position.set(0, 0, 4);
        this.scene.add(this.cursorLight);
    }

    createJewelry() {
        this.jewelryGroup = new THREE.Group();
        this.scene.add(this.jewelryGroup);

        // 1. High Polish Gold Band (Torus Geometry)
        const torusGeom = new THREE.TorusGeometry(1.6, 0.16, 48, 80); // reduced segments for performance
        
        this.goldMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xd4af37,        // Soft Yellow Gold
            metalness: 1.0,
            roughness: 0.08,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            reflectivity: 1.0,
            envMapIntensity: 2.0,
            shadowSide: THREE.DoubleSide
        });

        this.goldBand = new THREE.Mesh(torusGeom, this.goldMaterial);
        this.goldBand.rotation.x = Math.PI / 2;
        this.jewelryGroup.add(this.goldBand);

        // 2. Crown Prong settings (four detailed holding bars)
        const prongGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.45, 8);
        this.prongsGroup = new THREE.Group();
        
        const prongPositions = [
            { x: 0.35, z: 0.35 },
            { x: -0.35, z: 0.35 },
            { x: 0.35, z: -0.35 },
            { x: -0.35, z: -0.35 }
        ];

        prongPositions.forEach(pos => {
            const prong = new THREE.Mesh(prongGeom, this.goldMaterial);
            prong.position.set(pos.x, 1.6, pos.z);
            prong.rotation.x = pos.z * 0.4;
            prong.rotation.z = -pos.x * 0.4;
            this.prongsGroup.add(prong);
        });
        
        this.jewelryGroup.add(this.prongsGroup);

        // 3. Multi-Faceted Brilliant Cut Royal Sapphire
        this.brilliantGeom = new THREE.OctahedronGeometry(0.55, 1); // 24 facets
        
        // Alternative emerald cut shape (octagonal cylinder)
        this.emeraldGeom = new THREE.CylinderGeometry(0.42, 0.48, 0.48, 8);

        this.sapphireMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0f52ba,        // Sapphire Royal Blue
            transmission: 0.96,     // transmissive
            opacity: 1.0,
            roughness: 0.0,
            ior: 1.77,             // sapphire refractive index
            thickness: 1.0,
            specularIntensity: 2.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            envMapIntensity: 3.0,
            flatShading: true       // sharp facet cuts
        });

        this.sapphire = new THREE.Mesh(this.brilliantGeom, this.sapphireMaterial);
        this.sapphire.position.y = 1.75;
        this.jewelryGroup.add(this.sapphire);

        // Set initial transformations
        this.jewelryGroup.position.copy(this.state.position);
        this.jewelryGroup.rotation.set(this.state.rotation.x, this.state.rotation.y, this.state.rotation.z);
        this.jewelryGroup.scale.copy(this.state.scale);
    }

    // Dynamic customization methods
    updateAlloy(type) {
        let goldColor = 0xd4af37; // Default Yellow Gold
        let roughness = 0.08;

        if (type === 'rose') {
            goldColor = 0xe0a080; // Elegant Rose Gold
            roughness = 0.1;
        } else if (type === 'platinum') {
            goldColor = 0xe5e5e5; // Liquid Platinum
            roughness = 0.06;
        }

        gsap.to(this.goldMaterial.color, {
            r: ((goldColor >> 16) & 255) / 255,
            g: ((goldColor >> 8) & 255) / 255,
            b: (goldColor & 255) / 255,
            duration: 0.8,
            ease: 'power2.out'
        });

        gsap.to(this.goldMaterial, {
            roughness: roughness,
            duration: 0.8
        });
    }

    updateGemCut(cutType) {
        if (cutType === 'emerald') {
            this.sapphire.geometry.dispose();
            this.sapphire.geometry = this.emeraldGeom;
            this.sapphire.rotation.set(Math.PI / 8, Math.PI / 8, 0);
        } else {
            this.sapphire.geometry.dispose();
            this.sapphire.geometry = this.brilliantGeom;
            this.sapphire.rotation.set(0, 0, 0);
        }
    }

    createParticles() {
        const particleCount = window.innerWidth < 768 ? 80 : 180; // cut down particles on mobile
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount * 3; i += 3) {
            const radius = 2 + Math.random() * 6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);

            velocities.push({
                x: (Math.random() - 0.5) * 0.003,
                y: (Math.random() - 0.5) * 0.003,
                z: (Math.random() - 0.5) * 0.003
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xd4af37,        // gold sparkles
            size: 0.025,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.particleVelocities = velocities;
        this.scene.add(this.particles);
    }

    updateParticles() {
        const positions = this.particles.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const velIdx = i / 3;
            
            positions[i] += this.particleVelocities[velIdx].x;
            positions[i + 1] += this.particleVelocities[velIdx].y;
            positions[i + 2] += this.particleVelocities[velIdx].z;

            const distance = Math.sqrt(
                positions[i] * positions[i] + 
                positions[i+1] * positions[i+1] + 
                positions[i+2] * positions[i+2]
            );

            if (distance > 8) {
                positions[i] *= 0.5;
                positions[i + 1] *= 0.5;
                positions[i + 2] *= 0.5;
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    updateState(scrollState) {
        const progress = scrollState.progress;
        const activeSection = scrollState.activeSection;
        const sectionProgress = scrollState.sectionProgress;

        const time = this.clock.getElapsedTime();

        if (activeSection === 3) {
            // Interactive 3D section - hand control over to dragging
            this.interactive.active = true;
            this.state.targetPosition.set(0, 0.4, 0.5);
            this.state.targetScale.set(1.4, 1.4, 1.4);
            this.state.targetRotation.set(this.interactive.rotX, this.interactive.rotY, 0);
        } else {
            this.interactive.active = false;
            
            const isMobile = window.innerWidth < 768;

            if (activeSection === 0) {
                // HERO
                // Position centered, slowly rotating in the background
                this.state.targetPosition.set(0, isMobile ? 1.0 : -0.2, 0);
                this.state.targetScale.set(isMobile ? 1.25 : 1.5, isMobile ? 1.25 : 1.5, isMobile ? 1.25 : 1.5);
                this.state.targetRotation.set(
                    0.4 + Math.sin(time * 0.15) * 0.1, 
                    time * 0.1, 
                    0.2
                );
            } else if (activeSection === 1) {
                // STORE BOUTIQUE
                // Shift deep behind standard grid columns
                const t = sectionProgress;
                this.state.targetPosition.set(0, 0.6, -2.5);
                this.state.targetScale.set(1.1, 1.1, 1.1);
                this.state.targetRotation.set(0.6, time * 0.12, -0.2);
            } else if (activeSection === 2) {
                // HERITAGE STORIES
                // Translate to the right side
                const t = sectionProgress;
                this.state.targetPosition.set(isMobile ? 0 : 1.8, isMobile ? 0.8 : -0.2, 0);
                this.state.targetScale.set(isMobile ? 1.0 : 1.25, isMobile ? 1.0 : 1.25, isMobile ? 1.0 : 1.25);
                this.state.targetRotation.set(0.5 + 0.5 * t, time * 0.1 + 0.8 * t, -0.4 * t);
            } else if (activeSection >= 4) {
                // TRUST & RESERVE SECTIONS
                // Drift away
                const t = Math.min(1.0, sectionProgress);
                this.state.targetPosition.set(0, 0.8 + 2.0 * t, -3.5 * t);
                this.state.targetScale.set(0.95 - 0.6 * t, 0.95 - 0.6 * t, 0.95 - 0.6 * t);
                this.state.targetRotation.set(-0.4 + time * 0.2, time * 0.3, 0.6);
            }
        }
    }

    updateMousePosition(mx, my) {
        const lightX = (mx - 0.5) * 8;
        const lightY = -(my - 0.5) * 8;

        this.cursorLight.position.x = lightX;
        this.cursorLight.position.y = lightY;

        // Apply interactive dragging if active
        if (this.interactive.active) {
            if (this.interactive.isDragging) {
                const deltaX = mx - this.interactive.prevPointerX;
                const deltaY = my - this.interactive.prevPointerY;

                this.interactive.targetRotY += deltaX * 3.5;
                this.interactive.targetRotX += deltaY * 3.5;

                this.interactive.prevPointerX = mx;
                this.interactive.prevPointerY = my;
            }
        }
    }

    addEventListeners() {
        const grabArea = document.getElementById('canvas-grab-area');
        if (!grabArea) return;

        const startDrag = (e) => {
            if (!this.interactive.active) return;
            this.interactive.isDragging = true;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            this.interactive.prevPointerX = clientX / window.innerWidth;
            this.interactive.prevPointerY = clientY / window.innerHeight;
        };

        const stopDrag = () => {
            this.interactive.isDragging = false;
        };

        grabArea.addEventListener('mousedown', startDrag);
        grabArea.addEventListener('touchstart', startDrag, { passive: true });

        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchend', stopDrag);

        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);
            
            const isMobile = window.innerWidth < 768;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // 1. Smoothly Lerp interactive rotation vectors (Physics Friction)
        if (this.interactive.active) {
            this.interactive.rotX += (this.interactive.targetRotX - this.interactive.rotX) * 0.1;
            this.interactive.rotY += (this.interactive.targetRotY - this.interactive.rotY) * 0.1;
        }

        // 2. Interpolate overall group matrices (Physics Spring Lerp)
        const lerpFactor = 0.06;
        this.state.position.lerp(this.state.targetPosition, lerpFactor);
        this.state.scale.lerp(this.state.targetScale, lerpFactor);

        this.state.rotation.x += (this.state.targetRotation.x - this.state.rotation.x) * lerpFactor;
        this.state.rotation.y += (this.state.targetRotation.y - this.state.rotation.y) * lerpFactor;
        this.state.rotation.z += (this.state.targetRotation.z - this.state.rotation.z) * lerpFactor;

        this.jewelryGroup.position.copy(this.state.position);
        this.jewelryGroup.scale.copy(this.state.scale);
        this.jewelryGroup.rotation.set(this.state.rotation.x, this.state.rotation.y, this.state.rotation.z);

        // 3. Shimmer rotating sapphire gem facets autonomously
        if (this.sapphire) {
            if (this.sapphire.geometry === this.brilliantGeom) {
                this.sapphire.rotation.y = time * 0.15;
                this.sapphire.rotation.x = Math.sin(time * 0.05) * 0.1;
            } else {
                this.sapphire.rotation.y = time * 0.1 + Math.sin(time * 0.02) * 0.2;
            }
        }

        // 4. Drift dust particles
        this.updateParticles();

        this.renderer.render(this.scene, this.camera);
    }
}


/* ==========================================================================
   SAPPHERE ORCHESTRATOR & INTERACTION ENGINE
   ========================================================================== */

class App {
    constructor() {
        gsap.registerPlugin(ScrollTrigger);

        // Mark body as JS-ready so CSS-driven animations activate
        document.body.classList.add('js-ready');

        this.scrollState = {
            progress: 0,
            activeSection: 0,
            sectionProgress: 0
        };

        this.mouse = {
            x: 0.5,
            y: 0.5,
            targetX: 0.5,
            targetY: 0.5
        };

        this.cart = [];
        this.currentProductId = null;

        this.init();
    }

    async init() {
        this.jewelryEngine = new JewelryEngine('webgl-canvas');
        await this.loadProducts();
        this.loadCart();

        this.runCinematicLoader(() => {
            this.initSmoothScroll();
            this.initScrollAnimations();
            this.initCursorGlows();
            this.initMagneticInteractions();
            // Initialize scroll-fade animations for .fade-in elements
            this.initScrollFades();
        });

        // Supabase Realtime subscription for automatic cross-device updates
        const isSupabaseConfigured = typeof window.CONFIG !== 'undefined' && window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY;
        if (isSupabaseConfigured) {
            supabase
                .channel('public:jewelry_products')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'jewelry_products' }, async (payload) => {
                    await this.loadProducts();
                    this.loadCart();
                })
                .subscribe();
        }
    }

    /* ==========================================================================
       DYNAMIC LOCAL STORAGE PRODUCTS LOADER
       ========================================================================== */
    async loadProducts() {
        const STORAGE_KEY = 'sapphereProducts';
        const isSupabaseConfigured = typeof window.CONFIG !== 'undefined' && window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY;

        if (isSupabaseConfigured) {
            localStorage.removeItem(STORAGE_KEY); // clear stale cache before fetch
            try {
                const { data, error } = await supabase
                    .from('jewelry_products')
                    .select('*')
                    .order('created_at', { ascending: true });
                
                if (error) throw error;
                if (data && data.length > 0) {
                    this.productList = data;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    this.renderFeatured();
                    this.renderCatalog();
                    return;
                }
            } catch (err) {
                console.error("Supabase load error, falling back to LocalStorage:", err);
            }
        }

        let stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Default luxurious jewelry data
            const defaultProducts = [
                {
                    id: "flora-bead",
                    name: "Flora Bead Choker",
                    price: 1899,
                    originalPrice: 2099,
                    img: "photosjewewllry/jewelry-01.jpg",
                    cat: "necklace",
                    badge: "BESTSELLER",
                    description: "A playful, graceful gold chain adorned with hand-strung multi-colored floral bead charms.",
                    rating: "4.9",
                    reviews: "84",
                    featured: true
                },
                {
                    id: "earring-suite",
                    name: "Atelier Earring Suite",
                    price: 2499,
                    originalPrice: 2999,
                    img: "photosjewewllry/jewelry-10.jpg",
                    cat: "earring",
                    badge: "LIMITED",
                    description: "Curated suite of three distinct gold earrings: floral studs, double heart hoops, and bamboo hoops.",
                    rating: "4.8",
                    reviews: "46",
                    featured: true
                },
                {
                    id: "aura-heart",
                    name: "Aura Heart Pendant",
                    price: 1599,
                    originalPrice: 1899,
                    img: "photosjewewllry/jewelry-05.jpg",
                    cat: "necklace",
                    badge: "ROYAL CHOICE",
                    description: "A classic minimal gold chain holding a polished solid gold heart pendant on a premium display stand.",
                    rating: "5.0",
                    reviews: "112",
                    featured: true
                },
                {
                    id: "silken-heart",
                    name: "Silken Heart Choker",
                    price: 1699,
                    originalPrice: 1999,
                    img: "photosjewewllry/jewelry-07.jpg",
                    cat: "necklace",
                    badge: "POPULAR",
                    description: "A delicate hollow gold heart pendant layered elegantly over natural liquid-silk champagne drapery.",
                    rating: "4.9",
                    reviews: "73",
                    featured: true
                },
                {
                    id: "layered-necklace",
                    name: "Royal Layered Necklace",
                    price: 1899,
                    originalPrice: 2099,
                    img: "photosjewewllry/jewelry-01.jpg",
                    cat: "necklace",
                    badge: "10% OFF",
                    description: "Intricately styled layered necklace blending warm yellow gold bars and custom sweep links.",
                    rating: "5.0",
                    reviews: "128",
                    featured: false
                },
                {
                    id: "gold-choker",
                    name: "Gold Bead Choker",
                    price: 1499,
                    originalPrice: 1799,
                    img: "photosjewewllry/jewelry-02.jpg",
                    cat: "necklace",
                    badge: "BESTSELLER",
                    description: "Minimalist elegant gold bead choker, perfect for stacking and everyday elegance.",
                    rating: "5.0",
                    reviews: "84",
                    featured: false
                },
                {
                    id: "pearl-strand",
                    name: "Intimate Pearl Strand",
                    price: 2199,
                    originalPrice: 2499,
                    img: "photosjewewllry/jewelry-03.jpg",
                    cat: "necklace",
                    badge: "NEW",
                    description: "Elegant genuine pearl strand displaying subtle cream iridescent tones and safe gold locks.",
                    rating: "4.0",
                    reviews: "56",
                    featured: false
                },
                {
                    id: "floral-studs",
                    name: "Floral Stud Earrings",
                    price: 899,
                    originalPrice: 1059,
                    img: "photosjewewllry/jewelry-06.jpg",
                    cat: "earring",
                    badge: "15% OFF",
                    description: "Dainty floral stud earrings designed to frame the face with light-catching golden petals.",
                    rating: "5.0",
                    reviews: "203",
                    featured: false
                },
                {
                    id: "gold-bracelet",
                    name: "Velvet Gold Bracelet",
                    price: 1299,
                    originalPrice: 1499,
                    img: "photosjewewllry/jewelry-09.jpg",
                    cat: "bracelet",
                    badge: "NEW",
                    description: "Sleek and polished gold bracelet designed with smooth link loops and custom security sweeps.",
                    rating: "4.0",
                    reviews: "37",
                    featured: false
                },
                {
                    id: "gold-ring",
                    name: "Rose Gold Statement Ring",
                    price: 1199,
                    originalPrice: 1399,
                    img: "photosjewewllry/jewelry-13.jpg",
                    cat: "ring",
                    badge: "TOP RATED",
                    description: "Bold rose gold band ring, hand-polished to capture modern architectural sophistication.",
                    rating: "5.0",
                    reviews: "91",
                    featured: false
                },
                {
                    id: "crystal-drops",
                    name: "Crystal Drop Earrings",
                    price: 999,
                    originalPrice: 1249,
                    img: "photosjewewllry/jewelry-11.jpg",
                    cat: "earring",
                    badge: "20% OFF",
                    description: "Dazzling crystal drop earrings that cascade gracefully to add royalty and glamour.",
                    rating: "5.0",
                    reviews: "165",
                    featured: false
                },
                {
                    id: "combo-set",
                    name: "Bridal Combo Set",
                    price: 3499,
                    originalPrice: 4199,
                    img: "photosjewewllry/jewelry-12.jpg",
                    cat: "set",
                    badge: "COMBO",
                    description: "A rich jewelry suite containing matching royal layered choker and drop studs.",
                    rating: "5.0",
                    reviews: "52",
                    featured: false
                },
                {
                    id: "tennis-bracelet",
                    name: "Diamond Tennis Bracelet",
                    price: 2799,
                    originalPrice: 3299,
                    img: "photosjewewllry/jewelry-16.jpg",
                    cat: "bracelet",
                    badge: "NEW",
                    description: "Classic high-end tennis bracelet hand-set with highly brilliant sparkling faceted simulated diamonds.",
                    rating: "5.0",
                    reviews: "44",
                    featured: false
                },
                {
                    id: "festive-set",
                    name: "Festive Gold Set",
                    price: 2999,
                    originalPrice: 3599,
                    img: "photosjewewllry/jewelry-14.jpg",
                    cat: "set",
                    badge: "FESTIVE",
                    description: "Elegant traditional gold-sweep matching choker and bangle set designed for celebrations.",
                    rating: "4.0",
                    reviews: "68",
                    featured: false
                },
                {
                    id: "luxury-set",
                    name: "Sapphire Luxury Set",
                    price: 4499,
                    originalPrice: 5499,
                    img: "photosjewewllry/jewelry-15.jpg",
                    cat: "set",
                    badge: "LUXURY",
                    description: "Our crown jewel masterpiece suite, featuring royal blue sapphires in intricate golden settings.",
                    rating: "5.0",
                    reviews: "31",
                    featured: false
                },
                {
                    id: "emerald-ring",
                    name: "Emerald Solitaire Ring",
                    price: 1899,
                    originalPrice: 2299,
                    img: "photosjewewllry/jewelry-17.jpg",
                    cat: "ring",
                    badge: "TRENDING",
                    description: "A breathtaking solitaire ring showcasing a deep forest green faceted emerald cut gem.",
                    rating: "5.0",
                    reviews: "77",
                    featured: false
                }
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
            stored = JSON.stringify(defaultProducts);
        }
        this.productList = JSON.parse(stored);

        // Render sections dynamically
        this.renderFeatured();
        this.renderCatalog();
    }

    renderFeatured() {
        const grid = document.querySelector('.store-section .product-grid');
        if (!grid) return;

        // Get featured items
        const featuredItems = this.productList.filter(p => p.featured || p.id === 'flora-bead' || p.id === 'earring-suite' || p.id === 'aura-heart' || p.id === 'silken-heart');
        grid.innerHTML = '';

        featuredItems.slice(0, 4).forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card glass-card cinematic-card fade-in';
            card.dataset.product = p.id;
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Prevent quickview if user clicks directly on WhatsApp link
                if (e.target.closest('.btn-whatsapp-buy')) return;
                this.openQuickView(p.id);
            });

            const badgeHTML = p.badge ? `<span class="product-badge">${p.badge}</span>` : '';

            card.innerHTML = `
                <div class="product-visual">
                    <img src="${p.img}" alt="${p.name}" class="product-img">
                    ${badgeHTML}
                </div>
                <div class="product-info">
                    <div class="product-rating">${p.rating || '5.0'} ★ (${p.reviews || '10'} reviews)</div>
                    <h3 class="product-title">${p.name}</h3>
                    <p class="product-excerpt">${p.description || 'Bespoke SAPPHERE handcrafted jewelry piece.'}</p>
                    <div class="product-footer">
                        <span class="product-price">Rs.${Number(p.price).toLocaleString('en-IN')}</span>
                        <div class="product-actions">
                            <button class="btn-quick-view magnetic-btn" data-strength="6" onclick="event.stopPropagation(); app.openQuickView('${p.id}')">Specs</button>
                            <a href="https://wa.me/918891071849?text=${encodeURIComponent('Hello SAPPHERE! I am interested in purchasing the ' + p.name + ' (Rs.' + Number(p.price).toLocaleString('en-IN') + '). Please guide me through checkout.')}" target="_blank" class="btn-whatsapp-buy magnetic-btn" data-strength="10">
                                <span>BUY NOW</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    renderCatalog() {
        const grid = document.getElementById('jewels-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // Get currently active category filter to maintain selection on updates
        const activeBtn = document.querySelector('.jewel-filter-btn.active');
        const activeCat = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

        this.productList.forEach(p => {
            const card = document.createElement('div');
            card.className = 'jcard';
            card.dataset.cat = p.cat || 'necklace';
            
            const match = activeCat === 'all' || (p.cat || 'necklace') === activeCat;
            if (!match) {
                card.classList.add('hidden');
            }

            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Prevent quickview trigger if user clicks checkout button
                if (e.target.closest('.jcard-buy-btn')) return;
                this.openQuickView(p.id);
            });

            const badgeHTML = p.badge ? `<span class="jcard-badge ${getBadgeClass(p.badge)}">${p.badge}</span>` : '';
            const originalHTML = p.originalPrice ? `<span class="jcard-original">Rs.${Number(p.originalPrice).toLocaleString('en-IN')}</span>` : '';

            card.innerHTML = `
                <div class="jcard-img-wrap">
                    <img src="${p.img}" alt="${p.name}" class="jcard-img" loading="lazy">
                    ${badgeHTML}
                </div>
                <div class="jcard-body">
                    <p class="jcard-cat">${p.cat || 'Necklace'}</p>
                    <h3 class="jcard-name">${p.name}</h3>
                    <div class="jcard-stars">★★★★★ <span>(${p.reviews || '45'})</span></div>
                    <div class="jcard-price-row">
                        <span class="jcard-price">Rs.${Number(p.price).toLocaleString('en-IN')}</span>
                        ${originalHTML}
                    </div>
                    <a href="https://wa.me/918891071849?text=${encodeURIComponent('Hi SAPPHERE! I want to order the ' + p.name + ' - Rs.' + Number(p.price).toLocaleString('en-IN'))}" target="_blank" class="jcard-buy-btn">🛒 Buy Now</a>
                </div>
            `;
            grid.appendChild(card);
        });

        function getBadgeClass(badge) {
            badge = badge.toLowerCase();
            if (badge.includes('off') || badge.includes('%') || badge.includes('sale')) return 'sale';
            if (badge.includes('new')) return 'new';
            return 'bestseller';
        }
    }

    /* ==========================================================================
       SCROLLâ€‘FADE ANIMATIONS (IntersectionObserver)
       ========================================================================== */
    initScrollFades() {
        const fadeEls = document.querySelectorAll('.fade-in');
        if (!('IntersectionObserver' in window) || fadeEls.length === 0) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        fadeEls.forEach(el => observer.observe(el));
    }

    /* ==========================================================================
       CINEMATIC LOADING SEQUENCE
       ========================================================================== */
    runCinematicLoader(onCompleteCallback) {
        const loader = document.getElementById('loader');
        const loaderBar = document.getElementById('loader-bar');
        const loaderPercent = document.getElementById('loader-percentage');
        
        const tagline = document.querySelector('.loader-tagline');
        const title = document.querySelector('.loader-title');
        const barContainer = document.querySelector('.loader-bar-container');

        // Safety: always unlock scroll after 8s no matter what
        const safetyUnlock = setTimeout(() => {
            document.body.style.overflow = '';
            document.body.style.height = '';
            if (loader) loader.style.display = 'none';
            onCompleteCallback();
        }, 8000);

        if (!loader) {
            clearTimeout(safetyUnlock);
            onCompleteCallback();
            return;
        }

        try {
            document.body.style.overflow = 'hidden';

            const tl = gsap.timeline();
            
            tl.to(tagline, { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' })
              .to(title, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', letterSpacing: '0.5em' }, '-=0.6')
              .to(barContainer, { opacity: 1, duration: 0.8 }, '-=0.8')
              .to(loaderPercent, { opacity: 0.7, duration: 0.8 }, '-=0.8');

            const progressObj = { value: 0 };
            gsap.to(progressObj, {
                value: 100,
                duration: 0.6,
                ease: 'power1.inOut',
                onUpdate: () => {
                    const percent = Math.floor(progressObj.value);
                    if (loaderBar) loaderBar.style.width = `${percent}%`;
                    if (loaderPercent) loaderPercent.textContent = `${percent}%`;
                },
                onComplete: () => {
                    clearTimeout(safetyUnlock);
                    const exitTl = gsap.timeline({
                        onComplete: () => {
                            loader.style.display = 'none';
                            document.body.style.overflow = '';
                            document.body.style.height = '';
                            onCompleteCallback();
                        }
                    });

                    const loaderBg = document.querySelector('.loader-bg');
                    exitTl.to(loaderPercent, { opacity: 0, duration: 0.3 })
                          .to([tagline, title, barContainer], { y: -50, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power2.in' })
                          .to(loaderBg, { 
                              transform: 'translateY(-100%)', 
                              duration: 1.2, 
                              ease: 'power4.inOut' 
                          }, '-=0.2');
                }
            });
        } catch(e) {
            // If GSAP fails, immediately show site
            clearTimeout(safetyUnlock);
            loader.style.display = 'none';
            document.body.style.overflow = '';
            document.body.style.height = '';
            onCompleteCallback();
        }
    }

    /* ==========================================================================
       SMOOTH INERTIA SCROLL (Lenis Engine)
       ========================================================================== */
    initSmoothScroll() {
        this.lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.95,
            touchMultiplier: 1.3
        });

        this.lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    }

    /* ==========================================================================
       CINEMATIC SCROLL STORYTELLING
       ========================================================================== */
    initScrollAnimations() {
        // A. Reveal Hero elements
        const heroTl = gsap.timeline();
        heroTl.to('.hero-title .word', { y: '0%', duration: 1.4, ease: 'power4.out', stagger: 0.25 })
              .to('.cinematic-fade', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.15 }, '-=0.8');

        // B. Bind ScrollTrigger to all sections to drive WebGL 3D states
        const sections = ['#hero', '#store', '#heritage', '#interactive', '#trust', '#reserve'];
        
        sections.forEach((id, index) => {
            const el = document.querySelector(id);
            if (!el) return;

            ScrollTrigger.create({
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                onUpdate: (self) => {
                    if (self.isActive) {
                        this.scrollState.activeSection = index;
                        this.scrollState.sectionProgress = self.progress;
                        this.scrollState.progress = this.scrollState.progress;
                        
                        this.jewelryEngine.updateState(this.scrollState);
                    }
                }
            });
        });

        ScrollTrigger.create({
            trigger: '.scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                this.scrollState.progress = self.progress;
            }
        });

        // Background color shifts on scroll (Timelines)
        // Transition into deep matte black at store catalog section
        gsap.to('body', {
            backgroundColor: '#0a0a0a',
            scrollTrigger: {
                trigger: '#store',
                start: 'top 60%',
                end: 'top 20%',
                scrub: true,
                toggleActions: 'play reverse play reverse'
            }
        });

        // Shift back to burgundy/wine-red storytelling section
        gsap.to('body', {
            backgroundColor: '#3a0000',
            scrollTrigger: {
                trigger: '#heritage',
                start: 'top 60%',
                end: 'top 20%',
                scrub: true,
                toggleActions: 'play reverse play reverse'
            }
        });

        // Shift back to dark carbon black for customization atelier
        gsap.to('body', {
            backgroundColor: '#050505',
            scrollTrigger: {
                trigger: '#interactive',
                start: 'top 60%',
                end: 'top 20%',
                scrub: true,
                toggleActions: 'play reverse play reverse'
            }
        });

        // C. Individual element reveal transitions
        const reveals = document.querySelectorAll('.cinematic-reveal');
        reveals.forEach(el => {
            gsap.fromTo(el, 
                { opacity: 0, y: 40 },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 1.2, 
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        // D. Card expansions
        const cards = document.querySelectorAll('.cinematic-card');
        cards.forEach(card => {
            gsap.fromTo(card,
                { opacity: 0, y: 60, scale: 0.98 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1.4,
                    ease: 'power4.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 88%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });
    }

    /* ==========================================================================
       STANDARD CURSOR & BACKGROUND SHIMMER TRACKING
       ========================================================================== */
    initCursorGlows() {
        const ambientGlow = document.getElementById('ambient-glow');

        window.addEventListener('mousemove', (e) => {
            this.mouse.targetX = e.clientX / window.innerWidth;
            this.mouse.targetY = e.clientY / window.innerHeight;

            this.jewelryEngine.updateMousePosition(this.mouse.targetX, this.mouse.targetY);

            if (ambientGlow) {
                ambientGlow.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(212, 175, 55, 0.04) 0%, rgba(0, 0, 0, 0) 65%)`;
            }
        });

        // Touch tracking support for mobile sparkles
        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;

                this.mouse.targetX = touchX / window.innerWidth;
                this.mouse.targetY = touchY / window.innerHeight;

                this.jewelryEngine.updateMousePosition(this.mouse.targetX, this.mouse.targetY);
            }
        }, { passive: true });
    }

    /* ==========================================================================
       MAGNETIC HOVER ENGINE (Spring Physics)
       ========================================================================== */
    initMagneticInteractions() {
        const magneticElements = document.querySelectorAll('.magnetic-btn');
        
        magneticElements.forEach(el => {
            const inner = el.querySelector('span') || el;
            const strength = parseFloat(el.getAttribute('data-strength')) || 10;

            el.addEventListener('mousemove', (e) => {
                const bounding = el.getBoundingClientRect();
                const x = e.clientX - bounding.left - bounding.width / 2;
                const y = e.clientY - bounding.top - bounding.height / 2;

                gsap.to(inner, {
                    x: x * (strength / 25),
                    y: y * (strength / 25),
                    duration: 0.4,
                    ease: 'power2.out'
                });
                
                gsap.to(el, {
                    x: x * (strength / 40),
                    y: y * (strength / 40),
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to([el, inner], {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1.1, 0.4)'
                });
            });
        });
    }

    /* ==========================================================================
       E-COMMERCE FLOWS - QUICK VIEW BOTTOM DRAWER
       ========================================================================== */
    openQuickView(productId) {
        this.currentProductId = productId;
        const data = this.productList.find(p => p.id === productId);
        if (!data) return;

        const overlay = document.getElementById('quickview-overlay');
        const drawer = document.getElementById('quickview-drawer');
        
        // Populate drawer data
        document.getElementById('qv-title').textContent = data.name;
        document.getElementById('qv-img').src = data.img;
        document.getElementById('qv-desc').textContent = data.description || 'Bespoke SAPPHERE handcrafted jewelry piece.';
        document.getElementById('qv-price').textContent = `Rs.${Number(data.price).toLocaleString('en-IN')}`;

        // Set WhatsApp Checkout URL
        const orderMsg = `Hello SAPPHERE! I am interested in purchasing the ${data.name} (Rs.${Number(data.price).toLocaleString('en-IN')}). Please guide me through checkout.`;
        const encMsg = encodeURIComponent(orderMsg);
        document.getElementById('qv-buy-link').href = `https://wa.me/918891071849?text=${encMsg}`;

        // Stop Lenis background scrolling when drawer is open
        if (this.lenis) this.lenis.stop();

        // Slide Drawer up cleanly
        overlay.classList.add('active');
        drawer.classList.add('active');
        
        gsap.fromTo(drawer, 
            { y: '-30%', x: '-50%', scale: 0.9, opacity: 0 }, 
            { y: '-50%', x: '-50%', scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
        );
    }

    closeQuickView() {
        const overlay = document.getElementById('quickview-overlay');
        const drawer = document.getElementById('quickview-drawer');

        gsap.to(drawer, {
            y: '-30%',
            x: '-50%',
            scale: 0.9,
            opacity: 0,
            duration: 0.3,
            ease: 'power3.in',
            onComplete: () => {
                overlay.classList.remove('active');
                drawer.classList.remove('active');
                
                // Restart Lenis scroll track
                if (this.lenis) this.lenis.start();
            }
        });
    }

    /* ==========================================================================
       WHATSAPP CHAT FLOATING WIDGET
       ========================================================================== */
    toggleChatWidget() {
        const chatCard = document.getElementById('whatsapp-chat-card');
        if (!chatCard) return;

        chatCard.classList.toggle('active');
        
        if (chatCard.classList.contains('active')) {
            // Animate card slide up
            gsap.fromTo(chatCard,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }
            );
            
            // clear badge count
            const badge = document.querySelector('.whatsapp-badge');
            if (badge) badge.style.display = 'none';
        }
    }

    /* ==========================================================================
       3D ATELIER STATE SWITCHES (Interactive customizer options)
       ========================================================================== */
    updateAlloy(alloyType) {
        // Update 3D band alloy color
        this.jewelryEngine.updateAlloy(alloyType);
        
        // Update customizer active button classes
        const buttons = event.target.parentNode.querySelectorAll('.btn-option');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }

    updateGemCut(cutType) {
        // Update 3D Gem cut structure
        this.jewelryEngine.updateGemCut(cutType);

        // Update customizer active button classes
        const buttons = event.target.parentNode.querySelectorAll('.btn-option');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }

    /* ==========================================================================
       CART METHODS
       ========================================================================== */
    loadCart() {
        try {
            this.cart = JSON.parse(localStorage.getItem('sapphereCart') || '[]');
        } catch(e) {
            this.cart = [];
        }
        this.updateCartUI();
    }

    saveCart() {
        localStorage.setItem('sapphereCart', JSON.stringify(this.cart));
        this.updateCartUI();
    }

    addToCart(productId) {
        const product = this.productList.find(p => p.id === productId);
        if (!product) return;

        const cartItem = this.cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                img: product.img,
                quantity: 1
            });
        }
        this.saveCart();
        this.openCart();
    }

    addToCartFromQuickView() {
        if (this.currentProductId) {
            this.addToCart(this.currentProductId);
            this.closeQuickView();
        }
    }

    updateCartQuantity(productId, delta) {
        const cartItem = this.cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += delta;
            if (cartItem.quantity <= 0) {
                this.removeFromCart(productId);
                return;
            }
        }
        this.saveCart();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    }

    openCart() {
        const overlay = document.getElementById('cart-overlay');
        const drawer = document.getElementById('cart-drawer');
        if (!overlay || !drawer) return;

        if (this.lenis) this.lenis.stop();

        overlay.classList.add('active');
        drawer.classList.add('active');

        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            gsap.fromTo(drawer, { y: '100%' }, { y: '0%', duration: 0.6, ease: 'power4.out' });
        } else {
            gsap.fromTo(drawer, { x: '100%' }, { x: '0%', duration: 0.6, ease: 'power4.out' });
        }
    }

    closeCart() {
        const overlay = document.getElementById('cart-overlay');
        const drawer = document.getElementById('cart-drawer');
        if (!overlay || !drawer) return;

        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            gsap.to(drawer, {
                y: '100%',
                duration: 0.5,
                ease: 'power3.in',
                onComplete: () => {
                    overlay.classList.remove('active');
                    drawer.classList.remove('active');
                    if (this.lenis) this.lenis.start();
                }
            });
        } else {
            gsap.to(drawer, {
                x: '100%',
                duration: 0.5,
                ease: 'power3.in',
                onComplete: () => {
                    overlay.classList.remove('active');
                    drawer.classList.remove('active');
                    if (this.lenis) this.lenis.start();
                }
            });
        }
    }

    updateCartUI() {
        const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const countBadge = document.getElementById('cart-count');
        const countBadgeMobile = document.getElementById('cart-count-mobile');
        if (countBadge) countBadge.textContent = count;
        if (countBadgeMobile) countBadgeMobile.textContent = count;

        const container = document.getElementById('cart-items-container');
        if (!container) return;

        container.innerHTML = '';
        if (this.cart.length === 0) {
            container.innerHTML = '<div class="cart-empty-text">Your cart is empty. Explore our pieces to add items.</div>';
            document.getElementById('cart-total-price').textContent = 'Rs.0';
            return;
        }

        let total = 0;
        this.cart.forEach(item => {
            total += item.price * item.quantity;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-img-wrap">
                    <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-name" style="margin:0; font-size:0.9rem; font-family:var(--font-serif);">${item.name}</h4>
                    <div class="cart-item-price" style="margin:0.2rem 0; font-size:0.8rem; color:var(--gold);">Rs.${Number(item.price).toLocaleString('en-IN')}</div>
                    <div style="margin-top: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                        <div class="cart-item-controls">
                            <button class="cart-qty-btn" onclick="app.updateCartQuantity('${item.id}', -1)">-</button>
                            <span class="cart-qty-num">${item.quantity}</span>
                            <button class="cart-qty-btn" onclick="app.updateCartQuantity('${item.id}', 1)">+</button>
                        </div>
                        <button class="cart-remove-btn" onclick="app.removeFromCart('${item.id}')">Remove</button>
                    </div>
                </div>
            `;
            container.appendChild(itemEl);
        });

        document.getElementById('cart-total-price').textContent = `Rs.${Number(total).toLocaleString('en-IN')}`;
    }

    checkoutCart() {
        if (this.cart.length === 0) return;

        let total = 0;
        let summary = "Hello SAPPHERE! I would like to place an order for the following items:\n\n";
        this.cart.forEach((item, idx) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            summary += `${idx + 1}. ${item.name} x ${item.quantity} (Rs.${Number(itemTotal).toLocaleString('en-IN')})\n`;
        });

        summary += `\nTotal: Rs.${Number(total).toLocaleString('en-IN')}\n\nPlease guide me through checkout.`;
        const encMsg = encodeURIComponent(summary);
        window.open(`https://wa.me/918891071849?text=${encMsg}`, '_blank');
    }

    /* ==========================================================================
       CONTACT FORM SUBMIT
       ========================================================================== */
    submitInquiry() {
        alert('Your bespoke order inquiry has been cast into the SAPPHERE archives. Our boutique assistant will contact you shortly.');
        document.querySelector('.booking-form').reset();
    }
}

// Instantiate global app controller
let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app; // Expose globally for HTML event actions

    // IntersectionObserver for fade-in on scroll
    const fadeElements = document.querySelectorAll('.cinematic-fade');
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    fadeElements.forEach(el => fadeObserver.observe(el));
});

