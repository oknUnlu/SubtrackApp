import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';
import { getSetting, setSetting } from '../database/db';

const INSTALL_DATE_KEY = 'app_install_date';
const REVIEW_PROMPTED_KEY = 'review_prompted';
const REVIEW_DAYS_THRESHOLD = 3; // 3 gün sonra sor

export async function initInstallDate() {
  const existing = await getSetting(INSTALL_DATE_KEY);
  if (!existing) {
    await setSetting(INSTALL_DATE_KEY, new Date().toISOString());
  }
}

export async function shouldShowReviewPrompt(): Promise<boolean> {
  try {
    // Zaten sorulduysa tekrar sorma
    const alreadyPrompted = await getSetting(REVIEW_PROMPTED_KEY);
    if (alreadyPrompted === 'true') return false;

    const installDate = await getSetting(INSTALL_DATE_KEY);
    if (!installDate) {
      await initInstallDate();
      return false;
    }

    const installed = new Date(installDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - installed.getTime()) / (1000 * 60 * 60 * 24));

    return diffDays >= REVIEW_DAYS_THRESHOLD;
  } catch {
    return false;
  }
}

export async function requestReview() {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
    }
    // İster kabul ister reddetsin, bir kez gösterdik olarak işaretle
    await setSetting(REVIEW_PROMPTED_KEY, 'true');
  } catch {
    await setSetting(REVIEW_PROMPTED_KEY, 'true');
  }
}

export async function checkAndPromptReview(): Promise<boolean> {
  const shouldShow = await shouldShowReviewPrompt();
  if (shouldShow) {
    // Native store review mevcut mu kontrol et
    if (Platform.OS !== 'web') {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        return true; // Custom popup göster, kullanıcıya sor
      }
    }
  }
  return false;
}
