// rules/gdlyzyjsxy.js
function extractSchedule() {
    return new Promise((resolve, reject) => {
        // 1. 等待目标 DOM 元素出现
        const maxRetries = 20;
        let retries = 0;
        const checkExist = setInterval(() => {
            const rows = document.querySelectorAll('#schedule-table tbody tr');
            if (rows.length > 0) {
                clearInterval(checkExist);
                // 2. 解析数据
                const courses = [];
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        courses.push({
                            name: cells[0].textContent.trim(),
                            day: parseInt(cells[1].textContent.trim()),
                            startTime: cells[2].textContent.trim(),
                            endTime: cells[3].textContent.trim(),
                            location: cells[4]?.textContent.trim() || '',
                            weeks: cells[5]?.textContent.trim() || '1-16'
                        });
                    }
                });
                resolve(courses);
            } else {
                retries++;
                if (retries >= maxRetries) {
                    clearInterval(checkExist);
                    reject(new Error('等待课表加载超时'));
                }
            }
        }, 500);
    });
}
