import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sliders, RotateCw, MoreHorizontal, Truck, Check, ChevronUp } from 'lucide-react';
import { getPatients, updatePatient } from '../store';
import { Patient, PatientStatus, TriageCode } from '../types';
import { TransferNoteModal } from './TransferNoteModal';

export function TrackingBoard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string[]>([]);
  const [filterPatients, setFilterPatients] = useState<string[]>(['Active Patients']);
  const [filterSites, setFilterSites] = useState<string[]>(['Site 1', 'Central Hospital', 'George Washington University Hospital']);
  const [filterMD, setFilterMD] = useState('');
  const [filterRN, setFilterRN] = useState('');
  const [filterMedic, setFilterMedic] = useState('');
  const [modalState, setModalState] = useState<{ isOpen: boolean, patientId: string | null, mode: 'transfer' | 'update' | 'edit' }>({ isOpen: false, patientId: null, mode: 'transfer' });
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const filterPanel = document.getElementById('filter-panel');
      const filterButton = document.getElementById('filter-button');
      if (filterPanel && !filterPanel.contains(event.target as Node) && filterButton && !filterButton.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = patients.filter(p => {
    const matchesSearch = `${p.lastName} ${p.firstName} ${p.mrn} ${p.chiefComplaint}`.toLowerCase().includes(search.toLowerCase());
    
    // Discharged patients filter
    const isDischarged = p.status === PatientStatus.DISCHARGED_COMPLETE;
    const isActive = p.status !== PatientStatus.DISCHARGED_COMPLETE;
    
    let matchesPatientType = false;
    if (filterPatients.includes('Discharged Patients') && isDischarged) matchesPatientType = true;
    if (filterPatients.includes('Active Patients') && isActive) matchesPatientType = true;
    if (filterPatients.length === 0) matchesPatientType = true;

    // Site filter
    let matchesSite = false;
    if (filterSites.length === 0) {
      matchesSite = true;
    } else {
      const patientSites = [p.site];
      if (p.transferNote?.fromSite) patientSites.push(p.transferNote.fromSite);
      if (p.transferNote?.toCode) patientSites.push(p.transferNote.toCode);
      
      if (filterSites.includes('Site 1') && (patientSites.includes('SITE1') || patientSites.includes('Site 1'))) matchesSite = true;
      if (filterSites.includes('Central Hospital') && (patientSites.includes('CH') || patientSites.includes('Central Hospital'))) matchesSite = true;
      if (filterSites.includes('George Washington University Hospital') && (patientSites.includes('GWUH') || patientSites.includes('George Washington University Hospital'))) matchesSite = true;
    }

    // Patient Location filter
    let matchesLocation = false;
    if (filterLocation.length === 0) {
      matchesLocation = true;
    } else {
      if (filterLocation.includes('On Site') && p.status !== PatientStatus.IN_TRANSIT && p.status !== PatientStatus.TRANSFER_COMPLETE) matchesLocation = true;
      if (filterLocation.includes('In Transit') && p.status === PatientStatus.IN_TRANSIT) matchesLocation = true;
      if (filterLocation.includes('Transfer Completed') && p.status === PatientStatus.TRANSFER_COMPLETE) matchesLocation = true;
    }

    return matchesSearch && matchesPatientType && matchesSite && matchesLocation;
  });

  const getTriageClass = (code: TriageCode) => {
    switch (code) {
      case TriageCode.IMMEDIATE: return 'triage-badge--immediate';
      case TriageCode.DELAYED: return 'triage-badge--delayed';
      case TriageCode.MINOR: return 'triage-badge--minor';
      case TriageCode.EXPECTANT: return 'triage-badge--expectant';
      case TriageCode.DECEASED: return 'triage-badge--deceased';
      default: return 'triage-badge--minor';
    }
  };

  const handleMenuAction = (action: string, patientId: string) => {
    if (action === 'open-chart') {
      navigate(`/patient/${patientId}`);
    } else if (action === 'transfer') {
      setModalState({ isOpen: true, patientId, mode: 'transfer' });
    } else if (action === 'update-transfer') {
      setModalState({ isOpen: true, patientId, mode: 'update' });
    } else if (action === 'edit-transfer') {
      setModalState({ isOpen: true, patientId, mode: 'edit' });
    }
    setActiveMenu(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-white" onClick={() => setActiveMenu(null)}>
      {/* SUB-HEADER */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#BBBBBB]">
        <div className="text-xl font-bold text-[#101010] flex items-center gap-2">
          Tracking Board
          <div className="flex items-center gap-1">
            <button className="p-1 text-[#888888] hover:text-[#1F6AB0]" title="Refresh">
              <RotateCw className="w-4 h-4" />
            </button>
            <span className="bg-[#1C63A9] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
              {filtered.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-[#BBBBBB] rounded-md px-3 py-1.5 bg-white min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#888888]" />
            <input 
              type="text" 
              placeholder="Search for patient" 
              className="border-none outline-none text-sm text-[#1F1F1F] w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-[#1F1F1F] cursor-pointer">
            <input type="checkbox" className="accent-[#1C63A9]" /> My patients
            <span className="bg-[#1C63A9] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">2</span>
          </label>
          <button 
            id="filter-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFilter(!showFilter);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm transition-colors ${showFilter ? 'bg-[#1C63A9] text-white border-[#1C63A9]' : 'bg-white text-[#1F1F1F] border-[#BBBBBB] hover:bg-[#F5F5F5]'}`}
          >
            <Sliders className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      {showFilter && (
        <div 
          id="filter-panel"
          className="absolute top-[110px] right-6 w-[320px] bg-white border border-[#BBBBBB] rounded-md shadow-lg z-50 p-6 flex flex-col gap-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Patient Location */}
          <div>
            <div className="font-bold text-[#101010] mb-2">Patient Location</div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterLocation.includes('On Site')} onChange={(e) => {
                  if (e.target.checked) setFilterLocation([...filterLocation, 'On Site']);
                  else setFilterLocation(filterLocation.filter(l => l !== 'On Site'));
                }} /> On Site
              </label>
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterLocation.includes('In Transit')} onChange={(e) => {
                  if (e.target.checked) setFilterLocation([...filterLocation, 'In Transit']);
                  else setFilterLocation(filterLocation.filter(l => l !== 'In Transit'));
                }} /> In Transit
              </label>
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterLocation.includes('Transfer Completed')} onChange={(e) => {
                  if (e.target.checked) setFilterLocation([...filterLocation, 'Transfer Completed']);
                  else setFilterLocation(filterLocation.filter(l => l !== 'Transfer Completed'));
                }} /> Transfer Completed
              </label>
            </div>
          </div>

          {/* Patients */}
          <div>
            <div className="font-bold text-[#101010] mb-2">Patients</div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterPatients.includes('Discharged Patients')} onChange={(e) => {
                  if (e.target.checked) setFilterPatients([...filterPatients, 'Discharged Patients']);
                  else setFilterPatients(filterPatients.filter(l => l !== 'Discharged Patients'));
                }} /> Discharged Patients
              </label>
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterPatients.includes('Active Patients')} onChange={(e) => {
                  if (e.target.checked) setFilterPatients([...filterPatients, 'Active Patients']);
                  else setFilterPatients(filterPatients.filter(l => l !== 'Active Patients'));
                }} /> Active Patients
              </label>
            </div>
          </div>

          {/* Sites */}
          <div>
            <div className="font-bold text-[#101010] mb-2">Sites</div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterSites.length === 3} onChange={(e) => {
                  if (e.target.checked) setFilterSites(['Site 1', 'Central Hospital', 'George Washington University Hospital']);
                  else setFilterSites([]);
                }} /> Check All Sites
                <ChevronUp className="w-4 h-4 ml-auto" />
              </label>
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterSites.includes('Site 1')} onChange={(e) => {
                  if (e.target.checked) setFilterSites([...filterSites, 'Site 1']);
                  else setFilterSites(filterSites.filter(l => l !== 'Site 1'));
                }} /> Site 1
              </label>
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterSites.includes('Central Hospital')} onChange={(e) => {
                  if (e.target.checked) setFilterSites([...filterSites, 'Central Hospital']);
                  else setFilterSites(filterSites.filter(l => l !== 'Central Hospital'));
                }} /> Central Hospital
              </label>
              <label className="flex items-center gap-2 text-sm text-[#101010] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#1C63A9]" checked={filterSites.includes('George Washington University Hospital')} onChange={(e) => {
                  if (e.target.checked) setFilterSites([...filterSites, 'George Washington University Hospital']);
                  else setFilterSites(filterSites.filter(l => l !== 'George Washington University Hospital'));
                }} /> George Washington University Hospital
              </label>
            </div>
          </div>

          {/* MD/PA/NP */}
          <div>
            <div className="font-bold text-[#101010] mb-1">MD/PA/NP</div>
            <input type="text" className="w-full p-2 border border-[#BBBBBB] rounded text-sm" placeholder="Any" value={filterMD} onChange={e => setFilterMD(e.target.value)} />
          </div>
          
          {/* RN */}
          <div>
            <div className="font-bold text-[#101010] mb-1">RN</div>
            <input type="text" className="w-full p-2 border border-[#BBBBBB] rounded text-sm" placeholder="Any" value={filterRN} onChange={e => setFilterRN(e.target.value)} />
          </div>

          {/* MEDIC */}
          <div>
            <div className="font-bold text-[#101010] mb-1">MEDIC</div>
            <input type="text" className="w-full p-2 border border-[#BBBBBB] rounded text-sm" placeholder="Any" value={filterMedic} onChange={e => setFilterMedic(e.target.value)} />
          </div>
        </div>
      )}

      {/* PATIENT TABLE */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#E9F1FF] text-[#222]">
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] min-w-[67px]">Site</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[46px]">Bed</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[29px]">TL</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] min-w-[98px]">Last, First Name</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[36px]"></th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[38px]">Age</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[50px]">Sex</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] min-w-[100px]">Chief Complaint</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[50px]">MD/PA/NP</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[48px]">RN</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[48px]">MEDIC</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[70px]">BP</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[66px]">HR</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[50px]">RR</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[82px]">O2</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[54px]">T(°C)</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[40px]">PEWS</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[54px]">Status</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[69px]">TM</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[60px]">MEDS</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[60px]">LABS</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[40px]">Alert</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] min-w-[120px]">Comments</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[50px]">DISPO</th>
              <th className="px-1.5 py-2 text-left border-r border-[#ddd] w-[64px]">LOS</th>
              <th className="px-1.5 py-2 text-center border-r border-[#ddd] w-[46px]">Signed</th>
              <th className="px-1.5 py-2 text-center w-[46px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-[#F0F4FA] border-b border-[#E8E8E8] h-[38px]">
                <td className="px-1.5 py-1">{p.status === PatientStatus.IN_TRANSIT && p.transferNote ? p.transferNote.toCode : p.site}</td>
                <td className="px-1.5 py-1">{p.bed}</td>
                <td className="px-1.5 py-1 text-center">
                  <span className={`triage-badge ${getTriageClass(p.triageLevel)}`}>{p.triageLevel}</span>
                </td>
                <td className="px-1.5 py-1">
                  <Link to={`/patient/${p.id}`} className="text-[#1F6AB0] font-bold hover:underline">
                    {p.mrn}
                  </Link>
                </td>
                <td className="px-1.5 py-1"></td>
                <td className="px-1.5 py-1">{p.age}</td>
                <td className="px-1.5 py-1">{p.sex}</td>
                <td className="px-1.5 py-1">{p.chiefComplaint}</td>
                <td className="px-1.5 py-1"></td>
                <td className="px-1.5 py-1"></td>
                <td className="px-1.5 py-1"></td>
                <td className="px-1.5 py-1 text-[#888]">{p.vitals.bp}</td>
                <td className="px-1.5 py-1 text-[#888]">{p.vitals.hr}</td>
                <td className="px-1.5 py-1 text-[#888]">{p.vitals.rr}</td>
                <td className="px-1.5 py-1 text-[#888]">{p.vitals.o2}</td>
                <td className="px-1.5 py-1 text-[#888]">{p.vitals.temp}</td>
                <td className="px-1.5 py-1 text-center">{p.pewsMews}</td>
                <td className="px-1.5 py-1 text-center">
                  {p.status === PatientStatus.IN_TRANSIT && (
                    <div className="relative group inline-block">
                      <div className="w-6 h-6 flex items-center justify-center text-[#492781]">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M19 7h-3V6a4 4 0 0 0-4-4H4a2 2 0 0 0-2 2v10h2a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0h2v-4l-3-3zm-5-3a2 2 0 0 1 2 2v1h-2V4zm-7 8H5V9h2V7h2v2h2v2H9v2H7v-2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                        </svg>
                      </div>
                      <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 text-white p-4 rounded text-xs z-50 shadow-lg min-w-[320px]">
                        <div className="font-bold mb-3 text-[11px]">{p.transferNote?.isDischargeProcess ? 'In-Transit (Discharge Process)' : 'In-Transit'}</div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10px]">
                          <div className="flex flex-col gap-1.5">
                            {p.transferNote?.fromSite && <div><span className="text-gray-400 font-medium">From:</span> {p.transferNote.fromSite}</div>}
                            {p.transferNote?.toName && <div><span className="text-gray-400 font-medium">To:</span> {p.transferNote.toName}</div>}
                            {p.transferNote?.transport && <div><span className="text-gray-400 font-medium">By:</span> {p.transferNote.transport}</div>}
                            {p.transferNote?.eta && <div><span className="text-gray-400 font-medium">ETA:</span> {p.transferNote.eta}</div>}
                            {p.transferNote?.ambulanceId && <div><span className="text-gray-400 font-medium">Ambulance:</span> {p.transferNote.ambulanceId}</div>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {p.transferNote?.bedCategory && <div><span className="text-gray-400 font-medium">Bed:</span> {p.transferNote.bedCategory}</div>}
                            {p.transferNote?.specialty && <div><span className="text-gray-400 font-medium">Specialty:</span> {p.transferNote.specialty}</div>}
                            {p.transferNote?.additionalCapabilities && p.transferNote.additionalCapabilities.length > 0 && <div><span className="text-gray-400 font-medium">Required Capability:</span> {p.transferNote.additionalCapabilities.join(', ')}</div>}
                            {p.transferNote?.transitTime && <div><span className="text-gray-400 font-medium">Transit:</span> {new Date(p.transferNote.transitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
                            {p.transferNote?.jpatsNumber && <div><span className="text-gray-400 font-medium">JPATS:</span> {p.transferNote.jpatsNumber}</div>}
                          </div>
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-black/80"></div>
                      </div>
                    </div>
                  )}
                  {p.status === PatientStatus.TRANSFER_COMPLETE && (
                    <div className="relative group inline-block">
                      <span className="border border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] px-1 rounded text-[10px] font-bold cursor-help">TC</span>
                      <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 text-white p-2 rounded text-[10px] whitespace-nowrap z-50 shadow-lg">
                        Transfer Complete
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-black/80"></div>
                      </div>
                    </div>
                  )}
                  {p.status === PatientStatus.DISCHARGED && (
                    <div className="relative group inline-block">
                      <span className="border border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F] px-1 rounded text-[10px] font-bold cursor-help">D/C</span>
                      <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 text-white p-2 rounded text-[10px] whitespace-nowrap z-50 shadow-lg">
                        Pending Discharge
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-black/80"></div>
                      </div>
                    </div>
                  )}
                  {p.status === PatientStatus.DISCHARGED_COMPLETE && (
                    <div className="relative group inline-block">
                      <span className="border border-[#767676] bg-[#F5F5F5] text-[#767676] px-1 rounded text-[10px] font-bold cursor-help">D/C-C</span>
                      <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 text-white p-2 rounded text-[10px] whitespace-nowrap z-50 shadow-lg">
                        Discharge Complete
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-black/80"></div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-1.5 py-1 text-center">{p.tmStatus && <i className="fa-solid fa-video"></i>}</td>
                <td className="px-1.5 py-1 text-center"></td>
                <td className="px-1.5 py-1 text-center"></td>
                <td className="px-1.5 py-1 text-center">
                  <span className="status-icon status-icon--mci" title="MCI">MCI</span>
                </td>
                <td className="px-1.5 py-1">{p.comments}</td>
                <td className="px-1.5 py-1 text-center">
                  {/* Empty DISPO column as requested */}
                </td>
                <td className="px-1.5 py-1">{p.los}</td>
                <td className="px-1.5 py-1 text-center">{p.signed && <Check className="w-3 h-3 mx-auto text-[#2E7D32]" />}</td>
                <td className="px-1.5 py-1 text-center relative">
                  <button 
                    className="p-1 text-[#888] hover:bg-[#F5F5F5] rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === p.id ? null : p.id);
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {activeMenu === p.id && (
                    <div className="absolute right-full top-0 mr-2 bg-white border border-[#BBBBBB] rounded-md shadow-lg z-[100] min-w-[150px] py-1">
                      {p.status === PatientStatus.ADMITTED && (
                        <>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('transfer', p.id)}>Transfer</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('triage', p.id)}>Triage</button>
                        </>
                      )}
                      
                      {p.status === PatientStatus.IN_TRANSIT && (
                        <>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('update-transfer', p.id)}>Update Transfer</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('edit-transfer', p.id)}>Edit Transfer</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('triage', p.id)}>Triage</button>
                        </>
                      )}

                      {p.status === PatientStatus.TRANSFER_COMPLETE && (
                        <>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('triage', p.id)}>Triage</button>
                        </>
                      )}

                      {p.status === PatientStatus.DISCHARGED && (
                        <>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('transfer', p.id)}>Transfer</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('triage', p.id)}>Triage</button>
                        </>
                      )}

                      {p.status === PatientStatus.DISCHARGED_COMPLETE && (
                        <>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('update-transfer', p.id)}>Update Transfer</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('edit-transfer', p.id)}>Edit Transfer</button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5]" onClick={() => handleMenuAction('triage', p.id)}>Triage</button>
                        </>
                      )}

                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F5F5] text-[#D32F2F]">
                        Remove
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {modalState.isOpen && modalState.patientId && (
        <TransferNoteModal 
          patient={patients.find(p => p.id === modalState.patientId)!}
          mode={modalState.mode}
          onClose={() => setModalState({ isOpen: false, patientId: null, mode: 'transfer' })}
          onConfirm={() => {
            setModalState({ isOpen: false, patientId: null, mode: 'transfer' });
            load();
          }}
        />
      )}
    </div>
  );
}
