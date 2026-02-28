"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SearchParamsHandler({ onParamsChange }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (onParamsChange) {
      onParamsChange(searchParams);
    }
  }, [searchParams, onParamsChange]);

  return null;
}
