"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db'; // 2단계에서 만든 Dexie DB
import { useLiveQuery } from 'dexie-react-hooks';
import { PlusIcon, TrashIcon, SunIcon, MoonIcon, BookOpenIcon, PencilIcon, CloudArrowUpIcon, CloudIcon } from '@heroicons/react/24/outline';

export default function MemoApp() {
  // 1. 로컬 DB에서 메모 목록 실시간 구독 (인터넷 없어도 즉시 뜸)
  const memos = useLiveQuery(() => db.memos.toArray(), []) || [];
  const [activeTabId, setActiveTabId] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 초기 설정
  useEffect(() => {
    setIsMounted(true);
    syncInitialData();
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  // 테마 적용
  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.theme = 'dark'; }
    else { document.documentElement.classList.remove('dark'); localStorage.theme = 'light'; }
  }, [isDarkMode]);

  // [핵심] 2. 데이터 동기화 로직
  const syncInitialData = async () => {
    // 온라인이면 Supabase에서 최신 데이터를 가져와 로컬 DB 업데이트
    if (navigator.onLine) {
      const { data: remoteMemos } = await supabase.from('memos').select('*');
      if (remoteMemos) {
        for (const m of remoteMemos) {
          await db.memos.put({ ...m, is_synced: 1 });
        }
      }
    }
    // 첫 메모 설정
    const allMemos = await db.memos.toArray();
    if (allMemos.length > 0) setActiveTabId(allMemos[0].id);
    else addTab();
  };

  // 온라인 복구 시 자동 동기화 감지
  useEffect(() => {
    const handleOnline = async () => {
      const unsynced = await db.memos.where('is_synced').equals(0).toArray();
      for (const m of unsynced) {
        const { error } = await supabase.from('memos').upsert({ id: m.id, title: m.title, content: m.content });
        if (!error) await db.memos.update(m.id!, { is_synced: 1 });
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // 3. 메모 추가
  const addTab = async () => {
    const newId = crypto.randomUUID();
    const newMemo = { id: newId, title: '새 메모', content: '', is_synced: 0 };
    await db.memos.add(newMemo);
    setActiveTabId(newId);
    
    if (navigator.onLine) {
      const { error } = await supabase.from('memos').insert([{ id: newId, title: '새 메모', content: '' }]);
      if (!error) await db.memos.update(newId, { is_synced: 1 });
    }
  };

  // 4. 메모 삭제
  const deleteTab = async (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("메모를 삭제할까요?")) return;
    await db.memos.delete(id);
    if (navigator.onLine) await supabase.from('memos').delete().eq('id', id);
    if (activeTabId === id && memos.length > 1) setActiveTabId(memos[0].id);
  };

  // 5. 실시간 편집 및 자동 저장 (디바운싱)
  useEffect(() => {
    const activeMemo = memos.find(m => m.id === activeTabId);
    if (!activeMemo) return;

    const timeout = setTimeout(async () => {
      await db.memos.update(activeTabId, { is_synced: 0 });
      if (navigator.onLine) {
        const { error } = await supabase.from('memos').upsert({ id: activeTabId, title: activeMemo.title, content: activeMemo.content });
        if (!error) await db.memos.update(activeTabId, { is_synced: 1 });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [memos, activeTabId]);

  const activeMemo = memos.find(m => m.id === activeTabId) || { title: '', content: '', is_synced: 1 };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen bg-[#FBFBFA] dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4] transition-colors duration-200">
      <header className="flex justify-between items-center px-4 py-2 bg-[#F7F6F3] dark:bg-[#202020] border-b dark:border-[#2F2F2F]">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          {activeMemo.is_synced ? <CloudIcon className="w-4 h-4 text-green-500" /> : <CloudArrowUpIcon className="w-4 h-4 text-orange-400 animate-pulse" />}
          <span>{activeMemo.is_synced ? 'Synced' : 'Syncing...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPreview(!isPreview)} className="p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F2F] rounded-md transition-colors">
            {isPreview ? <PencilIcon className="w-4 h-4" /> : <BookOpenIcon className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-gray-200 dark:hover:bg-[#2F2F2F] rounded-md transition-colors">
            {isDarkMode ? <SunIcon className="w-4 h-4 text-yellow-500" /> : <MoonIcon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* 상단 탭 */}
      <div className="flex items-end px-2 bg-[#F7F6F3] dark:bg-[#202020] border-b dark:border-[#2F2F2F] overflow-x-auto no-scrollbar">
        {memos.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group flex items-center min-w-[120px] max-w-[200px] px-3 py-2 mr-1 text-sm rounded-t-lg cursor-pointer transition-all ${
              activeTabId === tab.id ? 'bg-[#FBFBFA] dark:bg-[#191919] border-t border-l border-r dark:border-[#2F2F2F] font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-[#EFEFEE] dark:hover:bg-[#2A2A2A]'
            }`}
          >
            <span className="truncate flex-1">{tab.title || '제목 없음'}</span>
            <button onClick={(e) => deleteTab(tab.id, e)} className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-500">
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={addTab} className="p-2 mb-1 hover:bg-gray-200 dark:hover:bg-[#2F2F2F] rounded-md text-gray-500"><PlusIcon className="w-4 h-4" /></button>
      </div>

      <main className="flex-1 overflow-y-auto p-8 md:px-24 lg:px-64">
        {isPreview ? (
          <article className="prose dark:prose-invert max-w-none">
            <h1 className="text-4xl font-extrabold mb-8 border-b pb-4 dark:border-[#2F2F2F]">{activeMemo.title}</h1>
            <ReactMarkdown>{activeMemo.content}</ReactMarkdown>
          </article>
        ) : (
          <div className="h-full flex flex-col">
            <input
              type="text"
              className="bg-transparent text-4xl font-extrabold mb-8 outline-none placeholder-gray-300 dark:placeholder-gray-700"
              placeholder="Untitled"
              value={activeMemo.title}
              onChange={(e) => db.memos.update(activeTabId, { title: e.target.value, is_synced: 0 })}
            />
            <textarea
              className="flex-1 bg-transparent w-full outline-none resize-none text-lg leading-relaxed placeholder-gray-300 dark:placeholder-gray-700 font-mono"
              placeholder="내용을 입력하세요..."
              value={activeMemo.content}
              onChange={(e) => db.memos.update(activeTabId, { content: e.target.value, is_synced: 0 })}
            />
          </div>
        )}
      </main>
    </div>
  );
}