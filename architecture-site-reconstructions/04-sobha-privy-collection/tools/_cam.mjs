import { chromium } from 'playwright';
const [origin, Y] = process.argv.slice(2);
const local = /localhost/.test(origin);
const b = await chromium.launch({ ...(!local ? { proxy: { server: process.env.HTTPS_PROXY } } : {}), args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(origin + '/location', { waitUntil: 'load', timeout: 120000 });
await p.waitForTimeout(9000);
const go = (y) => p.evaluate((y) => window.lenis ? window.lenis.scrollTo(y, { immediate: true, force: true }) : $('body').scroller('instance').scrollTop(y), y);
for (let y = 0; y <= +Y; y += 900) { await go(y); await p.waitForTimeout(300); }
await go(+Y); await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(() => {
  const el = document.querySelector('.location-webgl');
  const out = {};
  if (window.$) {
    const d = $(el).data();
    out.dataKeys = Object.keys(d);
    for (const k of Object.keys(d)) {
      const inst = d[k];
      if (inst && inst.app) {
        const a = inst.app;
        out.cam = { pos: a.camera.position.toArray().map((v) => +v.toFixed(3)), rot: a.camera.rotation.toArray().slice(0, 3).map((v) => +v.toFixed(5)), fov: a.camera.fov, aspect: a.camera.aspect, near: a.camera.near, far: a.camera.far, zoom: a.camera.zoom };
        out.scroll = { position: a.scroll.position, animated: a.scroll.positionAnimated };
        out.mouse = { x: a.mouse.xAnimated.get(), y: a.mouse.yAnimated.get() };
        out.size = { w: a.size.width, h: a.size.height };
        out.renderer = { pr: a.renderer.renderer.getPixelRatio(), tm: a.renderer.renderer.toneMapping, exp: a.renderer.renderer.toneMappingExposure, cs: a.renderer.renderer.outputColorSpace, clear: a.renderer.renderer.getClearAlpha() };
        out.env = { intensity: a.scene.environmentIntensity, bg: !!a.scene.background };
        out.lights = []; a.scene.traverse((o) => { if (o.isLight) out.lights.push([o.type, o.name, o.intensity, o.distance, o.decay, o.position.toArray().map((v) => +v.toFixed(2)), o.color.getHexString()]); });
        out.clouds = []; a.scene.traverse((o) => { if (o.name === 'clouds') out.clouds.push([o.visible, o.material.uniforms.opacity.value, o.material.uniforms.steps.value, o.material.uniforms.base.value.getHexString()]); });
      }
    }
  } else if (el.webgl) {
    const w = el.webgl;
    out.cam = { pos: w.camera.position.toArray().map((v) => +v.toFixed(3)), rot: w.camera.rotation.toArray().slice(0, 3).map((v) => +v.toFixed(5)), fov: w.camera.fov, aspect: w.camera.aspect };
    out.scroll = w.progress; out.mouse = w.pointer;
    out.renderer = { pr: w.renderer.getPixelRatio(), tm: w.renderer.toneMapping, cs: w.renderer.outputColorSpace, clear: w.renderer.getClearAlpha() };
    out.lights = []; w.scene.traverse((o) => { if (o.isLight) out.lights.push([o.type, o.name, o.intensity, o.distance, o.decay, o.position.toArray().map((v) => +v.toFixed(2))]); });
    out.clouds = []; w.scene.traverse((o) => { if (o.name === 'clouds') out.clouds.push([o.visible, o.material.uniforms.opacity.value, o.material.uniforms.steps.value]); });
  }
  return out;
}), null, 0));
await b.close();
