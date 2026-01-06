import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据库文件存储在项目根目录
const dbPath = path.join(process.cwd(), 'history.db');

const db = new Database(dbPath);

// 初始化数据库表
db.exec(`
    CREATE TABLE IF NOT EXISTS image_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT,
        negative_prompt TEXT,
        model TEXT,
        mode TEXT,
        image_name TEXT,
        layers TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/**
 * 保存生成记录到数据库
 */
export function saveToHistory(data: {
    prompt: string;
    negative_prompt?: string;
    model: string;
    mode: string;
    image_name: string;
    layers?: string;
}) {
    const stmt = db.prepare(`
        INSERT INTO image_history (prompt, negative_prompt, model, mode, image_name, layers)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(data.prompt, data.negative_prompt || '', data.model, data.mode, data.image_name, data.layers || '[]');
}

/**
 * 获取所有历史记录
 */
export function getHistory() {
    return db.prepare('SELECT * FROM image_history ORDER BY timestamp DESC').all();
}

/**
 * 确保图片存储目录存在
 */
export function ensureImageDir() {
    const dir = path.join(process.cwd(), 'public', 'generate_images');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
