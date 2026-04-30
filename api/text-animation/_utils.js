function clamp01(val) {
    return Math.min(1, Math.max(0, val));
}

function getLineY({ multiline, vCenter, intHeight, intSize, linesCount, index }) {
    if (multiline) {
        const lineSpacing = intSize + 8;
        const totalH = linesCount * lineSpacing;
        const baseY = vCenter ? Math.round((intHeight - totalH) / 2) + intSize : intSize + 4;
        return baseY + index * lineSpacing;
    }
    return vCenter ? Math.round(intHeight / 2 + intSize * 0.35) : intSize + 4;
}

function buildSequenceOpacity({ index, slotS, lineDurS, cycleDurS, repeat }) {
    const c = (v) => clamp01(v).toFixed(4);
    const start = (index * slotS) / cycleDurS;
    const fd = Math.min(0.02, (lineDurS / cycleDurS) * 0.05);
    const end = (index * slotS + lineDurS) / cycleDurS;
    return `<animate attributeName="opacity"
        values="0;0;1;1;0;0"
        keyTimes="0;${c(start)};${c(start + fd)};${c(end - fd)};${c(end)};1"
        dur="${cycleDurS}s"
        repeatCount="${repeat ? 'indefinite' : '1'}"
        fill="freeze" />`;
}

module.exports = { clamp01, getLineY, buildSequenceOpacity };
