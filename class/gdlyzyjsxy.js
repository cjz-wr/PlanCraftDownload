// ============================================================
// 最终稳定版 extractSchedule（彻底修复分割 + 教师提取）
// ============================================================
function extractSchedule() {
    var result = [];

    try {
        // ----- 1. 递归查找包含 #mytable0 的文档 -----
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
                    } catch(e) { /* 跨域忽略 */ }
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

        // ----- 2. 解析课表 -----
        var cells = doc.querySelectorAll('td.td, td.td0');
        var processedIds = {};

        var PERIOD_TIME_MAP = {
            '1-2节': { start: '08:00', end: '09:40' },
            '3-4节': { start: '10:00', end: '11:40' },
            '5-6节': { start: '14:00', end: '15:40' },
            '7-8节': { start: '16:00', end: '17:40' },
            '9-10节': { start: '19:00', end: '20:40' },
            '11-12节': { start: '20:50', end: '22:30' },
            '1节':   { start: '08:00', end: '08:45' },
            '2节':   { start: '08:50', end: '09:35' },
            '3节':   { start: '10:00', end: '10:45' },
            '4节':   { start: '10:50', end: '11:35' },
            '5节':   { start: '14:00', end: '14:45' },
            '6节':   { start: '14:50', end: '15:35' },
            '7节':   { start: '16:00', end: '16:45' },
            '8节':   { start: '16:50', end: '17:35' },
            '9节':   { start: '19:00', end: '19:45' },
            '10节':  { start: '19:50', end: '20:35' },
            '11节':  { start: '20:50', end: '21:35' },
            '12节':  { start: '21:40', end: '22:25' },
            '1-4节': { start: '08:00', end: '11:40' },
            '5-8节': { start: '14:00', end: '17:40' },
            '9-12节':{ start: '19:00', end: '22:30' }
        };

        function clean(str) {
            return str ? str.replace(/[\s\u3000]+/g, ' ').trim() : '';
        }

        function extractCourseName(text) {
            var firstSpace = text.indexOf(' ');
            var name = firstSpace > 0 ? text.substring(0, firstSpace) : text;
            var bracketMatch = name.match(/(.+?)（(.+?)）/);
            if (bracketMatch) name = bracketMatch[1] + '（' + bracketMatch[2] + '）';
            return name;
        }

        // 提取教师：学分后、[ 或空格前的中文，自动清除班级编号
        function extractTeacher(text) {
            var creditMatch = text.match(/[\d.]+/);
            if (!creditMatch) return '';
            var after = text.substring(creditMatch.index + creditMatch[0].length).trim();
            var teacher = after.split(/[\s\u3000\[]/)[0];
            teacher = teacher.replace(/\d+班$/, '').trim();
            return teacher;
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

            // ===== 彻底分割：统一所有换行形式，按行独立 =====
            var unified = title
                .replace(/<br\s*\/?>/gi, '\n')   // 将 <br> 转为换行
                .replace(/\r\n/g, '\n')          // 统一 \r\n -> \n
                .replace(/\r/g, '\n');           // 统一 \r -> \n
            var lines = unified.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var cleanPart = clean(lines[i]);
                if (!cleanPart) continue;

                // --- 周次处理（支持 [1-8,10-15,17] 拆分） ---
                var rawSegments = [];
                var weekRe = /\[([^\]]*)\]周|(\d+)周/g;
                var m;
                while ((m = weekRe.exec(cleanPart)) !== null) {
                    if (m[1] !== undefined) rawSegments.push(m[1]);
                    else if (m[2] !== undefined) rawSegments.push(m[2]);
                }
                var weekSegments = [];
                for (var si = 0; si < rawSegments.length; si++) {
                    var subSegs = rawSegments[si].split(',');
                    for (var sj = 0; sj < subSegs.length; sj++) {
                        var sub = subSegs[sj].trim();
                        if (sub) weekSegments.push(sub);
                    }
                }
                if (weekSegments.length === 0) weekSegments.push('1-16');

                // --- 节次 ---
                var periodMatch = cleanPart.match(/(\d+-\d+节|\d+节)/);
                var periodKey = periodMatch ? periodMatch[1] : '1-2节';
                var timeInfo = PERIOD_TIME_MAP[periodKey] || { start: '08:00', end: '09:40' };

                // --- 地点（无教室时用校区） ---
                var location = '';
                var locMatch = cleanPart.match(/(\d+-\d+节|\d+节)\s+(.+?)\s+([^\s]+校区)/);
                if (locMatch) {
                    var middle = locMatch[2];
                    var campus = locMatch[3];
                    middle = middle.replace(/\d+班\s*/g, '').replace(/\s+\d+$/g, '').trim();
                    if (middle && !/\d+-\d+节/.test(middle) && !/周/.test(middle)) {
                        location = middle;
                    } else {
                        location = campus;
                    }
                }
                if (!location) {
                    var onlineMatch = cleanPart.match(/线上教室\d+/);
                    if (onlineMatch) location = onlineMatch[0];
                }

                // --- 教师 ---
                var teacher = extractTeacher(cleanPart);

                // --- 课程名 ---
                var name = extractCourseName(cleanPart);
                if (name && name.length > 1) {
                    for (var wk = 0; wk < weekSegments.length; wk++) {
                        result.push({
                            name: name,
                            teacher: teacher || '',
                            day: day,
                            startTime: timeInfo.start,
                            endTime: timeInfo.end,
                            location: location || '',
                            weeks: weekSegments[wk]
                        });
                    }
                }
            }
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
