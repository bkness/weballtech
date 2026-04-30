const FONTS = {
    monospace: "'Courier New', Courier, monospace",
    sans:      "'Segoe UI', Ubuntu, sans-serif",
    serif:     "Georgia, 'Times New Roman', serif",
    code:      "'Share Tech Mono', 'Fira Code', 'JetBrains Mono', monospace",
};

const VALID = ['typing', 'glitch', 'neon', 'wave'];

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
        repeat = 'true', separator = ';',
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
        commonStyle: `font-family:${FONTS[font]||FONTS.monospace};font-weight:bold;font-size:${intSize}px;fill:#${safeColor};letter-spacing:${letterSpacing||'normal'};`,
        center: isCentered, repeat: isRepeat,
        lineDurS, pauseS, slotS, cycleDurS, lineY, seqOp,
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${intWidth}" height="${intHeight}" viewBox="0 0 ${intWidth} ${intHeight}">${bgRect}${content}</svg>`);
};
