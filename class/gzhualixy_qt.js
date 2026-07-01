// ==UserScript==
// @name         广州华立学院-强智课表提取
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  从强智教务系统提取课表数据
// @author       PlanCraft
// @match        https://www.hltz.net/hlxy_jsxsd/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 等待课表加载
    function waitForTable(callback) {
        const selectors = ['#wdkbTable', '#kbTable', '.wdkb', 'table[class*="kb"]'];
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            let table = null;
            for (let sel of selectors) {
                table = document.querySelector(sel);
                if (table) break;
            }
            // 如果没找到，尝试用文本内容匹配
            if (!table) {
                const allTables = document.querySelectorAll('table');
                for (let t of allTables) {
                    const txt = t.innerText;
                    if (txt.includes('星期一') && txt.includes('节次')) {
                        table = t;
                        break;
                    }
                }
            }
            if (table) {
                clearInterval(timer);
                callback(table);
            } else if (attempts > 30) {
                clearInterval(timer);
                alert('未找到课表，请确保在课表页面（或打印预览）运行。');
            }
        }, 500);
    }

    // 提取课表（针对强智结构）
    function extractSchedule(table) {
        const rows = table.querySelectorAll('tr');
        const result = [];
        const weekMap = {1:'一', 2:'二', 3:'三', 4:'四', 5:'五', 6:'六', 7:'日'};

        // 找到节次列和星期列起始位置
        let timeSlotCol = 0;    // 节次所在列索引
        let firstDayCol = 1;    // 星期一所在列索引（默认第2列）
        let headerRow = null;

        // 遍历行，寻找表头行
        for (let r of rows) {
            const cells = r.querySelectorAll('td, th');
            const texts = Array.from(cells).map(c => c.innerText.trim());
            if (texts.some(t => t.includes('节次')) && texts.some(t => t.includes('星期'))) {
                headerRow = r;
                // 找“节次”所在列
                for (let i = 0; i < texts.length; i++) {
                    if (texts[i].includes('节次')) timeSlotCol = i;
                    if (texts[i].includes('星期一')) {
                        firstDayCol = i;
                        break;
                    }
                }
                break;
            }
        }

        // 如果没有找到表头，则假设第一列为节次，第二列为星期一
        if (!headerRow) {
            timeSlotCol = 0;
            firstDayCol = 1;
        }

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;

            // 跳过表头行
            const firstText = cells[0]?.innerText.trim() || '';
            if (firstText.includes('节次') || firstText.includes('星期')) return;

            // 获取节次信息
            let timeSlot = '';
            if (cells[timeSlotCol]) {
                timeSlot = cells[timeSlotCol].innerText.trim().replace(/\s+/g, ' ');
            } else {
                timeSlot = '未知节次';
            }

            // 遍历星期列（从 firstDayCol 开始）
            for (let i = firstDayCol; i < cells.length; i++) {
                const content = cells[i].innerText.trim().replace(/\s+/g, ' ');
                if (!content || content.length < 2) continue;
                if (content.includes('星期') || content.includes('节次')) continue;

                // 拆分课程信息（强智格式：课程名\n教师\n教室）
                const parts = content.split('\n').filter(p => p.trim());
                const course = parts[0] || '';
                const teacher = parts[1] || '';
                const room = parts[2] || '';

                // 计算星期几（列索引 - firstDayCol + 1）
                const dayIndex = i - firstDayCol + 1;
                const weekDay = weekMap[dayIndex] || dayIndex;

                result.push({
                    星期: '星期' + weekDay,
                    节次: timeSlot,
                    课程: course,
                    教师: teacher,
                    教室: room,
                    原文: content
                });
            }
        });

        return result;
    }

    // 执行
    waitForTable((table) => {
        const data = extractSchedule(table);
        if (data.length === 0) {
            alert('提取结果为空，请确认课表已正常显示。');
            return;
        }

        console.table(data);
        const jsonStr = JSON.stringify(data, null, 2);
        console.log('📋 课表 JSON：', jsonStr);

        try {
            copy(jsonStr);
            alert(`✅ 成功提取 ${data.length} 条记录，已复制 JSON 到剪贴板。`);
        } catch (e) {
            alert(`✅ 提取成功，共 ${data.length} 条记录。请手动复制控制台输出的 JSON。`);
        }

        window.__scheduleData = data;
    });

})();
