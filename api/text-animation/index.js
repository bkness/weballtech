const { clamp01, getLineY, buildSequenceOpacity } = require('./_utils');

const animationMap = {
    typing:   require('./typing'),
    fade:     require('./fade'),
    slide:    require('./slide'),
    bounce:   require('./bounce'),
    pulse:    require('./pulse'),
    blink:    require('./blink'),
    shake:    require('./shake'),
    rainbow:  require('./rainbow'),
    glitch:   require('./glitch'),
    stroke:   require('./stroke'),
    wave:     require('./wave'),
    flip:     require('./flip'),
    neon:     require('./neon'),
    matrix:   require('./matrix'),
    zoom:     require('./zoom'),
    blur:     require('./blur'),
    float:    require('./float'),
    swing:    require('./swing'),
    pop:      require('./pop'),
    skew:     require('./skew'),
};

const FONTS = {
    monospace: "'Courier New', Courier, monospace",
    sans:      "'Segoe UI', Ubuntu, sans-serif",
    serif:     "Georgia, 'Times New Roman', serif",
    code:      "'Fira Code', 'JetBrains Mono', monospace",
};

const VALID_ANIMATIONS = Object.keys(animationMap);

module.exports = (req, res) => {
    const {
        lines: rawLines   = 'Hello+World!',
        color             = '36BCF7',
        size              = '20',
        animation         = 'typing',
        duration          = '5000',
        pause             = '1000',
        width             = '435',
        height            = '50',
        font              = 'monospace',
        background        = '00000000',
        center            = 'false',
        vCenter           = 'false',
        multiline         = 'false',
        letterSpacing     = 'normal',
        repeat            = 'true',
        random            = 'false',
        separator         = ';',
    } = req.query;

    const lines = rawLines
        .split(separator)
        .map(l => decodeURIComponent(l.replace(/\+/g, ' ')).trim())
        .filter(Boolean);

    if (lines.length === 0) lines.push('Hello World!');

    const safeColor = (color || '36BCF7').replace(/[^a-fA-F0-9]/g, '').slice(0, 6) || '36BCF7';
    const safeBg    = (background || '00000000').replace(/[^a-fA-F0-9]/g, '').slice(0, 8) || '00000000';
    const intSize   = Math.min(Math.max(parseInt(size)     || 20,   8),   120);
    const intDur    = Math.min(Math.max(parseInt(duration) || 5000, 200), 30000);
    const intPause  = Math.min(Math.max(parseInt(pause)    || 1000, 0),   10000);
    const intWidth  = Math.min(Math.max(parseInt(width)    || 435,  50),  1200);
    const intHeight = Math.min(Math.max(parseInt(height)   || 50,   20),  400);
    const animType  = VALID_ANIMATIONS.includes(animation) ? animation : 'typing';

    const fontFamily = FONTS[font] || FONTS.monospace;
    const textColor  = `#${safeColor}`;
    const bgColor    = safeBg !== '00000000' ? `#${safeBg}` : 'transparent';
    const textAnchor = center === 'true' ? 'middle' : 'start';
    const textX      = center === 'true' ? '50%' : '20';

    const commonStyle = `font-family: ${fontFamily}; font-weight: bold; font-size: ${intSize}px; fill: ${textColor}; letter-spacing: ${letterSpacing || 'normal'};`;

    const lineDurS   = intDur / 1000;
    const pauseS     = intPause / 1000;
    const slotS      = lineDurS + pauseS;
    const cycleDurS  = slotS * Math.max(lines.length, 1);

    const lineY = (index) => getLineY({
        multiline: multiline === 'true',
        vCenter:   vCenter   === 'true',
        intHeight, intSize,
        linesCount: lines.length,
        index,
    });

    const sequenceOpacity = (index) => buildSequenceOpacity({
        index, slotS, lineDurS, cycleDurS, repeat: repeat !== 'false',
    });

    const bgRect = bgColor !== 'transparent'
        ? `<rect width="${intWidth}" height="${intHeight}" fill="${bgColor}" />`
        : '';

    const content = animationMap[animType]({
        lines, textColor, intSize, intWidth, intHeight,
        textX, textAnchor, commonStyle,
        center: center === 'true', vCenter: vCenter === 'true',
        multiline: multiline === 'true', repeat: repeat !== 'false',
        lineDurS, pauseS, slotS, cycleDurS,
        clamp01, lineY, sequenceOpacity,
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${intWidth}"
     height="${intHeight}"
     viewBox="0 0 ${intWidth} ${intHeight}">
    ${bgRect}${content}
</svg>`);
};
