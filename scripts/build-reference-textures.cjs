// Extend valid surface colour beyond image masks for stable 3D texture filtering.
// Original reference images remain untouched.
const fs = require('node:fs');
const sharp = require('sharp');

(async () => {
  fs.mkdirSync('public/assets/reconstruction', { recursive: true });
  for (const gender of ['female', 'male']) {
    for (const view of ['front', 'back', 'left', 'right']) {
      const { data, info } = await sharp(`public/assets/mannequin-${gender}-${view}.png`)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const { width, height } = info;

      // Normalise back reference photo exposure:
      // Back is measured at #b99e7d (RGB 185,158,125), ~12 levels brighter than front (#ad9274, RGB 173,146,116).
      // Gain factor 0.935 balances back luminance to match front and side views seamlessly.
      const gain = view === 'back' ? 0.935 : 1.0;
      if (gain !== 1.0) {
        for (let i = 0; i < width * height; i++) {
          const k = i * 4;
          data[k] = Math.min(255, Math.round(data[k] * gain));
          data[k + 1] = Math.min(255, Math.round(data[k + 1] * gain));
          data[k + 2] = Math.min(255, Math.round(data[k + 2] * gain));
        }
      }

      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0, tail = 0;

      // Erode mask edges by 3-4 px so dark cutout silhouettes and edge falloff
      // are not baked into the flood-filled surface textures.
      const EROSION_RADIUS = 4;
      const EROSION_R2 = EROSION_RADIUS * EROSION_RADIUS;

      for (let i = 0; i < visited.length; i++) {
        const k = i * 4;
        const x = i % width, y = Math.floor(i / width);
        let interior =
          x >= EROSION_RADIUS &&
          x < width - EROSION_RADIUS &&
          y >= EROSION_RADIUS &&
          y < height - EROSION_RADIUS;

        if (interior) {
          for (let dy = -EROSION_RADIUS; dy <= EROSION_RADIUS && interior; dy++) {
            for (let dx = -EROSION_RADIUS; dx <= EROSION_RADIUS; dx++) {
              if (dx * dx + dy * dy <= EROSION_R2) {
                const neighbour = ((y + dy) * width + x + dx) * 4;
                if (data[neighbour + 3] < 250) {
                  interior = false;
                  break;
                }
              }
            }
          }
        }

        const max = Math.max(data[k], data[k + 1], data[k + 2]);
        const min = Math.min(data[k], data[k + 1], data[k + 2]);
        if (
          interior &&
          data[k + 3] >= 253 &&
          data[k] - data[k + 2] > 20 &&
          data[k + 1] - data[k + 2] > 8 &&
          !(min > 215 && max - min < 30)
        ) {
          visited[i] = 1;
          queue[tail++] = i;
        }
      }

      if (!tail) throw new Error(`No valid surface observations for ${gender}/${view}`);

      // BFS dilation: extend clean interior surface color across entire background
      while (head < tail) {
        const i = queue[head++], x = i % width, y = Math.floor(i / width);
        const neighbours = [
          x > 0 ? i - 1 : -1,
          x + 1 < width ? i + 1 : -1,
          y > 0 ? i - width : -1,
          y + 1 < height ? i + width : -1,
        ];
        for (const next of neighbours) {
          if (next < 0 || visited[next]) continue;
          visited[next] = 1;
          queue[tail++] = next;
          for (let c = 0; c < 3; c++) data[next * 4 + c] = data[i * 4 + c];
        }
        data[i * 4 + 3] = 255;
      }

      await sharp(data, { raw: { width, height, channels: 4 } })
        .png()
        .toFile(`public/assets/reconstruction/${gender}-${view}-surface.png`);
    }
  }
})();
