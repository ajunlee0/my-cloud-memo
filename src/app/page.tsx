"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { PlusIcon, TrashIcon, SunIcon, MoonIcon, BookOpenIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function MemoApp() {
  const [tabs, setTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 초기 설정 로드
  useEffect(() => {
    setIsMounted(true);
    fetchMemos();
    // 시스템 테마 확인 또는 로컬스토리지 확인
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  // 다크모드 적용
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  async function fetchMemos() {
    const { data } = await supabase.from('memos').select('*').order('created_at', { ascending: true });
    if (data && data.length > 0) {
      setTabs(data);
      setActiveTabId(data[0].id);
    } else {
      addTab();
    }
  }

  const addTab = async () => {
    const newMemo = { title: '새 메모', content: '' };
    const { data } = await supabase.from('memos').insert([newMemo]).select();
    if (data) {
      setTabs([...tabs, data[0]]);
      setActiveTabId(data[0].id);
    }
  };

  const deleteTab = async (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return alert("최소 하나의 메모는 있어야 합니다.");
    if (!confirm("메모를 삭제할까요?")) return;
    
    await supabase.from('memos').delete().eq('id', id);
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
  };

  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    const timeout = setTimeout(async () => {
      await supabase
        .from('memos')
        .update({ title: activeTab.title, content: activeTab.content })
        .eq('id', activeTab.id);
    }, 800);

    return () => clearTimeout(timeout);
  }, [tabs, activeTabId]);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || { title: '', content: '' };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen bg-notion-bg dark:bg-notion-dark-bg text-notion-text dark:text-notion-dark-text transition-colors duration-200">
      
      {/* 상단바: 다크모드 & 프리뷰 토글 */}
      <header className="flex justify-between items-center px-4 py-2 bg-[#F7F6F3] dark:bg-[#202020] border-b dark:border-[#2F2F2F]">
        <div className="flex gap-2 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1">☁️ Cloud Synced</span>
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

      {/* 상단 탭 영역 (Chrome/Windows 메모장 스타일) */}
      <div className="flex items-end px-2 bg-[#F7F6F3] dark:bg-[#202020] border-b dark:border-[#2F2F2F] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group flex items-center min-w-[120px] max-w-[200px] px-3 py-2 mr-1 text-sm rounded-t-lg cursor-pointer transition-all ${
              activeTabId === tab.id 
                ? 'bg-[#FBFBFA] dark:bg-[#191919] border-t border-l border-r dark:border-[#2F2F2F] font-semibold text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 hover:bg-[#EFEFEE] dark:hover:bg-[#2A2A2A]'
            }`}
          >
            <span className="truncate flex-1">{tab.title || '제목 없음'}</span>
            <button 
              onClick={(e) => deleteTab(tab.id, e)} 
              className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={addTab} className="p-2 mb-1 hover:bg-gray-200 dark:hover:bg-[#2F2F2F] rounded-md transition-colors text-gray-500">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 메인 편집 영역 */}
      <main className="flex-1 overflow-y-auto bg-[#FBFBFA] dark:bg-[#191919] p-8 md:px-24 lg:px-64">
        {isPreview ? (
          <article className="prose dark:prose-invert max-w-none">
            <h1 className="text-4xl font-extrabold mb-8 border-b pb-4 dark:border-[#2F2F2F]">{activeTab.title}</h1>
            <ReactMarkdown>{activeTab.content}</ReactMarkdown>
          </article>
        ) : (
          <div className="h-full flex flex-col">
            <input
              type="text"
              className="bg-transparent text-4xl font-extrabold mb-8 outline-none placeholder-gray-300 dark:placeholder-gray-700"
              placeholder="Untitled"
              value={activeTab.title}
              onChange={(e) => setTabs(tabs.map(t => t.id === activeTabId ? { ...t, title: e.target.value } : t))}
            />
            <textarea
              className="flex-1 bg-transparent w-full outline-none resize-none text-lg leading-relaxed placeholder-gray-300 dark:placeholder-gray-700 font-mono"
              placeholder="여기에 내용을 입력하세요 (마크다운 지원)..."
              value={activeTab.content}
              onChange={(e) => setTabs(tabs.map(t => t.id === activeTabId ? { ...t, content: e.target.value } : t))}
            />
          </div>
        )}
      </main>
    </div>
  );
}