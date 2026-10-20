/**
 * ভাসান: three photos of the same frame (Ma in the river, sinking, gone) crossfaded under a moving water surface.
 * Small noise waves keep the river alive, a finger on the screen sends out rings, and the floating diya lights
 * the water around it. Plain WebGL1, one full-screen triangle, so it runs on any phone.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform sampler2D tA;
uniform sampler2D tB;
uniform sampler2D tC;
uniform float uSeq;
uniform float uTime;
uniform float uAspect;
uniform float uPhotoAspect;
uniform float uFade;
uniform vec3 uLamp;
uniform vec4 uRip[8];
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float waves(vec2 p) {
  float t = uTime;
  return noise(p * 3.0 + vec2(t * 0.22, t * 0.1)) * 0.55
       + noise(p * 7.0 + vec2(-t * 0.3, t * 0.25)) * 0.3
       + noise(p * 15.0 + vec2(t * 0.5, -t * 0.4)) * 0.15;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float e = 0.004;
  float h0 = waves(p);
  vec2 n = vec2(waves(p + vec2(e, 0.0)) - h0, waves(p + vec2(0.0, e)) - h0) / e;

  // Rings from fingers on the water
  vec2 rip = vec2(0.0);
  float ripLight = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 r = uRip[i];
    float age = uTime - r.z;
    if (r.w > 0.0 && age > 0.0 && age < 4.5) {
      vec2 d = p - (r.xy - 0.5) * vec2(uAspect, 1.0);
      float dist = length(d);
      float front = age * 0.26;
      float band = exp(-pow((dist - front) * 14.0, 2.0));
      float wave = sin((dist - front) * 80.0) * band * exp(-age * 0.8) * r.w;
      rip += (d / (dist + 0.0001)) * wave;
      ripLight += wave;
    }
  }

  // Cover the screen with the photo, push in slowly, let the water move it
  vec2 uv = vUv - 0.5;
  float zoom = 1.0 + 0.05 * uSeq + 0.012 * sin(uTime * 0.2);
  uv /= zoom;
  if (uAspect > uPhotoAspect) uv.y *= uPhotoAspect / uAspect;
  else uv.x *= uAspect / uPhotoAspect;
  uv += 0.5 + n * 0.0018 + rip * 0.011;

  vec3 a = texture2D(tA, uv).rgb;
  vec3 b = texture2D(tB, uv).rgb;
  vec3 c = texture2D(tC, uv).rgb;
  vec3 col = mix(mix(a, b, smoothstep(0.0, 1.0, uSeq)), c, smoothstep(1.0, 2.0, uSeq));

  float glint = pow(max(0.0, dot(normalize(vec3(-n * 0.012 - rip * 0.6, 1.0)), normalize(vec3(-0.12, 0.25, 1.0)))), 900.0);
  col += vec3(0.95, 0.6, 0.3) * glint * 0.14;
  col += vec3(1.0, 0.92, 0.8) * ripLight * 0.05;

  // The diya's warm light on the water
  vec2 lp = (uLamp.xy - 0.5) * vec2(uAspect, 1.0);
  float ld = length((p - lp) * vec2(1.0, 1.3));
  col += vec3(0.95, 0.5, 0.18) * uLamp.z * (exp(-ld * 14.0) * 0.32 + exp(-ld * 5.0) * 0.05) * (0.85 + 0.3 * noise(p * 30.0 + uTime));

  float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(uAspect * 0.8, 1.0)));
  col *= mix(0.5, 1.0, v);
  gl_FragColor = vec4(col * uFade, 1.0);
}
`;

type Uniforms = Record<
  "tA" | "tB" | "tC" | "uSeq" | "uTime" | "uAspect" | "uPhotoAspect" | "uFade" | "uLamp" | "uRip",
  WebGLUniformLocation | null
>;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export class FaceWater {
  private gl: WebGLRenderingContext;
  private u: Uniforms;
  private raf = 0;
  private running = false;
  private t0 = performance.now();
  private ripples = new Float32Array(32);
  private nextRipple = 0;
  private ro: ResizeObserver;
  private ready = false;
  private photoAspect = 1;

  /** 0 = Ma in the water, 1 = sinking, 2 = gone. */
  seq = 0;
  /** Diya position in screen uv (x right, y up) and how bright its light is. */
  lamp = { x: 0.5, y: 0.2, on: 0 };
  fade = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false });
    if (!gl || gl.isContextLost()) throw new Error("no webgl");
    this.gl = gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const names = ["tA", "tB", "tC", "uSeq", "uTime", "uAspect", "uPhotoAspect", "uFade", "uLamp", "uRip"] as const;
    this.u = Object.fromEntries(names.map((k) => [k, gl.getUniformLocation(prog, k === "uRip" ? "uRip[0]" : k)])) as Uniforms;
    gl.uniform1i(this.u.tA, 0);
    gl.uniform1i(this.u.tB, 1);
    gl.uniform1i(this.u.tC, 2);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }

  setPhotos(images: HTMLImageElement[]) {
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    images.slice(0, 3).forEach((img, i) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
    this.photoAspect = images[0].naturalWidth / images[0].naturalHeight;
    this.ready = true;
  }

  /** A finger on the water at a screen point. */
  touch(clientX: number, clientY: number, strength = 1) {
    const r = this.canvas.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = 1 - (clientY - r.top) / r.height;
    const k = (this.nextRipple++ % 8) * 4;
    this.ripples.set([x, y, this.now(), strength], k);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Stops drawing. The context is left alive: React may mount the scene again on the same canvas. */
  destroy() {
    this.stop();
    this.ro.disconnect();
  }

  private now() {
    return (performance.now() - this.t0) / 1000;
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    if (!this.running) this.render();
  }

  private render() {
    if (!this.ready) return;
    const { gl, u } = this;
    gl.uniform1f(u.uTime, this.now());
    gl.uniform1f(u.uSeq, this.seq);
    gl.uniform1f(u.uAspect, this.canvas.width / this.canvas.height);
    gl.uniform1f(u.uPhotoAspect, this.photoAspect);
    gl.uniform1f(u.uFade, this.fade);
    gl.uniform3f(u.uLamp, this.lamp.x, this.lamp.y, this.lamp.on);
    gl.uniform4fv(u.uRip, this.ripples);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
