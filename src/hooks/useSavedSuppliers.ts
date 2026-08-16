import { useState, useEffect, useCallback } from 'react';
import { VerifiedSupplier } from '../types';
import { VERIFIED_SUPPLIERS, SEARCH_SUPPLIERS } from '../data/mockData';

const SAVED_SUPPLIERS_STORAGE_KEY = 'nexora_saved_suppliers_ids_v1';

// Prepopulate default saved suppliers if empty so first-time users can immediately see the UX
const DEFAULT_SAVED_IDS = ['sup-1'];

export function useSavedSuppliers() {
  const [savedSupplierIds, setSavedSupplierIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_SUPPLIERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      return DEFAULT_SAVED_IDS;
    } catch {
      return DEFAULT_SAVED_IDS;
    }
  });

  // Sync to local storage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_SUPPLIERS_STORAGE_KEY, JSON.stringify(savedSupplierIds));
    } catch (e) {
      console.error('Failed to persist saved suppliers to localStorage', e);
    }
  }, [savedSupplierIds]);

  const toggleSaveSupplier = useCallback((supplierId: string, supplierName?: string) => {
    let isSavedNow = false;
    setSavedSupplierIds((prev) => {
      const exists = prev.includes(supplierId);
      if (exists) {
        isSavedNow = false;
        return prev.filter((id) => id !== supplierId);
      } else {
        isSavedNow = true;
        return [...prev, supplierId];
      }
    });
    return isSavedNow;
  }, []);

  const isSupplierSaved = useCallback(
    (supplierId: string) => {
      return savedSupplierIds.includes(supplierId);
    },
    [savedSupplierIds]
  );

  const clearAllSavedSuppliers = useCallback(() => {
    setSavedSupplierIds([]);
  }, []);

  // Map saved IDs to rich supplier objects from both VERIFIED_SUPPLIERS and SEARCH_SUPPLIERS
  const savedSuppliersList = savedSupplierIds
    .map((id) => {
      const verified = VERIFIED_SUPPLIERS.find((s) => s.id === id);
      if (verified) return verified;

      const searchSup = SEARCH_SUPPLIERS.find((s) => s.id === id);
      if (searchSup) {
        const mapped: VerifiedSupplier = {
          id: searchSup.id,
          name: searchSup.name,
          shortCode: searchSup.shortCode,
          type: searchSup.type,
          city: `${searchSup.city}, ${searchSup.state}`,
          isVerified: searchSup.isNexoraVerified,
          isGstVerified: searchSup.isGstVerified,
          isIsoCertified: searchSup.isIsoCertified,
          categories: searchSup.categories,
          phone: searchSup.phone,
          whatsapp: searchSup.whatsapp,
          responseRate: `${searchSup.responseRate} within ${searchSup.responseTime}`,
          trustScore: searchSup.trustScore,
          reliabilityRating: 98,
          responseScore: 96,
          responseTimeText: searchSup.responseTime,
          exportReadiness: searchSup.exportReady ? 92 : 80,
          exportCertifications: 'ISO 9001 GMP • Audited Facility'
        };
        return mapped;
      }
      return null;
    })
    .filter(Boolean) as VerifiedSupplier[];

  return {
    savedSupplierIds,
    savedSuppliersList,
    savedCount: savedSupplierIds.length,
    toggleSaveSupplier,
    isSupplierSaved,
    clearAllSavedSuppliers
  };
}
