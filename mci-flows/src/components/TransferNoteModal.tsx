import { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, TransferNote } from '../types';
import { updatePatient } from '../store';
import { Check, X, ChevronDown } from 'lucide-react';

interface Props {
  patient: Patient;
  mode: 'transfer' | 'update' | 'edit';
  onClose: () => void;
  onConfirm: () => void;
}

export function TransferNoteModal({ patient, mode, onClose, onConfirm }: Props) {
  const [status, setStatus] = useState<string>(
    mode === 'update' ? 'Transfer Complete' : 
    (patient.transferNote?.status || 'In-Transit')
  );
  
  const [toCode, setToCode] = useState(patient.transferNote?.toCode || '');
  const [transport, setTransport] = useState(patient.transferNote?.transport || 'Private vehicle');
  const [ambulanceId, setAmbulanceId] = useState(patient.transferNote?.ambulanceId || '');
  const [jpats, setJpats] = useState(patient.transferNote?.jpats || false);
  const [jpatsNumber, setJpatsNumber] = useState(patient.transferNote?.jpatsNumber || '');
  const [details, setDetails] = useState(patient.transferNote?.details || '');
  
  const [receivingSite, setReceivingSite] = useState(patient.transferNote?.toCode || '');
  const [completeDetails, setCompleteDetails] = useState(patient.transferNote?.completeDetails || '');
  const [receivingTime, setReceivingTime] = useState(patient.transferNote?.receivingTime || '');

  const [specialty, setSpecialty] = useState(patient.transferNote?.specialty || '');
  const [bedCategory, setBedCategory] = useState(patient.transferNote?.bedCategory || '');
  const [additionalCapabilities, setAdditionalCapabilities] = useState<string[]>(patient.transferNote?.additionalCapabilities || []);
  const [isCapabilityOpen, setIsCapabilityOpen] = useState(false);
  const capabilityRef = useRef<HTMLDivElement>(null);
  
  const [dispositionTime, setDispositionTime] = useState(patient.transferNote?.dispositionTime || '');
  const [dispositionDetails, setDispositionDetails] = useState(patient.transferNote?.dispositionDetails || '');

  const [transitTime, setTransitTime] = useState(patient.transferNote?.transitTime || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (mode === 'transfer' && patient.status === PatientStatus.DISCHARGED && patient.dischargePlan?.disposition === 'Transfer') {
      const plan = patient.dischargePlan;
      if (plan.destinationSite) setToCode(plan.destinationSite);
      if (plan.specialty) setSpecialty(plan.specialty);
      if (plan.bedCategory) setBedCategory(plan.bedCategory);
      if (plan.additionalCapabilities) setAdditionalCapabilities(plan.additionalCapabilities);
      if (plan.dispositionDate) setTransitTime(plan.dispositionDate);
    }
  }, [patient, mode]);

  const getCurrentTime = () => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (status === 'Transfer Complete' && !receivingTime) {
      setReceivingTime(getCurrentTime());
    }
    if (status === 'Other Disposition' && !dispositionTime) {
      setDispositionTime(getCurrentTime());
    }
  }, [status]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (capabilityRef.current && !capabilityRef.current.contains(event.target as Node)) {
        setIsCapabilityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (status === 'Transfer Complete' && !receivingTime) {
      setReceivingTime(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
    if (status === 'Other Disposition' && !dispositionTime) {
      setDispositionTime(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  }, [status]);

  const sites = [
    { code: 'CH', name: 'Central Hospital' },
    { code: 'GWUH', name: 'George Washington University Hospital' },
    { code: 'EMS', name: 'EMS Transit Unit' },
  ];

  const specialtyOptions: Record<string, string[]> = {
    'CH': ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology'],
    'GWUH': ['Trauma', 'Burn', 'Neurosurgery', 'Cardiac Surgery', 'Transplant'],
    'EMS': ['General', 'Trauma', 'Cardiac', 'Respiratory'],
  };

  const bedCategoryOptions = ['Burn','Critical Care','Med/Surg','Negative Pressure/Isolation','Pediatric','Psychiatric','Pediatric Critical'];

  const additionalCapabilityOptions = ["Bariatric", "Blood Products", "Cardiovascular Critical Care", "Dialysis", "ECMO", "Hyperbaric Oxygen Therapy", "Interventional Embolization", "L&D", "Limb Replantation", "Negative Pressure Isolation", "Neurocritical Care", "NICU", "OR", "Ventilator"];

  // Reset specialty if destination changes and current specialty is not in the new list
  useEffect(() => {
    if (toCode && specialtyOptions[toCode]) {
      if (!specialtyOptions[toCode].includes(specialty)) {
        setSpecialty('');
      }
    }
  }, [toCode]);

  const handleCapabilityToggle = (cap: string) => {
    setAdditionalCapabilities(prev => 
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  const [eta, setEta] = useState(patient.transferNote?.eta || '');

  const handleConfirm = async () => {
    const newErrors: Record<string, boolean> = {};
    if (status === 'In-Transit' || status === 'Transport Ordered') {
      if (!toCode) newErrors.toCode = true;
      if (transport === 'Ambulance' && !ambulanceId) newErrors.ambulanceId = true;
      if (jpats && !jpatsNumber) newErrors.jpatsNumber = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let newStatus = patient.status;
    let note: Partial<TransferNote> = { ...patient.transferNote };

    if (status === 'In-Transit' || status === 'Transport Ordered') {
      newStatus = status === 'In-Transit' ? PatientStatus.IN_TRANSIT : PatientStatus.TRANSFER_ORDERED;
      note = {
        ...note,
        status,
        toCode,
        toName: sites.find(s => s.code === toCode)?.name || toCode,
        fromSite: patient.site,
        transport,
        ambulanceId: transport === 'Ambulance' ? ambulanceId : '',
        transitTime,
        eta,
        jpats,
        jpatsNumber: jpats ? jpatsNumber : '',
        details,
        specialty,
        bedCategory,
        additionalCapabilities,
      };
    } else if (status === 'Transfer Complete') {
      newStatus = PatientStatus.TRANSFER_COMPLETE;
      note = {
        ...note,
        status,
        toCode: receivingSite,
        toName: sites.find(s => s.code === receivingSite)?.name || receivingSite,
        completeTime: new Date().toISOString(),
        completeDetails,
        receivingTime,
      };
    } else if (status === 'Other Disposition') {
      newStatus = PatientStatus.OTHER_DISPOSITION;
      note = {
        ...note,
        status,
        dispositionTime,
        dispositionDetails,
      };
    }

    await updatePatient(patient.id, { 
      status: newStatus, 
      transferNote: note as TransferNote 
    });
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-2xl w-[650px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#101010]">Transfer Note</h2>
            <div className="text-sm text-[#888] mt-1">{patient.firstName} {patient.lastName} · {patient.mrn}</div>
          </div>
          <button onClick={onClose} className="text-2xl text-[#aeaeae] hover:text-[#666] leading-none">&times;</button>
        </div>

        <div className="bg-[#F6F7F8] rounded-xl p-6 flex flex-col gap-5">
          <div>
            <div className="text-sm font-bold text-[#1f1f1f] mb-2">Transfer Status</div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                <input type="radio" name="tnStatus" value="Transport Ordered" checked={status === 'Transport Ordered'} onChange={(e) => setStatus(e.target.value)} className="accent-[#155098] w-[18px] h-[18px]" /> Transport Ordered
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                <input type="radio" name="tnStatus" value="In-Transit" checked={status === 'In-Transit'} onChange={(e) => setStatus(e.target.value)} className="accent-[#155098] w-[18px] h-[18px]" /> In-Transit
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                <input type="radio" name="tnStatus" value="Transfer Complete" checked={status === 'Transfer Complete'} onChange={(e) => setStatus(e.target.value)} className="accent-[#155098] w-[18px] h-[18px]" /> Transfer Complete
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                <input type="radio" name="tnStatus" value="Other Disposition" checked={status === 'Other Disposition'} onChange={(e) => setStatus(e.target.value)} className="accent-[#155098] w-[18px] h-[18px]" /> Other Disposition
              </label>
            </div>
          </div>

          {(status === 'In-Transit' || status === 'Transport Ordered') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">From</label>
                  <input className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-[#F0F0F0] text-[#666] text-sm font-medium cursor-not-allowed" value={patient.site} readOnly />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">To <span className="text-[#D32F2F]">*</span></label>
                  <select 
                    className={`w-full h-[38px] px-3 border rounded bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.toCode ? 'border-[#D32F2F]' : 'border-[#DFDFDF] focus:border-[#1C63A9]'}`} 
                    value={toCode} 
                    onChange={e => {
                      setToCode(e.target.value);
                      if (e.target.value) setErrors(prev => ({ ...prev, toCode: false }));
                    }}
                  >
                    <option value="">— Select —</option>
                    {sites.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">Specialty</label>
                  <select 
                    className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15 disabled:bg-[#F5F5F5]" 
                    value={specialty} 
                    onChange={e => setSpecialty(e.target.value)}
                    disabled={!toCode}
                  >
                    <option value="">— Select —</option>
                    {toCode && specialtyOptions[toCode]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">Bed Category</label>
                  <select className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" value={bedCategory} onChange={e => setBedCategory(e.target.value)}>
                    <option value="">— Select —</option>
                    {bedCategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#1f1f1f]">Additional Capability</label>
                <div className="relative" ref={capabilityRef}>
                  <div 
                    className="min-h-[38px] w-full px-3 py-1 border border-[#DFDFDF] rounded bg-white flex flex-wrap gap-1 items-center cursor-pointer focus-within:border-[#1C63A9] focus-within:ring-2 focus-within:ring-[#1C63A9]/15"
                    onClick={() => setIsCapabilityOpen(!isCapabilityOpen)}
                  >
                    {additionalCapabilities.length === 0 && <span className="text-[#888] text-sm">— Select —</span>}
                    {additionalCapabilities.map(cap => (
                      <span key={cap} className="bg-[#E9F1FF] text-[#1C63A9] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        {cap}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-[#D32F2F]" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCapabilityToggle(cap);
                          }}
                        />
                      </span>
                    ))}
                    <ChevronDown className="w-4 h-4 ml-auto text-[#888]" />
                  </div>
                  {isCapabilityOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#DFDFDF] rounded shadow-lg z-[210] max-h-[200px] overflow-y-auto">
                      {additionalCapabilityOptions.map(cap => (
                        <div 
                          key={cap} 
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#F5F5F5] flex items-center justify-between ${additionalCapabilities.includes(cap) ? 'bg-[#F0F4FA] text-[#1C63A9] font-bold' : 'text-[#1f1f1f]'}`}
                          onClick={() => handleCapabilityToggle(cap)}
                        >
                          {cap}
                          {additionalCapabilities.includes(cap) && <Check className="w-4 h-4" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">Transit Time</label>
                  <input 
                    type="datetime-local" 
                    className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" 
                    value={transitTime} 
                    onChange={e => setTransitTime(e.target.value)} 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">Estimated Time of Arrival</label>
                  <input 
                    type="datetime-local" 
                    className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" 
                    value={eta} 
                    onChange={e => setEta(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#1f1f1f]">Other Details</label>
                <textarea className="w-full min-h-[60px] px-3 py-2 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" value={details} onChange={e => setDetails(e.target.value)} />
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">Mode of Transportation</label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                      <input type="radio" name="tnTransport" value="Ambulance" checked={transport === 'Ambulance'} onChange={e => setTransport(e.target.value)} className="accent-[#155098] w-[18px] h-[18px]" /> Ambulance
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                      <input type="radio" name="tnTransport" value="Private vehicle" checked={transport === 'Private vehicle'} onChange={e => setTransport(e.target.value)} className="accent-[#155098] w-[18px] h-[18px]" /> Private vehicle
                    </label>
                  </div>
                </div>
                {transport === 'Ambulance' && (
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-bold text-[#1f1f1f]">Ambulance Unit ID <span className="text-[#D32F2F]">*</span></label>
                    <input 
                      className={`w-full h-[38px] px-3 border rounded bg-[#FFF8E1] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.ambulanceId ? 'border-[#D32F2F]' : 'border-[#F9A825]'}`} 
                      value={ambulanceId} 
                      onChange={e => {
                        setAmbulanceId(e.target.value);
                        if (e.target.value) setErrors(prev => ({ ...prev, ambulanceId: false }));
                      }} 
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-1">
                  <label className="text-sm font-bold text-[#1f1f1f]">JPATS Tracking</label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                      <input type="radio" name="tnJpats" value="yes" checked={jpats === true} onChange={() => setJpats(true)} className="accent-[#155098] w-[18px] h-[18px]" /> Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f] cursor-pointer">
                      <input type="radio" name="tnJpats" value="no" checked={jpats === false} onChange={() => setJpats(false)} className="accent-[#155098] w-[18px] h-[18px]" /> No
                    </label>
                  </div>
                </div>
                {jpats && (
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-bold text-[#1f1f1f]">JPATS Number <span className="text-[#D32F2F]">*</span></label>
                    <input 
                      className={`w-full h-[38px] px-3 border rounded bg-[#FFF8E1] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.jpatsNumber ? 'border-[#D32F2F]' : 'border-[#F9A825]'}`} 
                      value={jpatsNumber} 
                      onChange={e => {
                        setJpatsNumber(e.target.value);
                        if (e.target.value) setErrors(prev => ({ ...prev, jpatsNumber: false }));
                      }} 
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {status === 'Transfer Complete' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#1f1f1f]">Receiving Site</label>
                <select className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" value={receivingSite} onChange={e => setReceivingSite(e.target.value)}>
                  <option value="">— Select —</option>
                  {sites.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#1f1f1f]">Receiving Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" 
                  value={receivingTime} 
                  onChange={e => setReceivingTime(e.target.value)} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#1f1f1f]">Other Details</label>
                <textarea className="w-full min-h-[80px] px-3 py-2 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" value={completeDetails} onChange={e => setCompleteDetails(e.target.value)} />
              </div>
            </>
          )}

          {status === 'Other Disposition' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#1f1f1f]">Disposition Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full h-[38px] px-3 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" 
                  value={dispositionTime} 
                  onChange={e => setDispositionTime(e.target.value)} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#1f1f1f]">Disposition Details</label>
                <textarea 
                  className="w-full min-h-[120px] px-3 py-2 border border-[#DFDFDF] rounded bg-white text-sm font-medium focus:outline-none focus:border-[#1C63A9] focus:ring-2 focus:ring-[#1C63A9]/15" 
                  value={dispositionDetails} 
                  onChange={e => setDispositionDetails(e.target.value)} 
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="h-11 px-6 rounded-md font-bold text-sm bg-white text-[#1f1f1f] border border-[#bbb] hover:bg-[#f5f5f5]">Cancel</button>
          <button onClick={handleConfirm} className="h-11 px-6 rounded-md font-bold text-sm bg-[#155098] text-white hover:bg-[#0e3d75]">Confirm</button>
        </div>
      </div>
    </div>
  );
}
