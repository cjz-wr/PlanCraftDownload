// ============================================================
// 适配新 HTML 结构的 extractSchedule
// ============================================================
function extractSchedule() {
    var result = [];

    try {
        // ----- 1. 查找课表表格 -----
        var table = document.querySelector('#mytable');
        if (!table) {
            return JSON.stringify({ error: 'TABLE_NOT_FOUND' });
        }

        // ----- 2. 节次时间映射 -----
        var PERIOD_TIME_MAP = {
            '1-2节':   { start: '08:15', end: '09:45' },
            '3-4节':   { start: '10:05', end: '11:35' },
            '5-6节':   { start: '13:45', end: '15:15' },
            '7-8节':   { start: '15:35', end: '17:05' },
            '9-10节':  { start: '18:30', end: '19:50' },
            '11-12节': { start: '20:00', end: '21:20' },

            '1节':     { start: '08:15', end: '08:55' },
            '2节':     { start: '09:05', end: '09:45' },
            '3节':     { start: '10:05', end: '10:45' },
            '4节':     { start: '10:55', end: '11:35' },
            '5节':     { start: '13:45', end: '14:25' },
            '6节':     { start: '14:35', end: '15:15' },
            '7节':     { start: '15:35', end: '16:15' },
            '8节':     { start: '16:25', end: '17:05' },
            '9节':     { start: '18:30', end: '19:10' },
            '10节':    { start: '19:20', end: '19:50' },
            '11节':    { start: '20:00', end: '20:40' },
            '12节':    { start: '20:50', end: '21:20' },

            '1-4节':   { start: '08:15', end: '11:35' },
            '5-8节':   { start: '13:45', end: '17:05' },
            '9-12节':  { start: '18:30', end: '21:20' }
        };

        // 星期几映射：cellIndex - 1 = 星期几（星期一=1，星期日=7）
        // 表格列: 0=行标题(上午/一), 1=节次(一/二), 2=星期一, ..., 8=星期日

        // ----- 3. 遍历所有课程单元格 -----
        var cells = table.querySelectorAll('td.td');
        for (var ci = 0; ci < cells.length; ci++) {
            var cell = cells[ci];
            var day = cell.cellIndex - 1;   // cellIndex: 2→1(星期一) ... 8→7(星期日)
            if (day < 1 || day > 7) continue;

            var divs = cell.querySelectorAll('div');
            for (var di = 0; di < divs.length; di++) {
                var div = divs[di];
                var text = (div.innerText || div.textContent || '').trim();
                if (!text) continue;   // 跳过空 div (如 div_nokb)

                var lines = text.split('\n');
                var cleanLines = [];
                for (var li = 0; li < lines.length; li++) {
                    var line = lines[li].replace(/[\s\u3000]+/g, ' ').trim();
                    if (line) cleanLines.push(line);
                }
                if (cleanLines.length < 3) continue; // 至少：课程名、教师、周次[节次]

                var courseName = cleanLines[0];
                var teacher = cleanLines[1] || '';
                var weekPeriod = cleanLines[2];
                var location = cleanLines.length > 3 ? cleanLines[3] : '';

                // 解析 "周次[节次]" 格式，例如 "11-17[1-2]"
                var match = weekPeriod.match(/^(.+?)\[(\d+(?:-\d+)?)\]$/);
                if (!match) continue;

                var weekPart = match[1].trim();   // "11-17" 或 "11,13,15,17" 或 "6"
                var periodPart = match[2];        // "1-2"

                var periodKey = periodPart.indexOf('-') > 0 ? periodPart + '节' : periodPart + '节';
                var timeInfo = PERIOD_TIME_MAP[periodKey];
                if (!timeInfo) {
                    // 尝试用数字范围匹配，例如 "1-4" 不在映射中但 "1-4节" 在
                    timeInfo = PERIOD_TIME_MAP[periodPart + '节'] || { start: '08:00', end: '09:40' };
                }

                // 解析周次为多段，支持逗号分隔的离散周及范围
                var weekSegments = [];
                var parts = weekPart.split(',');
                for (var pi = 0; pi < parts.length; pi++) {
                    var seg = parts[pi].trim();
                    if (seg) weekSegments.push(seg);
                }
                if (weekSegments.length === 0) weekSegments.push('1-16');

                for (var wi = 0; wi < weekSegments.length; wi++) {
                    result.push({
                        name: courseName,
                        teacher: teacher,
                        day: day,
                        startTime: timeInfo.start,
                        endTime: timeInfo.end,
                        location: location,
                        weeks: weekSegments[wi]
                    });
                }
            }
        }

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
