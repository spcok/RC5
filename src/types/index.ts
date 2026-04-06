export interface HusbandryLog {
  id: string;

  animal_id: string;
  date: string;
  type: 'FEED' | 'WEIGHT' | 'FLIGHT' | 'TRAINING' | 'TEMPERATURE';
  value: string;
  author: string;
}

export enum ShiftType {
  FULL_DAY = 'Full Day',
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  NIGHT = 'Night',
  CUSTOM = 'Custom'
}
export interface Shift {
  id: string;

  user_id: string;
  user_name: string; // denormalized for fast offline rendering
  user_role: string; // denormalized for filtering
  date: string; // YYYY-MM-DD
  shift_type: ShiftType;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  assigned_area?: string; // e.g. "Owls", "Mammals", "Site Maintenance"
  notes?: string;
  pattern_id?: string; // UUID linking a repeating block
  updated_at?: string;
  is_deleted?: boolean;
}

export enum AnimalCategory {
  ALL = 'ALL',
  OWLS = 'OWLS',
  RAPTORS = 'RAPTORS',
  MAMMALS = 'MAMMALS',
  EXOTICS = 'EXOTICS'
}

export enum ConservationStatus {
  NE = 'NE',
  DD = 'DD',
  LC = 'LC',
  NT = 'NT',
  VU = 'VU',
  EN = 'EN',
  CR = 'CR',
  EW = 'EW',
  EX = 'EX'
}

export enum HazardRating {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum UserRole {
  VOLUNTEER = 'VOLUNTEER',
  KEEPER = 'KEEPER',
  SENIOR_KEEPER = 'SENIOR_KEEPER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  GUEST = 'GUEST'
}

export enum HealthRecordType {
  OBSERVATION = 'OBSERVATION',
  MEDICATION = 'MEDICATION',
  SURGERY = 'SURGERY',
  VACCINATION = 'VACCINATION',
  EXAM = 'EXAM'
}

export enum HealthCondition {
  HEALTHY = 'HEALTHY',
  CONCERN = 'CONCERN',
  CRITICAL = 'CRITICAL',
  DECEASED = 'DECEASED'
}

export enum LogType {
  GENERAL = 'GENERAL',
  WEIGHT = 'WEIGHT',
  FEED = 'FEED',
  FLIGHT = 'FLIGHT',
  TRAINING = 'TRAINING',
  TEMPERATURE = 'TEMPERATURE',
  HEALTH = 'HEALTH',
  EVENT = 'EVENT',
  MISTING = 'MISTING',
  WATER = 'WATER',
  BIRTH = 'BIRTH'
}

export enum MovementType {
  TRANSFER = 'TRANSFER',
  ACQUISITION = 'ACQUISITION',
  DISPOSITION = 'DISPOSITION'
}

export enum TransferType {
  ARRIVAL = 'Arrival',
  DEPARTURE = 'Departure'
}

export enum TransferStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed'
}

export enum TimesheetStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed'
}

export enum LeaveType {
  ANNUAL = 'Annual',
  SICK = 'Sick',
  UNPAID = 'Unpaid',
  OTHER = 'Other'
}

export enum HolidayStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DECLINED = 'Declined'
}

export enum EntityType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP'
}

export interface Animal {
  id: string;

  entityType?: EntityType | null;
  parentMobId?: string;
  censusCount?: number | null;
  name: string;
  species: string;
  latinName?: string | null;
  category: AnimalCategory;
  location: string;
  imageUrl?: string;
  hazardRating: HazardRating;
  isVenomous: boolean;
  weightUnit: 'g' | 'oz' | 'lbs_oz' | 'kg';
  dob?: string;
  isDobUnknown?: boolean;
  sex?: 'Male' | 'Female' | 'Unknown';
  microchipId?: string;
  dispositionStatus?: 'Active' | 'Transferred' | 'Deceased' | 'Missing' | 'Stolen';
  originLocation?: string;
  destinationLocation?: string;
  transferDate?: string;
  ringNumber?: string;
  hasNoId?: boolean;
  redListStatus?: ConservationStatus;
  description?: string;
  specialRequirements?: string;
  criticalHusbandryNotes?: string[];
  targetDayTempC?: number;
  targetNightTempC?: number;
  targetHumidityMinPercent?: number;
  targetHumidityMaxPercent?: number;
  mistingFrequency?: string;
  acquisitionDate?: string;
  origin?: string;
  sireId?: string;
  damId?: string;
  flyingWeightG?: number;
  winterWeightG?: number;
  displayOrder?: number;
  archived?: boolean;
  archiveReason?: string;
  archivedAt?: string;
  archiveType?: 'Disposition' | 'Death' | 'Euthanasia' | 'Missing' | 'Stolen';
  dateOfDeath?: string | null;
  dispositionDate?: string | null;
  isQuarantine?: boolean;
  distributionMapUrl?: string;
  waterTippingTemp?: number;
  ambientTempOnly?: boolean;
  acquisitionType?: 'BORN' | 'TRANSFERRED_IN' | 'RESCUE' | 'UNKNOWN';
  isBoarding?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface LogEntry {
  id: string;

  animalId: string;
  logType: LogType;
  logDate: string;
  value: string;
  notes?: string;
  userInitials?: string;
  weightGrams?: number;
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lbs' | 'lbs_oz';
  healthRecordType?: string;
  // Temperature fields
  baskingTempC?: number;
  coolTempC?: number;
  temperatureC?: number;
  createdAt?: string;
  createdBy?: string;
  integritySeal?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Task {
  id: string;

  animalId?: string;
  title: string;
  notes?: string;
  dueDate: string;
  completed: boolean;
  type?: LogType;
  recurring?: boolean;
  assignedTo?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface UserPermissions {
  dashboard: boolean;
  dailyLog: boolean;
  tasks: boolean;
  medical: boolean;
  movements: boolean;
  safety: boolean;
  maintenance: boolean;
  settings: boolean;
  flightRecords: boolean;
  feedingSchedule: boolean;
  attendance: boolean;
  holidayApprover: boolean;
  attendanceManager: boolean;
  missingRecords: boolean;
  reports: boolean;
  rounds: boolean;
  view_archived_records?: boolean;
  userManagement?: boolean;
}

export interface UserProfile {
  id: string;

  email: string;
  name: string;
  role: UserRole;
  initials: string;
  pin?: string;
  job_position?: string;
  permissions?: Partial<UserPermissions>;
  signature_data?: string;
  integrity_seal?: string;
}

export interface RolePermissionConfig {
  id?: string;
  role: UserRole;
  // Animals
  view_animals: boolean;
  add_animals: boolean;
  edit_animals: boolean;
  archive_animals: boolean;
  // Husbandry
  view_daily_logs: boolean;
  create_daily_logs: boolean;
  edit_daily_logs: boolean;
  view_tasks: boolean;
  complete_tasks: boolean;
  manage_tasks: boolean;
  view_daily_rounds: boolean;
  log_daily_rounds: boolean;
  // Medical
  view_medical: boolean;
  add_clinical_notes: boolean;
  prescribe_medications: boolean;
  administer_medications: boolean;
  manage_quarantine: boolean;
  // Logistics
  view_movements: boolean;
  log_internal_movements: boolean;
  manage_external_transfers: boolean;
  // Safety
  view_incidents: boolean;
  report_incidents: boolean;
  manage_incidents: boolean;
  view_maintenance: boolean;
  report_maintenance: boolean;
  resolve_maintenance: boolean;
  view_safety_drills: boolean;
  view_first_aid: boolean;
  // Staff
  submit_timesheets: boolean;
  manage_all_timesheets: boolean;
  request_holidays: boolean;
  approve_holidays: boolean;
  // Compliance & Admin
  view_missing_records: boolean;
  view_archived_records: boolean;
  manage_zla_documents: boolean;
  generate_reports: boolean;
  view_settings: boolean;
  manage_users: boolean;
  manage_roles: boolean;
}

export type User = UserProfile;

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  address?: string;
}

export interface ZLADocument {
  id: string;
  name: string;
  category: string;
  file_url: string;
  upload_date: Date;
}

export interface OrgProfileSettings {
  id: string;
  org_name: string;
  logo_url?: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  zla_license_number: string;
  official_website?: string;
  adoption_portal?: string;
}

export interface OrgProfile {
  name: string;
  logo_url: string;
  adoption_portal?: string;
}

export interface ClinicalNote {
  id: string;

  animalId: string;
  animalName: string;
  date: string;
  noteType: string;
  noteText: string;
  recheckDate?: string;
  staffInitials: string;
  attachmentUrl?: string;
  thumbnailUrl?: string;
  diagnosis?: string;
  bcs?: number;
  weightGrams?: number;
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lbs' | 'lbs_oz';
  treatmentPlan?: string;
  integritySeal?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface MARChart {
  id: string;

  animalId: string;
  animalName: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed';
  instructions: string;
  administeredDates: string[];
  staffInitials: string;
  integritySeal?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface QuarantineRecord {
  id: string;

  animalId: string;
  animalName: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Cleared';
  isolationNotes: string;
  staffInitials: string;
  updatedAt?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface InternalMovement {
  id: string;

  animal_id: string;
  animal_name: string;
  log_date: string;
  movement_type: MovementType;
  source_location: string;
  destination_location: string;
  notes?: string;
  created_by: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface Transfer {
  id: string;

  animal_id: string;
  animal_name: string;
  transfer_type: TransferType;
  date: string;
  institution: string;
  transport_method: string;
  cites_article_10_ref: string;
  status: TransferStatus;
  notes?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface Timesheet {
  id: string;

  staff_name: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  notes?: string;
  status: TimesheetStatus;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface Holiday {
  id: string;

  staff_name: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  status: HolidayStatus;
  notes?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface SafetyDrill {
  id: string;

  date: string;
  title: string;
  location: string;
  priority: string;
  status: string;
  description: string;
  timestamp: number;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface MaintenanceLog {
  id: string;

  enclosure_id: string;
  task_type: 'UV Replacement' | 'Structural Repair' | 'General';
  description: string;
  status: 'Pending' | 'Completed';
  date_logged: string;
  date_completed?: string;
  integrity_seal?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface FirstAidLog {
  id: string;

  date: string;
  staff_id: string;
  incident_description: string;
  treatment_provided: string;
  created_at: string;
  
  person_name: string;
  type: 'Injury' | 'Illness' | 'Near Miss';
  location: string;
  outcome: 'Returned to Work' | 'Restricted Duties' | 'Monitoring' | 'Sent Home' | 'GP Visit' | 'Hospital' | 'Ambulance Called' | 'Refused Treatment' | 'None';
  
  updated_at?: string;
  is_deleted?: boolean;
}

export enum IncidentType {
  INJURY = 'Injury',
  ILLNESS = 'Illness',
  NEAR_MISS = 'Near Miss',
  FIRE = 'Fire',
  OTHER = 'Other'
}

export enum IncidentSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface DailyRound {
  id: string;

  date: string;
  shift: 'Morning' | 'Evening';
  section: string;
  check_data?: Record<string, unknown>;
  status: 'Completed' | 'Pending' | 'completed' | 'pending';
  completed_by: string;
  completed_at?: string;
  updated_at?: string;
  notes?: string;
}

export interface Incident {
  id: string;

  date: string;
  time: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  status: string;
  reported_by: string;
  
  reporter_id: string;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface SyncQueueItem {
  id?: number;
  table_name: string;
  record_id: string;
  operation: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  status: 'pending' | 'failed' | 'quarantined';
  priority: number;
  retry_count: number;
  error_log?: string;
}

export interface OperationalList {
  id: string;

  type: 'food_type' | 'feed_method' | 'location' | 'event';
  category: AnimalCategory;
  value: string;
  is_deleted?: boolean;
  updated_at?: string;
}

export interface SignContent {
    diet: string[];
    habitat: string[];
    didYouKnow: string[];
    speciesBrief?: string;
    wildOrigin?: string;
    speciesStats: {
        lifespanWild: string;
        lifespanCaptivity: string;
        wingspan: string;
        weight: string;
    };
}

export type OrganisationProfile = OrgProfile;

export interface MissingRecord {
  id: string;
  animal_id: string;
  animal_name: string;
  animal_category: string;
  alert_type: 'Missing Weight' | 'Missing Feed' | 'Overdue Checkup' | 'Missing Details';
  days_overdue: number;
  severity: 'High' | 'Medium';
  category: 'Husbandry' | 'Health' | 'Details';
  missing_fields?: string[];
  date: string;
  is_deleted?: boolean;
}

export interface TimeLogEntry {
  id: string;
  staff_name: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  notes?: string;
  status: TimesheetStatus;
}

