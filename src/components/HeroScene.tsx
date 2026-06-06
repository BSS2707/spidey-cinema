import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HeroScene() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mount.current) return;
    const container = mount.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.PointLight(0xe50914, 4, 50);
    key.position.set(-6, 4, 6); scene.add(key);
    const rim = new THREE.PointLight(0xff6f00, 3, 50);
    rim.position.set(6, -2, 4); scene.add(rim);

    // Film reel (torus + spokes)
    const reelGroup = new THREE.Group();
    const reel = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.25, 16, 80),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2, emissive: 0xe50914, emissiveIntensity: 0.15 })
    );
    reelGroup.add(reel);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 4.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.3 })
      );
      spoke.rotation.z = (i / 6) * Math.PI * 2;
      reelGroup.add(spoke);
    }
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xe50914, emissive: 0xe50914, emissiveIntensity: 0.8 })
    );
    reelGroup.add(hub);
    reelGroup.position.set(-2.5, 0.3, 0);
    scene.add(reelGroup);

    // Floating tickets
    const tickets: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const t = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.45),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0xff6f00 : 0xe50914,
          emissive: i % 2 ? 0xff6f00 : 0xe50914,
          emissiveIntensity: 0.4,
          side: THREE.DoubleSide,
          metalness: 0.3, roughness: 0.5,
        })
      );
      t.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6 - 2,
      );
      t.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      (t as any).speed = 0.2 + Math.random() * 0.5;
      (t as any).offset = Math.random() * Math.PI * 2;
      scene.add(t);
      tickets.push(t);
    }

    // Particle field
    const pCount = 600;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18 - 4;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xff6f00, size: 0.04, transparent: true, opacity: 0.7 })
    );
    scene.add(particles);

    let mouseX = 0, mouseY = 0;
    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      reelGroup.rotation.z -= 0.005;
      reelGroup.rotation.y = Math.sin(t * 0.4) * 0.15;
      tickets.forEach((tk) => {
        tk.position.y += Math.sin(t * (tk as any).speed + (tk as any).offset) * 0.005;
        tk.rotation.x += 0.003;
        tk.rotation.y += 0.005;
      });
      particles.rotation.y = t * 0.02;
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 1 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const W = container.clientWidth, H = container.clientHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="absolute inset-0" aria-hidden />;
}
