import React, { useRef, useState } from 'react';
import { 
  CheckCircle2, 
  UploadCloud, 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Info,
  Download,
  Loader2
} from 'lucide-react';
import { exportSupplierAuditVaultToCsv } from '../utils/exportCsv';
import { MediaUploader } from './media/MediaUploader';
import { SecureImage } from './media/SecureImage';
import { useMediaOwner } from '../hooks/useMediaOwner';
import { MediaAsset, deleteMedia, resolveMediaUrl } from '../lib/mediaService';

interface SupplierVerificationScreenProps {
  onBack: () => void;
}

export const SupplierVerificationScreen: React.FC<SupplierVerificationScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');
  
  // Mock statuses for the UI
  const [verificationStatus, setVerificationStatus] = useState({
    business: 'verified', // verified, pending, action_required
    gst: 'verified',
    iso: 'action_required',
    gmp: 'pending',
    fda: 'action_required',
    factory: 'action_required'
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Track uploaded documents in session. Compliance proofs are PRIVATE: they
  // live in the `documents` bucket and are only readable through signed URLs.
  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, { name: string; url: string; type: string; date: string; asset?: MediaAsset }>
  >({});

  // Preview modal state — the URL is resolved lazily because signed URLs expire.
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
    type: string;
    asset?: MediaAsset;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isResolvingPreview, setIsResolvingPreview] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { ownerId: mediaOwnerId, isAuthenticated } = useMediaOwner();
  const docPickerRef = useRef<(() => void) | null>(null);

  const handleUploadClick = (docName: string) => {
    setUploadError(null);
    if (!isAuthenticated) {
      setUploadError('Sign in to upload compliance documents.');
      return;
    }
    setUploadingDoc(docName);
    // Let the pending state paint before the OS file dialog opens.
    window.setTimeout(() => docPickerRef.current?.(), 0);
  };

  const handleDocUploaded = (next: MediaAsset | MediaAsset[] | null) => {
    const asset = Array.isArray(next) ? next[0] ?? null : next;
    const docName = uploadingDoc;
    setUploadingDoc(null);
    if (!asset || !docName) return;

    setUploadedDocs(prev => ({
      ...prev,
      [docName]: {
        name: asset.originalName || docName,
        // Preview URL is resolved on demand (private bucket ⇒ signed URL).
        url: asset.isLocal ? asset.localUrl || '' : '',
        type: asset.mimeType,
        date: 'Just now',
        asset,
      },
    }));
  };

  const openPreview = async (doc: { name: string; url: string; type: string; asset?: MediaAsset }) => {
    setPreviewDoc(doc);
    setIsResolvingPreview(true);
    setPreviewUrl(null);
    const url = doc.asset ? await resolveMediaUrl(doc.asset) : doc.url;
    setPreviewUrl(url);
    setIsResolvingPreview(false);
  };

  const removeDoc = async (docName: string) => {
    const doc = uploadedDocs[docName];
    if (doc?.asset) await deleteMedia(doc.asset);
    setUploadedDocs(prev => {
      const next = { ...prev };
      delete next[docName];
      return next;
    });
    if (previewDoc?.name === doc?.name) setPreviewDoc(null);
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDFBF7] pb-24">
      {/* Storage-backed compliance uploader (private `documents` bucket) */}
      <div className="hidden">
        <MediaUploader
          ownerId={mediaOwnerId}
          scope="verification"
          entityType="supplier_verification"
          onChange={handleDocUploaded}
          pickerRef={docPickerRef}
          variant="compact"
          hidePreview
        />
      </div>

      {uploadError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-[13px] font-bold text-red-700">{uploadError}</span>
        </div>
      )}

      {uploadingDoc && (
        <div className="bg-[#F5EEF8] border-b border-[#E8D5F2] px-4 py-3 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-[#6B2D8C] animate-spin" />
          <span className="text-[13px] font-bold text-[#6B2D8C]">
            Uploading {uploadingDoc}…
          </span>
        </div>
      )}
      {/* Notification Banner */}
      <div className="bg-[#E5F5EB] border-b border-[#008A27]/20 px-4 py-3 flex items-center justify-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#008A27]" />
        <span className="text-[13px] font-bold text-[#008A27]">Notification: Your ISO 9001:2015 certificate has been successfully verified!</span>
      </div>
      
      {/* Header */}
      <div className="bg-white border-b border-[#F4F0E9]">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button 
                onClick={onBack}
                className="text-[13px] text-[#5B4A6E] hover:text-[#6B2D8C] font-medium flex items-center gap-1 mb-3 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Dashboard
              </button>
              <h1 className="text-[28px] md:text-[32px] font-serif font-bold text-[#2A0E3F] leading-tight mb-2">
                Verification Center
              </h1>
              <p className="text-[14px] text-[#5B4A6E]">
                Manage your trust badges, upload compliance documents, and stand out to premium B2B buyers.
              </p>
            </div>
            
            {/* Top Level Status Card & Export Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-[#FDFBF7] border border-[#D9C3E8] rounded-xl p-4 flex items-start gap-3 min-w-[240px]">
                <div className="w-10 h-10 rounded-full bg-[#6B2D8C]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#6B2D8C]" />
                </div>
                <div>
                  <div className="text-[12px] text-[#5B4A6E] font-semibold uppercase tracking-wider mb-0.5">Overall Status</div>
                  <div className="text-[16px] font-bold text-[#2A0E3F]">Verified Supplier</div>
                  <div className="text-[12px] text-[#6B2D8C] mt-1 font-medium">Rank Boost Active</div>
                </div>
              </div>

              <button
                onClick={() => {
                  const sampleDocs = [
                    { docName: 'GST Registration Certificate', docType: 'GSTIN License', regNumber: '27AABCA1234A1Z5', issuingAuthority: 'Govt of India (GST Portal)', status: 'Verified', uploadDate: '2026-01-10', expiryDate: 'Permanent' },
                    { docName: 'ISO 22716 Cosmetics GMP', docType: 'ISO Certification', regNumber: 'ISO-22716-2025-IND', issuingAuthority: 'TÜV SÜD South Asia', status: 'Verified', uploadDate: '2025-11-20', expiryDate: '2028-11-19' },
                    { docName: 'US-FDA Establishment Identifier (FEI)', docType: 'US-FDA Registration', regNumber: 'FEI-3018294021', issuingAuthority: 'U.S. Food and Drug Administration', status: 'Verified', uploadDate: '2026-02-01', expiryDate: '2027-12-31' },
                    { docName: 'Factory License & Pollution Board NOC', docType: 'Industrial License', regNumber: 'FAC-MH-2024-88', issuingAuthority: 'Maharashtra Pollution Control Board', status: 'Verified', uploadDate: '2025-06-15', expiryDate: '2029-06-14' },
                    ...Object.entries(uploadedDocs).map(([key, val]) => ({
                      docName: key,
                      docType: 'Uploaded Certificate',
                      regNumber: 'REG-PENDING',
                      issuingAuthority: 'Self-Uploaded Audit Vault',
                      status: 'Under Review',
                      uploadDate: (val as any)?.date || 'Just now',
                      expiryDate: 'TBD'
                    }))
                  ];
                  exportSupplierAuditVaultToCsv(sampleDocs);
                }}
                className="bg-white border border-[#D9C3E8] hover:border-[#6B2D8C] text-[#2A0E3F] hover:text-[#6B2D8C] text-[13px] font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#6B2D8C]" />
                <span>Export Audit Vault CSV</span>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-6 mt-8 border-b border-[#F4F0E9]">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'overview' ? 'text-[#6B2D8C]' : 'text-[#5B4A6E] hover:text-[#2A0E3F]'}`}
            >
              Overview & Badges
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6B2D8C] rounded-t-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'documents' ? 'text-[#6B2D8C]' : 'text-[#5B4A6E] hover:text-[#2A0E3F]'}`}
            >
              Document Uploads
              {activeTab === 'documents' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6B2D8C] rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 mt-8">
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Trust Badges */}
            <div className="bg-white border border-[#E5D8EE] rounded-2xl p-6">
              <h2 className="text-[18px] font-bold text-[#2A0E3F] mb-1">Your Trust Badges</h2>
              <p className="text-[13px] text-[#5B4A6E] mb-6">Badges visible to buyers on your profile and listings.</p>
              
              <div className="space-y-4">
                {/* Badge Item: Verified Business */}
                <div className="flex items-center justify-between p-4 border border-[#E5D8EE] rounded-xl bg-[#FDFBF7]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B2D8C] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#2A0E3F]">Business Verified</div>
                      <div className="text-[12px] text-[#5B4A6E]">Core identity & GST confirmed</div>
                    </div>
                  </div>
                  <div className="text-[12px] font-bold text-[#008A27] bg-[#E5F5EB] px-2.5 py-1 rounded-full">
                    Active
                  </div>
                </div>

                {/* Badge Item: Quality Certified */}
                <div className="flex items-center justify-between p-4 border border-[#E5D8EE] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${uploadedDocs['ISO 9001:2015'] ? 'bg-[#FFF4E5]' : 'bg-[#F4F0E9]'}`}>
                      <ShieldCheck className={`w-4 h-4 ${uploadedDocs['ISO 9001:2015'] ? 'text-[#D97706]' : 'text-[#8B7FA3]'}`} />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#2A0E3F]">Quality Certified</div>
                      <div className="text-[12px] text-[#5B4A6E]">ISO / GMP credentials</div>
                    </div>
                  </div>
                  {uploadedDocs['ISO 9001:2015'] ? (
                     <div className="text-[12px] font-bold text-[#D97706] bg-[#FFF4E5] px-2.5 py-1 rounded-full">
                       Under Review
                     </div>
                  ) : (
                    <div className="text-[12px] font-bold text-[#5B4A6E] bg-[#F4F0E9] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#E5D8EE] transition-colors" onClick={() => setActiveTab('documents')}>
                      Upload Required
                    </div>
                  )}
                </div>

                {/* Badge Item: Export Ready */}
                <div className="flex items-center justify-between p-4 border border-[#E5D8EE] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${uploadedDocs['US-FDA Registration'] ? 'bg-[#FFF4E5]' : 'bg-[#F4F0E9]'}`}>
                      <ShieldCheck className={`w-4 h-4 ${uploadedDocs['US-FDA Registration'] ? 'text-[#D97706]' : 'text-[#8B7FA3]'}`} />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#2A0E3F]">Export Ready</div>
                      <div className="text-[12px] text-[#5B4A6E]">US-FDA / EU registered</div>
                    </div>
                  </div>
                  {uploadedDocs['US-FDA Registration'] ? (
                     <div className="text-[12px] font-bold text-[#D97706] bg-[#FFF4E5] px-2.5 py-1 rounded-full">
                       Under Review
                     </div>
                  ) : (
                    <div className="text-[12px] font-bold text-[#5B4A6E] bg-[#F4F0E9] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#E5D8EE] transition-colors" onClick={() => setActiveTab('documents')}>
                      Upload Required
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Why Verify */}
            <div className="bg-[#FFF7FA] border border-[#D9C3E8] rounded-2xl p-6">
              <h2 className="text-[18px] font-bold text-[#2A0E3F] mb-4">Why Complete Verification?</h2>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6B2D8C] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14px] font-bold text-[#2A0E3F]">3x More Buyer Enquiries</div>
                    <div className="text-[13px] text-[#5B4A6E] mt-0.5">Verified suppliers receive significantly more sourcing requests from premium buyers.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6B2D8C] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14px] font-bold text-[#2A0E3F]">Higher Search Ranking</div>
                    <div className="text-[13px] text-[#5B4A6E] mt-0.5">Your products and profile will appear above unverified competitors in global search.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6B2D8C] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14px] font-bold text-[#2A0E3F]">Exclusive RFQ Access</div>
                    <div className="text-[13px] text-[#5B4A6E] mt-0.5">Only fully verified suppliers can quote on high-value, restricted buyer RFQs.</div>
                  </div>
                </li>
              </ul>
              
              <button 
                onClick={() => setActiveTab('documents')}
                className="w-full mt-6 bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-[14px] font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Upload Documents Now
              </button>
            </div>
            
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white border border-[#E5D8EE] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E5D8EE] bg-[#FDFBF7] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#2A0E3F]">Document Submission</h2>
                <p className="text-[13px] text-[#5B4A6E] mt-1">Upload clear, legible copies of your certificates. PDFs or high-res JPEGs preferred.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleUploadClick('Bulk Archive')}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5D8EE] rounded-lg text-[13px] font-bold text-[#2A0E3F] hover:bg-[#F4F0E9] transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                  Bulk Upload (.ZIP)
                </button>
                <button 
                  onClick={() => {
                    // Simulate export
                    const link = document.createElement('a');
                    link.href = '#';
                    link.download = 'Nexora_Audit_Vault_AuraLabs.zip';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-[#FDFBF7] border border-[#6B2D8C] rounded-lg text-[13px] font-bold text-[#6B2D8C] hover:bg-[#F5EEF8] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Export Audit Vault
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-[#E5D8EE]">
              
              {/* Document 1: GST */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#2A0E3F]">GST Certificate</h3>
                    <span className="bg-[#E5F5EB] text-[#008A27] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Verified</span>
                  </div>
                  <p className="text-[13px] text-[#5B4A6E]">Required for core business identity verification in India.</p>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[12px] text-[#5B4A6E]">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#6B2D8C]" />
                      GST_Certificate_AuraBeauty.pdf
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-[#D97706]">
                      <Clock className="w-3.5 h-3.5" />
                      Expires: Mar 31, 2025
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <button 
                    onClick={() => handleUploadClick('GST Certificate')}
                    className="px-4 py-2 border border-[#E5D8EE] text-[#2A0E3F] text-[13px] font-semibold rounded-lg hover:bg-[#F4F0E9] transition-colors"
                  >
                    Renew / Update
                  </button>
                </div>
              </div>

              {/* Document 2: ISO */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#2A0E3F]">ISO 9001:2015</h3>
                    {uploadedDocs['ISO 9001:2015'] ? (
                      <span className="bg-[#FFF4E5] text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Under Review</span>
                    ) : (
                      <span className="bg-[#F5EEF8] text-[#6B2D8C] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Required</span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#5B4A6E]">Proves your Quality Management System standards.</p>
                  {uploadedDocs['ISO 9001:2015'] && (
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-[#5B4A6E]">
                      <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                      {uploadedDocs['ISO 9001:2015'].name} ({uploadedDocs['ISO 9001:2015'].date})
                    </div>
                  )}
                </div>
                <div className="shrink-0 w-full md:w-auto flex items-center gap-3">
                  {uploadedDocs['ISO 9001:2015'] ? (
                    <>
                      <button 
                        onClick={() => void openPreview(uploadedDocs['ISO 9001:2015'])}
                        className="px-4 py-2 border border-[#E5D8EE] text-[#2A0E3F] text-[13px] font-semibold rounded-lg hover:bg-[#F4F0E9] transition-colors"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleUploadClick('ISO 9001:2015')}
                        className="px-4 py-2 border border-[#E5D8EE] text-[#2A0E3F] text-[13px] font-semibold rounded-lg hover:bg-[#F4F0E9] transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => void removeDoc('ISO 9001:2015')}
                        className="px-3 py-2 border border-red-100 text-red-600 text-[13px] font-semibold rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Remove ISO 9001:2015 document"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleUploadClick('ISO 9001:2015')}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-[13px] font-bold rounded-lg transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload PDF/JPG
                    </button>
                  )}
                </div>
              </div>

              {/* Document 3: GMP */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#2A0E3F]">GMP Certificate</h3>
                    <span className="bg-[#FFF4E5] text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pending Review</span>
                  </div>
                  <p className="text-[13px] text-[#5B4A6E]">Good Manufacturing Practices certification.</p>
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-[#5B4A6E]">
                    <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                    GMP_Cert_2024.pdf (Uploaded 2 days ago)
                  </div>
                </div>
                <div className="shrink-0">
                  <button className="px-4 py-2 border border-[#E5D8EE] text-[#2A0E3F] text-[13px] font-semibold rounded-lg hover:bg-[#F4F0E9] transition-colors" disabled>
                    In Review
                  </button>
                </div>
              </div>

              {/* Document 4: US-FDA */}
              <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-[#2A0E3F]">US-FDA Registration</h3>
                    {uploadedDocs['US-FDA Registration'] ? (
                      <span className="bg-[#FFF4E5] text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Under Review</span>
                    ) : (
                      <span className="bg-[#F4F0E9] text-[#5B4A6E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Optional</span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#5B4A6E]">Boosts trust for international export buyers.</p>
                  {uploadedDocs['US-FDA Registration'] && (
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-[#5B4A6E]">
                      <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                      {uploadedDocs['US-FDA Registration'].name} ({uploadedDocs['US-FDA Registration'].date})
                    </div>
                  )}
                </div>
                <div className="shrink-0 w-full md:w-auto flex items-center gap-3">
                  {uploadedDocs['US-FDA Registration'] ? (
                    <>
                      <button 
                        onClick={() => void openPreview(uploadedDocs['US-FDA Registration'])}
                        className="px-4 py-2 border border-[#E5D8EE] text-[#2A0E3F] text-[13px] font-semibold rounded-lg hover:bg-[#F4F0E9] transition-colors"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleUploadClick('US-FDA Registration')}
                        className="px-4 py-2 border border-[#E5D8EE] text-[#2A0E3F] text-[13px] font-semibold rounded-lg hover:bg-[#F4F0E9] transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => void removeDoc('US-FDA Registration')}
                        className="px-3 py-2 border border-red-100 text-red-600 text-[13px] font-semibold rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Remove US-FDA Registration document"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleUploadClick('US-FDA Registration')}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#6B2D8C] text-[#6B2D8C] hover:bg-[#FDFBF7] text-[13px] font-bold rounded-lg transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload Document
                    </button>
                  )}
                </div>
              </div>

            </div>
            
            {/* Info Footer */}
            <div className="p-5 bg-[#F4F0E9] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#5B4A6E] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#5B4A6E] leading-relaxed">
                Verification processing typically takes 24-48 business hours. Ensure all uploaded documents are clearly legible and valid. Expired documents will result in badge removal.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-[#2A0E3F]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[800px] h-[95vh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-[#F4F0E9]">
              <h3 className="text-[15px] md:text-[16px] font-bold text-[#2A0E3F] truncate pr-4">{previewDoc.name}</h3>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="text-[#5B4A6E] hover:text-[#6B2D8C] text-[13px] md:text-[14px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#FDFBF7] transition-colors shrink-0"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[#F4F0E9] flex items-center justify-center p-2 md:p-4 min-h-[300px] md:min-h-[400px]">
              {isResolvingPreview && (
                <Loader2 className="w-6 h-6 animate-spin text-[#6B2D8C]" />
              )}

              {!isResolvingPreview && previewDoc.type.startsWith('image/') && previewDoc.asset && (
                <SecureImage
                  asset={previewDoc.asset}
                  alt="Document Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  showSpinner
                />
              )}

              {!isResolvingPreview && previewDoc.type.startsWith('image/') && !previewDoc.asset && previewUrl && (
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              )}

              {!isResolvingPreview && previewDoc.type === 'application/pdf' && previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[60vh] rounded-lg shadow-sm bg-white"
                  title="PDF Preview"
                />
              )}

              {!isResolvingPreview && previewDoc.type === 'application/pdf' && !previewUrl && (
                <p className="text-[13px] font-bold text-red-600 px-4 text-center">
                  This document could not be opened. It may have been removed or its access link expired.
                </p>
              )}

              {!isResolvingPreview &&
                !previewDoc.type.startsWith('image/') &&
                previewDoc.type !== 'application/pdf' && (
                  <div className="flex flex-col items-center gap-3 text-[#5B4A6E] p-8 text-center">
                    <FileText className="w-10 h-10 md:w-12 md:h-12 text-[#6B2D8C]" />
                    <p className="text-[13px] md:text-[14px] font-medium">Preview not available for this file type.</p>
                    <p className="text-[12px]">You can still submit it for review.</p>
                  </div>
                )}
            </div>
            <div className="p-3 md:p-4 border-t border-[#F4F0E9] flex justify-end gap-3 bg-white">
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-full md:w-auto px-5 py-2.5 md:py-2 bg-[#6B2D8C] text-white text-[14px] font-bold rounded-lg hover:bg-[#4A2560] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
