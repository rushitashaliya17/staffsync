import fs from 'fs';
import path from 'path';

// StaffSync Persistent JSON Database Store
// Mirroring MongoDB collections, indexes, and document structures with persistence to disk.
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'staffsync.json');

export interface IDatabase {
  users: any[];
  employees: any[];
  departments: any[];
  attendances: any[];
  leaves: any[];
  leavePolicies: any[];
  leaveBalances: any[];
  announcements: any[];
  trainings: any[];
  trainingEnrollments: any[];
  notifications: any[];
  auditLogs: any[];
}

const defaultData: IDatabase = {
  users: [],
  employees: [],
  departments: [],
  attendances: [],
  leaves: [],
  leavePolicies: [],
  leaveBalances: [],
  announcements: [],
  trainings: [],
  trainingEnrollments: [],
  notifications: [],
  auditLogs: []
};

class DatabaseStore {
  private data: IDatabase = { ...defaultData };
  private initialized = false;

  public init() {
    if (this.initialized) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...defaultData, ...JSON.parse(content) };
      } catch (err) {
        console.error('Error loading db file, starting fresh', err);
        this.data = { ...defaultData };
      }
    } else {
      this.save();
    }
    this.initialized = true;
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  public get<K extends keyof IDatabase>(collection: K): IDatabase[K] {
    this.init();
    return this.data[collection];
  }

  public set<K extends keyof IDatabase>(collection: K, items: IDatabase[K]) {
    this.init();
    this.data[collection] = items;
    this.save();
  }

  public reset() {
    this.data = {
      users: [],
      employees: [],
      departments: [],
      attendances: [],
      leaves: [],
      leavePolicies: [],
      leaveBalances: [],
      announcements: [],
      trainings: [],
      trainingEnrollments: [],
      notifications: [],
      auditLogs: []
    };
    this.save();
  }
}

export const db = new DatabaseStore();

export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
