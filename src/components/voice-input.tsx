"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Notice } from "./ui";
import { Button } from "./button";

/**
 * 浏览器语音输入。
 *
 * 只做 Web Speech API 的转写，转写结果必须显示出来并由用户确认或修正后
 * 才通过 onConfirm 交给上层。未确认的转写不会进入任何模型。
 *
 * 刻意不采集也不传输音频，不做任何声纹、语速、情绪特征分析：
 * 平台不会从语音特征推断人格或能力。
 */

type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInput({
  label,
  onConfirm,
  confirmLabel = "确认这段转写",
  compact = false,
}: {
  label: string;
  onConfirm: (transcript: string) => void;
  confirmLabel?: string;
  compact?: boolean;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // 只做卸载清理。浏览器支持情况在首次点击时判定，避免服务端渲染与
  // 客户端首帧不一致，也避免在 effect 里同步 setState。
  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    },
    [],
  );

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setError("");
    const recognition = new Ctor();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result?.isFinal) finalText += result[0]?.transcript ?? "";
      }
      if (finalText) setTranscript((prev) => `${prev}${finalText}`);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "浏览器没有授予麦克风权限，可以改用文字输入"
          : "语音识别中断，可以重试或改用文字输入",
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {supported === false ? (
            <span className="text-xs text-slate-500">当前浏览器不支持语音输入</span>
          ) : listening ? (
            <Button variant="secondary" onClick={stop} className="min-h-9 px-3 text-xs">
              <span className="size-2 animate-pulse rounded-full bg-rose-500" />
              停止聆听
            </Button>
          ) : (
            <Button variant="ghost" onClick={start} className="min-h-9 px-3 text-xs">
              <span aria-hidden="true">◉</span>
              {label}
            </Button>
          )}
          {transcript && (
            <Button variant="ghost" onClick={() => setTranscript("")} className="min-h-9 px-2 text-xs">
              清空
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-amber-700">{error}</p>}
        {transcript && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-2">
            <label className="sr-only" htmlFor={`transcript-${label}`}>
              {label}转写结果
            </label>
            <textarea
              id={`transcript-${label}`}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-sky-200 bg-white p-2 text-sm leading-relaxed"
              placeholder="确认前可以修正转写"
            />
            <Button
              onClick={() => {
                onConfirm(transcript.trim());
                setTranscript("");
              }}
              disabled={transcript.trim().length === 0}
              className="mt-2 min-h-9 px-3 text-xs"
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        <Badge tone="info">仅转写文本，不上传音频</Badge>
        {listening && <Badge tone="warn">正在聆听</Badge>}
      </div>

      {supported === false && (
        <Notice tone="warn">
          当前浏览器不支持 Web Speech API，请改用文字输入。语音只是可选入口，
          不影响主流程。
        </Notice>
      )}

      {supported !== false && (
        <div className="flex flex-wrap gap-2">
          {listening ? (
            <Button variant="secondary" onClick={stop}>
              停止录音
            </Button>
          ) : (
            <Button variant="secondary" onClick={start}>
              开始语音输入
            </Button>
          )}
          {transcript && (
            <Button variant="ghost" onClick={() => setTranscript("")}>
              清空转写
            </Button>
          )}
        </div>
      )}

      {error && <Notice tone="warn">{error}</Notice>}

      {transcript && (
        <div className="space-y-2">
          <label
            className="block text-xs text-slate-600"
            htmlFor={`transcript-${label}`}
          >
            转写结果（可直接修正，确认后才会进入模型）
          </label>
          <textarea
            id={`transcript-${label}`}
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed"
          />
          <Button
            onClick={() => {
              onConfirm(transcript.trim());
              setTranscript("");
            }}
            disabled={transcript.trim().length === 0}
          >
            {confirmLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
