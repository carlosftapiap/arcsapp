import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || './logs';
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB max per log file

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating log directory:', error);
  }
}

function getLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `app-${date}.log`);
}

function rotateLogIfNeeded(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_LOG_SIZE) {
        const timestamp = Date.now();
        fs.renameSync(filePath, `${filePath}.${timestamp}.bak`);
      }
    }
  } catch (error) {
    console.error('Error rotating log:', error);
  }
}

function formatLogEntry(entry: LogEntry): string {
  let log = `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
  if (entry.data) {
    try {
      log += `\n  Data: ${JSON.stringify(entry.data, null, 2).replace(/\n/g, '\n  ')}`;
    } catch {
      log += `\n  Data: [Unable to stringify]`;
    }
  }
  if (entry.stack) {
    log += `\n  Stack: ${entry.stack.replace(/\n/g, '\n  ')}`;
  }
  return log + '\n';
}

function writeLog(level: LogLevel, message: string, data?: any, error?: Error) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    stack: error?.stack,
  };

  // Always log to console
  const consoleMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
  consoleMethod(`[${level}] ${message}`, data || '', error?.stack || '');

  // Write to file in production
  if (process.env.NODE_ENV === 'production') {
    try {
      ensureLogDir();
      const filePath = getLogFilePath();
      rotateLogIfNeeded(filePath);
      fs.appendFileSync(filePath, formatLogEntry(entry));
    } catch (err) {
      console.error('Error writing to log file:', err);
    }
  }
}

export const logger = {
  info: (message: string, data?: any) => writeLog('INFO', message, data),
  warn: (message: string, data?: any) => writeLog('WARN', message, data),
  error: (message: string, error?: Error | any, data?: any) => {
    const err = error instanceof Error ? error : new Error(String(error));
    writeLog('ERROR', message, data, err);
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG === 'true') {
      writeLog('DEBUG', message, data);
    }
  },
};

export async function getRecentLogs(lines: number = 100): Promise<string[]> {
  try {
    ensureLogDir();
    const filePath = getLogFilePath();
    
    if (!fs.existsSync(filePath)) {
      return ['No logs found for today'];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    
    return allLines.slice(-lines);
  } catch (error) {
    return [`Error reading logs: ${error}`];
  }
}

export async function getAllLogFiles(): Promise<string[]> {
  try {
    ensureLogDir();
    const files = fs.readdirSync(LOG_DIR);
    return files.filter(f => f.endsWith('.log')).sort().reverse();
  } catch (error) {
    return [];
  }
}

export async function getLogFileContent(filename: string, lines: number = 200): Promise<string[]> {
  try {
    const filePath = path.join(LOG_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return ['Log file not found'];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    
    return allLines.slice(-lines);
  } catch (error) {
    return [`Error reading log file: ${error}`];
  }
}
