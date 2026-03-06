import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  Video, 
  UserPlus, 
  Monitor, 
  List,
  Check,
  AlertCircle,
  Truck,
  MapPin,
  RotateCw,
  Search,
  X
} from 'lucide-react';
import { getPatientById, updatePatient } from '../store';
import { Patient, PatientStatus, TriageCode, DischargePlan } from '../types';

export function PatientChart() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('Summary');
  const [dischargeSubTab, setDischargeSubTab] = useState('Plan');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Discharge Plan Form State
  const [dispoDate, setDispoDate] = useState('2026-11-11T13:25');
  const [diagnosis, setDiagnosis] = useState('I51.9 - Unspecified heart disease');
  const [disposition, setDisposition] = useState('Transfer');
  const [acuity, setAcuity] = useState('');
  const [transferType, setTransferType] = useState('Hospital ER');
  const [facility, setFacility] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bedCategory, setBedCategory] = useState('');
  const [additionalCapabilities, setAdditionalCapabilities] = useState<string[]>([]);
  const [isCapabilityOpen, setIsCapabilityOpen] = useState(false);
  const capabilityRef = useRef<HTMLDivElement>(null);
  const [receivingProvider, setReceivingProvider] = useState('Ken Lee');
  const [instructionsLabel, setInstructionsLabel] = useState('Attach Diagnosis Information');
  const [instructionsContent, setInstructionsContent] = useState([
    'AVOIDING TRIGGERS WITH HEART FAILURE: AFTER YOUR VISIT',
    'BIVENTRICULAR PACEMAKER: GENERAL INFO',
    'BIVENTRICULAR PACEMAKER: POST-OP'
  ]);
  const [patientInstructions, setPatientInstructions] = useState('');
  const [referral, setReferral] = useState('CVS Urgent Care');

  // Discharge Process Form State
  const [processDispoDate, setProcessDispoDate] = useState('2026-11-11T13:25');
  const [processDiagnosis, setProcessDiagnosis] = useState('I51.9 - Unspecified heart disease');
  const [processDisposition, setProcessDisposition] = useState('Transfer');
  const [processAcuity, setProcessAcuity] = useState('Stable');
  const [processTransferType, setProcessTransferType] = useState('Hospital ER');
  const [processFacility, setProcessFacility] = useState('George Washington University Hospital');
  const [processSpecialty, setProcessSpecialty] = useState('Cardiology');
  const [processBedCategory, setProcessBedCategory] = useState('Burn');
  const [processAdditionalCapabilities, setProcessAdditionalCapabilities] = useState<string[]>(['Dialysis', 'Cardiovascular Critical Care']);
  const [processReceivingProvider, setProcessReceivingProvider] = useState('Ken Lee');
  const [processAssessmentNote, setProcessAssessmentNote] = useState('');
  
  const [transportOrdered, setTransportOrdered] = useState(true);
  const [transportOrderedTime, setTransportOrderedTime] = useState('2026-11-11T13:25');
  const [transportType, setTransportType] = useState('');
  const [emsEta, setEmsEta] = useState('');
  const [transferTime, setTransferTime] = useState('2026-11-11T13:25');
  const [facilityEta, setFacilityEta] = useState('');
  const [modeOfTransport, setModeOfTransport] = useState('Ambulance');
  const [ambulanceUnitId, setAmbulanceUnitId] = useState('AB9384202');
  const [otherDetail, setOtherDetail] = useState('');
  const [jpatsTracking, setJpatsTracking] = useState('Yes');
  const [jpatsNumber, setJpatsNumber] = useState('AB9384202');

  const [processPatientInstructions, setProcessPatientInstructions] = useState('35-year-old woman with a past medical history of diabetes and renal disease who presents with a worsening soft tissue infection of the arm. Three days ago, she sustained a laceration to her arm while evacuating from her flooded home during a hurricane. She initially cleaned the wound with water but has not been able to maintain proper wound care due to limited resources in the shelter. Yesterday, she noticed increasing redness, warmth, swelling, and pain around the wound, accompanied by mild drainage.\nShe was seen by a medical volunteer at the shelter who started her on oral cephalexin 500mg every six hours. She has taken three doses so far, but the symptoms have continued to worsen. The pain has become more severe, and the redness appears to be spreading up her arm. She denies fever, chills, or systemic symptoms at this time but expresses concern about the infection given her underlying health conditions.');
  
  const [emailInstructions, setEmailInstructions] = useState('Content');
  const [emailTransferPacket, setEmailTransferPacket] = useState('Content');

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [check4, setCheck4] = useState(false);

  const sites = [
    { code: 'SITE1', name: 'Site 1' },
    { code: 'CH', name: 'Central Hospital' },
    { code: 'GWUH', name: 'George Washington University Hospital' },
    { code: 'EMS', name: 'EMS Transit Unit' },
  ];

  const specialtyOptions: Record<string, string[]> = {
    'SITE1': ['Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics'],
    'CH': ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology'],
    'GWUH': ['Trauma', 'Burn', 'Neurosurgery', 'Cardiac Surgery', 'Transplant'],
    'EMS': ['General', 'Trauma', 'Cardiac', 'Respiratory'],
  };

  const bedCategoryOptions = ['Burn','Critical Care','Med/Surg','Negative Pressure/Isolation','Pediatric','Psychiatric','Pediatric Critical'];
  const additionalCapabilityOptions = ["Bariatric", "Blood Products", "Cardiovascular Critical Care", "Dialysis", "ECMO", "Hyperbaric Oxygen Therapy", "Interventional Embolization", "L&D", "Limb Replantation", "Negative Pressure Isolation", "Neurocritical Care", "NICU", "OR", "Ventilator"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (capabilityRef.current && !capabilityRef.current.contains(event.target as Node)) {
        setIsCapabilityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCapabilityToggle = (cap: string) => {
    setAdditionalCapabilities(prev => 
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  useEffect(() => {
    const load = async () => {
      if (id) {
        const data = await getPatientById(id);
        setPatient(data);
        if (data?.dischargePlan) {
          const plan = data.dischargePlan;
          setDispoDate(plan.dispositionDate);
          setDiagnosis(plan.diagnosis);
          setDisposition(plan.disposition);
          setAcuity(plan.dischargeAcuity);
          setTransferType(plan.transferType || 'Hospital ER');
          setFacility(plan.destinationSite);
          setBedCategory(plan.bedCategory);
          setSpecialty(plan.specialty);
          setAdditionalCapabilities(plan.additionalCapabilities || []);
          setReceivingProvider(plan.receivingProvider || 'Ken Lee');
          setInstructionsLabel(plan.instructions?.label || 'Attach Diagnosis Information');
          setInstructionsContent(plan.instructions?.content || []);
          setPatientInstructions(plan.instructions?.patientInstructions || '');

          // Prefill Process form
          setProcessDispoDate(plan.dispositionDate);
          setProcessDiagnosis(plan.diagnosis);
          setProcessDisposition(plan.disposition);
          setProcessAcuity(plan.dischargeAcuity);
          setProcessTransferType(plan.transferType || 'Hospital ER');
          setProcessFacility(sites.find(s => s.code === plan.destinationSite)?.name || plan.destinationSite);
          setProcessSpecialty(plan.specialty);
          setProcessBedCategory(plan.bedCategory);
          setProcessAdditionalCapabilities(plan.additionalCapabilities || []);
          setProcessReceivingProvider(plan.receivingProvider || 'Ken Lee');
        }
      }
    };
    load();
  }, [id]);

  if (!patient) return <div className="p-8">Patient not found</div>;

  const isDischargePlanReadOnly = patient.status === PatientStatus.DISCHARGED || patient.status === PatientStatus.DISCHARGED_COMPLETE;
  const isDischargeProcessReadOnly = patient.status === PatientStatus.DISCHARGED_COMPLETE;

  const handleSignAndOrderDischarge = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!acuity) newErrors.acuity = true;
    if (disposition === 'Transfer') {
      if (!specialty) newErrors.specialty = true;
      if (!bedCategory) newErrors.bedCategory = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newPlan: DischargePlan = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      providerName: 'Kim, S (MD)',
      dispositionDate: dispoDate,
      diagnosis,
      disposition,
      dischargeAcuity: acuity,
      transferType: disposition === 'Transfer' ? transferType : undefined,
      destinationSite: disposition === 'Transfer' ? facility : '',
      bedCategory: disposition === 'Transfer' ? bedCategory : '',
      specialty: disposition === 'Transfer' ? specialty : '',
      additionalCapabilities: disposition === 'Transfer' ? additionalCapabilities : [],
      receivingProvider: disposition === 'Transfer' ? receivingProvider : undefined,
      instructions: {
        label: instructionsLabel,
        content: instructionsContent,
        patientInstructions,
      },
      prescriptions: [
        { name: 'Ibuprofen 100mg/5mL', duration: '3 day(s)', instructions: 'Take 10 mL every 8 hours', prescribedBy: 'Ken Lee, MD' },
        { name: 'Losartan', duration: '3 day(s)', instructions: 'Monitor blood pressure regularly. Avoid potassium supplements unless instructed.', prescribedBy: 'Ken Lee, MD' },
        { name: 'Med Name', duration: '<day-supply> day(s)', instructions: 'Monitor blood pressure regularly. Avoid potassium supplements unless instructed.', prescribedBy: 'Ken Lee, MD' }
      ],
      medsToGo: [
        { name: 'Ibuprofen 100mg/5mL', quantity: '100 Capsules', comments: 'Take with a full glass of water. Avoid skipping doses.', prescribedBy: 'Ken Lee, MD' },
        { name: 'Fluconazole Tablets 200 mg', quantity: '100 Tablets', comments: 'Monitor blood pressure regularly. Avoid potassium supplements unless instructed.', prescribedBy: 'Ken Lee, MD' },
        { name: 'Med Name + Strength', quantity: 'Quantity', comments: 'Direction', prescribedBy: 'Ken Lee, MD' }
      ],
      status: 'Finalized',
    };
    
    await updatePatient(patient.id, { 
      dischargePlan: newPlan,
      status: PatientStatus.DISCHARGED 
    });
    navigate('/');
  };

  const handleCompleteAndTransfer = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!processAssessmentNote) newErrors.processAssessmentNote = true;
    if (!transferTime) newErrors.transferTime = true;
    if (jpatsTracking === 'Yes' && !jpatsNumber) newErrors.jpatsNumber = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!patient) return;
    
    const now = new Date();
    const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const supersededEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: formattedDate,
      note: `Discharge Note — ${formattedDate} — Superseded`,
      status: 'Finalized',
      author: 'Kim, S (MD)',
      signedBy: 'Kim, S (MD)'
    };

    const newDocumentation = [supersededEntry, ...(patient.documentation || [])];

    await updatePatient(patient.id, {
      status: PatientStatus.IN_TRANSIT,
      site: 'EMS Transit Unit',
      documentation: newDocumentation,
      dischargePlan: null,
      transferNote: {
        isDischargeProcess: true,
        status: 'In-Transit',
        fromSite: 'CH',
        toCode: facility,
        toName: sites.find(s => s.code === facility)?.name || facility,
        transport: modeOfTransport,
        eta: facilityEta || emsEta,
        jpats: jpatsTracking === 'Yes',
        jpatsNumber: jpatsTracking === 'Yes' ? jpatsNumber : '',
        details: processAssessmentNote,
        receivingTime: '',
        dispositionTime: '',
        dispositionDetails: '',
        specialty: specialty,
        bedCategory: bedCategory,
        additionalCapabilities: additionalCapabilities,
        ambulanceId: ambulanceUnitId,
        transitTime: transferTime
      }
    });
    navigate('/');
  };

  const handleCompleteDischarge = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!processAssessmentNote) newErrors.processAssessmentNote = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!patient) return;
    
    const now = new Date();
    const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const dischargeEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: formattedDate,
      note: `Discharge Note — ${formattedDate}`,
      status: 'Finalized',
      author: 'Kim, S (MD)',
      signedBy: 'Kim, S (MD)'
    };

    const newDocumentation = [dischargeEntry, ...(patient.documentation || [])];

    await updatePatient(patient.id, {
      status: PatientStatus.DISCHARGED_COMPLETE,
      documentation: newDocumentation
    });
    navigate('/');
  };

  const handleProcessDischarge = async (transferInfo: any) => {
    await updatePatient(patient.id, { 
      status: PatientStatus.IN_TRANSIT,
      transferNote: {
        status: 'In-Transit',
        toCode: patient.dischargePlan?.destinationSite || '',
        toName: patient.dischargePlan?.destinationSite || '',
        fromSite: patient.site,
        transport: transferInfo.transport,
        ambulanceId: transferInfo.ambulanceId,
        transitTime: new Date().toISOString(),
        eta: transferInfo.eta,
        jpats: transferInfo.jpats,
        details: transferInfo.details,
      }
    });
    const updated = await getPatientById(patient.id);
    setPatient(updated);
    setShowProcessModal(false);
  };

  const tabs = [
    { name: 'Summary' },
    { name: 'Rapid Actions' },
    { name: 'Triage' },
    { name: 'Documentation', badge: 2 },
    { name: 'Orders', badge: 1 },
    { name: 'Results', badge: 1 },
    { name: 'Nursing' },
    { name: 'Pharmacy' },
    { name: 'Telemedicine', badge: 1 },
    { name: 'Demographics' },
    { name: 'HIE' },
    { name: 'Discharge', subTabs: ['Plan', 'Process'] },
  ];

  return (
    <div className="flex bg-[#EAEAEA] min-h-[calc(100vh-72px)]">
      {/* Left Tab Menu */}
      <div className="w-[200px] bg-white border-r border-[#BBBBBB] flex flex-col">
        {tabs.map(tab => (
          <div key={tab.name}>
            <button
              onClick={() => setActiveTab(tab.name)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between border-b border-[#E8E8E8] hover:bg-[#F5F5F5] transition-colors ${activeTab === tab.name ? 'bg-[#1F6AB0] text-white' : 'text-[#101010]'}`}
            >
              <span className="text-sm font-medium">{tab.name}</span>
              {tab.badge && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === tab.name ? 'bg-white text-[#1F6AB0]' : 'bg-[#1F6AB0] text-white'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
            {tab.name === 'Discharge' && activeTab === 'Discharge' && (
              <div className="bg-[#E9F1FF]">
                {tab.subTabs?.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setDischargeSubTab(sub)}
                    className={`w-full text-left pl-8 pr-4 py-2 text-sm border-b border-[#D1E1F5] hover:bg-[#D1E1F5] transition-colors ${dischargeSubTab === sub ? 'bg-[#D1E1F5] font-bold' : 'text-[#101010]'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Patient Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-[#E3E5E8] overflow-hidden">
              <img src={`https://picsum.photos/seed/${patient.id}/64/64`} alt="Patient" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#101010]">{patient.lastName}, {patient.firstName}*</h2>
              <div className="text-sm text-[#888] flex items-center gap-2">
                <span>{patient.sex}</span>
                <span>·</span>
                <span>{patient.age} yo</span>
                <span>·</span>
                <span>01/30/2025</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-[#101010]">Alerts:</span>
                {patient.alerts.map(a => (
                  <span key={a} className="flex items-center gap-1 text-xs text-[#101010]">
                    <i className="fa-solid fa-language"></i> {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-[#888]">NDMS MRN:</span>
              <span className="font-bold">0098264</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-[#888]">ASPR DT MRN:</span>
              <span className="font-bold">{patient.mrn}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm border-l border-[#BBBBBB] pl-8">
            <div className="flex gap-4">
              <span className="text-[#888]">CC:</span>
              <span className="font-bold">{patient.chiefComplaint}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-[#888]">Triage Lvl:</span>
              <span className={`triage-badge ${patient.triageLevel === TriageCode.IMMEDIATE ? 'triage-badge--immediate' : 'triage-badge--minor'}`}>{patient.triageLevel}</span>
              <span className="font-bold">Emergent</span>
            </div>
            <div className="flex gap-4">
              <span className="text-[#888]">PEWS:</span>
              <span className="font-bold">{patient.pewsMews || '-'}</span>
              <span className="text-[#888] ml-4">MEWS:</span>
              <span className="bg-[#D32F2F] text-white px-1 rounded font-bold">3</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm border-l border-[#BBBBBB] pl-8">
            <div className="flex justify-between gap-8">
              <span className="text-[#888]">Weight:</span>
              <span className="font-bold">80kg</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-[#888]">Allergies:</span>
              <span className="text-[#D32F2F] font-bold">Acetaminophen</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-[#888]">Code Status:</span>
              <span className="font-bold">RESUS</span>
            </div>
          </div>

          <div className="bg-[#F5F5F5] p-3 rounded-lg border border-[#BBBBBB] flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-[#101010]">
                <MapPin className="w-4 h-4" /> TGH / C-3
              </div>
              <button className="text-[#1F6AB0] text-xs font-bold hover:underline flex items-center gap-1">
                Sites <List className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xs text-[#101010]">
              Kim, S (MD); Singer, J; Reyes, M (RN), Ng, S (EMT)
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        {activeTab === 'Summary' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column: Vitals, Triage Note, Medical History */}
            <div className="col-span-3 flex flex-col gap-4">
              {/* Vitals */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#101010]">Vitals</h3>
                  <div className="flex gap-4 text-[10px] text-[#888]">
                    <span>10/10/24<br/>10:03 AM</span>
                    <span>10/10/24<br/>08:36 AM</span>
                    <span>10/10/24<br/>08:36 PM</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#888]">BP</span>
                    <span className="font-bold">110/74</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">HR</span>
                    <span className="font-bold">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">RR</span>
                    <span className="font-bold">16</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">O₂ Delivery</span>
                    <span className="font-bold">98% 2L NC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Temp</span>
                    <span className="font-bold">36.8°C</span>
                  </div>
                </div>
              </div>

              {/* Triage Note */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <h3 className="font-bold text-[#101010] mb-2">Triage Note</h3>
                <p className="text-sm text-[#101010]">
                  Brought in by EMS for chest pain x 5 hrs, LE edema, ran out of medications
                </p>
              </div>

              {/* Medical History */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <h3 className="font-bold text-[#101010] mb-4">Medical History</h3>
                <div className="flex flex-col gap-4 text-xs">
                  <div className="flex gap-4">
                    <span className="text-[#888] w-16 italic">PMHx</span>
                    <span className="font-bold">HTN</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#888] w-16 italic">PSHx</span>
                    <span className="font-bold">Appendectomy 2007<br/>R knee ACL repair 2018</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#888] w-16 italic">Social Hx</span>
                    <span className="font-bold">Vapes - Everyday<br/>Alcohol - Twice a week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Active Orders, Results */}
            <div className="col-span-6 flex flex-col gap-4">
              {/* Active Orders */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <h3 className="font-bold text-[#101010] mb-4">Active Orders</h3>
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1 rounded bg-[#E9F1FF] text-[#1F6AB0] text-xs font-bold border border-[#1F6AB0]">Medication 2</button>
                  <button className="px-3 py-1 rounded bg-[#E9F1FF] text-[#1F6AB0] text-xs font-bold border border-[#1F6AB0]">Lab 2</button>
                  <button className="px-3 py-1 rounded bg-[#E9F1FF] text-[#1F6AB0] text-xs font-bold border border-[#1F6AB0]">IV Fluids 1</button>
                  <button className="px-3 py-1 rounded bg-[#E9F1FF] text-[#1F6AB0] text-xs font-bold border border-[#1F6AB0]">Interventions 1</button>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[10px] text-[#888] mb-1">Medication</div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1F6AB0] font-bold">Labetalol 20mg IV</span>
                        <Check className="w-4 h-4 text-[#388E3C]" />
                      </div>
                      <span className="text-[#888] text-xs">10/11/25 09:55 AM</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#888] mb-1">Lab</div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1F6AB0] font-bold">i-STAT Chem 8+</span>
                        <Check className="w-4 h-4 text-[#388E3C]" />
                      </div>
                      <span className="text-[#888] text-xs">11/12/25 09:55 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <h3 className="font-bold text-[#101010] mb-4">Results</h3>
                <div className="flex border-b border-[#BBBBBB] mb-4">
                  <button className="px-4 py-2 text-xs font-bold border-b-2 border-[#1F6AB0] text-[#1F6AB0]">Lab 3</button>
                  <button className="px-4 py-2 text-xs font-bold text-[#888]">Imaging</button>
                  <button className="px-4 py-2 text-xs font-bold text-[#888]">EKG 1</button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-[#1F6AB0]">Urinalysis</span>
                    <span className="text-[#888] text-xs font-normal">10/10/24 10:05 AM</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs pl-4">
                    <span className="text-[#888]">LE</span><span className="text-[#D32F2F]">Trace</span>
                    <span className="text-[#888]">Nit</span><span>Negative</span>
                    <span className="text-[#888]">Uro</span><span>2.0 mg/dL</span>
                    <span className="text-[#888]">Protein</span><span className="text-[#D32F2F]">30 mg/dL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Telemedicine, Caregiver, Diagnosis, Disposition */}
            <div className="col-span-3 flex flex-col gap-4">
              {/* Telemedicine */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <h3 className="font-bold text-[#101010] mb-4">Telemedicine</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Video className="w-6 h-6 text-[#101010]" />
                  <div>
                    <div className="text-sm font-bold">Respiratory Therapist</div>
                    <div className="text-xs text-[#888]">1h30m</div>
                  </div>
                  <span className="ml-auto text-[10px] text-[#388E3C] font-bold">Specialist is ready</span>
                </div>
                <button className="w-full bg-[#155098] text-white py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2">
                  <Video className="w-4 h-4" /> Join Call
                </button>
              </div>

              {/* Disposition */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <h3 className="font-bold text-[#101010] mb-2">Disposition</h3>
                <div className="text-sm text-[#101010]">
                  {patient.status === PatientStatus.IN_TRANSIT ? (
                    <div className="flex items-center gap-2 text-[#492781] font-bold">
                      <Truck className="w-4 h-4" /> In-Transit to {patient.transferNote?.toName}
                    </div>
                  ) : patient.dischargePlan ? (
                    <div className="flex items-center gap-2 text-[#2E7D32] font-bold">
                      <Check className="w-4 h-4" /> Transfer to {patient.dischargePlan.destinationSite}
                    </div>
                  ) : (
                    <span className="text-[#888]">No disposition set</span>
                  )}
                </div>
              </div>

              {/* Hand-off Note */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-4">
                <h3 className="font-bold text-[#101010] mb-2">Hand-off Note</h3>
                <p className="text-xs text-[#101010]">
                  Kan, R (RN) to Singer, D (RN) @ 10/10/24 07:00 PM
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Documentation' && (
          <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] overflow-hidden">
            <div className="bg-[#F5F5F5] px-6 py-3 border-b border-[#BBBBBB] flex items-center justify-between">
              <h3 className="font-bold text-[#101010]">Past Session</h3>
              <button className="text-[#1F6AB0] text-xs font-bold hover:underline">+ Add Note</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#E9F1FF] text-[#101010]">
                <tr>
                  <th className="px-6 py-3 text-left font-bold">Date</th>
                  <th className="px-6 py-3 text-left font-bold">Note</th>
                  <th className="px-6 py-3 text-left font-bold">Status</th>
                  <th className="px-6 py-3 text-left font-bold">Author</th>
                  <th className="px-6 py-3 text-left font-bold">Signed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBBBBB]">
                {patient.documentation?.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-[#F9F9F9]">
                    <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
                    <td className="px-6 py-4 font-medium text-[#1F6AB0]">{entry.note}</td>
                    <td className="px-6 py-4">{entry.status}</td>
                    <td className="px-6 py-4">{entry.author}</td>
                    <td className="px-6 py-4">{entry.signedBy}</td>
                  </tr>
                ))}
                {(!patient.documentation || patient.documentation.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#888]">No documentation entries for this session</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Discharge Tab Content */}
        {activeTab === 'Discharge' && (
          <div className="bg-[#F5F5F5] min-h-full">
            <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-[#BBBBBB]">
              <h2 className="text-xl font-bold text-[#101010]">Discharge - {dischargeSubTab}</h2>
            </div>

            {dischargeSubTab === 'Plan' && (
              <div className="p-6 space-y-6">
                {/* Discharge Details Section */}
                <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-6">
                  <h3 className="text-sm font-bold text-[#888] mb-4">Discharge Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-1">Disposition Date & Time</label>
                      <div className="relative">
                        <input 
                          type="datetime-local" 
                          className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                          value={dispoDate} 
                          onChange={e => setDispoDate(e.target.value)}
                          disabled={isDischargePlanReadOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Diagnosis</label>
                        <input 
                          type="text" 
                          className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                          value={diagnosis} 
                          onChange={e => setDiagnosis(e.target.value)}
                          disabled={isDischargePlanReadOnly}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Disposition</label>
                        <select 
                          className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                          value={disposition} 
                          onChange={e => setDisposition(e.target.value)}
                          disabled={isDischargePlanReadOnly}
                        >
                          <option value="Home">Home</option>
                          <option value="Transfer">Transfer</option>
                          <option value="Shelter">Shelter</option>
                          <option value="AMA">AMA</option>
                          <option value="Deceased">Deceased</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Discharge Acuity <span className="text-[#D32F2F]">*</span></label>
                        <select 
                          className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.acuity ? 'border-[#D32F2F] bg-[#FDECEA]' : 'border-[#BBBBBB] bg-white'} ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : ''}`} 
                          value={acuity} 
                          onChange={e => {
                            setAcuity(e.target.value);
                            if (e.target.value) setErrors(prev => ({ ...prev, acuity: false }));
                          }}
                          disabled={isDischargePlanReadOnly}
                        >
                          <option value="">— Select —</option>
                          <option value="Stable">Stable</option>
                          <option value="Guarded">Guarded</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    {disposition === 'Transfer' && (
                      <>
                        <div className="flex items-center gap-6 py-2">
                          <span className="text-sm font-bold text-[#101010]">Transfer Type:</span>
                          <label className={`flex items-center gap-2 text-sm ${isDischargePlanReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="radio" name="transferType" value="Hospital ER" checked={transferType === 'Hospital ER'} onChange={e => setTransferType(e.target.value)} className="accent-[#155098]" disabled={isDischargePlanReadOnly} /> Hospital ER
                          </label>
                          <label className={`flex items-center gap-2 text-sm ${isDischargePlanReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="radio" name="transferType" value="Hospital Inpatient" checked={transferType === 'Hospital Inpatient'} onChange={e => setTransferType(e.target.value)} className="accent-[#155098]" disabled={isDischargePlanReadOnly} /> Hospital Inpatient
                          </label>
                          <label className={`flex items-center gap-2 text-sm ${isDischargePlanReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="radio" name="transferType" value="Behavioral Health Facility" checked={transferType === 'Behavioral Health Facility'} onChange={e => setTransferType(e.target.value)} className="accent-[#155098]" disabled={isDischargePlanReadOnly} /> Behavioral Health Facility
                          </label>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Facility</label>
                            <select 
                              className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                              value={facility} 
                              onChange={e => setFacility(e.target.value)}
                              disabled={isDischargePlanReadOnly}
                            >
                              <option value="">— Select —</option>
                              {sites.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Specialty <span className="text-[#D32F2F]">*</span></label>
                            <select 
                              className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.specialty ? 'border-[#D32F2F] bg-[#FDECEA]' : 'border-[#BBBBBB] bg-white'} ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : ''}`} 
                              value={specialty} 
                              onChange={e => {
                                setSpecialty(e.target.value);
                                if (e.target.value) setErrors(prev => ({ ...prev, specialty: false }));
                              }}
                              disabled={isDischargePlanReadOnly}
                            >
                              <option value="">— Select —</option>
                              {specialtyOptions[facility]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Bed Category <span className="text-[#D32F2F]">*</span></label>
                            <select 
                              className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.bedCategory ? 'border-[#D32F2F] bg-[#FDECEA]' : 'border-[#BBBBBB] bg-white'} ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : ''}`} 
                              value={bedCategory} 
                              onChange={e => {
                                setBedCategory(e.target.value);
                                if (e.target.value) setErrors(prev => ({ ...prev, bedCategory: false }));
                              }}
                              disabled={isDischargePlanReadOnly}
                            >
                              <option value="">— Select —</option>
                              {bedCategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Additional Capability</label>
                            <div className="relative" ref={capabilityRef}>
                              <div 
                                className={`min-h-[38px] w-full px-3 py-1 border border-[#BBBBBB] rounded flex flex-wrap gap-1 items-center ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white cursor-pointer focus-within:border-[#1C63A9] focus-within:ring-2 focus-within:ring-[#1C63A9]/15'}`}
                                onClick={() => !isDischargePlanReadOnly && setIsCapabilityOpen(!isCapabilityOpen)}
                              >
                                {additionalCapabilities.length === 0 && <span className="text-[#888] text-sm">— Select —</span>}
                                {additionalCapabilities.map(cap => (
                                  <span key={cap} className="bg-[#E9F1FF] text-[#1C63A9] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                    {cap}
                                    {!isDischargePlanReadOnly && (
                                      <X 
                                        className="w-3 h-3 cursor-pointer hover:text-[#D32F2F]" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCapabilityToggle(cap);
                                        }}
                                      />
                                    )}
                                  </span>
                                ))}
                                <ChevronDown className="w-4 h-4 ml-auto text-[#888]" />
                              </div>
                              {isCapabilityOpen && !isDischargePlanReadOnly && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#BBBBBB] rounded shadow-lg z-[210] max-h-[200px] overflow-y-auto">
                                  {additionalCapabilityOptions.map(cap => (
                                    <div 
                                      key={cap} 
                                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#F5F5F5] flex items-center justify-between ${additionalCapabilities.includes(cap) ? 'bg-[#F0F4FA] text-[#1C63A9] font-bold' : 'text-[#101010]'}`}
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
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Receiving Provider</label>
                            <select 
                              className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                              value={receivingProvider} 
                              onChange={e => setReceivingProvider(e.target.value)}
                              disabled={isDischargePlanReadOnly}
                            >
                              <option value="Ken Lee">Ken Lee</option>
                              <option value="Sarah Smith">Sarah Smith</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Discharge Instructions Section */}
                <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-6">
                  <h3 className="text-sm font-bold text-[#888] mb-4">Discharge Instructions</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-1">Attach Diagnosis Information</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                            value={instructionsLabel} 
                            onChange={e => setInstructionsLabel(e.target.value)}
                            disabled={isDischargePlanReadOnly}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#888]">
                            <Search className="w-4 h-4" />
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#BBBBBB] rounded overflow-hidden">
                      {instructionsContent.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between px-4 py-2 border-b border-[#BBBBBB] last:border-0 text-sm">
                          <span>{item}</span>
                          {!isDischargePlanReadOnly && (
                            <button 
                              onClick={() => setInstructionsContent(prev => prev.filter((_, i) => i !== idx))}
                              className="text-[#D32F2F] hover:bg-[#FDECEA] p-1 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-1">Patient Instructions</label>
                      <textarea 
                        className={`w-full p-3 border border-[#BBBBBB] rounded text-sm min-h-[120px] ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                        placeholder='use "/" to show the template'
                        value={patientInstructions}
                        onChange={e => setPatientInstructions(e.target.value)}
                        disabled={isDischargePlanReadOnly}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-1">Referral</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                          value={referral} 
                          onChange={e => setReferral(e.target.value)}
                          disabled={isDischargePlanReadOnly}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#888]">
                          <Search className="w-4 h-4" />
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  className={`w-full py-3 border-2 border-dashed border-[#BBBBBB] rounded-lg text-sm font-bold text-[#101010] transition-colors ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'hover:bg-white'}`}
                  disabled={isDischargePlanReadOnly}
                >
                  Add Electronic Prescriptions
                </button>

                {/* Prescriptions Section */}
                <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#BBBBBB]">
                    <h3 className="text-sm font-bold text-[#888]">Prescriptions</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-[#E9F1FF] text-[#101010]">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold">Name</th>
                        <th className="px-6 py-3 text-left font-bold">Duration</th>
                        <th className="px-6 py-3 text-left font-bold">Instructions</th>
                        <th className="px-6 py-3 text-left font-bold">Prescribed by</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BBBBBB]">
                      <tr>
                        <td className="px-6 py-4">
                          <div className="font-bold">Ibuprofen 100mg/5mL</div>
                          <div className="text-xs text-[#888]">Quantity: 10 Capsule | Refills: 1</div>
                        </td>
                        <td className="px-6 py-4">3 day(s)</td>
                        <td className="px-6 py-4">Take 10 mL every 8 hours</td>
                        <td className="px-6 py-4">Ken Lee, MD</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="font-bold">Losartan</div>
                          <div className="text-xs text-[#888]">Quantity: 50 mg | Refills: 0</div>
                        </td>
                        <td className="px-6 py-4">3 day(s)</td>
                        <td className="px-6 py-4">Monitor blood pressure regularly. Avoid potassium supplements unless instructed.</td>
                        <td className="px-6 py-4">Ken Lee, MD</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="font-bold">Med Name</div>
                          <div className="text-xs text-[#888]">Quantity: &lt;Dispense&gt; + &lt;Dispense Unit&gt; | Refills: &lt;#&gt;</div>
                        </td>
                        <td className="px-6 py-4">&lt;day-supply&gt; day(s)</td>
                        <td className="px-6 py-4">Monitor blood pressure regularly. Avoid potassium supplements unless instructed.</td>
                        <td className="px-6 py-4">Ken Lee, MD</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="p-6 bg-[#F9F9F9] space-y-4">
                    <div className="text-xs font-bold text-[#101010]">Pharmacy Receiving Prescription</div>
                    <div className="text-xs text-[#101010]">COSTCO PHARMACY #143, 1000 N Reinstorff Ave, Mountain View, CA, 94043, 6509887106</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" className="accent-[#155098]" /> Electronic Prescription
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer ml-6">
                        <input type="checkbox" className="accent-[#155098]" /> Sent to: COSTCO PHARMACY #143, 1000 N Reinstorff Ave, Mountain View, CA, 94043, 6509887106
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" className="accent-[#155098]" /> Printed
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" className="accent-[#155098]" /> Other Prescription
                      </label>
                    </div>
                  </div>
                </div>

                {/* Medications to Go Section */}
                <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#BBBBBB]">
                    <h3 className="text-sm font-bold text-[#888]">Medications to Go</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-[#E9F1FF] text-[#101010]">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold">Name</th>
                        <th className="px-6 py-3 text-left font-bold">Quantity</th>
                        <th className="px-6 py-3 text-left font-bold">Comments</th>
                        <th className="px-6 py-3 text-left font-bold">Prescribed by</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BBBBBB]">
                      <tr>
                        <td className="px-6 py-4">
                          <div className="font-bold">Ibuprofen 100mg/5mL</div>
                          <div className="text-xs text-[#888]">500 mg | 3 days</div>
                        </td>
                        <td className="px-6 py-4">100 Capsules</td>
                        <td className="px-6 py-4">Take with a full glass of water. Avoid skipping doses.</td>
                        <td className="px-6 py-4">Ken Lee, MD</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="font-bold">Fluconazole Tablets 200 mg</div>
                          <div className="text-xs text-[#888]">200 mg PO | 3 days</div>
                        </td>
                        <td className="px-6 py-4">100 Tablets</td>
                        <td className="px-6 py-4">Monitor blood pressure regularly. Avoid potassium supplements unless instructed.</td>
                        <td className="px-6 py-4">Ken Lee, MD</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4">
                          <div className="font-bold">Med Name + Strength</div>
                          <div className="text-xs text-[#888]">Dosing Option | Duration</div>
                        </td>
                        <td className="px-6 py-4">Quantity</td>
                        <td className="px-6 py-4">Direction</td>
                        <td className="px-6 py-4">Prescribed by</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button className={`h-11 px-8 rounded-md font-bold text-sm border transition-colors ${isDischargePlanReadOnly ? 'bg-[#F5F5F5] text-gray-400 border-gray-300 cursor-not-allowed' : 'bg-white text-[#155098] border-[#155098] hover:bg-[#F5F9FF]'}`} disabled={isDischargePlanReadOnly}>Sign</button>
                  <button 
                    onClick={handleSignAndOrderDischarge}
                    className={`h-11 px-8 rounded-md font-bold text-sm text-white transition-colors ${isDischargePlanReadOnly ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#155098] hover:bg-[#0e3d75]'}`}
                    disabled={isDischargePlanReadOnly}
                  >
                    Sign & Order Discharge
                  </button>
                </div>
              </div>
            )}

            {dischargeSubTab === 'Process' && (
              <div className="p-6 space-y-6">
                {/* Discharge Details Section */}
                <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-6">
                  <h3 className="text-sm font-bold text-[#888] mb-4">Discharge Details</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Disposition Date & Time</label>
                        <input 
                          type="datetime-local" 
                          className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                          value={processDispoDate} 
                          onChange={e => setProcessDispoDate(e.target.value)}
                          disabled={isDischargeProcessReadOnly}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Diagnosis</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                          value={processDiagnosis} 
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Disposition</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                          value={processDisposition} 
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Discharge Acuity</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                          value={processAcuity} 
                          readOnly
                        />
                      </div>
                    </div>

                    {processDisposition === 'Transfer' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Transfer Type:</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                              value={processTransferType} 
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Facility</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                              value={processFacility} 
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Specialty</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                              value={processSpecialty} 
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Bed Category</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                              value={processBedCategory} 
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Additional Capability</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                              value={processAdditionalCapabilities.join(', ')} 
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#101010] mb-1">Receiving Provider/Service</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-[#BBBBBB] rounded bg-[#F5F5F5] text-sm" 
                              value={processReceivingProvider} 
                              readOnly
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-1">Discharge Assessment Note <span className="text-[#D32F2F]">*</span></label>
                      <textarea 
                        className={`w-full p-3 border rounded text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.processAssessmentNote ? 'border-[#D32F2F] bg-[#FDECEA]' : 'border-[#BBBBBB]'} ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                        placeholder='use "/" to show the template'
                        value={processAssessmentNote}
                        onChange={e => {
                          setProcessAssessmentNote(e.target.value);
                          if (e.target.value) setErrors(prev => ({ ...prev, processAssessmentNote: false }));
                        }}
                        disabled={isDischargeProcessReadOnly}
                      />
                    </div>
                  </div>
                </div>

                {/* Transport Section */}
                {processDisposition === 'Transfer' && (
                  <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-6">
                    <h3 className="text-sm font-bold text-[#888] mb-4">Transport</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-bold text-[#101010]">Transport Ordered:</span>
                        <div className="flex items-center gap-4">
                          <label className={`flex items-center gap-2 text-sm ${isDischargeProcessReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="radio" checked={transportOrdered === true} onChange={() => setTransportOrdered(true)} className="accent-[#155098]" disabled={isDischargeProcessReadOnly} /> Yes
                          </label>
                          <label className={`flex items-center gap-2 text-sm ${isDischargeProcessReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="radio" checked={transportOrdered === false} onChange={() => setTransportOrdered(false)} className="accent-[#155098]" disabled={isDischargeProcessReadOnly} /> No
                          </label>
                        </div>
                        {transportOrdered && (
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm text-[#888]">at</span>
                            <input 
                              type="datetime-local" 
                              className={`p-1 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                              value={transportOrderedTime}
                              onChange={e => setTransportOrderedTime(e.target.value)}
                              disabled={isDischargeProcessReadOnly}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#101010] mb-1">Transport Type</label>
                          <select className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} value={transportType} onChange={e => setTransportType(e.target.value)} disabled={isDischargeProcessReadOnly}>
                            <option value="">— Select —</option>
                            <option value="Ground">Ground</option>
                            <option value="Air">Air</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#101010] mb-1">EMS ETA</label>
                          <input type="text" className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} value={emsEta} onChange={e => setEmsEta(e.target.value)} placeholder="e.g. 15 mins" disabled={isDischargeProcessReadOnly} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#101010] mb-1">Transfer Time <span className="text-[#D32F2F]">*</span></label>
                          <input 
                            type="datetime-local" 
                            className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.transferTime ? 'border-[#D32F2F] bg-[#FDECEA]' : 'border-[#BBBBBB]'} ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                            value={transferTime} 
                            onChange={e => {
                              setTransferTime(e.target.value);
                              if (e.target.value) setErrors(prev => ({ ...prev, transferTime: false }));
                            }}
                            disabled={isDischargeProcessReadOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#101010] mb-1">Facility ETA</label>
                          <input type="text" className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} value={facilityEta} onChange={e => setFacilityEta(e.target.value)} placeholder="e.g. 30 mins" disabled={isDischargeProcessReadOnly} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#101010] mb-1">Mode of Transport</label>
                          <select className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} value={modeOfTransport} onChange={e => setModeOfTransport(e.target.value)} disabled={isDischargeProcessReadOnly}>
                            <option value="Ambulance">Ambulance</option>
                            <option value="Private vehicle">Private vehicle</option>
                            <option value="Air Transport">Air Transport</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#101010] mb-1">Ambulance Unit ID</label>
                          <input type="text" className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} value={ambulanceUnitId} onChange={e => setAmbulanceUnitId(e.target.value)} disabled={isDischargeProcessReadOnly} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#101010] mb-1">Other Detail</label>
                        <input type="text" className={`w-full p-2 border border-[#BBBBBB] rounded text-sm ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} value={otherDetail} onChange={e => setOtherDetail(e.target.value)} disabled={isDischargeProcessReadOnly} />
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="text-sm font-bold text-[#101010]">JPATS Tracking:</span>
                        <div className="flex items-center gap-4">
                          <label className={`flex items-center gap-2 text-sm ${isDischargeProcessReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="radio" checked={jpatsTracking === 'Yes'} onChange={() => setJpatsTracking('Yes')} className="accent-[#155098]" disabled={isDischargeProcessReadOnly} /> Yes
                          </label>
                          <label className={`flex items-center gap-2 text-sm ${isDischargeProcessReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            <input type="radio" checked={jpatsTracking === 'No'} onChange={() => setJpatsTracking('No')} className="accent-[#155098]" disabled={isDischargeProcessReadOnly} /> No
                          </label>
                        </div>
                        {jpatsTracking === 'Yes' && (
                          <div className="flex items-center gap-2 ml-4 flex-1">
                            <span className="text-sm text-[#888]">Number:</span>
                            <input 
                              type="text" 
                              className={`flex-1 p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C63A9]/15 ${errors.jpatsNumber ? 'border-[#D32F2F] bg-[#FDECEA]' : 'border-[#BBBBBB]'} ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`} 
                              value={jpatsNumber}
                              onChange={e => {
                                setJpatsNumber(e.target.value);
                                if (e.target.value) setErrors(prev => ({ ...prev, jpatsNumber: false }));
                              }}
                              disabled={isDischargeProcessReadOnly}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Discharge Instructions */}
                <div className="bg-white rounded-lg shadow-sm border border-[#BBBBBB] p-6">
                  <h3 className="text-sm font-bold text-[#888] mb-4">Discharge Instructions</h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-[#101010] mb-1">Diagnosis Information</label>
                    <div className="border border-[#BBBBBB] rounded overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#BBBBBB] text-sm">AVOIDING TRIGGERS WITH HEART FAILURE: AFTER YOUR VISIT</div>
                      <div className="px-4 py-3 border-b border-[#BBBBBB] text-sm">BIVENTRICULAR PACEMAKER: GENERAL INFO</div>
                      <div className="px-4 py-3 text-sm bg-[#F5F5F5]">BIVENTRICULAR PACEMAKER: POST-OP</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#101010] mb-1">Patient Instructions</label>
                    <div className="text-sm leading-relaxed">{processPatientInstructions}</div>
                  </div>
                </div>

                {/* Email/Print Documents */}
                <div className="bg-[#F5F5F5] rounded-lg shadow-sm border border-[#BBBBBB] p-6">
                  <h3 className="text-sm font-bold text-[#888] mb-4">Email/Print Documents</h3>
                  
                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-2">Discharge Instructions</label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Email</span>
                        <input type="text" className="flex-1 p-2 border border-[#BBBBBB] rounded bg-white text-sm max-w-[300px]" value={emailInstructions} onChange={e => setEmailInstructions(e.target.value)} />
                        <button className="flex items-center justify-center gap-2 px-6 py-2 border border-[#1C63A9] text-[#1C63A9] rounded font-bold text-sm bg-white hover:bg-[#F5F9FF] min-w-[120px]">
                          <i className="fa-solid fa-envelope"></i> Send
                        </button>
                        <div className="w-px h-6 bg-[#BBBBBB]"></div>
                        <button className="flex items-center justify-center gap-2 px-6 py-2 border border-[#1C63A9] text-[#1C63A9] rounded font-bold text-sm bg-white hover:bg-[#F5F9FF] min-w-[120px]">
                          <i className="fa-solid fa-print"></i> Print
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-2">Transfer Packet</label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Email</span>
                        <input type="text" className="flex-1 p-2 border border-[#BBBBBB] rounded bg-white text-sm max-w-[300px]" value={emailTransferPacket} onChange={e => setEmailTransferPacket(e.target.value)} />
                        <button className="flex items-center justify-center gap-2 px-6 py-2 border border-[#1C63A9] text-[#1C63A9] rounded font-bold text-sm bg-white hover:bg-[#F5F9FF] min-w-[120px]">
                          <i className="fa-solid fa-envelope"></i> Send
                        </button>
                        <div className="w-px h-6 bg-[#BBBBBB]"></div>
                        <button className="flex items-center justify-center gap-2 px-6 py-2 border border-[#1C63A9] text-[#1C63A9] rounded font-bold text-sm bg-white hover:bg-[#F5F9FF] min-w-[120px]">
                          <i className="fa-solid fa-print"></i> Print
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <label className="flex items-start gap-3 text-sm cursor-pointer">
                      <input type="checkbox" className="mt-1 w-4 h-4 accent-[#1C63A9]" checked={check1} onChange={e => setCheck1(e.target.checked)} />
                      <span>The patient and/or their caretaker has been provided with the diagnosis, treatment plan, and discharge instructions including follow-up recommendations and counseling on when to seek emergent care. The patient and/or their caretaker have had an opportunity to have their questions answered and verbally confirm their understanding.</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={check2} onChange={e => setCheck2(e.target.checked)} />
                      <span>An interpreter was used during the discharge process.</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={check3} onChange={e => setCheck3(e.target.checked)} />
                      <span>Patient is unable to sign due to clinical condition.</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={check4} onChange={e => setCheck4(e.target.checked)} />
                      <span>Patient declines to sign.</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-2">Patient Signature</label>
                      <div className="relative border border-[#BBBBBB] rounded bg-white h-[120px] flex items-center justify-center">
                        <span className="text-3xl text-[#BBBBBB] opacity-50 font-light">Sign here</span>
                        <button className="absolute top-3 right-3 text-[#1C63A9] hover:opacity-80">
                          <RotateCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#101010] mb-2">Parent/Guardian Signature</label>
                      <div className="relative border border-[#BBBBBB] rounded bg-white h-[120px] flex items-center justify-center">
                        <span className="text-3xl text-[#BBBBBB] opacity-50 font-light">Sign here</span>
                        <button className="absolute top-3 right-3 text-[#1C63A9] hover:opacity-80">
                          <RotateCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-[#BBBBBB]">
                  <button className={`h-11 px-8 rounded-md font-bold text-sm border transition-colors ${isDischargeProcessReadOnly ? 'bg-[#F5F5F5] text-gray-400 border-gray-300 cursor-not-allowed' : 'bg-white text-[#155098] border-[#155098] hover:bg-[#F5F9FF]'}`} disabled={isDischargeProcessReadOnly}>
                    Save & Order Transfer
                  </button>
                  {processDisposition === 'Transfer' ? (
                    <button 
                      onClick={handleCompleteAndTransfer}
                      className={`h-11 px-8 rounded-md font-bold text-sm text-white transition-colors ${isDischargeProcessReadOnly ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#155098] hover:bg-[#0e3d75]'}`}
                      disabled={isDischargeProcessReadOnly}
                    >
                      Complete & Transfer
                    </button>
                  ) : (
                    <button 
                      onClick={handleCompleteDischarge}
                      className={`h-11 px-8 rounded-md font-bold text-sm text-white transition-colors ${isDischargeProcessReadOnly ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#155098] hover:bg-[#0e3d75]'}`}
                      disabled={isDischargeProcessReadOnly}
                    >
                      Complete Discharge
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Process Transfer Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-2xl w-[600px] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Process Transfer</h2>
            <div className="space-y-4">
              <div className="bg-[#F6F7F8] p-4 rounded-lg mb-4">
                <div className="text-xs text-[#888]">Destination (from Plan)</div>
                <div className="font-bold">{patient.dischargePlan?.destinationSite}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Transport Mode</label>
                  <select id="transport" className="w-full p-2 border border-[#BBBBBB] rounded bg-white">
                    <option value="Ambulance">Ambulance</option>
                    <option value="Private vehicle">Private vehicle</option>
                    <option value="Air Transport">Air Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Ambulance ID</label>
                  <input id="ambId" type="text" className="w-full p-2 border border-[#BBBBBB] rounded" placeholder="e.g. AMB-102" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">ETA</label>
                <input id="eta" type="datetime-local" className="w-full p-2 border border-[#BBBBBB] rounded" />
              </div>
              <div className="flex items-center gap-2">
                <input id="jpats" type="checkbox" className="w-4 h-4 accent-[#155098]" />
                <label className="text-sm font-bold">JPATS Tracking Required</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowProcessModal(false)} className="px-6 py-2 rounded-md font-bold text-[#101010] hover:bg-[#F5F5F5]">Cancel</button>
              <button 
                onClick={() => {
                  const transport = (document.getElementById('transport') as HTMLSelectElement).value;
                  const ambId = (document.getElementById('ambId') as HTMLInputElement).value;
                  const eta = (document.getElementById('eta') as HTMLInputElement).value;
                  const jpats = (document.getElementById('jpats') as HTMLInputElement).checked;
                  handleProcessDischarge({ transport, ambulanceId: ambId, eta, jpats });
                }}
                className="px-6 py-2 rounded-md font-bold bg-[#155098] text-white"
              >
                Initiate Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
