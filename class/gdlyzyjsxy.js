// ============================================================
// 修复版 extractSchedule（正确返回 Promise）
// ============================================================
function extractSchedule() {
    // ✅ 必须 return Promise
    return new Promise(function(resolve, reject) {
        var startTime = Date.now();
        var maxAttempts = 30;
        var attempts = 0;

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

        function findTable() {
            var table = document.querySelector('#mytable0');
            if (table) return table;
            table = document.querySelector('#mytable');
            if (table) return table;
            table = document.querySelector('table[id*="mytable"]');
            if (table) return table;
            var iframes = document.querySelectorAll('iframe');
            for (var i = 0; i < iframes.length; i++) {
                try {
                    var doc = iframes[i].contentDocument;
                    if (doc) {
                        table = doc.querySelector('#mytable0');
                        if (table) return table;
                    }
                } catch(e) { /* 跨域忽略 */ }
            }
            return null;
        }

        function checkAndExtract() {
            attempts++;
            var elapsed = Date.now() - startTime;

            var table = findTable();

            if (!table) {
                if (attempts >= maxAttempts) {
                    resolve(JSON.stringify({
                        success: false,
                        error: 'TABLE_NOT_FOUND',
                        debug: { attempts: attempts, elapsed: elapsed + 'ms' }
                    }));
                    return;
                }
                setTimeout(checkAndExtract, 500);
                return;
            }

            try {
                var cells = table.querySelectorAll('td.td, td.td0');
                var result = [];
                var processedIds = {};

                cells.forEach(function(cell) {
                    var div = cell.querySelector('div[id]');
                    if (!div) return;
                    var id = div.id;
                    if (!id || id.length < 2) return;
                    var colChar = id.charAt(1);
                    var colIndex = parseInt(colChar);
                    if (isNaN(colIndex) || colIndex < 1 || colIndex > 7) return;
                    var dayMap = {1:1,2:2,3:3,4:4,5:5,6:6,7:7};
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
                        var weekMatch = cleanPart.match(/\[([^\]]+)\]\s*周/);
                        var weeks = weekMatch ? weekMatch[1] : '1-16';
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
                            result.push({
                                name: name,
                                day: day,
                                startTime: timeInfo.start,
                                endTime: timeInfo.end,
                                location: location || '',
                                weeks: weeks
                            });
                        }
                    });
                });

                if (result.length === 0) {
                    resolve(JSON.stringify({ success: false, error: 'NO_COURSES', debug: { cellCount: cells.length } }));
                } else {
                    resolve(JSON.stringify({ success: true, data: result, count: result.length }));
                }
            } catch(e) {
                resolve(JSON.stringify({ success: false, error: e.message }));
            }
        }

        // ✅ 关键修复：立即开始检测（异步）
        checkAndExtract();
    });
}
