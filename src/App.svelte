<script lang="ts">
  import {
    Canvas,
    Scene,
    PerspectiveCamera,
    DirectionalLight,
    AmbientLight,
    BoxBufferGeometry,
    Mesh,
    MeshStandardMaterial,
    WebGLRenderer,
    OrbitControls,
    BufferGeometry,
    Color,
  } from "svelthree";
  import type { Array3 } from "svelthree/src/utils/Sv3Types.svelte";
  import { onMount, tick } from "svelte";

  const urlParams = new URLSearchParams(window.location.search);
  let username = urlParams.get("username") || "";

  let total = 0;
  let contributions: Array<
    Array<{ date: string; count: number; intensity: string }>
  >;

  const debounce = (func: Function, delay: number) => {
    let timer: NodeJS.Timeout;

    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  const getContributions = () => {
    try {
      fetch(
        `https://gh-contributions.nathaniel-fernandes.workers.dev/?username=${username}`
      ).then((resp) =>
        resp.json().then((json) => {
          total = json.total;
          contributions = json.contributions;
        })
      );
    } catch (e) {
      total = 0;
      contributions = [];
    }
  };
  getContributions();

  const updateContributions = debounce(() => {
    const new_url = `${window.location.protocol}//${window.location.host}/github-cubed?username=${username}`;
    window.history.replaceState({ path: new_url }, document.title, new_url);
    getContributions();
  }, 1000);

  let objects: Array<{
    geometry: BufferGeometry;
    material: MeshStandardMaterial;
    mat: { roughness: number; metalness: number; color: Color };
    pos: Array3;
    rot: Array3;
    count: number;
    date: string;
  }>;

  const cubeRoughness = 1.0;
  const cubeMetalness = 0.05;
  const cubeHeightScale = 0.15;
  const cubeRot: Array3 = [0, 0, 0];

  const cubeSize = 0.5;
  const cubeSpacing = 0.7;

  let baseGeometry: BufferGeometry;
  let baseMaterial: MeshStandardMaterial;
  let basePos: Array3;

  const baseHeight = 0.8;
  const baseColor = new Color(0x0d1117);

  const intensity = {
    "0": new Color(0x161b22),
    "1": new Color(0x0e4429),
    "2": new Color(0x006d32),
    "3": new Color(0x26a641),
    "4": new Color(0x39d353),
  };

  $: if (contributions) {
    let offsetX = contributions.length * (cubeSpacing / -2.0);
    let offsetY = 0;
    let offsetZ = 0;

    baseGeometry = new BoxBufferGeometry(
      contributions.length * cubeSpacing,
      baseHeight,
      7 * cubeSpacing
    );
    baseMaterial = new MeshStandardMaterial();
    basePos = [
      cubeSpacing - cubeSpacing / 2.0,
      baseHeight / -2.0,
      (8 * cubeSpacing) / 2.0,
    ];

    objects = contributions.flatMap((week) => {
      offsetZ = 0;
      offsetX += cubeSpacing;

      return week.map((day) => {
        offsetZ += cubeSpacing;

        let height = cubeHeightScale + cubeHeightScale * day.count;
        return {
          geometry: new BoxBufferGeometry(cubeSize, height, cubeSize),
          material: new MeshStandardMaterial(),
          mat: {
            roughness: cubeRoughness,
            metalness: cubeMetalness,
            color: intensity[day.intensity],
          },
          pos: [offsetX, offsetY + height / 2.0, offsetZ],
          rot: cubeRot,
          count: day.count,
          date: new Date(day.date).toDateString(),
        };
      });
    });
  }

  let w = 1000;
  let h = 1000;
  let mounted = false;

  const resize = debounce(async () => {
    mounted = false;
    await tick();
    w = window.innerWidth;
    h = window.innerHeight;
    mounted = true;
  }, 300);

  onMount(() => {
    w = window.innerWidth;
    h = window.innerHeight;
    mounted = true;

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  });

  let info: { count: number; date: string };
</script>

<main>
  <input
    class="sub"
    placeholder="github username..."
    bind:value={username}
    on:input={updateContributions}
    spellcheck="false"
  />

  {#if total}
    <h2 class="sub">{total} contributions in the last year</h2>
  {:else}
    <h2 class="sub">user does not exist</h2>
  {/if}

  {#if info}
    <h2 class="sub info">
      commits: {info.count}
      <br />{info.date}
    </h2>
  {/if}

  {#if mounted && total}
    <Canvas let:sti {w} {h} interactive>
      <Scene {sti} let:scene id="scene1" props={{ background: 0x334461 }}>
        <PerspectiveCamera
          {scene}
          id="cam1"
          pos={[0, 20, 30]}
          lookAt={[0, 0, 0]}
        />
        <AmbientLight {scene} intensity={1.25} />

        {#if objects}
          <Mesh
            {scene}
            geometry={baseGeometry}
            material={baseMaterial}
            mat={{ roughness: 1.0, metalness: 0.1, color: baseColor }}
            pos={basePos}
            rot={cubeRot}
          />

          {#each objects as { geometry, material, mat, pos, rot, count, date }}
            <Mesh
              {scene}
              {geometry}
              {material}
              {mat}
              {pos}
              {rot}
              interact
              onPointerOver={() => (info = { count, date })}
              onPointerLeave={() => (info = null)}
            />
          {/each}
        {/if}

        <DirectionalLight {scene} pos={[1, 2, 1]} intensity={0.8} />
        <OrbitControls {scene} enableDamping autoRotate />
      </Scene>

      <WebGLRenderer
        {sti}
        sceneId="scene1"
        camId="cam1"
        config={{ antialias: true, alpha: true }}
      />
    </Canvas>
  {/if}
</main>

<style>
  .sub {
    position: absolute;
    z-index: 100;
  }

  .info {
    margin: 4rem 1.5rem;
    font-size: 1rem;
  }

  main {
    background-color: #1a1a2a;
    height: 100%;
    width: 100%;
  }

  h2 {
    color: rgba(255, 255, 255, 0.8);
    margin: 1rem 1.5rem;
    top: 1.8rem;
  }

  input {
    background: none;
    color: rgba(255, 255, 255, 0.8);
    border: none;
    outline: none;
    font-size: 2rem;
    font-weight: 800;
    margin: 0.5rem 1.5rem;
    padding: 0;
  }
</style>
