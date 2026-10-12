"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ds/Button";

const CAT_URL = "https://cataas.com/cat/cute";

type Status = "loading" | "loaded" | "error";

// 글 상세 커버 — 열 때마다 랜덤 고양이 사진. 저장하지 않는다.
export function CoverImage() {
  // 같은 주소면 브라우저가 이전 사진을 재사용하므로, 요청마다 다른 값을 붙인다.
  const [seed, setSeed] = useState(() => Date.now());
  const [status, setStatus] = useState<Status>("loading");
  const imgRef = useRef<HTMLImageElement>(null);
  const src = `${CAT_URL}?t=${seed}`;

  // 이벤트가 붙기 전에 이미 다 받아진 경우(캐시)를 놓치지 않는다.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, [seed]);

  function retry() {
    setStatus("loading");
    setSeed(Date.now());
  }

  return (
    <div className={`cover cover--${status}`} aria-busy={status === "loading"}>
      {status === "error" ? (
        <div className="cover__error">
          <p>고양이 사진을 불러오지 못했어요</p>
          <Button variant="secondary" size="sm" onClick={retry}>다시 불러오기</Button>
        </div>
      ) : (
        <>
          {/* 사진은 자르지 않고 통째로, 남는 양옆은 같은 사진을 흐리게 깔아 채운다. */}
          <img key={`bg-${seed}`} className="cover__backdrop" src={src} alt="" aria-hidden="true" />
          <img
            key={seed}
            ref={imgRef}
            className="cover__img"
            src={src}
            alt="고양이 커버 사진"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        </>
      )}
    </div>
  );
}
