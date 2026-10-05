// Stand at the edge of a real generated lake at midday, just above the water line.
// This is the viewpoint where separated water plates showed up in the screenshot.
window.__see = async function () {
    const all = performance.getEntriesByType('resource').map(r => r.name);
    const hot = re => all.find(n => re.test(n) && /\?t=\d+/.test(n)) || all.find(n => re.test(n));
    const W = await import(hot(/worldGen/));
    const B = await import(hot(/blocks/));
    const PH = await import(hot(/physics/));
    const RE = await import(hot(/renderEngine/));
    const DN = await import(hot(/dayNight/));

    DN.setWorldTime(0.45);

    const cam = RE.camera;
    const px = Math.floor(cam.position.x), pz = Math.floor(cam.position.z);
    const cx = px >> 4, cz = pz >> 4;
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) W.generateChunkData(cx + a, cz + b);

    // densest water sample in a wide scan
    let best = null;
    for (let dx = -50; dx <= 50; dx += 3) for (let dz = -50; dz <= 50; dz += 3) {
        let n = 0;
        for (let a = -6; a <= 6; a += 3) for (let b = -6; b <= 6; b += 3) {
            if (W.getBlock(px + dx + a, 18, pz + dz + b) === B.BLOCKS.WATER) n++;
        }
        if (!best || n > best.n) best = { x: px + dx, z: pz + dz, n };
    }

    if (!best || best.n < 4) return JSON.stringify({ error: 'no lake near player', best });

    RE.updateWorldChunks(PH.player.pos || cam.position, 6, true);

    PH.player.pos.set(best.x + 0.5, 19.4, best.z + 7.5);
    PH.player.visualY = PH.player.pos.y;
    PH.yaw = Math.PI;
    PH.pitch = -0.05;

    return JSON.stringify({ lakeCentre: [best.x, best.z], waterSamples: best.n, eye: 19.4 });
};