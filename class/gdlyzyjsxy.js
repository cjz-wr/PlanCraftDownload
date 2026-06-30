function extractSchedule() {
    return new Promise((resolve, reject) => {
        const maxRetries = 20;
        let retries = 0;

        // 青果系统节次 → 时间映射表（辽宁传媒学院）
        const periodTimeMap = {
            '1-2节': { start: '08:00', end: '09:40' },
            '3-4节': { start: '10:00', end: '11:40' },
            '5-6节': { start: '14:00', end: '15:40' },
            '7-8节': { start: '16:00', end: '17:40' },
            '9-10节': { start: '19:00', end: '20:40' },
            '11-12节': { start: '20:50', end: '22:30' },
            // 跨多节特殊处理
            '1-4节': { start: '08:00', end: '11:40' },
            '5-8节': { start: '14:00', end: '17:40' },
            '9-12节': { start: '19:00', end: '22:30' }
        };

        // 列索引 → 星期映射（基于表格结构：第0列空，第1-7列对应周一至周日）
        function getDayFromColumn(colIndex) {
            const map = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 };
            return map[colIndex] || 0;
        }

        // 从 title 属性解析单条课程信息
        function parseCourseInfo(courseStr, day) {
            // 1. 提取周次：[3-9]周 或 [1-8,10-15,17]周 或 [6]周
            const weekMatch = courseStr.match(/\[([^\]]+)\]\s*周/);
            const weeks = weekMatch ? weekMatch[1] : '1-16';

            // 2. 提取节次：1-2节 / 3-4节 / 5-6节 / ...
            const periodMatch = courseStr.match(/(\d+-\d+)节/);
            const periodKey = periodMatch ? periodMatch[1] + '节' : '1-2节';

            // 3. 获取时间
            const timeInfo = periodTimeMap[periodKey] || { start: '08:00', end: '09:40' };

            // 4. 提取课程名（第一个空格之前的内容）
            //    注意：课程名可能包含括号如“面向对象程序设计（JAVA）”
            const nameMatch = courseStr.match(/^([^\s]+(?:\s*[（(][^）)]*[）)])?/);
            // 更稳健的方式：提取到第一个空格前，但保留括号内的内容
            let courseName = '';
            const firstSpaceIdx = courseStr.indexOf(' ');
            if (firstSpaceIdx > 0) {
                courseName = courseStr.substring(0, firstSpaceIdx).trim();
            } else {
                courseName = courseStr.trim();
            }

            // 5. 提取地点（在“节”和“校区”之间）
            let location = '';
            const locationMatch = courseStr.match(/\d+-\d+节\s+([^\s]+(?:\s+[^\s]+)*?)\s+[^\s]+校区/);
            if (locationMatch) {
                location = locationMatch[1].trim();
            } else {
                // 降级：提取节次后的内容直到校区
                const afterPeriod = courseStr.split(/\d+-\d+节/)[1];
                if (afterPeriod) {
                    const campusMatch = afterPeriod.match(/(.+?)\s+[^\s]+校区/);
                    if (campusMatch) {
                        location = campusMatch[1].trim();
                    }
                }
            }

            // 6. 如果地点仍为空，尝试从原字符串提取
            if (!location) {
                const fallbackMatch = courseStr.match(/\d+-\d+节\s+([^校区]+)/);
                if (fallbackMatch) {
                    location = fallbackMatch[1].trim();
                }
            }

            // 7. 清理课程名中的多余空格
            courseName = courseName.replace(/\s+/g, ' ').trim();

            return {
                name: courseName || '未命名课程',
                day: day,
                startTime: timeInfo.start,
                endTime: timeInfo.end,
                location: location || '',
                weeks: weeks
            };
        }

        // 主检测逻辑
        const checkExist = setInterval(() => {
            const table = document.querySelector('#mytable0');
            if (!table) {
                retries++;
                if (retries >= maxRetries) {
                    clearInterval(checkExist);
                    reject(new Error('未找到课表表格，请确认已进入课表页面'));
                }
                return;
            }

            // 获取所有数据单元格 (class=td 或 td0)
            const allCells = table.querySelectorAll('td.td, td.td0');
            if (allCells.length === 0) {
                retries++;
                if (retries >= maxRetries) {
                    clearInterval(checkExist);
                    reject(new Error('未找到课表数据，可能页面尚未加载完成'));
                }
                return;
            }

            clearInterval(checkExist);

            const courses = [];
            const processedIds = new Set();

            allCells.forEach(cell => {
                const id = cell.id;
                // 只处理有 id 且格式正确的数据单元格
                if (!id || id.length < 2) return;

                const colChar = id.charAt(1);
                const colIndex = parseInt(colChar);
                if (isNaN(colIndex) || colIndex < 1 || colIndex > 7) return;

                const day = getDayFromColumn(colIndex);
                if (day === 0) return;

                // 避免重复处理（rowspan 跨行的单元格只处理一次）
                if (processedIds.has(id)) return;
                processedIds.add(id);

                const title = cell.getAttribute('title');
                if (!title || title.trim() === '') return;

                // 按换行分割多门课程（青果系统用 \n 分隔）
                const courseLines = title.split('\n').filter(line => line.trim() !== '');

                if (courseLines.length === 0) {
                    // 尝试按 <br> 分割（降级方案）
                    const brLines = title.split('<br>').filter(line => line.trim() !== '');
                    if (brLines.length > 0) {
                        brLines.forEach(line => {
                            const cleanLine = line.replace(/<br>/g, '').trim();
                            if (cleanLine) {
                                const course = parseCourseInfo(cleanLine, day);
                                courses.push(course);
                            }
                        });
                    }
                } else {
                    courseLines.forEach(line => {
                        const cleanLine = line.trim();
                        if (cleanLine) {
                            const course = parseCourseInfo(cleanLine, day);
                            courses.push(course);
                        }
                    });
                }
            });

            if (courses.length === 0) {
                reject(new Error('未识别到任何课程，请确认课表页面已完整显示'));
            } else {
                resolve(courses);
            }
        }, 500);
    });
}
