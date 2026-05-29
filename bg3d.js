/* ══════════════════════════════════════════════
   PULSE CHAT — bg3d.js
   3D animated canvas background
   Layers: nebulae · grid lines · connection web
           floating shapes · particle field
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

    /* ── Mouse tracking ── */
    const mouse = { x: W() / 2, y: H() / 2 };
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('touchmove', e => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    /* ── Helpers ── */
    function rand(min, max) { return min + Math.random() * (max - min); }

    const PALETTE = [
        '#5c4ef0', '#8b6ff7', '#b48eff',
        '#4f46e5', '#7c3aed', '#00d4aa', '#fd79a8'
    ];

    /* ════════════════════
       NEBULA BLOBS
    ════════════════════ */
    class Nebula {
        constructor(bx, by, r, color) {
            this.bx    = bx;
            this.by    = by;
            this.r     = r;
            this.color = color;
            this.t     = rand(0, Math.PI * 2);
            this.speed = rand(0.0015, 0.004);
            this.ox    = rand(-40, 40);
            this.oy    = rand(-30, 30);
        }

        update() {
            this.t += this.speed;
            this.x = this.bx * W() + Math.sin(this.t)       * this.ox;
            this.y = this.by * H() + Math.cos(this.t * 0.7) * this.oy;
        }

        draw() {
            const grad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.r
            );
            grad.addColorStop(0, this.color + '1a');
            grad.addColorStop(1, this.color + '00');
            ctx.globalAlpha = 1;
            ctx.fillStyle   = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ════════════════════
       GRID LINES
    ════════════════════ */
    class GridLine {
        constructor(isH) {
            this.isH  = isH;
            this.pos  = isH ? rand(0, H()) : rand(0, W());
            this.speed = rand(0.15, 0.45) * (isH ? 1 : 0.6);
            this.alpha = rand(0.012, 0.035);
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
                ctx.moveTo(0,    this.pos);
                ctx.lineTo(W(),  this.pos);
            } else {
                ctx.moveTo(this.pos, 0);
                ctx.lineTo(this.pos, H());
            }
            ctx.stroke();
        }
    }

    /* ════════════════════
       CONNECTION WEB
    ════════════════════ */
    class ConnectionWeb {
        constructor() {
            this.nodes = Array.from({ length: 18 }, () => ({
                x:  rand(0.04, 0.96),
                y:  rand(0.04, 0.96),
                vx: rand(-0.00025, 0.00025),
                vy: rand(-0.00025, 0.00025),
            }));
        }

        update() {
            this.nodes.forEach(n => {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0.02 || n.x > 0.98) n.vx *= -1;
                if (n.y < 0.02 || n.y > 0.98) n.vy *= -1;
            });
        }

        draw() {
            const mx = mouse.x / W();
            const my = mouse.y / H();

            /* node-to-node lines */
            this.nodes.forEach((a, i) => {
                this.nodes.forEach((b, j) => {
                    if (j <= i) return;
                    const dx   = a.x - b.x;
                    const dy   = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 0.24) {
                        ctx.globalAlpha = (0.24 - dist) / 0.24 * 0.06;
                        ctx.strokeStyle = '#8b6ff7';
                        ctx.lineWidth   = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(a.x * W(), a.y * H());
                        ctx.lineTo(b.x * W(), b.y * H());
                        ctx.stroke();
                    }
                });

                /* mouse attraction lines */
                const dx   = a.x - mx;
                const dy   = a.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.20) {
                    ctx.globalAlpha = (0.20 - dist) / 0.20 * 0.28;
                    ctx.strokeStyle = '#b48eff';
                    ctx.lineWidth   = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(a.x * W(), a.y * H());
                    ctx.lineTo(mouse.x,   mouse.y);
                    ctx.stroke();
                }

                /* node dots */
                ctx.globalAlpha = 0.35;
                ctx.fillStyle   = '#9d8fff';
                ctx.beginPath();
                ctx.arc(a.x * W(), a.y * H(), 1.3, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    /* ════════════════════
       FLOATING SHAPES
    ════════════════════ */
    class FloatingShape {
        constructor() { this.reset(true); }

        reset(init) {
            this.x     = rand(0, W());
            this.y     = init ? rand(0, H()) : H() + rand(20, 80);
            this.z     = rand(0.12, 0.45);
            this.size  = rand(18, 72) * this.z;
            this.speedY = rand(0.08, 0.32) * this.z;
            this.speedX = rand(-0.08, 0.08);
            this.rot    = rand(0, Math.PI * 2);
            this.rotSpeed = rand(-0.003, 0.003);
            this.type  = Math.floor(Math.random() * 3); // 0=hex 1=square 2=tri
            this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha = rand(0.035, 0.10) * this.z;
        }

        update() {
            this.x   += this.speedX;
            this.y   += this.speedY;
            this.rot += this.rotSpeed;
            if (this.y < -(this.size * 2)) this.reset(false);
            /* reset at bottom if init placed there */
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
                /* hexagon */
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    i === 0
                        ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s)
                        : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
                }
                ctx.closePath();
            } else if (this.type === 1) {
                /* square */
                ctx.rect(-s / 2, -s / 2, s, s);
            } else {
                /* triangle */
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
            this.x      = rand(0, W());
            this.y      = init ? rand(0, H()) : H() + rand(5, 20);
            this.z      = rand(0.2, 1.0);
            this.r      = rand(0.8, 2.8) * this.z;
            this.speedY = rand(-0.25, -0.8) * this.z;
            this.speedX = rand(-0.12, 0.12);
            this.color  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha  = rand(0.25, 0.75) * this.z;
            this.twinkle      = rand(0, Math.PI * 2);
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

    /* ── Instantiate all layers ── */
    const nebulae = [
        new Nebula(0.12, 0.18, 220, '#5c4ef0'),
        new Nebula(0.85, 0.78, 190, '#7c3aed'),
        new Nebula(0.50, 0.52, 150, '#00d4aa'),
        new Nebula(0.76, 0.12, 170, '#fd79a8'),
    ];

    const hLines   = Array.from({ length: 6  }, () => new GridLine(true));
    const vLines   = Array.from({ length: 9  }, () => new GridLine(false));
    const web      = new ConnectionWeb();
    const shapes   = Array.from({ length: 16 }, () => new FloatingShape());
    const particles = Array.from({ length: 100 }, () => new Particle());

    /* ── Render loop ── */
    function frame() {
        ctx.clearRect(0, 0, W(), H());

        nebulae.forEach(n  => { n.update(); n.draw(); });
        hLines.forEach(l   => { l.update(); l.draw(); });
        vLines.forEach(l   => { l.update(); l.draw(); });
        web.update(); web.draw();
        shapes.forEach(s   => { s.update(); s.draw(); });
        particles.forEach(p => { p.update(); p.draw(); });

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }

    frame();
})();
