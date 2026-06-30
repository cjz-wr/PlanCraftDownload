function extractSchedule() {
    return new Promise((resolve, reject) => {
        const maxRetries = 25;
        let retries = 0;

        // 节次 → 时间映射表（完整版）
        const periodTimeMap = {
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
            // 跨多节
            '1-4节': { start: '08:00', end: '11:40' },
            '5-8节': { start: '14:00', end: '17:40' },
            '9-12节': { start: '19:00', end: '22:30' },
            '1-2节': { start: '08:00', end: '09:40' },
            '3-4节': { start: '10:00', end: '11:40' },
            '5-6节': { start: '14:00', end: '15:40' },
            '7-8节': { start: '16:00', end: '17:40' },
            '9-10节': { start: '19:00', end: '20:40' },
            '11-12节': { start: '20:50', end: '22:30' }
        };

        // 列索引 → 星期映射
        function getDayFromColumn(colIndex) {
            const map = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 };
            return map[colIndex] || 0;
        }

        // 从 title 属性解析单条课程信息（重写）
        function parseCourseInfo(courseStr, day) {
            // 清理字符串
            let str = courseStr.replace(/\s+/g, ' ').trim();

            // 1. 提取周次
            const weekMatch = str.match(/\[([^\]]+)\]\s*周/);
            const weeks = weekMatch ? weekMatch[1] : '1-16';

            // 2. 提取节次
            const periodMatch = str.match(/(\d+-\d+节|\d+节)/);
            const periodKey = periodMatch ? periodMatch[1] : '1-2节';
            const timeInfo = periodTimeMap[periodKey] || { start: '08:00', end: '09:40' };

            // 3. 提取地点（多种模式匹配）
            let location = '';

            // 模式1：节次后面的内容，直到校区
            const afterPeriod = str.split(/\d+-\d+节|\d+节/)[1];
            if (afterPeriod) {
                // 提取从第一个非空格到"校区"之间的内容
                const locMatch1 = afterPeriod.match(/\s+([^\s]+(?:\s+[^\s]+)*?)\s+[^\s]+校区/);
                if (locMatch1) {
                    location = locMatch1[1].trim();
                } else {
                    // 如果没有"校区"，尝试提取到末尾
                    const locMatch2 = afterPeriod.match(/\s+([^\s]+(?:\s+[^\s]+)*?)$/);
                    if (locMatch2) {
                        location = locMatch2[1].trim();
                    }
                }
            }

            // 如果地点仍为空，尝试从原字符串提取
            if (!location) {
                const fallbackMatch = str.match(/\d+-\d+节\s+([^校区]+)/);
                if (fallbackMatch) {
                    location = fallbackMatch[1].trim();
                }
            }

            // 如果地点包含"线上教室"，保留
            if (str.includes('线上教室')) {
                const onlineMatch = str.match(/线上教室\d+/);
                if (onlineMatch) {
                    location = onlineMatch[0];
                }
            }

            // 4. 提取课程名（正确方法：取节次之前的内容，去掉周次和教师）
            // 先找到节次的位置
            const periodPos = str.search(/\d+-\d+节|\d+节/);
            let courseName = '';
            if (periodPos > 0) {
                // 节次之前的内容
                let beforePeriod = str.substring(0, periodPos).trim();
                // 去掉周次部分
                beforePeriod = beforePeriod.replace(/\[[^\]]+\]\s*周/, '').trim();
                // 如果有学分数字，去掉（如 "3.5"）
                beforePeriod = beforePeriod.replace(/\s+\d+(\.\d+)?$/, '').trim();
                // 去掉教师姓名（通常在学分后面）
                courseName = beforePeriod;
            } else {
                // 降级：取第一个空格前的内容
                const firstSpace = str.indexOf(' ');
                if (firstSpace > 0) {
                    courseName = str.substring(0, firstSpace).trim();
                } else {
                    courseName = str.trim();
                }
            }

            // 清理课程名中的多余空格和特殊字符
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

            // 获取所有数据单元格
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
                if (!id || id.length < 2) return;

                // 提取列索引：id 的第二位数字
                const colChar = id.charAt(1);
                const colIndex = parseInt(colChar);
                if (isNaN(colIndex) || colIndex < 1 || colIndex > 7) return;

                const day = getDayFromColumn(colIndex);
                if (day === 0) return;

                if (processedIds.has(id)) return;
                processedIds.add(id);

                // 从 title 属性获取课程数据
                const title = cell.getAttribute('title');
                if (!title || title.trim() === '') return;

                // 分割多门课程：按 <br> 分割（青果系统的实际分隔符）
                let courseParts = title.split(/<br\s*\/?>/i).filter(s => s.trim() !== '');
                if (courseParts.length === 0) {
                    // 降级：按 \n 分割
                    courseParts = title.split('\n').filter(s => s.trim() !== '');
                }
                if (courseParts.length === 0) {
                    // 再降级：按 \r\n 分割
                    courseParts = title.split('\r\n').filter(s => s.trim() !== '');
                }

                // 如果分割后仍有内容，逐条解析
                if (courseParts.length > 0) {
                    courseParts.forEach(part => {
                        const cleanPart = part.replace(/<br>/g, '').replace(/\s+/g, ' ').trim();
                        if (cleanPart && cleanPart.length > 0) {
                            const course = parseCourseInfo(cleanPart, day);
                            // 过滤无效课程（名称不能为空且不能是纯数字或纯符号）
                            if (course.name && course.name.length > 1 && !/^[\d\s\-_]+$/.test(course.name)) {
                                courses.push(course);
                            }
                        }
                    });
                } else {
                    // 如果分割失败，尝试直接解析整个 title
                    const cleanTitle = title.replace(/\s+/g, ' ').trim();
                    if (cleanTitle && cleanTitle.length > 0) {
                        const course = parseCourseInfo(cleanTitle, day);
                        if (course.name && course.name.length > 1) {
                            courses.push(course);
                        }
                    }
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
