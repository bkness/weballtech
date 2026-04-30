const { SHARE_TECH_MONO_B64, fontFace } = require('../../lib/fonts');

const FONTS = {
    monospace: "'Courier New', Courier, monospace",
    sans:      "'Segoe UI', Ubuntu, sans-serif",
    serif:     "Georgia, 'Times New Roman', serif",
    code:      "'Share Tech Mono', monospace",
};

const VALID = ['typing','glitch','neon','wave','reveal','blink','blur','bounce','fade','flip','float','matrix','pop','pulse','rainbow','shake','skew','slide','stroke','swing','zoom'];

function clamp01(v) { return Math.min(1, Math.max(0, v)); }

function getLineY({ multiline, vCenter, intHeight, intSize, linesCount, index }) {
    if (multiline) {
        const spacing = intSize + 8;
        const total = linesCount * spacing;
        const base = vCenter ? Math.round((intHeight - total) / 2) + intSize : intSize + 4;
        return base + index * spacing;
    }
    return vCenter ? Math.round(intHeight / 2 + intSize * 0.35) : intSize + 4;
}

function seqOpacity({ index, slotS, lineDurS, cycleDurS, repeat }) {
    const c = (v) => clamp01(v).toFixed(4);
    const start = (index * slotS) / cycleDurS;
    const fd    = Math.min(0.02, (lineDurS / cycleDurS) * 0.05);
    const end   = (index * slotS + lineDurS) / cycleDurS;
    return `<animate attributeName="opacity" values="0;0;1;1;0;0"
        keyTimes="0;${c(start)};${c(start+fd)};${c(end-fd)};${c(end)};1"
        dur="${cycleDurS}s" repeatCount="${repeat ? 'indefinite' : '1'}" fill="freeze"/>`;
}

const animations = {
    typing(ctx) {
        const { lines, intSize, intWidth, intHeight, textX, textAnchor, commonStyle,
                textColor, center, repeat, cycleDurS, lineDurS, slotS, lineY, seqOp } = ctx;
        let defs = '', body = '';
        lines.forEach((line, i) => {
            const cw = intSize * 0.6;
            const totalW = Math.ceil(line.length * cw) + 24;
            const tx = center ? (intWidth - totalW) / 2 : 20;
            const s = i * slotS;
            const typS = lineDurS * 0.55, holdS = lineDurS * 0.3;
            const eraseS = Math.max(0.08, lineDurS - typS - holdS);
            const [t0,t1,t2,t3] = [s, s+typS, s+typS+holdS, s+typS+holdS+eraseS].map(v => clamp01(v/cycleDurS));
            const id = `clip_t_${i}`;
            defs += `<clipPath id="${id}"><rect x="${tx}" y="0" width="0" height="${intHeight}">
                <animate attributeName="width" values="0;0;${totalW};${totalW};0;0"
                    keyTimes="0;${t0};${t1};${t2};${t3};1"
                    dur="${cycleDurS}s" repeatCount="${repeat ? 'indefinite' : '1'}" fill="freeze"/>
            </rect></clipPath>`;
            body += `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" clip-path="url(#${id})" opacity="0">
                ${seqOp(i)}${line}</text>
            <rect x="${tx}" y="${lineY(i)-intSize+4}" width="2" height="${intSize}" fill="${textColor}" opacity="0">
                <animate attributeName="x" values="${tx};${tx};${tx+totalW};${tx+totalW};${tx+totalW};${tx+totalW}"
                    keyTimes="0;${t0};${t1};${t2};${t3};1"
                    dur="${cycleDurS}s" repeatCount="${repeat ? 'indefinite' : '1'}" fill="freeze"/>
                <animate attributeName="opacity" values="0;0;1;1;0;0"
                    keyTimes="0;${t0};${t1};${t2};${t3};1"
                    dur="${cycleDurS}s" repeatCount="${repeat ? 'indefinite' : '1'}" fill="freeze"/>
            </rect>`;
        });
        return `<defs>${defs}</defs>${body}`;
    },

    glitch(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<g opacity="0">${seqOp(i)}
            <text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" fill="red" opacity="0.4">
                <animateTransform attributeName="transform" type="translate" values="2,0;-2,0;2,1;-2,-1;0,0"
                    dur="${Math.max(0.25,lineDurS*0.25)}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}"/>
                ${line}</text>
            <text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" fill="cyan" opacity="0.4">
                <animateTransform attributeName="transform" type="translate" values="-2,0;2,0;-2,-1;2,1;0,0"
                    dur="${Math.max(0.25,lineDurS*0.25)}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}"/>
                ${line}</text>
            <text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0.9">
                <animateTransform attributeName="transform" type="translate" values="0,0;1,0;-1,0;0,1;0,0"
                    dur="${Math.max(0.35,lineDurS*0.35)}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}"/>
                ${line}</text>
        </g>`).join('');
    },

    neon(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        const fid = `neon_${Math.random().toString(36).slice(2,7)}`;
        const items = lines.map((line, i) => `<g opacity="0">${seqOp(i)}
            <text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" filter="url(#${fid})" opacity="0.9">
                <animate attributeName="opacity" values="0.5;1;0.5;0.8;1;0.5"
                    dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}"/>
                ${line}</text>
        </g>`).join('');
        return `<defs><filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter></defs>${items}`;
    },

    reveal(ctx) {
        const { lines, commonStyle, textColor, repeat, intWidth, intSize, center, lineY, pauseS, speedS } = ctx;
        const cw       = intSize * 0.62;
        const delay    = speedS;
        const totalCh  = lines.reduce((s, l) => s + l.length, 0);
        const revealT  = totalCh * delay;
        const fadeT    = 0.4;
        const cycleT   = revealT + pauseS + fadeT;
        const fid      = `rg_${Math.random().toString(36).slice(2,7)}`;
        const c        = v => Math.min(1, Math.max(0, v)).toFixed(4);
        const holdFrac = c((revealT + pauseS) / cycleT);

        let ci = 0;
        const charEls = lines.map((line, row) => {
            const sx = center ? (intWidth - line.length * cw) / 2 : 20;
            return line.split('').map((ch, i) => {
                const t   = ci++ * delay;
                const t0  = c(Math.max(0.0001, t / cycleT));
                const t1  = c(Math.min((t + delay * 0.1) / cycleT, (revealT + pauseS * 0.5) / cycleT));
                const anim = repeat
                    ? `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${t0};${t1};${holdFrac};1" dur="${cycleT}s" repeatCount="indefinite"/>`
                    : `<animate attributeName="opacity" values="0;1" dur="0.12s" begin="${t.toFixed(3)}s" fill="freeze"/>`;
                return `<text x="${(sx + i * cw).toFixed(1)}" y="${lineY(row)}" style="${commonStyle}" filter="url(#${fid})" opacity="0">${anim}${ch}</text>`;
            }).join('');
        }).join('');

        // Blinking cursor after last line
        const lastLine  = lines[lines.length - 1];
        const cursorX   = (center ? (intWidth - lastLine.length * cw) / 2 : 20) + lastLine.length * cw + 3;
        const cursorH   = Math.round(intSize * 0.82);
        const cursorTop = lineY(lines.length - 1) - intSize + Math.round(intSize * 0.15);

        let cursorAnim;
        if (repeat) {
            const blinks = Math.max(2, Math.floor(pauseS / 0.6));
            const bp = pauseS / blinks;
            const vals  = ['0', '0'];
            const times = ['0', c((revealT + 0.01) / cycleT)];
            for (let b = 0; b < blinks; b++) {
                const on  = revealT + b * bp + 0.01;
                const off = on + bp * 0.5;
                vals.push('1', '0');
                times.push(c(on / cycleT), c(off / cycleT));
            }
            vals.push('0'); times.push('1');
            cursorAnim = `<animate attributeName="opacity" values="${vals.join(';')}" keyTimes="${times.join(';')}" dur="${cycleT}s" repeatCount="indefinite"/>`;
        } else {
            cursorAnim = `<animate attributeName="opacity" values="1;1;0;1;1;0" keyTimes="0;0.45;0.5;0.55;0.95;1" dur="1.2s" begin="${revealT.toFixed(3)}s" repeatCount="indefinite"/>`;
        }

        return `<defs><filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter></defs>${charEls}<rect x="${cursorX.toFixed(1)}" y="${cursorTop}" width="2" height="${cursorH}" fill="${textColor}" filter="url(#${fid})" opacity="0">${cursorAnim}</rect>`;
    },

    blink(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animate attributeName="opacity" values="1;0;1" keyTimes="0;0.5;1" calcMode="discrete" dur="${lineDurS}s" begin="${(i * ctx.slotS).toFixed(3)}s" repeatCount="${repeat ? 'indefinite' : '1'}" />
            ${line}
        </text>`).join('');
    },

    blur(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        const fb = `blur_${Math.random().toString(36).slice(2,7)}`;
        const defs = lines.map((_, i) => `<filter id="${fb}_${i}">
            <feGaussianBlur stdDeviation="8;0;0;8">
                <animate attributeName="stdDeviation" values="10;0;0;10" keyTimes="0;0.25;0.75;1" dur="${lineDurS}s" begin="${(i * ctx.slotS).toFixed(3)}s" repeatCount="${repeat ? 'indefinite' : '1'}" />
            </feGaussianBlur>
        </filter>`).join('');
        const items = lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" filter="url(#${fb}_${i})" opacity="0">
            ${seqOp(i)}${line}
        </text>`).join('');
        return `<defs>${defs}</defs>${items}`;
    },

    bounce(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, intSize, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-${Math.round(intSize*0.45)};0,0;0,-${Math.round(intSize*0.18)};0,0" keyTimes="0;0.25;0.5;0.75;1" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    fade(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    flip(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, intWidth, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="rotate" values="90 ${intWidth/2} ${lineY(i)};0 ${intWidth/2} ${lineY(i)};0 ${intWidth/2} ${lineY(i)};-90 ${intWidth/2} ${lineY(i)}" keyTimes="0;0.1;0.8;1" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" fill="freeze" />
            ${line}
        </text>`).join('');
    },

    float(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, intSize, lineY, seqOp } = ctx;
        const offset = (intSize * 0.4).toFixed(2);
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="translate" values="0,${offset};0,-${offset};0,${offset}" dur="${Math.max(0.5,lineDurS*0.9)}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    matrix(ctx) {
        const { lines, intSize, intWidth, intHeight, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        const source = lines.join(' ');
        const pool = source.split('').concat(['0','1','#','@','!','$','%','^','&','*']);
        const cols = Math.floor(intWidth / (intSize * 0.6));
        return lines.map((_, i) => {
            let drops = `<g opacity="0">${seqOp(i)}`;
            for (let c = 0; c < Math.min(cols, 30); c++) {
                const x = c * (intSize * 0.6) + (intSize * 0.3);
                const ch = pool[(c + i) % pool.length];
                const delay = (i * ctx.slotS + (c / Math.max(cols,1)) * lineDurS * 0.35).toFixed(3);
                drops += `<text x="${x}" y="0" style="${commonStyle}" font-size="${Math.max(10,intSize-4)}px" opacity="0.8">
                    <animateTransform attributeName="transform" type="translate" values="0,-${intSize};0,${intHeight+intSize}" dur="${Math.max(0.4,lineDurS*0.6).toFixed(2)}s" begin="${delay}s" repeatCount="${repeat?'indefinite':'1'}" />
                    <animate attributeName="opacity" values="0;0.9;0.4;0.9;0" dur="${Math.max(0.35,lineDurS*0.5).toFixed(2)}s" begin="${delay}s" repeatCount="${repeat?'indefinite':'1'}" />
                    ${ch}
                </text>`;
            }
            return `${drops}</g>`;
        }).join('');
    },

    pop(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="scale" values="0.6;1.12;1" dur="${Math.max(0.2,lineDurS*0.5)}s" begin="${(i*ctx.slotS).toFixed(3)}s" additive="replace" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    pulse(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, intWidth, center, lineY, seqOp } = ctx;
        const cx = center ? intWidth / 2 : 20;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0" transform-origin="${cx} ${lineY(i)}">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="scale" values="1;1.08;1;0.96;1" keyTimes="0;0.3;0.5;0.75;1" additive="sum" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    rainbow(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, textColor, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animate attributeName="fill" values="${textColor};#ff0040;#ff8c00;#ffef00;#00dd44;#0088ff;#7700ff;${textColor}" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    shake(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="translate" values="0,0;-2,1;2,-1;-3,2;3,-2;-2,1;2,-1;0,0" dur="${Math.max(0.35,lineDurS*0.22)}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    skew(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="skewX" values="0;14;-10;0" dur="${Math.max(0.35,lineDurS*0.65)}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    slide(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, intSize, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="translate" values="0,${Math.round(intSize*0.7)};0,0;0,0;0,-${Math.round(intSize*0.5)}" keyTimes="0;0.2;0.8;1" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    stroke(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, intSize, textColor, lineY, seqOp } = ctx;
        return lines.map((line, i) => {
            const dashLen = Math.max(600, line.length * intSize * 0.7);
            return `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" fill="none" stroke="${textColor}" stroke-width="1.5" stroke-dasharray="${dashLen}" stroke-dashoffset="${dashLen}" opacity="0">
                ${seqOp(i)}
                <animate attributeName="stroke-dashoffset" values="${dashLen};0" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" fill="freeze" repeatCount="${repeat?'indefinite':'1'}" />
                <animate attributeName="fill" values="transparent;${textColor}" keyTimes="0;1" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" fill="freeze" repeatCount="${repeat?'indefinite':'1'}" />
                ${line}
            </text>`;
        }).join('');
    },

    swing(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, lineY, seqOp } = ctx;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="rotate" values="-4 ${textX} ${lineY(i)};4 ${textX} ${lineY(i)};-3 ${textX} ${lineY(i)};0 ${textX} ${lineY(i)}" dur="${Math.max(0.4,lineDurS*0.7).toFixed(3)}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    zoom(ctx) {
        const { lines, textX, textAnchor, commonStyle, repeat, lineDurS, intWidth, lineY, seqOp } = ctx;
        const cx = intWidth / 2;
        return lines.map((line, i) => `<text x="${textX}" y="${lineY(i)}" text-anchor="${textAnchor}" style="${commonStyle}" transform-origin="${cx} ${lineY(i)}" opacity="0">
            ${seqOp(i)}
            <animateTransform attributeName="transform" type="scale" values="0.1;1;1;2" keyTimes="0;0.2;0.7;1" additive="sum" dur="${lineDurS}s" begin="${(i*ctx.slotS).toFixed(3)}s" repeatCount="${repeat?'indefinite':'1'}" />
            ${line}
        </text>`).join('');
    },

    wave(ctx) {
        const { lines, commonStyle, intSize, lineDurS, repeat, center, intWidth, lineY, seqOp } = ctx;
        return lines.map((line, row) => {
            const chars = line.split('');
            const cw = intSize * 0.62;
            const startX = center ? (intWidth - chars.length * cw) / 2 : 20;
            return chars.map((ch, i) => {
                const x = startX + i * cw;
                const begin = (row * ctx.slotS + (i / Math.max(chars.length,1)) * lineDurS * 0.35).toFixed(3);
                return `<text x="${x}" y="${lineY(row)}" style="${commonStyle}" opacity="0">
                    ${seqOp(row)}
                    <animateTransform attributeName="transform" type="translate" values="0,0;0,-${intSize*0.4};0,0"
                        dur="${Math.max(0.2,lineDurS*0.45)}s" begin="${begin}s" repeatCount="${repeat?'indefinite':'1'}"/>
                    ${ch}</text>`;
            }).join('');
        }).join('');
    },
};

module.exports = (req, res) => {
    const {
        lines: raw = 'Hello+World!', color = '36BCF7', size = '20',
        animation = 'typing', duration = '5000', pause = '1000',
        width = '435', height = '50', font = 'code',
        background = '00000000', center = 'false', vCenter = 'false',
        multiline = 'false', letterSpacing = 'normal',
        repeat = 'true', separator = ';', speed = '180',
    } = req.query;

    const lines = raw.split(separator)
        .map(l => decodeURIComponent(l.replace(/\+/g, ' ')).trim())
        .filter(Boolean);
    if (!lines.length) lines.push('Hello World!');

    const safeColor = (color||'36BCF7').replace(/[^a-fA-F0-9]/g,'').slice(0,6)||'36BCF7';
    const safeBg    = (background||'00000000').replace(/[^a-fA-F0-9]/g,'').slice(0,8)||'00000000';
    const intSize   = Math.min(Math.max(parseInt(size)||20, 8), 120);
    const intDur    = Math.min(Math.max(parseInt(duration)||5000, 200), 30000);
    const intPause  = Math.min(Math.max(parseInt(pause)||1000, 0), 10000);
    const intWidth  = Math.min(Math.max(parseInt(width)||435, 50), 1200);
    const intHeight = Math.min(Math.max(parseInt(height)||50, 20), 400);
    const animType  = VALID.includes(animation) ? animation : 'typing';
    const isCentered = center === 'true';

    const speedS    = Math.min(Math.max(parseInt(speed) || 180, 30), 1000) / 1000;
    const lineDurS  = intDur / 1000;
    const pauseS    = intPause / 1000;
    const slotS     = lineDurS + pauseS;
    const cycleDurS = slotS * Math.max(lines.length, 1);
    const isRepeat  = repeat !== 'false';

    const lineY = (i) => getLineY({
        multiline: multiline === 'true', vCenter: vCenter === 'true',
        intHeight, intSize, linesCount: lines.length, index: i,
    });
    const seqOp = (i) => seqOpacity({ index: i, slotS, lineDurS, cycleDurS, repeat: isRepeat });

    const bgRect = safeBg !== '00000000' ? `<rect width="${intWidth}" height="${intHeight}" fill="#${safeBg}"/>` : '';

    const content = animations[animType]({
        lines, textColor: `#${safeColor}`, intSize, intWidth, intHeight,
        textX: isCentered ? '50%' : '20',
        textAnchor: isCentered ? 'middle' : 'start',
        commonStyle: `font-family:${FONTS[font]||FONTS.monospace};font-weight:${font==='code'?'normal':'bold'};font-size:${intSize}px;fill:#${safeColor};letter-spacing:${letterSpacing||'normal'};`,
        center: isCentered, repeat: isRepeat,
        lineDurS, pauseS, slotS, cycleDurS, speedS, lineY, seqOp,
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const fontDefs = font === 'code' ? `<defs><style>${fontFace}</style></defs>` : '';
    res.send(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${intWidth}" height="${intHeight}" viewBox="0 0 ${intWidth} ${intHeight}">${fontDefs}${bgRect}${content}</svg>`);
};
