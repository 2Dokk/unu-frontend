"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  loading: boolean;
  onVerify: (sid: string, name: string, accessCode: string) => void;
}

const inputCls =
  "w-full rounded-[11px] border border-line-input bg-surface-input px-3.5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-brand focus:bg-white disabled:opacity-60";

export default function AuthScreen({ loading, onVerify }: Props) {
  const [sid, setSid] = useState("");
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);

  const canVerify =
    sid.trim().length >= 4 &&
    name.trim().length >= 1 &&
    accessCode.trim().length >= 1 &&
    !loading;

  const submit = () => {
    if (!canVerify) return;
    onVerify(sid.trim(), name.trim(), accessCode.trim());
  };

  return (
    <main className="mx-auto max-w-[420px] px-5 pt-11 pb-20 sm:px-7">
      <div className="mb-[30px] text-center">
        <Image
          src="/cnu-logo.png"
          alt="CNU"
          width={52}
          height={52}
          priority
          className="mx-auto mb-[18px] h-[52px] w-[52px] rounded-[14px]"
        />
        <h1 className="mb-2 text-[23px] font-extrabold tracking-[-0.6px]">학회원 인증</h1>
        <p className="text-sm leading-relaxed text-hint">
          학회원 확인을 위해 학번, 이름, 인증 코드를 입력해 주세요.
        </p>
      </div>

      <div className="rounded-[18px] border border-line bg-white px-[26px] py-7">
        <label className="mb-[7px] block text-[12.5px] font-bold text-ink-3">학번</label>
        <input
          value={sid}
          onChange={(e) => setSid(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="예: 20261234"
          inputMode="numeric"
          disabled={loading}
          className={`${inputCls} mb-4`}
        />

        <label className="mb-[7px] block text-[12.5px] font-bold text-ink-3">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="예: 김크누"
          disabled={loading}
          className={`${inputCls} mb-4`}
        />

        <label className="mb-[7px] block text-[12.5px] font-bold text-ink-3">인증 코드</label>
        <div className="relative mb-[22px]">
          <input
            type={showAccessCode ? "text" : "password"}
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="전달받은 인증 코드를 입력하세요"
            disabled={loading}
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowAccessCode((prev) => !prev)}
            disabled={loading}
            aria-label={showAccessCode ? "인증 코드 숨기기" : "인증 코드 보기"}
            className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-hint hover:bg-line-soft hover:text-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showAccessCode ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.9 10.9 0 0 1 12 20C7 20 2.73 16.89 1 12a11.7 11.7 0 0 1 4.06-5.94" />
                <path d="M9.9 4.24A10.7 10.7 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.17 3.19" />
                <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                <path d="M1 1l22 22" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={submit}
          disabled={!canVerify}
          className={`w-full rounded-xl py-3.5 text-[15px] font-bold transition-colors ${
            canVerify
              ? "cursor-pointer bg-brand-dark text-white hover:bg-brand"
              : "cursor-not-allowed bg-[#e4e7ee] text-[#8b93a3]"
          }`}
        >
          {loading ? "확인 중…" : "확인"}
        </button>
      </div>
    </main>
  );
}
