import React, { lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

import { ThemeProvider } from '@/context/ThemeContext';
import { TenantProvider } from '@/context/TenantContext';
import { useAuthStore } from './stores/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Ingress & Core Viewports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Shared Utilities & Queues
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const LiveQueuePage = lazy(() => import('./pages/LiveQueue/LiveQueuePage'));
const MyAttendance = lazy(() => import('./pages/Users/MyAttendance'));
const AccountSettingsPage = lazy(() => import('./pages/Account/AccountSettingsPage'));
const UserListPage = lazy(() => import('./pages/Users/UserListPage'));
const PrintRujukanPage = lazy(() => import('./pages/PrintRujukanPage'));
const TvAntrean = lazy(() => import('./pages/Display/TvAntrean'));

// Pharmacy & Inventory Subsystems
const PharmacistDashboard = lazy(() => import('./pages/Pharmacy/PharmacistDashboard'));
const ClinicalPathwayManagement = lazy(() => import('./pages/Admin/ClinicalPathwayManagement'));
const AddMedicinePage = lazy(() => import('./pages/Pharmacy/AddMedicinePage'));
const PharmacyQueuePage = lazy(() => import('./pages/Pharmacy/PharmacyQueuePage'));
const GoodsReceiptPage = lazy(() => import('./pages/Pharmacy/GoodsReceiptPage'));
const DepoPharmacyPage = lazy(() => import('./pages/Pharmacy/DepoPharmacyPage'));
const StockOpnamePage = lazy(() => import('./pages/Pharmacy/StockOpnamePage'));
const StockLedgerPage = lazy(() => import('./pages/Pharmacy/StockLedgerPage'));
const BulkStockTransferPage = lazy(() => import('./pages/Pharmacy/BulkStockTransferPage'));
const DispensingBoard = lazy(() => import('./pages/Pharmacy/DispensingBoard'));
const SyncMedicinePage = lazy(() => import('./pages/Pharmacy/SyncMedicinePage'));
const RetailPosAllInOne = lazy(() => import('./pages/Pharmacy/RetailPosAllInOne'));
const DrugClassManagement = lazy(() => import('./pages/Admin/DrugClassManagement'));
const SipnapReportPage = lazy(() => import('./pages/Pharmacy/SipnapReportPage'));

// Cashier, Tariff & Financial Ledgers
const CashierDashboard = lazy(() => import('./pages/Cashier/CashierDashboard'));
const RetailTransactionHistory = lazy(() => import('./pages/Cashier/RetailTransactionHistory'));
const RetailTransactionDetail = lazy(() => import('./pages/Cashier/RetailTransactionDetail'));
const MasterTarifPage = lazy(() => import('./pages/Billing/MasterTarifPage'));
const PayerManagementPage = lazy(() => import('./pages/Billing/PayerManagementPage'));
const ConsolidatedRevenueReport = lazy(() => import('./pages/Cashier/ConsolidatedRevenueReport'));

// Administrative, Provisioning & HRIS Modules
const WorkstationProvisioningPage = lazy(() => import('./pages/Admin/WorkstationProvisioningPage'));
const ManagementDashboard = lazy(() => import('./pages/Admin/ManagementDashboard'));
const SystemConfig = lazy(() => import('./pages/Admin/SystemConfig'));
const RoleManagement = lazy(() => import('./pages/Admin/RoleManagement').then(m => ({ default: m.RoleManagement })));
const MachineManagement = lazy(() => import('./pages/Admin/MachineManagement'));
const RoomManagementDashboard = lazy(() => import('./pages/Admin/RoomManagementDashboard'));
const ScheduleManagement = lazy(() => import('./pages/Admin/ScheduleManagement'));
const HrisDashboard = lazy(() => import('./pages/Admin/HrisDashboard'));
const StaffShiftManagement = lazy(() => import('./pages/Admin/StaffShiftManagement'));
const PayrollDashboard = lazy(() => import('./pages/Admin/PayrollDashboard'));
const RemunerationConfigPage = lazy(() => import('./pages/Admin/RemunerationConfigPage'));
const MedicalCredentialWorkspace = lazy(() => import('./pages/Admin/MedicalCredentialWorkspace'));

// Clinical Examination, Wards & Specialty Wings
const PatientsPage = lazy(() => import('./pages/Patients/PatientsPage'));
const PatientDetail = lazy(() => import('./pages/Patients/PatientDetail'));
const AdministrativePatientDetail = lazy(() => import('./pages/Patients/AdministrativePatientDetail'));
const DoctorWorkspace = lazy(() => import('./pages/Doctor/DoctorWorkspace'));
const ExaminationPage = lazy(() => import('./pages/Doctor/ExaminationPage'));
const VisiteDashboard = lazy(() => import('./pages/Doctor/VisiteDashboard'));
const IncWorkspace = lazy(() => import('./pages/Doctor/IncWorkspace'));
const NurseDashboard = lazy(() => import('./pages/Nurse/NurseDashboard'));
const IgdRegistration = lazy(() => import('./pages/Nurse/IgdRegistration'));
const BedDashboard = lazy(() => import('./pages/Inpatient/BedDashboard'));
const IcuCentralStation = lazy(() => import('./pages/Inpatient/IcuCentralStation'));
const PenunjangDashboard = lazy(() => import('./pages/Penunjang/PenunjangDashboard'));
const IbsDashboard = lazy(() => import('./pages/IBS/IbsDashboard'));
const HdDashboard = lazy(() => import('./pages/Hemodialisa/HdDashboard'));
const InterBranchReferralBoard = lazy(() => import('./pages/Patients/components/InterBranchReferralBoard'));

// Casemix & DRG Analytics
const CasemixDashboard = lazy(() => import('./pages/Casemix/CasemixDashboard'));
const CasemixReportPage = lazy(() => import('./pages/Casemix/CasemixReportPage'));
const CasemixFinancialDashboard = lazy(() => import('./pages/Casemix/CasemixFinancialDashboard'));

const APP_MODE = import.meta.env.VITE_APP_MODE || 'simrs';

function ProtectedLayout() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

function RoleBasedRedirect() {
  const userRole = useAuthStore(state => state.userRole);
  const role = (userRole || '').toLowerCase();

  // Executive & Administrative Personnel
  if (role.includes('admin') || role.includes('manager') || role.includes('direktur')) {
    return <Navigate to="/admin/management-dashboard" replace />;
  }

  // Attending Physicians / Doctors
  if ((role.includes('doctor') || role.includes('dokter')) && APP_MODE !== 'apotek') {
    return <Navigate to="/doctor/workspace" replace />;
  }

  // Clinical Nursing Staff
  if (role.includes('nurse') || role.includes('perawat')) {
    return <Navigate to="/nurse/dashboard" replace />;
  }

  // Pharmacy & Dispensing Technicians
  if (role.includes('asisten')) {
    return <Navigate to="/pharmacy/dispensing-board" replace />;
  }
  if (role.includes('apoteker') || role.includes('farmasi') || role.includes('pharmacist')) {
    return <Navigate to="/pharmacy/dashboard" replace />;
  }

  // Billing & Cashier Desk
  if (role.includes('cashier') || role.includes('kasir')) {
    return <Navigate to="/cashier/checkout" replace />;
  }

  // Default Institutional Fallback
  return <Navigate to="/dashboard" replace />;
}

function NotFoundPage() {
  const { t } = useTranslation('common');
  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-sm w-full">
        <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">404</h2>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">
          {t('notFound', 'Page Not Found')}
        </p>
        <a 
          href="/" 
          className="mt-6 inline-flex w-full justify-center items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-600/20 transition-all cursor-pointer"
        >
          {t('backToHome', 'Return to Home')}
        </a>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/display-antrean" element={<TvAntrean />} />
      
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live-queue" element={<LiveQueuePage />} />
        
        <Route path="/admin/clinical-credentials" element={
            <ProtectedRoute permission="MANAGE_MEDICAL_IDENTITY">
                <MedicalCredentialWorkspace />
            </ProtectedRoute>
        } />
		
        <Route path="/admin/clinical-pathways" element={
            <ProtectedRoute permission="MANAGE_MEDICAL_IDENTITY">
                <ClinicalPathwayManagement />
            </ProtectedRoute>
        } />
        
        <Route path="/my-attendance" element={<MyAttendance />} />
        <Route path="/account-settings" element={<AccountSettingsPage />} />
        <Route path="/print/rujukan-lab" element={<PrintRujukanPage />} />
        <Route path="/users" element={
          <ProtectedRoute anyPermission={["MANAGE_SYSTEM", "MANAGE_MEDICAL_IDENTITY", "CREATE_USER"]}>
              <UserListPage />
          </ProtectedRoute>
        } />
        <Route path="/register-staff" element={
            <ProtectedRoute permission="CREATE_USER">
                <RegisterPage />
            </ProtectedRoute>
        } />

        {/* Pharmacy & Dispensing State Boundaries */}
        <Route path="/pharmacy/dashboard" element={
            <ProtectedRoute anyPermission={["READ_MEDICINE", "UPDATE_MEDICINE", "CREATE_MEDICINE"]}>
                <PharmacistDashboard />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/add" element={
            <ProtectedRoute permission="CREATE_MEDICINE">
                <AddMedicinePage />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/queue" element={
            <ProtectedRoute permission="READ_PHARMACY_QUEUE">
                <PharmacyQueuePage />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/receive" element={
            <ProtectedRoute permission="RECEIVE_GOODS">
                <GoodsReceiptPage />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/depo" element={
            <ProtectedRoute permission="READ_PHARMACY_QUEUE">
                <DepoPharmacyPage />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/opname" element={
            <ProtectedRoute permission="ADJUST_STOCK">
                <StockOpnamePage />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/ledger" element={
            <ProtectedRoute permission="READ_STOCK_LEDGER">
                <StockLedgerPage />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/transfer" element={
            <ProtectedRoute permission="TRANSFER_STOCK">
                <BulkStockTransferPage />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/dispensing-board" element={
            <ProtectedRoute permission="READ_PHARMACY_QUEUE">
                <DispensingBoard />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/sync" element={
           <ProtectedRoute permission="SYNC_MEDICINE">
               <SyncMedicinePage />
           </ProtectedRoute>
        } />
        <Route path="/pharmacy/sipnap" element={
            <ProtectedRoute permission="READ_STOCK_LEDGER">
                <SipnapReportPage />
            </ProtectedRoute>
        } />

        {/* Cash Desk, Pricing & Revenue Ledgers */}
        <Route path="/finance/consolidated-reports" element={
            <ProtectedRoute permission="READ_REVENUE_REPORT">
                <ConsolidatedRevenueReport />
            </ProtectedRoute>
        } />
        <Route path="/pharmacy/pos" element={
            <ProtectedRoute permission="CREATE_RETAIL_TRANSACTION">
                <RetailPosAllInOne />
            </ProtectedRoute>
        } />
        <Route path="/cashier/checkout" element={
            <ProtectedRoute permission="READ_UNPAID_BILL">
                <CashierDashboard mode="all" />
            </ProtectedRoute>
        } />
        <Route path="/cashier/reports" element={
            <ProtectedRoute permission="READ_RETAIL_TRANSACTION">
                <RetailTransactionHistory />
            </ProtectedRoute>
        } />
        <Route path="/cashier/reports/:id" element={
            <ProtectedRoute permission="READ_RETAIL_TRANSACTION">
                <RetailTransactionDetail />
            </ProtectedRoute>
        } />
        <Route path="/billing/unpaid" element={
            <ProtectedRoute permission="READ_UNPAID_BILL">
                <CashierDashboard mode="all" />
            </ProtectedRoute>
        } />
        <Route path="/billing/master-tarif" element={
          <ProtectedRoute anyPermission={["CREATE_MASTER_TARIF", "UPDATE_MASTER_TARIF", "MANAGE_SYSTEM"]}>
              <MasterTarifPage />
          </ProtectedRoute>
        } />
        <Route path="/billing/payers" element={
          <ProtectedRoute anyPermission={["CREATE_MASTER_TARIF", "UPDATE_MASTER_TARIF", "MANAGE_SYSTEM"]}>
              <PayerManagementPage />
          </ProtectedRoute>
        } />

        {/* System Administration & Infrastructure */}
        <Route path="/admin/workstations" element={
            <ProtectedRoute permission="MANAGE_SYSTEM">
                <WorkstationProvisioningPage />
            </ProtectedRoute>
        } />
        <Route path="/admin/management-dashboard" element={
            <ProtectedRoute permission="VIEW_EXECUTIVE_DASHBOARD">
                <ManagementDashboard />
            </ProtectedRoute>
        } />
        <Route path="/admin/system-config" element={
            <ProtectedRoute permission="MANAGE_SYSTEM">
                <SystemConfig />
            </ProtectedRoute>
        } />
        <Route path="/admin/role-management" element={
            <ProtectedRoute permission="MANAGE_SYSTEM">
                <RoleManagement />
            </ProtectedRoute>
        } />
        <Route path="/admin/machines" element={
            <ProtectedRoute permission="MANAGE_SYSTEM">
                <MachineManagement />
            </ProtectedRoute>
        } />
        <Route path="/admin/drug-classes" element={
            <ProtectedRoute permission="MANAGE_SYSTEM">
                <DrugClassManagement />
            </ProtectedRoute>
        } />

        {/* Clinical Core & Specialized Units */}
        {APP_MODE !== 'apotek' && (
          <>
            <Route path="/igd-admit" element={
                <ProtectedRoute anyPermission={["CREATE_IGD_ADMISSION", "CREATE_EMERGENCY_PATIENT", "READ_NURSE_QUEUE"]}>
                    <IgdRegistration />
                </ProtectedRoute>
            } />
            <Route path="/patients" element={
                <ProtectedRoute anyPermission={["CREATE_PATIENT", "READ_PATIENT"]}>
                    <PatientsPage />
                </ProtectedRoute>
            } />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/staff/patients/:id" element={<AdministrativePatientDetail />} />
            <Route path="/referrals" element={
                <ProtectedRoute permission="READ_MEDICAL_RECORD">
                    <InterBranchReferralBoard />
                </ProtectedRoute>
            } />
            <Route path="/doctor/workspace" element={
                <ProtectedRoute permission="READ_DOCTOR_QUEUE">
                    <DoctorWorkspace />
                </ProtectedRoute>
            } />
            <Route path="/doctor/examination/:id" element={
                <ProtectedRoute permission="UPDATE_MEDICAL_RECORD">
                    <ExaminationPage />
                </ProtectedRoute>
            } />
            <Route path="/doctor/visite" element={
                <ProtectedRoute permission="READ_DOCTOR_INPATIENTS">
                    <VisiteDashboard />
                </ProtectedRoute>
            } /> 
            <Route path="/doctor/inc/:id" element={
                <ProtectedRoute anyPermission={["CREATE_INC", "UPDATE_MEDICAL_RECORD"]}>
                    <IncWorkspace />
                </ProtectedRoute>
            } />
            <Route path="/nurse/dashboard" element={
                <ProtectedRoute permission="READ_NURSE_QUEUE">
                    <NurseDashboard />
                </ProtectedRoute>
            } />
            <Route path="/inpatient/dashboard" element={
                <ProtectedRoute permission="VIEW_INPATIENT_DASHBOARD">
                    <BedDashboard />
                </ProtectedRoute>
            } />
            <Route path="/icu-command-center" element={
                <ProtectedRoute permission="READ_ICU_MONITOR">
                    <IcuCentralStation />
                </ProtectedRoute>
            } />
            <Route path="/admin/rooms" element={
                <ProtectedRoute permission="MANAGE_SYSTEM">
                    <RoomManagementDashboard />
                </ProtectedRoute>
            } /> 
            <Route path="/penunjang/dashboard" element={
                <ProtectedRoute permission="READ_LAB_QUEUE">
                    <PenunjangDashboard />
                </ProtectedRoute>
            } />
            <Route path="/ibs/dashboard" element={
                <ProtectedRoute permission="READ_SURGERY_BOOKING">
                    <IbsDashboard />
                </ProtectedRoute>
            } /> 
            <Route path="/hd/dashboard" element={
                <ProtectedRoute permission="READ_HD_QUEUE">
                    <HdDashboard />
                </ProtectedRoute>
            } />
            <Route path="/casemix/dashboard" element={
                <ProtectedRoute permission="READ_CASEMIX_QUEUE">
                    <CasemixDashboard />
                </ProtectedRoute>
            } />
            <Route path="/schedules" element={
                <ProtectedRoute permission="READ_SCHEDULE">
                    <ScheduleManagement />
                </ProtectedRoute>
            } /> 
            <Route path="/hris/shifts" element={
                <ProtectedRoute permission="MANAGE_SHIFT_MASTER">
                    <StaffShiftManagement />
                </ProtectedRoute>
            } />
            <Route path="/hris/dashboard" element={
                <ProtectedRoute permission="READ_ALL_ATTENDANCE">
                    <HrisDashboard />
                </ProtectedRoute>
            } />
            <Route path="/hris/payroll" element={
                <ProtectedRoute permission="READ_ALL_PAYROLL">
                    <PayrollDashboard />
                </ProtectedRoute>
            } />
            <Route path="/hris/remuneration" element={
                <ProtectedRoute permission="MANAGE_SYSTEM">
                    <RemunerationConfigPage />
                </ProtectedRoute>
            } />
            <Route path="/casemix/reports" element={
                <ProtectedRoute permission="READ_CASEMIX_REPORT">
                    <CasemixReportPage />
                </ProtectedRoute>
            } />
            <Route path="/casemix/financial" element={
                <ProtectedRoute permission="READ_CASEMIX_PNL">
                    <CasemixFinancialDashboard />
                </ProtectedRoute>
            } />
          </>
        )}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  const { t } = useTranslation('common');
  const isInitializing = useAuthStore(state => state.isInitializing);
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 select-none">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500"></div>
          <div className="absolute h-8 w-8 rounded-full bg-primary-500/10 dark:bg-primary-500/20 blur-lg"></div>
        </div>
        <p className="mt-5 text-slate-500 dark:text-slate-400 font-bold text-[11px] tracking-[0.25em] uppercase font-mono animate-pulse">
          {t('loadingSystem', 'INITIALIZING AISHEALTH CORE')}
        </p>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        className="!z-[999999]"
        toastClassName="!z-[999999]"
        style={{ zIndex: 999999 }}
      />
    </>
  );
}
