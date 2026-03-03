import Dexie, { Table } from 'dexie';

export interface Memo {
  id?: string;
  title: string;
  content: string;
  created_at?: string;
  is_synced: number; // 0: 미동기화, 1: 동기화됨
}

export class MyDatabase extends Dexie {
  memos!: Table<Memo>;

  constructor() {
    super('MemoDatabase');
    this.version(1).stores({
      memos: '++id, title, is_synced' // ID와 동기화 여부로 인덱싱
    });
  }
}

export const db = new MyDatabase();