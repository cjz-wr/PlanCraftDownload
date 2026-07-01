// ============================================================
// 最终稳定版 extractSchedule（适配强智系统 · 广州华立学院）
// 输出格式与示例完全一致
// ============================================================
function extractSchedule() {
    var result = [];

    try {
        // ----- 1. 智能查找课表表格（兼容强智常见ID） -----
        function findTable(rootDoc) {
            var selectors = ['#mytable0', '#wdkbTable', '#kbTable', 'table.kbtable', 'table[class*="wdkb"]'];
            for (var i = 0; i < selectors.length; i++) {
                var table = rootDoc.querySelector(selectors[i]);
                if (table) return table;
            }
            // 若未找到，遍历所有表格，通过文本内容判断
            var allTables = rootDoc.querySelectorAll('table');
            for (var j = 0; j < allTables.length; j++) {
                var txt = allTables[j].innerText;
                if (txt.includes('星期一') && txt.includes('节次')) {
                    return allTables[j];
                }
            }
            return null;
        }

        var table = findTable(document);
        if (!table) {
            return JSON.stringify({ error: 'TABLE_NOT_FOUND' });
        }

        // ----- 2. 时间映射（与示例相同） -----
        var PERIOD_TIME_MAP = {
            '1-2节': { start: '08:15', end: '09:45' },
            '3-4节': { start: '10:05', end: '11:35' },
            '5-6节': { start: '13:45', end: '15:15' },
            '7-8节': { start: '15:35', end: '17:05' },
            '9-10节': { start: '18:30', end: '19:50' },
            '11-12节': { start: '20:00', end: '21:20' },
            '1节':   { start: '08:15', end: '08:55' },
            '2节':   { start: '09:05', end: '09:45' },
            '3节':   { start: '10:05', end: '10:45' },
            '4节':   { start: '10:55', end: '11:35' },
            '5节':   { start: '13:45', end: '14:25' },
            '6节':   { start: '14:35', end: '15:15' },
            '7节':   { start: '15:35', end: '16:15' },
            '8节':   { start: '16:25', end: '17:05' },
            '9节':   { start: '18:30', end: '19:10' },
            '10节':  { start: '19:20', end: '19:50' },
            '11节':  { start: '20:00', end: '20:40' },
            '12节':  { start: '20:50', end: '21:20' },
            '1-4节': { start: '08:15', end: '11:35' },
            '5-8节': { start: '13:45', end: '17:05' },
            '9-12节':{ start: '18:30', end: '21:20' }
        };

        // ----- 3. 辅助函数 -----
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

        function extractTeacher(text) {
            var creditMatch = text.match(/[\d.]+/);
            if (!creditMatch) return '';
            var after = text.substring(creditMatch.index + creditMatch[0].length).trim();
            var teacher = after.split(/[\s\u3000\[]/)[0];
            teacher = teacher.replace(/\d+班$/, '').trim();
            return teacher;
        }

        // ----- 4. 强智课表解析（核心） -----
        // 强智的课表通常是：行代表节次，列代表星期，单元格内有 div 或直接文本
        // 我们遍历所有行，识别节次列和星期列
        var rows = table.querySelectorAll('tr');
        var weekMap = { 1:'一', 2:'二', 3:'三', 4:'四', 5:'五', 6:'六', 7:'日' };
        var timeSlotCol = 0;    // 节次所在列索引
        var firstDayCol = 1;    // 星期一所在列索引

        // 先找表头行确定列位置
        for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('td, th');
            var texts = [];
            for (var c = 0; c < cells.length; c++) {
                texts.push(cells[c].innerText.trim());
            }
            if (texts.some(function(t){ return t.includes('节次'); }) && texts.some(function(t){ return t.includes('星期'); })) {
                // 找到节次列
                for (var i = 0; i < texts.length; i++) {
                    if (texts[i].includes('节次')) timeSlotCol = i;
                    if (texts[i].includes('星期一')) {
                        firstDayCol = i;
                        break;
                    }
                }
                break;
            }
        }

        // 如果没找到表头，默认第一列为节次，第二列为星期一
        if (firstDayCol === 1 && timeSlotCol === 0) {
            // 尝试检查第一行第一列是否有“节”字
            var firstRow = rows[0];
            if (firstRow) {
                var firstCell = firstRow.querySelector('td, th');
                if (firstCell && firstCell.innerText.includes('节')) {
                    timeSlotCol = 0;
                    firstDayCol = 1;
                }
            }
        }

        // 遍历数据行（从表头行之后开始）
        var startRow = 0;
        for (var r2 = 0; r2 < rows.length; r2++) {
            var rowText = rows[r2].innerText;
            if (rowText.includes('节次') || rowText.includes('星期')) {
                startRow = r2 + 1;
                break;
            }
        }

        for (var rowIdx = startRow; rowIdx < rows.length; rowIdx++) {
            var row = rows[rowIdx];
            var tds = row.querySelectorAll('td');
            if (tds.length <= firstDayCol) continue;

            // 获取节次字符串
            var timeSlotText = '';
            if (tds[timeSlotCol]) {
                timeSlotText = clean(tds[timeSlotCol].innerText);
            }
            if (!timeSlotText) timeSlotText = '未知节次';

            // 遍历星期列
            for (var col = firstDayCol; col < tds.length; col++) {
                var cell = tds[col];
                // 尝试从 div 中获取内容（强智常用 div[id]）
                var div = cell.querySelector('div[id]');
                var content = div ? div.innerText : cell.innerText;
                content = clean(content);
                if (!content) continue;

                // 如果内容包含“星期”或“节次”，跳过
                if (content.includes('星期') || content.includes('节次')) continue;

                // 解析周次
                var weekSegments = [];
                var weekRe = /\[([^\]]*)\]周|(\d+)周/g;
                var m;
                while ((m = weekRe.exec(content)) !== null) {
                    if (m[1] !== undefined) weekSegments.push(m[1]);
                    else if (m[2] !== undefined) weekSegments.push(m[2]);
                }
                // 如果没找到，默认全学期
                if (weekSegments.length === 0) weekSegments.push('1-16');

                // 解析节次
                var periodMatch = content.match(/(\d+-\d+节|\d+节)/);
                var periodKey = periodMatch ? periodMatch[1] : '1-2节';
                var timeInfo = PERIOD_TIME_MAP[periodKey] || { start: '08:00', end: '09:40' };

                // 解析地点
                var location = '';
                var locMatch = content.match(/(\d+-\d+节|\d+节)\s+(.+?)\s+([^\s]+校区)/);
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
                    var onlineMatch = content.match(/线上教室\d+/);
                    if (onlineMatch) location = onlineMatch[0];
                }

                // 提取教师
                var teacher = extractTeacher(content);

                // 提取课程名
                var name = extractCourseName(content);
                if (name && name.length > 1) {
                    // 计算星期几（列偏移）
                    var dayNum = col - firstDayCol + 1;
                    if (dayNum < 1 || dayNum > 7) continue;
                    // 拆分周次段，每个段都作为一条记录（类似示例）
                    for (var wi = 0; wi < weekSegments.length; wi++) {
                        result.push({
                            name: name,
                            teacher: teacher || '',
                            day: dayNum,
                            startTime: timeInfo.start,
                            endTime: timeInfo.end,
                            location: location || '',
                            weeks: weekSegments[wi]
                        });
                    }
                }
            }
        }

        return JSON.stringify({ success: true, data: result, count: result.length });

    } catch(e) {
        return JSON.stringify({ success: false, error: e.message });
    }
}

// ============================================================
// 执行入口（与示例完全一致）
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
