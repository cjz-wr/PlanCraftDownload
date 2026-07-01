// ==UserScript==
// @name         广州华立学院课表提取
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  从正方教务系统提取课表数据
// @author       PlanCraft
// @match        https://www.hltz.net/hlxy_jsxsd/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 等待课表加载完成（因为可能有异步加载）
    function waitForTable(callback) {
        const selectors = ['#kbtable', '#schedule-table', '.kbtable', 'table[class*="kb"]'];
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            let table = null;
            for (let sel of selectors) {
                table = document.querySelector(sel);
                if (table) break;
            }
            // 如果没找到，尝试用文本内容判断
            if (!table) {
                const allTables = document.querySelectorAll('table');
                for (let t of allTables) {
                    const txt = t.innerText;
                    if (txt.includes('星期一') && txt.includes('星期二') && (txt.includes('节次') || txt.includes('第'))) {
                        table = t;
                        break;
                    }
                }
            }
            if (table) {
                clearInterval(timer);
                callback(table);
            } else if (attempts > 30) { // 15秒超时
                clearInterval(timer);
                alert('未找到课表，请确认已进入课表查询页面。');
            }
        }, 500);
    }

    // 提取课表数据
    function extractSchedule(table) {
        const rows = table.querySelectorAll('tr');
        const result = [];
        let weekMap = {1:'一', 2:'二', 3:'三', 4:'四', 5:'五', 6:'六', 7:'日'};
        let timeSlot = '';
        let startIdx = 0;

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;

            // 尝试获取节次信息（第一列或第二列）
            const firstText = cells[0]?.innerText.trim() || '';
            const secondText = cells[1]?.innerText.trim() || '';
            if (firstText.includes('节') || firstText.includes('节次')) {
                timeSlot = firstText.replace(/\s+/g, ' ');
                startIdx = 1;
            } else if (secondText.includes('节') || secondText.includes('节次')) {
                timeSlot = secondText.replace(/\s+/g, ' ');
                startIdx = 2;
            } else if (rowIndex === 0) {
                // 可能是表头行，跳过
                return;
            } else {
                // 默认第一列为节次
                timeSlot = firstText || '未知节次';
                startIdx = 1;
            }

            // 跳过表头行（包含“星期”或“节次”）
            if (timeSlot.includes('节次') || cells[0]?.innerText.includes('星期')) return;

            // 遍历星期列
            for (let i = startIdx; i < cells.length; i++) {
                const content = cells[i].innerText.trim().replace(/\s+/g, ' ');
                if (!content || content.length < 2) continue;
                if (content.includes('星期') || content.includes('节次')) continue;

                // 拆分课程信息（正方格式通常为：课程名\n教师\n教室 或 课程名\n教师\n时间\n教室）
                const parts = content.split('\n').filter(p => p.trim());
                let course = parts[0] || '';
                let teacher = parts[1] || '';
                let room = parts[2] || '';
                // 如果第三个是时间，则第四个是教室
                if (room.includes('节') && parts.length > 3) {
                    room = parts[3] || '';
                }

                // 计算星期几（列索引偏移）
                const dayNum = (startIdx === 1) ? i : i - 1; // 若第一列是节次，则星期从第2列开始
                const weekDay = weekMap[dayNum] || dayNum;

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

    // 主流程
    waitForTable((table) => {
        const data = extractSchedule(table);
        if (data.length === 0) {
            alert('提取结果为空，请检查课表页面是否显示正常。');
            return;
        }

        console.table(data);
        const jsonStr = JSON.stringify(data, null, 2);
        console.log('📋 课表 JSON 数据：', jsonStr);

        // 尝试复制到剪贴板
        try {
            copy(jsonStr);
            alert(`✅ 成功提取 ${data.length} 条课程记录，已复制 JSON 到剪贴板。`);
        } catch (e) {
            alert(`✅ 提取成功，共 ${data.length} 条记录。请手动复制控制台输出的 JSON。`);
        }

        // 如果运行环境支持，还可以将数据挂载到 window 供外部调用
        window.__scheduleData = data;
    });

})();
