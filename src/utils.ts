export interface Point { x: number; y: number; }
export interface Rect { minX: number; minY: number; maxX: number; maxY: number; }

export const getBBox = (points: Point[]): Rect => {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
};

export const doRectsIntersect = (r1: Rect, r2: Rect, buffer: number = 0): boolean => {
    return !(r2.minX > r1.maxX + buffer || 
             r2.maxX < r1.minX - buffer || 
             r2.minY > r1.maxY + buffer || 
             r2.maxY < r1.minY - buffer);
};

export const getDistanceSq = (p1: Point, p2: Point): number => {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
};

export const getMinDistance = (pointsA: Point[], pointsB: Point[]): number => {
    const bboxA = getBBox(pointsA);
    const bboxB = getBBox(pointsB);

    // Quick check with BBox distance (lower bound)
    const dx = Math.max(bboxA.minX - bboxB.maxX, 0, bboxB.minX - bboxA.maxX);
    const dy = Math.max(bboxA.minY - bboxB.maxY, 0, bboxB.minY - bboxA.maxY);
    const bboxDistSq = dx * dx + dy * dy;
    
    // If we cared about a threshold, we could return early here.
    // But we want the actual min distance.
    
    let minSq = Infinity;

    // Optimization: Only check points that are somewhat close
    // This is still O(N*M) in worst case but helps if shapes are far apart
    // Actually, for "sea invasion" check, we only care if dist < 8.5.
    // But the function signature implies returning exact distance.
    // Let's stick to brute force for correctness, it's fast enough for click events.

    for (const pA of pointsA) {
        for (const pB of pointsB) {
            const dSq = (pA.x - pB.x) ** 2 + (pA.y - pB.y) ** 2;
            if (dSq < minSq) {
                minSq = dSq;
            }
        }
    }
    return Math.sqrt(minSq);
};

export const parsePath = (d: string): Point[] => {
    // Regex to match commands and numbers
    const tokens = d.match(/([a-zA-Z])|([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/g);
    if (!tokens) return [];

    const points: Point[] = [];
    let current: Point = { x: 0, y: 0 };
    let cmd = 'L'; // Default for subsequent points if no command
    let i = 0;

    // First token should be M or m
    if (i < tokens.length && /[a-zA-Z]/.test(tokens[i])) {
        cmd = tokens[i++];
    }

    while (i < tokens.length) {
        const token = tokens[i];
        
        if (/[a-zA-Z]/.test(token)) {
            cmd = token;
            i++;
            continue;
        }

        const isRelative = cmd === cmd.toLowerCase();
        const upperCmd = cmd.toUpperCase();

        if (upperCmd === 'Z') {
            continue;
        }

        if (upperCmd === 'M' || upperCmd === 'L') {
            if (i + 1 >= tokens.length) break;
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            
            if (isRelative) {
                current = { x: current.x + x, y: current.y + y };
            } else {
                current = { x, y };
            }
            points.push({ ...current });
            
            if (upperCmd === 'M') cmd = isRelative ? 'l' : 'L';
        } else if (upperCmd === 'H') {
            const x = parseFloat(tokens[i++]);
            if (isRelative) current.x += x;
            else current.x = x;
            points.push({ ...current });
        } else if (upperCmd === 'V') {
            const y = parseFloat(tokens[i++]);
            if (isRelative) current.y += y;
            else current.y = y;
            points.push({ ...current });
        } else {
            i++;
        }
    }
    return points;
};

export const areNeighbors = (pointsA: Point[], pointsB: Point[], threshold: number = 2.0): boolean => {
    const bboxA = getBBox(pointsA);
    const bboxB = getBBox(pointsB);

    if (!doRectsIntersect(bboxA, bboxB, threshold)) {
        return false;
    }

    const thresholdSq = threshold * threshold;

    for (const pA of pointsA) {
        if (pA.x < bboxB.minX - threshold || pA.x > bboxB.maxX + threshold ||
            pA.y < bboxB.minY - threshold || pA.y > bboxB.maxY + threshold) {
            continue;
        }

        for (const pB of pointsB) {
            if (getDistanceSq(pA, pB) <= thresholdSq) {
                return true;
            }
        }
    }

    return false;
};
