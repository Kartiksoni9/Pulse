/* ══════════════════════════════════════════════
   PULSE CHAT — bg3d.js
   Layers: aurora waves · ripple rings
           grid lines · floating shapes · particles
══════════════════════════════════════════════ */

(function () {
    'use strict';

    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* ── Resize ── */
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    /* ── Helpers ── */
    function rand(min, max) { return min + Math.random() * (max - min); }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    const PALETTE = [
        '#5c4ef0', '#8b6ff7', '#b48eff',
        '#4f46e5', '#7c3aed', '#00d4aa', '#fd79a8'
    ];

    /* ════════════════════════════════
       AURORA WAVES
       — multiple layered sine bands
         that drift horizontally and
         breathe in brightness
    ════════════════════════════════ */
    class AuroraWave {
        constructor(opts) {
            this.yBase    = opts.yBase;          // 0-1 vertical anchor
            this.amp      = opts.amp;            // wave amplitude (px)
            this.freq     = opts.freq;           // horizontal frequency
            this.speed    = opts.speed;          // phase drift speed
            this.color1   = opts.color1;         // left gradient color
            this.color2   = opts.color2;         // right gradient color
            this.thick    = opts.thick;          // band thickness (px)
            this.alpha    = opts.alpha;          // max alpha
            this.phase    = rand(0, Math.PI * 2);
            this.breathT  = rand(0, Math.PI * 2);
            this.breathSpd= rand(0.003, 0.007);
            this.driftSpd = rand(0.0002, 0.0006) * (Math.random() > 0.5 ? 1 : -1);
            this.yOffset  = 0;
            this.yOSpd    = rand(0.0004, 0.001) * (Math.random() > 0.5 ? 1 : -1);
            this.yRange   = rand(20, 60);
            this.yT       = rand(0, Math.PI * 2);
        }

        update() {
            this.phase   += this.speed;
            this.breathT += this.breathSpd;
            this.yT      += this.yOSpd;
            this.yOffset  = Math.sin(this.yT) * this.yRange;
        }

        draw() {
            const w      = W();
            const h      = H();
            const steps  = Math.ceil(w / 3);           // sample every 3px — smooth enough
            const baseY  = this.yBase * h + this.yOffset;
            const breath = 0.55 + 0.45 * Math.sin(this.breathT);
            const alpha  = this.alpha * breath;

            /* horizontal gradient for colour shift left→right */
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0,    hexToRgba(this.color1, 0));
            grad.addColorStop(0.25, hexToRgba(this.color1, 1));
            grad.addColorStop(0.5,  hexToRgba(this.color2, 1));
            grad.addColorStop(0.75, hexToRgba(this.color1, 1));
            grad.addColorStop(1,    hexToRgba(this.color2, 0));

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = grad;
            ctx.lineWidth   = this.thick;
            ctx.lineCap     = 'round';
            ctx.shadowBlur  = this.thick * 3.5;
            ctx.shadowColor = this.color1;

            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const x = (i / steps) * w;
                const y = baseY
                    + Math.sin(i / steps * Math.PI * 2 * this.freq + this.phase) * this.amp
                    + Math.sin(i / steps * Math.PI * 3 * this.freq + this.phase * 1.3) * (this.amp * 0.35);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            /* soft glow pass — wider, more transparent */
            ctx.globalAlpha = alpha * 0.25;
            ctx.lineWidth   = this.thick * 6;
            ctx.shadowBlur  = 0;
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const x = (i / steps) * w;
                const y = baseY
                    + Math.sin(i / steps * Math.PI * 2 * this.freq + this.phase) * this.amp
                    + Math.sin(i / steps * Math.PI * 3 * this.freq + this.phase * 1.3) * (this.amp * 0.35);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.shadowBlur = 0;
        }
    }

    /* ════════════════════════════════
       RIPPLE RINGS
       — spawned on click/touch,
         expand outward and fade
    ════════════════════════════════ */
    const ripples = [];

    class Ripple {
        constructor(x, y) {
            this.x      = x;
            this.y      = y;
            this.r      = 0;
            this.maxR   = rand(120, 260);
            this.speed  = rand(2.5, 4.5);
            this.alpha  = 0.7;
            this.color  = PALETTE[Math.floor(Math.random() * 5)]; // purples/violet
            this.rings  = Math.floor(rand(2, 4)); // concentric rings
            this.dead   = false;
        }

        update() {
            this.r     += this.speed;
            this.alpha  = 0.7 * (1 - this.r / this.maxR);
            if (this.r >= this.maxR) this.dead = true;
        }

        draw() {
            for (let k = 0; k < this.rings; k++) {
                const ringR = this.r - k * 18;
                if (ringR <= 0) continue;
                const a = this.alpha * (1 - k * 0.28);
                ctx.globalAlpha = a;
                ctx.strokeStyle = this.color;
                ctx.lineWidth   = 1.5 - k * 0.4;
                ctx.shadowBlur  = 12;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, ringR, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            /* inner fill flash — only at birth */
            if (this.r < 30) {
                const flash = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 30);
                flash.addColorStop(0, this.color + '33');
                flash.addColorStop(1, this.color + '00');
                ctx.globalAlpha = (1 - this.r / 30) * 0.5;
                ctx.fillStyle   = flash;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function spawnRipple(x, y) {
        if (ripples.length < 12) ripples.push(new Ripple(x, y));
    }

    window.addEventListener('click',     e => spawnRipple(e.clientX, e.clientY));
    window.addEventListener('touchstart', e => {
        if (e.touches.length > 0) spawnRipple(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });


    /* ════════════════════
       GRID LINES
    ════════════════════ */
    class GridLine {
        constructor(isH) {
            this.isH   = isH;
            this.pos   = isH ? rand(0, H()) : rand(0, W());
            this.speed = rand(0.15, 0.45) * (isH ? 1 : 0.6);
            this.alpha = rand(0.012, 0.032);
        }

        update() {
            this.pos += this.speed;
            if (this.isH && this.pos > H()) this.pos = 0;
            if (!this.isH && this.pos > W()) this.pos = 0;
        }

        draw() {
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = '#5c4ef0';
            ctx.lineWidth   = 0.5;
            ctx.beginPath();
            if (this.isH) {
                ctx.moveTo(0,   this.pos);
                ctx.lineTo(W(), this.pos);
            } else {
                ctx.moveTo(this.pos, 0);
                ctx.lineTo(this.pos, H());
            }
            ctx.stroke();
        }
    }


    /* ════════════════════
       FLOATING SHAPES
    ════════════════════ */
    class FloatingShape {
        constructor() { this.reset(true); }

        reset(init) {
            this.x        = rand(0, W());
            this.y        = init ? rand(0, H()) : H() + rand(20, 80);
            this.z        = rand(0.12, 0.45);
            this.size     = rand(18, 72) * this.z;
            this.speedY   = rand(0.08, 0.32) * this.z;
            this.speedX   = rand(-0.08, 0.08);
            this.rot      = rand(0, Math.PI * 2);
            this.rotSpeed = rand(-0.003, 0.003);
            this.type     = Math.floor(Math.random() * 3);
            this.color    = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha    = rand(0.035, 0.10) * this.z;
        }

        update() {
            this.x   += this.speedX;
            this.y   += this.speedY;
            this.rot += this.rotSpeed;
            if (this.y < -(this.size * 2)) this.reset(false);
            if (this.speedY < 0 && this.y > H() + this.size * 2) this.reset(false);
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth   = 0.8;

            const s = this.size;
            ctx.beginPath();

            if (this.type === 0) {
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    i === 0
                        ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s)
                        : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
                }
                ctx.closePath();
            } else if (this.type === 1) {
                ctx.rect(-s / 2, -s / 2, s, s);
            } else {
                ctx.moveTo(0, -s);
                ctx.lineTo(s * 0.866,  s * 0.5);
                ctx.lineTo(-s * 0.866, s * 0.5);
                ctx.closePath();
            }

            ctx.stroke();
            ctx.restore();
        }
    }


    /* ════════════════════
       PARTICLE FIELD
    ════════════════════ */
    class Particle {
        constructor() { this.reset(true); }

        reset(init) {
            this.x           = rand(0, W());
            this.y           = init ? rand(0, H()) : H() + rand(5, 20);
            this.z           = rand(0.2, 1.0);
            this.r           = rand(0.8, 2.8) * this.z;
            this.speedY      = rand(-0.25, -0.8) * this.z;
            this.speedX      = rand(-0.12, 0.12);
            this.color       = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha       = rand(0.25, 0.75) * this.z;
            this.twinkle     = rand(0, Math.PI * 2);
            this.twinkleSpeed = rand(0.01, 0.04);
        }

        update() {
            this.x       += this.speedX;
            this.y       += this.speedY;
            this.twinkle += this.twinkleSpeed;
            if (this.y < -6) this.reset(false);
        }

        draw() {
            const a = this.alpha * (0.55 + 0.45 * Math.sin(this.twinkle));
            ctx.globalAlpha = a;
            ctx.fillStyle   = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }


    /* ── Instantiate ── */
    const auroras = [
        new AuroraWave({ yBase: 0.18, amp: 55,  freq: 1.4, speed: 0.006, color1: '#5c4ef0', color2: '#00d4aa', thick: 3.0, alpha: 0.75 }),
        new AuroraWave({ yBase: 0.32, amp: 40,  freq: 1.8, speed: 0.005, color1: '#8b6ff7', color2: '#fd79a8', thick: 2.2, alpha: 0.60 }),
        new AuroraWave({ yBase: 0.50, amp: 70,  freq: 1.1, speed: 0.004, color1: '#7c3aed', color2: '#5c4ef0', thick: 4.0, alpha: 0.80 }),
        new AuroraWave({ yBase: 0.65, amp: 35,  freq: 2.2, speed: 0.007, color1: '#00d4aa', color2: '#b48eff', thick: 2.0, alpha: 0.55 }),
        new AuroraWave({ yBase: 0.80, amp: 50,  freq: 1.6, speed: 0.005, color1: '#fd79a8', color2: '#8b6ff7', thick: 2.5, alpha: 0.62 }),
        new AuroraWave({ yBase: 0.10, amp: 28,  freq: 2.5, speed: 0.008, color1: '#b48eff', color2: '#5c4ef0', thick: 1.8, alpha: 0.50 }),
    ];

    const hLines   = Array.from({ length: 6  }, () => new GridLine(true));
    const vLines   = Array.from({ length: 9  }, () => new GridLine(false));
    const shapes   = Array.from({ length: 16 }, () => new FloatingShape());
    const particles = Array.from({ length: 100 }, () => new Particle());


    /* ── Render loop ── */
    function frame() {
        ctx.clearRect(0, 0, W(), H());

        /* 1. Aurora waves — deepest layer */
        auroras.forEach(a => { a.update(); a.draw(); });

        /* 2. Grid lines */
        hLines.forEach(l  => { l.update(); l.draw(); });
        vLines.forEach(l  => { l.update(); l.draw(); });

        /* 3. Floating shapes */
        shapes.forEach(s  => { s.update(); s.draw(); });

        /* 4. Ripple rings */
        for (let i = ripples.length - 1; i >= 0; i--) {
            ripples[i].update();
            ripples[i].draw();
            if (ripples[i].dead) ripples.splice(i, 1);
        }

        /* 5. Particles — top layer */
        particles.forEach(p => { p.update(); p.draw(); });

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }

    frame();
})();
