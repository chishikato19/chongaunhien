
import React from 'react';
import { Student } from '../types';

export const BADGE_INFO: {[key: string]: string} = {
    'KNOWLEDGE_KING': 'Vị Vua Tri Thức: Người nhiều điểm nhất lớp (Duy nhất)',
    'RANK_APPRENTICE': 'Học Việc: Đạt mốc 10 XP',
    'RANK_BACHELOR': 'Cử Nhân: Đạt mốc 50 XP',
    'RANK_MASTER': 'Thạc Sĩ: Đạt mốc 100 XP',
    'RANK_PHD': 'Tiến Sĩ: Đạt mốc 200 XP',
    'RANK_PROFESSOR': 'Giáo Sư: Đạt mốc 500 XP',
    'FIRST_PICK': 'Tân binh: Lần đầu được gọi!',
    'LUCKY_STAR': 'Sao may mắn: Nhận điểm may mắn',
    'SURVIVOR': 'Vua lì đòn: Bị trừ điểm nhưng vẫn cười',
    'QUIZ_WIZARD': 'Phù thủy tri thức: Trả lời đúng',
    'SPEED_DEMON': 'Thần tốc: Trả lời cực nhanh',
    'STREAK_3': 'Chuỗi thắng: 3 lần đúng liên tiếp',
    'GROUP_POWER': 'Team Đoàn Kết: Cả nhóm cùng chiến thắng'
};

export const BADGE_ICONS: {[key: string]: React.ReactNode} = {
    'KNOWLEDGE_KING': '👑',
    'RANK_APPRENTICE': '🔨',
    'RANK_BACHELOR': '📜',
    'RANK_MASTER': '🎓',
    'RANK_PHD': '🔬',
    'RANK_PROFESSOR': '🏫',
    'FIRST_PICK': '🌱', 
    'LUCKY_STAR': '🍀',
    'SURVIVOR': '🛡️',
    'QUIZ_WIZARD': '🧙‍♂️',
    'SPEED_DEMON': '⚡',
    'STREAK_3': '🔥',
    'GROUP_POWER': '🤝'
};

// Badges that rely on score thresholds
export const SCORE_BASED_BADGES = ['RANK_APPRENTICE', 'RANK_BACHELOR', 'RANK_MASTER', 'RANK_PHD', 'RANK_PROFESSOR'];

export const HELP_CONTENT = [
    {
        title: "1. Tổng Quan",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <p><b>ClassRandomizer</b> là ứng dụng hỗ trợ giáo viên chọn học sinh ngẫu nhiên, quản lý điểm số và tổ chức trò chơi trong lớp học.</p>
                <p>Ứng dụng chạy hoàn toàn trên trình duyệt, không cần cài đặt. Dữ liệu được lưu trong bộ nhớ máy (LocalStorage).</p>
            </div>
        )
    },
    {
        title: "2. Google Apps Script (Cloud Sync)",
        content: (
            <div className="space-y-2 text-sm text-gray-600">
                <p>Để đồng bộ dữ liệu giữa các máy, bạn cần tạo một Google Apps Script. Các bước thực hiện:</p>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Truy cập <a href="https://script.google.com/" target="_blank" className="text-blue-600 underline">script.google.com</a> và tạo dự án mới.</li>
                    <li>Xóa toàn bộ code cũ và dán đoạn code bên dưới vào.</li>
                    <li>Nhấn <b>Deploy</b> (Triển khai) → <b>New Deployment</b> (Tùy chọn mới).</li>
                    <li>Chọn loại: <b>Web App</b>.</li>
                    <li>Who has access (Ai có quyền truy cập): Chọn <b>Anyone</b> (Bất kỳ ai).</li>
                    <li>Copy URL (Web App URL) và dán vào ô "Google Script URL" trong ứng dụng này.</li>
                </ol>
                <div className="bg-gray-800 text-green-400 p-3 rounded-md text-xs font-mono overflow-x-auto select-all mt-2">
{`function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var key = postData.key || 'backup_default';
    var value = postData.value;
    saveDataChunked(key, value);
    return ContentService.createTextOutput(JSON.stringify({'result': 'success', 'message': 'Saved successfully'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({'result': 'error', 'message': error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet(e) {
  try {
    var key = 'class_randomizer_backup';
    var data = loadDataChunked(key);
    var result = {};
    if (data) result[key] = data;
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({'result': 'error', 'message': error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
function saveDataChunked(key, dataObj) {
  var sheet = getSheet();
  var jsonString = JSON.stringify(dataObj);
  var chunkSize = 45000;
  var chunks = [];
  for (var i = 0; i < jsonString.length; i += chunkSize) chunks.push(jsonString.substring(i, i + chunkSize));
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var rowIndex = -1;
  for (var i = 0; i < values.length; i++) { if (values[i][0] == key) { rowIndex = i + 1; break; } }
  if (rowIndex == -1) { rowIndex = sheet.getLastRow() + 1; sheet.getRange(rowIndex, 1).setValue(key); }
  var maxCols = sheet.getMaxColumns();
  if (maxCols > 1) sheet.getRange(rowIndex, 2, 1, maxCols - 1).clearContent();
  for (var j = 0; j < chunks.length; j++) sheet.getRange(rowIndex, j + 2).setValue(chunks[j]);
  sheet.getRange(rowIndex, 1).setNote("Updated: " + new Date());
}
function loadDataChunked(key) {
  var sheet = getSheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] == key) {
      var row = values[i];
      var jsonString = "";
      for (var j = 1; j < row.length; j++) { if (row[j]) jsonString += row[j]; }
      return JSON.parse(jsonString);
    }
  }
  return null;
}
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Database");
  if (!sheet) sheet = ss.insertSheet("Database");
  return sheet;
}`}
                </div>
            </div>
        )
    }
];

export const checkAchievements = (student: Student, actionType: 'PICK' | 'SCORE' | 'LUCKY' | 'CORRECT_ANSWER', scoreDelta: number = 0, thresholds: {[key: string]: number}): string[] => {
    const currentBadges = student.achievements || [];
    const newBadges: string[] = [];
    const checkScore = student.cumulativeScore || student.score;

    if (actionType === 'PICK' && student.lastPickedDate === null && !currentBadges.includes('FIRST_PICK')) newBadges.push('FIRST_PICK');

    // Rank Checks
    if (checkScore >= (thresholds['RANK_APPRENTICE'] || 10) && !currentBadges.includes('RANK_APPRENTICE')) newBadges.push('RANK_APPRENTICE');
    if (checkScore >= (thresholds['RANK_BACHELOR'] || 50) && !currentBadges.includes('RANK_BACHELOR')) newBadges.push('RANK_BACHELOR');
    if (checkScore >= (thresholds['RANK_MASTER'] || 100) && !currentBadges.includes('RANK_MASTER')) newBadges.push('RANK_MASTER');
    if (checkScore >= (thresholds['RANK_PHD'] || 200) && !currentBadges.includes('RANK_PHD')) newBadges.push('RANK_PHD');
    if (checkScore >= (thresholds['RANK_PROFESSOR'] || 500) && !currentBadges.includes('RANK_PROFESSOR')) newBadges.push('RANK_PROFESSOR');

    if (actionType === 'LUCKY' && !currentBadges.includes('LUCKY_STAR')) newBadges.push('LUCKY_STAR');
    if (scoreDelta < 0 && !currentBadges.includes('SURVIVOR')) newBadges.push('SURVIVOR');
    if (actionType === 'CORRECT_ANSWER' && !currentBadges.includes('QUIZ_WIZARD')) newBadges.push('QUIZ_WIZARD');

    return newBadges;
};
