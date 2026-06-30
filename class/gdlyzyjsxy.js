// ============================================================
// 增强版 extractSchedule（递归穿透 iframe + 周段独立拆分）
// ============================================================
function extractSchedule() {
    var result = [];

    try {
        // ----- 1. 递归查找包含 #mytable0 的文档（支持任意层嵌套） -----
        function findTableRecursive(rootDoc) {
            var visited = new WeakSet();
            function search(doc) {
                if (!doc || visited.has(doc)) return null;
                visited.add(doc);
                var table = doc.querySelector('#mytable0');
                if (table) return { table: table, doc: doc };
                var frames = doc.querySelectorAll('iframe, frame');
                for (var i = 0; i < frames.length; i++) {
                    try {
                        var frameDoc = frames[i].contentDocument || frames[i].contentWindow.document;
                        if (frameDoc) {
                            var found = search(frameDoc);
                            if (found) return found;
                        }
                    } catch(e) {
                        // 跨域或无权访问，跳过该 iframe
                    }
                }
                return null;
            }
            return search(rootDoc);
        }

        var found = findTableRecursive(document);
        if (!found) {
            return JSON.stringify({ error: 'TABLE_NOT_FOUND' });
        }
        var doc = found.doc;
        var table = found.table;

        // ----- 2. 基于找到的文档进行解析 -----
        var cells = doc.querySelectorAll('td.td, td.td0');
        var processedIds = {};

        var PERIOD_TIME_MAP = {
            '1-2节': { start: '08:00', end: '09:40' },
            '3-4节': { start: '10:00', end: '11:40' },
            '5-6节': { start: '14:00', end: '15:40' },
            '7-8节': { start: '16:00', end: '17:40' },
            '9-10节': { start: '19:00', end: '20:40' },
            '11-12节': { start: '20:50', end: '22:30' },
            '1节': { start: '08:00', end: '08:45' },
            '2节': { start: '08:50', end: '09:35' },
            '3节': { start: '10:00', end: '10:45' },
            '4节': { start: '10:50', end: '11:35' },
            '5节': { start: '14:00', end: '14:45' },
            '6节': { start: '14:50', end: '15:35' },
            '7节': { start: '16:00', end: '16:45' },
            '8节': { start: '16:50', end: '17:35' },
            '9节': { start: '19:00', end: '19:45' },
            '10节': { start: '19:50', end: '20:35' },
            '11节': { start: '20:50', end: '21:35' },
            '12节': { start: '21:40', end: '22:25' },
            '1-4节': { start: '08:00', end: '11:40' },
            '5-8节': { start: '14:00', end: '17:40' },
            '9-12节': { start: '19:00', end: '22:30' }
        };

        function clean(str) {
            return str ? str.replace(/\s+/g, ' ').trim() : '';
        }

        function extractCourseName(text) {
            var firstSpace = text.indexOf(' ');
            var name = firstSpace > 0 ? text.substring(0, firstSpace) : text;
            var bracketMatch = name.match(/(.+?)（(.+?)）/);
            if (bracketMatch) name = bracketMatch[1] + '（' + bracketMatch[2] + '）';
            return name;
        }

        cells.forEach(function(cell) {
            var div = cell.querySelector('div[id]');
            if (!div) return;

            var id = div.id;
            if (!id || id.length < 2) return;

            var colChar = id.charAt(1);
            var colIndex = parseInt(colChar);
            if (isNaN(colIndex) || colIndex < 1 || colIndex > 7) return;

            var dayMap = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 };
            var day = dayMap[colIndex];
            if (!day) return;

            if (processedIds[id]) return;
            processedIds[id] = true;

            var title = cell.getAttribute('title');
            if (!title || !title.trim()) return;

            var parts = title.split('\n').filter(function(s) { return s.trim(); });
            if (parts.length === 0) parts = title.split(/<br\s*\/?>/i).filter(function(s) { return s.trim(); });
            if (parts.length === 0) parts = [clean(title)];

            parts.forEach(function(part) {
                var cleanPart = clean(part);
                if (!cleanPart) return;

                // ===== 提取所有原始周段，再按逗号拆分为独立子段 =====
                var rawSegments = [];
                var weekRe = /\[([^\]]*)\]周|(\d+)周/g;
                var m;
                while ((m = weekRe.exec(cleanPart)) !== null) {
                    if (m[1] !== undefined) {
                        rawSegments.push(m[1]);  // 方括号内可能含逗号，如 "1-8,10-15,17"
                    } else if (m[2] !== undefined) {
                        rawSegments.push(m[2]);
                    }
                }
                var weekSegments = [];
                for (var si = 0; si < rawSegments.length; si++) {
                    var segStr = rawSegments[si];
                    var subSegs = segStr.split(',');
                    for (var sj = 0; sj < subSegs.length; sj++) {
                        var sub = subSegs[sj].trim();
                        if (sub) weekSegments.push(sub);
                    }
                }
                if (weekSegments.length === 0) {
                    weekSegments.push('1-16');
                }

                var periodMatch = cleanPart.match(/(\d+-\d+节|\d+节)/);
                var periodKey = periodMatch ? periodMatch[1] : '1-2节';
                var timeInfo = PERIOD_TIME_MAP[periodKey] || { start: '08:00', end: '09:40' };

                var location = '';
                var locMatch = cleanPart.match(/\d+-\d+节\s+([^\s]+(?:\s+[^\s]+)*?)\s+[^\s]+校区/);
                if (locMatch) location = locMatch[1].trim();
                if (!location) {
                    var onlineMatch = cleanPart.match(/线上教室\d+/);
                    if (onlineMatch) location = onlineMatch[0];
                }

                var name = extractCourseName(cleanPart);
                if (name && name.length > 1) {
                    // 每个独立周段生成一条记录
                    for (var wk = 0; wk < weekSegments.length; wk++) {
                        result.push({
                            name: name,
                            day: day,
                            startTime: timeInfo.start,
                            endTime: timeInfo.end,
                            location: location || '',
                            weeks: weekSegments[wk]
                        });
                    }
                }
            });
        });

        return JSON.stringify({ success: true, data: result, count: result.length });

    } catch(e) {
        return JSON.stringify({ success: false, error: e.message });
    }
}

// ============================================================
// 执行入口
// ============================================================
(function() {
    try {
        var result = extractSchedule();
        console.log(result);
        return result;
    } catch(e) {
        console.error('执行失败:', e.message);
        return JSON.stringify({ success: false, error: e.message });
    }
})();
