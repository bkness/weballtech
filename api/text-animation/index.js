const SHARE_TECH_MONO_B64 = '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';

const FONTS = {
    monospace: "'Courier New', Courier, monospace",
    sans:      "'Segoe UI', Ubuntu, sans-serif",
    serif:     "Georgia, 'Times New Roman', serif",
    code:      "'Share Tech Mono', monospace",
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
    const fontDefs = font === 'code'
        ? `<defs><style>@font-face{font-family:'Share Tech Mono';src:url('data:font/woff2;base64,${SHARE_TECH_MONO_B64}') format('woff2');font-weight:normal;font-style:normal;}</style></defs>`
        : '';
    res.send(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${intWidth}" height="${intHeight}" viewBox="0 0 ${intWidth} ${intHeight}">${fontDefs}${bgRect}${content}</svg>`);
};
