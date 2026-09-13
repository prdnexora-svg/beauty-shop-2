import { useEffect, useState } from 'react';
import {
  SkincareDisplayStyleId,
  SKINCARE_DISPLAY_STYLES,
  getSkincareDisplayLabel,
  SKINCARE_SUBCATEGORIES,
} from '../data/skincareSubcategoryStyles';

const STORAGE_KEY = 'nexora_skincare_display_style';
const DEFAULT_STYLE: SkincareDisplayStyleId = 'pureEnglish';

function readStoredStyle(): SkincareDisplayStyleId {
  if (typeof window === 'undefined') return DEFAULT_STYLE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as SkincareDisplayStyleId | null;
    if (stored && SKINCARE_DISPLAY_STYLES.some((s) => s.id === stored)) {
      return stored;
    }
  } catch {}
  return DEFAULT_STYLE;
}

export function useSkincareDisplayStyle() {
  const [styleId, setStyleId] = useState<SkincareDisplayStyleId>(() => readStoredStyle());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStyleId(readStoredStyle());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, styleId);
    } catch {}
  }, [styleId, mounted]);

  const currentStyle = SKINCARE_DISPLAY_STYLES.find((s) => s.id === styleId) || SKINCARE_DISPLAY_STYLES[1];

  // Helper to translate any canonical skincare subcategory name to current display style
  const translate = (canonicalName: string): string => {
    // Try to find item by canonical or by pure english
    const normalized = canonicalName.trim().toLowerCase();
    const item = SKINCARE_SUBCATEGORIES.find(
      (it) =>
        it.canonicalEnglish.toLowerCase() === normalized ||
        it.pureEnglish.toLowerCase() === normalized ||
        it.hindiEnglishMix.toLowerCase() === normalized ||
        it.simpleHinglish.toLowerCase() === normalized ||
        it.id === normalized
    );
    if (!item) return canonicalName; // fallback for non-skincare or unknown
    return getSkincareDisplayLabel(item, styleId);
  };

  // For subcategory lists
  const translateList = (names: string[]): string[] => names.map(translate);

  return {
    styleId,
    setStyleId,
    currentStyle,
    allStyles: SKINCARE_DISPLAY_STYLES,
    translate,
    translateList,
    isHindiMix: styleId === 'hindiEnglishMix',
    isPureEnglish: styleId === 'pureEnglish',
    isSimpleHinglish: styleId === 'simpleHinglish',
    mounted,
  };
}

// Non-hook helper for places outside React (e.g., taxonomyService)
export function getStoredSkincareDisplayStyle(): SkincareDisplayStyleId {
  return readStoredStyle();
}

export function formatSkincareSubcategoryForDisplay(
  canonicalName: string,
  style: SkincareDisplayStyleId
): string {
  const normalized = canonicalName.trim().toLowerCase();
  const item = SKINCARE_SUBCATEGORIES.find(
    (it) =>
      it.canonicalEnglish.toLowerCase() === normalized ||
      it.pureEnglish.toLowerCase() === normalized ||
      it.hindiEnglishMix.toLowerCase() === normalized ||
      it.simpleHinglish.toLowerCase() === normalized ||
      it.id === normalized
  );
  if (!item) return canonicalName;
  return getSkincareDisplayLabel(item, style);
}
