"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase'; // 방금 만든 파일 불러오기

export default function MemoApp() {
  const [tabs, setTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 1. 데이터 불러오기 (DB에서)
  useEffect(() => {
    setIsMounted(true);
    fetchMemos();
  }, []);

  async function fetchMemos() {
    const { data, error } = await supabase.from('memos').select('*').order('created_at', { ascending: true });
    if (data && data.length > 0) {
      setTabs(data);
      setActiveTabId(data[0].id);
    } else {
      // 데이터가 없으면 초기 메모 생성
      addTab();
    }
  }

  // 2. 새 메모 추가 (DB에 저장)
  const addTab = async () => {
    const newMemo = { title: '제목 없음', content: '' };
    const { data, error } = await supabase.from('memos').insert([newMemo]).select();
    if (data) {
      setTabs([...tabs, data[0]]);
      setActiveTabId(data[0].id);
    }
  };

  // 3. 실시간 저장 (타이핑 멈추면 저장)
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    const timeout = setTimeout(async () => {
      await supabase
        .from('memos')
        .update({ title: activeTab.title, content: activeTab.content })
        .eq('id', activeTab.id);
    }, 1000); // 1초 뒤에 자동 저장

    return () => clearTimeout(timeout);
  }, [tabs, activeTabId]);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || { title: '', content: '' };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen bg-[#F7F7F5] text-gray-800">
      <div className="flex items-end bg-[#EBEBE9] px-2 pt-2 border-b">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`px-4 py-1.5 mr-1 text-sm rounded-t-md cursor-pointer border-t border-l border-r ${
              activeTabId === tab.id ? 'bg-[#F7F7F5] border-gray-300 font-bold' : 'opacity-50'
            }`}
          >
            {tab.title.substring(0, 10) || '제목 없음'}
          </div>
        ))}
        <button onClick={addTab} className="px-3 py-1 mb-1 hover:bg-gray-300 rounded">+</button>
      </div>

      <div className="p-2 border-b flex justify-end bg-white">
        <button onClick={() => setIsPreview(!isPreview)} className="text-xs px-3 py-1 bg-blue-500 text-white rounded">
          {isPreview ? '편집' : '미리보기'}
        </button>
      </div>

      <main className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full bg-white shadow-sm">
        {isPreview ? (
          <div className="prose max-w-none"><ReactMarkdown>{activeTab.content}</ReactMarkdown></div>
        ) : (
          <textarea
            className="w-full h-full outline-none bg-transparent resize-none text-lg leading-relaxed font-mono"
            value={activeTab.content}
            onChange={(e) => {
              const newContent = e.target.value;
              const firstLine = newContent.split('\n')[0].replace('#', '').trim();
              setTabs(tabs.map(t => t.id === activeTabId ? { ...t, content: newContent, title: firstLine || '제목 없음' } : t));
            }}
          />
        )}
      </main>
    </div>
  );
}