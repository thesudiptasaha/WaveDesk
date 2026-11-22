// lib/core.js

const DEFAULT_CHANNELS = [
  'The Wave 24',
  'The Wave World',
  'The Wave Money',
  'The Wave Sports',
  'The Wave Faith',
  'The Wave Life',
  'The Wave Glam',
];

/* The database also enforces the status after script approval and some post-production rules per content type (functions guard_contents_update and contents_post_production_rules, and the check constraint contents_content_type_valid). When a type is added or its pipeline changes, change this table AND those database functions together. hasScript indicates whether a type includes script writing; afterDraft gives the forward target directly from Draft for script-less types. */
const CONTENT_TYPE_CONFIG = {
  EXPLAINER: {
    hint: 'Full pipeline',
    color: { bg: 'bg-green-500', text: 'text-green-500', tagText: 'text-white' },
    afterScript: 'Ready for Shoot',
    skipsShoot: false,
    hasPostStage: true,
    usesVideoEditor: true,
    hasScript: true,
    afterDraft: null,
    hiddenCredits: ['multimedia_journalist'],
    showsLiveCredits: false,
  },
  LIVE: {
    hint: 'Script approved → done (published)',
    color: { bg: 'bg-red-500', text: 'text-red-500', tagText: 'text-white' },
    afterScript: 'Published',
    skipsShoot: true,
    hasPostStage: false,
    usesVideoEditor: false,
    hasScript: true,
    afterDraft: null,
    hiddenCredits: ['video_editor', 'multimedia_journalist'],
    showsLiveCredits: true,
  },
  'RECORDED LIVE': {
    hint: 'Full pipeline',
    color: { bg: 'bg-orange-500', text: 'text-orange-500', tagText: 'text-white' },
    afterScript: 'Ready for Shoot',
    skipsShoot: false,
    hasPostStage: true,
    usesVideoEditor: true,
    hasScript: true,
    afterDraft: null,
    hiddenCredits: ['multimedia_journalist'],
    showsLiveCredits: false,
  },
  SOT: {
    hint: 'Full pipeline',
    color: { bg: 'bg-blue-500', text: 'text-blue-500', tagText: 'text-white' },
    afterScript: 'Ready for Shoot',
    skipsShoot: false,
    hasPostStage: true,
    usesVideoEditor: true,
    hasScript: true,
    afterDraft: null,
    hiddenCredits: ['multimedia_journalist'],
    showsLiveCredits: false,
  },
  PACKAGE: {
    hint: 'Script + raw footage → straight to the editor (no shoot)',
    color: { bg: 'bg-purple-500', text: 'text-purple-500', tagText: 'text-white' },
    afterScript: 'Assign Editor',
    skipsShoot: true,
    hasPostStage: true,
    usesVideoEditor: true,
    hasScript: true,
    afterDraft: null,
    hiddenCredits: [
      'camera_operator',
      'teleprompter_operator',
      'light_designer',
      'sound_recordist',
      'set_designer',
      'makeup_artist',
      'data_wrangler',
      'production_manager',
      'multimedia_journalist',
    ],
    showsLiveCredits: false,
  },
  SHOW: {
    hint: 'Full pipeline',
    color: { bg: 'bg-pink-500', text: 'text-pink-500', tagText: 'text-white' },
    afterScript: 'Ready for Shoot',
    skipsShoot: false,
    hasPostStage: true,
    usesVideoEditor: true,
    hasScript: true,
    afterDraft: null,
    hiddenCredits: ['multimedia_journalist'],
    showsLiveCredits: false,
  },
  UNCUT: {
    hint: 'Reporter footage → editor (no script, no shoot steps)',
    color: { bg: 'bg-teal-500', text: 'text-teal-500', tagText: 'text-white' },
    afterScript: 'Assign Editor',   // never used (no script), keep a valid value
    skipsShoot: true,
    hasPostStage: true,
    usesVideoEditor: true,
    hasScript: false,
    afterDraft: 'Assign Editor',
    hiddenCredits: ['concept_creator','writer','presenter_name','producer','production_manager','set_designer','teleprompter_operator','light_designer','data_wrangler','makeup_artist','voice_over_artist','audio_mixer'],
    showsLiveCredits: false,
  },
  'PHOTO CARD': {
    hint: 'Card from a channel template, made by a designer (no script, no shoot, no editing)',
    color: { bg: 'bg-pink-500', text: 'text-pink-500', tagText: 'text-white' },
    afterScript: 'Requested',
    skipsShoot: true,
    hasPostStage: false,
    usesVideoEditor: false,
    hasScript: false,
    afterDraft: null,
    isCard: true,
    showsLiveCredits: false,
    hiddenCredits: [
      'concept_creator',
      'writer',
      'multimedia_journalist',
      'production_manager',
      'producer',
      'presenter_name',
      'set_designer',
      'camera_operator',
      'teleprompter_operator',
      'light_designer',
      'sound_recordist',
      'data_wrangler',
      'makeup_artist',
      'voice_over_artist',
      'video_editor',
      'motion_graphics_designer',
      'colorist',
      'audio_mixer',
      'live_video_switcher',
      'live_audio_mixer',
    ],
  },
};

const CONTENT_TYPES = Object.keys(CONTENT_TYPE_CONFIG);

const CONTENT_TYPE_HINT = Object.fromEntries(
  Object.entries(CONTENT_TYPE_CONFIG).map(([k, v]) => [k, v.hint])
);

const CONTENT_TYPE_COLORS = Object.fromEntries(
  Object.entries(CONTENT_TYPE_CONFIG).map(([k, v]) => [k, v.color])
);

function typeConfig(type) {
  return CONTENT_TYPE_CONFIG[type] || CONTENT_TYPE_CONFIG.PACKAGE;
}

const typeAfterScript = (type) => typeConfig(type).afterScript;
const typeHasScript = (type) => typeConfig(type).hasScript !== false;
const typeAfterDraft = (type) => typeConfig(type).afterDraft || null;
const typeHiddenCredits = (type) => typeConfig(type).hiddenCredits;
const typeUsesVideoEditor = (type) => typeConfig(type).usesVideoEditor;
const typeHasPostStage = (type) => typeConfig(type).hasPostStage;
const typeSkipsShoot = (type) => typeConfig(type).skipsShoot;
const typeShowsLiveCredits = (type) => typeConfig(type).showsLiveCredits;
const typeIsCard = (type) => typeConfig(type).isCard === true;

const PLATFORMS = [
  { id: 'web', label: 'Web Portal' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'threads', label: 'Threads' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

const ACCESS_LIST = [
  { key: 'can_write_edit_scripts', label: 'Write & Edit Scripts', hint: 'Write, edit and save scripts', group: 'Scripts' },
  { key: 'can_approve_scripts', label: 'Approve Scripts', hint: 'Approve or send back submitted scripts', group: 'Scripts' },
  { key: 'can_edit_content_details', label: 'Edit Content Details', hint: 'Title, thumbnail text, platforms', group: 'Content' },
  { key: 'can_change_channel', label: 'Change Channel', hint: 'Switch the channel of a content', group: 'Content' },
  { key: 'can_reschedule_content', label: 'Reschedule Content', hint: 'Change scheduled date and publish time', group: 'Content' },
  { key: 'can_manage_sponsors', label: 'Manage Sponsors', hint: 'Add sponsors to contents and set their type and status', group: 'Content' },
  { key: 'can_assign_video_editor', label: 'Assign Video Editor', hint: 'Change or assign the video editor', group: 'Assignments' },
  { key: 'can_assign_presenter', label: 'Assign Presenter', hint: 'Update the presenter assignment', group: 'Assignments' },
  { key: 'can_review_videos', label: 'Review Videos', hint: 'Approve edited videos or request revisions', group: 'Review' },
  { key: 'can_request_photo_cards', label: 'Request Photo Cards', hint: 'Open and fill a Photo Card request, and edit its details until it is approved', group: 'Photo Cards' },
  { key: 'can_approve_photo_cards', label: 'Approve Photo Cards', hint: 'Approve a finished Photo Card or send it back for correction', group: 'Photo Cards' },
  { key: 'can_manage_photo_templates', label: 'Graphic Template Management', hint: 'Create and change the templates writers use for Photo Cards', group: 'Photo Cards' },
];

const ROLE_LIST = [
  { key: 'role_concept_creator', label: 'Concept Creator', field: 'concept_creator', hint: 'Appears in the Concept Creator list', group: 'Editorial', drawerGroup: 'idea' },
  { key: 'role_research_script_writer', label: 'Research & Script Writer', field: 'writer', hint: 'Appears in the Research & Script Writer list', group: 'Editorial', drawerGroup: 'idea' },
  { key: 'role_multimedia_journalist', label: 'Multimedia Journalist', field: 'multimedia_journalist', hint: 'Appears in the Multimedia Journalist list', group: 'Editorial', drawerGroup: 'idea' },
  { key: 'role_production_manager', label: 'Production Manager', field: 'production_manager', hint: 'Appears in the Production Manager list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_producer', label: 'Producer', field: 'producer', hint: 'Appears in the Producer list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_presenter', label: 'Presenter', field: 'presenter_name', hint: 'Appears in the Presenter list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_set_designer', label: 'Set Designer', field: 'set_designer', hint: 'Appears in the Set Designer list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_camera_operator', label: 'Camera Operator', field: 'camera_operator', hint: 'Appears in the Camera Operator list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_teleprompter_operator', label: 'Teleprompter Operator', field: 'teleprompter_operator', hint: 'Appears in the Teleprompter Operator list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_light_designer', label: 'Light Designer', field: 'light_designer', hint: 'Appears in the Light Designer list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_sound_recordist', label: 'Sound Recordist', field: 'sound_recordist', hint: 'Appears in the Sound Recordist list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_data_wrangler', label: 'Data Wrangler', field: 'data_wrangler', hint: 'Appears in the Data Wrangler list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_makeup_artist', label: 'Makeup Artist', field: 'makeup_artist', hint: 'Appears in the Makeup Artist list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_voice_over_artist', label: 'Voice Over Artist', field: 'voice_over_artist', hint: 'Appears in the Voice Over Artist list', group: 'Production', drawerGroup: 'crew' },
  { key: 'role_video_editor', label: 'Video Editor', field: 'video_editor', hint: 'Appears in the Video Editor list', group: 'Post-Production', drawerGroup: 'post' },
  { key: 'role_motion_graphics_designer', label: 'Motion Graphics Designer', field: 'motion_graphics_designer', hint: 'Appears in the Motion Graphics Designer list', group: 'Post-Production', drawerGroup: 'post' },
  { key: 'role_graphic_designer', label: 'Graphic Designer', field: 'graphic_designer', hint: 'Appears in the Graphic Designer list', group: 'Post-Production', drawerGroup: 'post' },
  { key: 'role_colorist', label: 'Colorist', field: 'colorist', hint: 'Appears in the Colorist list', group: 'Post-Production', drawerGroup: 'post' },
  { key: 'role_audio_mixer', label: 'Audio Mixer', field: 'audio_mixer', hint: 'Appears in the Audio Mixer list', group: 'Post-Production', drawerGroup: 'post' },
  { key: 'role_publisher', label: 'Publisher', field: 'publisher', hint: 'Appears in the Publisher list', group: 'Publishing', drawerGroup: 'publish' },
  { key: 'role_live_video_switcher', label: 'Live Video Switcher', field: 'live_video_switcher', hint: 'Appears in the Live Video Switcher list', group: 'Live', drawerGroup: 'live' },
  { key: 'role_live_audio_mixer', label: 'Live Audio Mixer', field: 'live_audio_mixer', hint: 'Appears in the Live Audio Mixer list', group: 'Live', drawerGroup: 'live' },
];

const rolesInDrawerGroup = (groupId) => ROLE_LIST.filter((r) => r.drawerGroup === groupId);
const PRODUCTION_CREW_FIELDS = rolesInDrawerGroup('crew').map((r) => r.field).filter((f) => f !== 'presenter_name');
const GUARDED_ASSIGN_FIELDS = [...PRODUCTION_CREW_FIELDS, 'publisher'];

const isUncutReporter = (m, row) => !!m && m.active !== false && !!row && row.content_type === 'UNCUT' && m.role_multimedia_journalist === true;

const canAssignProductionCrew = (m, row) => !!m && m.active !== false && (isManager(m) || m.role_producer === true || m.role_production_manager === true || isUncutReporter(m, row));
const canRunShoot = (m, row) => !!m && m.active !== false && (canAssignProductionCrew(m, row) || m.role_camera_operator === true || !!(row && row.camera_operator && row.camera_operator === m.full_name));
const canEditShootTimes = (m, row) => !!m && m.active !== false && (canAssignProductionCrew(m, row) || m.role_camera_operator === true);
const canTickFilesDelivered = (m, row) => !!m && m.active !== false && (canAssignProductionCrew(m, row) || m.role_camera_operator === true || m.role_data_wrangler === true);
const canEditProductionNotes = (m, row) => canTickFilesDelivered(m, row);
const canMarkFilesReceived = (m, row) => !!m && m.active !== false && !!row && (isManager(m) || (!!row.video_editor && row.video_editor === m.full_name));
const canFixFilesProblem = (m, row) => !!m && m.active !== false && (canTickFilesDelivered(m, row) || (!!row && !!row.files_delivered_by && row.files_delivered_by === m.full_name));
const FILES_DELIVERED_STATUSES = ['Shooting', 'Assign Editor', 'Editing', 'Video Review', 'Ready to Publish', 'Scheduled', 'Published', 'Re-Shoot'];

/* One flat list of every toggle (Access first, then Roles). Other code reads this. */
const PERMISSIONS = [...ACCESS_LIST, ...ROLE_LIST].map(({ key, label, hint }) => ({ key, label, hint }));

const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', general: 'General' };

/* Chip colours follow the phase: grey = script, red = production, golden yellow = video edit, green = ready to publish, blue = published, pale yellow = on hold, black = dropped, teal = scheduled on the platform. */
const STATUS_META = {
  Draft: { tone: 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25', dot: 'bg-zinc-400' },
  Requested: { tone: 'text-violet-300 bg-violet-500/15 ring-violet-400/25', dot: 'bg-violet-400' },
  Designing: { tone: 'text-fuchsia-300 bg-fuchsia-500/15 ring-fuchsia-400/25', dot: 'bg-fuchsia-400', live: true },
  'In Review': { tone: 'text-orange-300 bg-orange-500/15 ring-orange-400/25', dot: 'bg-orange-400' },
  'Script Submitted': { tone: 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25', dot: 'bg-zinc-400' },
  'Ready for Shoot': { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400' },
  Shooting: { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400', live: true },
  'Assign Editor': { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500' },
  Editing: { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500', live: true },
  'Video Review': { tone: 'text-amber-500 bg-amber-500/15 ring-amber-400/25', dot: 'bg-amber-500' },
  'Ready to Publish': { tone: 'text-emerald-300 bg-emerald-500/15 ring-emerald-400/25', dot: 'bg-emerald-400' },
  Scheduled: { tone: 'text-teal-300 bg-teal-500/15 ring-teal-400/25', dot: 'bg-teal-400' },
  Published: { tone: 'text-sky-300 bg-sky-500/15 ring-sky-400/25', dot: 'bg-sky-400' },
  'On Hold': { tone: 'text-yellow-200 bg-yellow-400/10 ring-yellow-300/25', dot: 'bg-yellow-300' },
  Dropped: { tone: 'text-zinc-300 bg-zinc-950 ring-zinc-500/50', dot: 'bg-zinc-500' },
  'Re-Shoot': { tone: 'text-red-300 bg-red-500/15 ring-red-400/25', dot: 'bg-red-400' },
};
const ALL_STATUSES = Object.keys(STATUS_META);

/* ------------------------------------------------------------------ */
/* Permission helpers                                                  */
/* ------------------------------------------------------------------ */
const isManager = (m) => !!m && m.active !== false && (m.role === 'owner' || m.role === 'manager');
const isOwner = (m) => !!m && m.active !== false && m.role === 'owner';
const can = (m, key) => !!m && m.active !== false && (isManager(m) || m[key] === true);

const AD_TYPES = [
  { value: 'spoken', label: 'Spoken mention' },
  { value: 'intro_clip', label: 'Intro clip' },
  { value: 'outro_clip', label: 'Outro clip' },
  { value: 'logo_dog', label: 'Logo / DOG' },
  { value: 'l_shape', label: 'L-shape pop-up' },
  { value: 'caption', label: 'Caption mention' },
  { value: 'other', label: 'Other' },
];

const AD_STATUSES = [
  { value: 'agreed', label: 'Agreed' },
  { value: 'added', label: 'Added' },
  { value: 'aired', label: 'Aired' },
];

const canEditAds = (m) => !!m && m.active !== false && (isManager(m) || m.can_manage_sponsors === true);

const isExternal = (m) => !!m && m.member_type === 'external';
const canManageExternals = (m) => !!m && m.active !== false && (isManager(m) || m.role_producer === true || m.role_production_manager === true);
const canManagePhotoTemplates = (m) => !!m && m.active !== false && (isManager(m) || m.can_manage_photo_templates === true);
const canRequestPhotoCards = (m) => !!m && m.active !== false && (isManager(m) || m.can_request_photo_cards === true);
const canApprovePhotoCards = (m) => !!m && m.active !== false && (isManager(m) || m.can_approve_photo_cards === true);
const canSeePhotoCardDesk = (m) => {
  if (!m || m.active === false) return false;
  if (isManager(m)) return true;
  return (
    m.can_request_photo_cards === true ||
    m.can_approve_photo_cards === true ||
    m.role_graphic_designer === true ||
    m.role_publisher === true
  );
};
const isCardCreatedBy = (row, name) => {
  if (!row || !name || !Array.isArray(row.audit_log)) return false;
  return row.audit_log.some(
    (e) => e && e.kind === 'status' && e.to === 'Draft' && e.note === 'Created' && e.actor === name
  );
};

const PHOTO_FIELD_TYPES = [
  { id: 'short', label: 'Short text' },
  { id: 'long', label: 'Long text' },
  { id: 'image', label: 'Image link' },
  { id: 'date', label: 'Date' },
];

const PUBLISH_CHECK_STATUSES = ['Scheduled', 'Ready to Publish'];
const PUBLISH_CHECK_GRACE_MS = 10 * 60 * 1000;

const publishCheckState = (row, nowMs = Date.now()) => {
  if (!row || !PUBLISH_CHECK_STATUSES.includes(row.status)) return null;
  if (typeIsCard(row.content_type)) return null;
  if (row.publish_help_at) return 'waiting_manager';
  if (row.scheduled_publish_time) {
    const t = new Date(row.scheduled_publish_time).getTime();
    if (!Number.isNaN(t) && nowMs >= t + PUBLISH_CHECK_GRACE_MS) {
      return 'unanswered';
    }
  }
  return null;
};

const canAnswerPublishCheck = (m, row) =>
  !!m && m.active !== false && !!row && (isManager(m) || (!!row.publisher && row.publisher === m.full_name));

const canAnswerPublishCheckNow = (m, row, nowMs) => {
  if (!m || m.active === false || !row) return false;
  const state = publishCheckState(row, nowMs);
  if (!state) return false;
  if (state === 'waiting_manager') return isManager(m);
  return canAnswerPublishCheck(m, row);
};

const canRescheduleRow = (m, row) =>
  !!m && m.active !== false && (can(m, 'can_reschedule_content') || (m.role_publisher === true && !!row && !!row.publisher && row.publisher === m.full_name));

function normalizePhone(input) {
  if (!input) return '';
  let s = String(input).trim().replace(/[\s\-\.\(\)]/g, '');
  if (s.startsWith('00')) {
    s = '+' + s.slice(2);
  } else if (s.startsWith('+')) {
    s = '+' + s.slice(1).replace(/\D/g, '');
  } else if (s.startsWith('880')) {
    s = '+' + s.replace(/\D/g, '');
  } else if (s.startsWith('0') && s.length === 11) {
    s = '+88' + s.replace(/\D/g, '');
  } else if (s.startsWith('1') && s.length === 10) {
    s = '+880' + s.replace(/\D/g, '');
  } else {
    return '';
  }
  if (/^\+[1-9][0-9]{7,14}$/.test(s)) {
    return s;
  }
  return '';
}

const memberOptionLabel = (m) => (m ? (m.nickname || m.full_name || '') + (isExternal(m) ? ' (External)' : '') : '');

/* ------------------------------------------------------------------ */
/* Workflow (state machine)                                            */
/* ------------------------------------------------------------------ */
const afterScript = (type) => typeConfig(type).afterScript;
const afterShoot = () => 'Assign Editor';

function isRemovedPublished(row) {
  return !!(row && row.status === 'Dropped' && (row.published_at || row.went_live_at));
}

function getActions(row, m, ctx = {}) {
  const list = [];
  if (!m || m.active === false) return list;
  const mgr = isManager(m);
  const pubOk = mgr || (!!row.publisher && row.publisher === m.full_name);
  const s = row.status;
  const t = row.content_type;
  const add = (id, label, to, tone, allowed, why, blocked, needsReason) =>
    list.push({ id, label, to, tone, allowed, why: why || '', blocked: blocked || '', needsReason: !!needsReason });

  if (typeIsCard(t)) {
    const { photoTemplates } = ctx || {};
    if (s === 'Draft') {
      const template = photoTemplates ? photoTemplates.find((tp) => String(tp.id) === String(row.template_id)) : null;
      const missing = photoCardMissing(row, template);
      const blocked = missing.length > 0 ? `Fill first: ${missing.join(', ')}` : '';
      add('submit_card', 'Submit to Design', 'Requested', 'primary', canRequestPhotoCards(m), 'Needs the “Request Photo Cards” permission', blocked);
    } else if (s === 'Requested') {
      add('take_card', "I'm taking it", 'Designing', 'primary', mgr || !!m.role_graphic_designer, 'Graphic Designers or managers only');
      add('withdraw_card', 'Withdraw', 'Draft', 'ghost', mgr || (!!row.requested_by && row.requested_by === m.full_name), 'Requester or managers only');
    } else if (s === 'Designing') {
      const isDesigner = mgr || (!!row.graphic_designer && row.graphic_designer === m.full_name);
      const designerWhy = 'Assigned Graphic Designer or managers only';
        add('made_card', 'Made, send for review', 'In Review', 'primary', isDesigner, designerWhy);
      add('give_back_card', 'Give back', 'Requested', 'ghost', isDesigner, designerWhy);
    } else if (s === 'In Review') {
      const isRequester = !!row.requested_by && row.requested_by === m.full_name;
      const isDesigner = !!row.graphic_designer && row.graphic_designer === m.full_name;
      const canApprove = mgr || ((canApprovePhotoCards(m) || isRequester) && !isDesigner);
      const approveWhy = (isDesigner && !mgr)
        ? 'The graphic designer cannot approve their own card'
        : 'Needs the “Approve Photo Cards” permission, or must be the requester or a Manager';
      add('approve_card', 'Approve', 'Ready to Publish', 'primary', canApprove, approveWhy);
      add('correct_card', 'Request correction', 'Designing', 'ghost', canApprove, approveWhy, '', true);
    } else if (s === 'Ready to Publish') {
      const cardPubOk = mgr || (!!m.role_publisher && (!row.publisher || row.publisher === m.full_name));
      const cardPubWhy = (!!row.publisher && row.publisher !== m.full_name && !mgr) ? 'Assigned to another publisher' : 'Publishers or managers only';
      add('schedule', 'Mark as Scheduled', 'Scheduled', 'primary', cardPubOk, cardPubWhy);
      add('publish', 'Publish', 'Published', 'ghost', cardPubOk, cardPubWhy);
    } else if (s === 'Scheduled') {
      const cardPubOk = mgr || (!!m.role_publisher && (!row.publisher || row.publisher === m.full_name));
      const cardPubWhy = (!!row.publisher && row.publisher !== m.full_name && !mgr) ? 'Assigned to another publisher' : 'Publishers or managers only';
      add('publish', 'Confirm Published', 'Published', 'primary', cardPubOk, cardPubWhy);
      add('unschedule', 'Cancel Schedule', 'Ready to Publish', 'ghost', cardPubOk, cardPubWhy);
    }
    if (s === 'Published') {
      add('drop', 'Drop', 'Dropped', 'danger', mgr, 'Managers only', '', true);
    } else if (s === 'On Hold') {
      add('resume', 'Resume', row.previous_status || 'Draft', 'primary', mgr, 'Managers only');
    } else if (s === 'Dropped') {
      add('restore', 'Restore', isRemovedPublished(row) ? 'Published' : 'Draft', 'primary', mgr, 'Managers only');
    } else if (!['Published', 'Dropped', 'On Hold'].includes(s)) {
      add('hold', 'Hold', 'On Hold', 'ghost', mgr, 'Managers only', '', true);
      add('drop', 'Drop', 'Dropped', 'danger', mgr, 'Managers only', '', true);
    }
    return list;
  }

  switch (s) {
    case 'Draft':
      if (typeConfig(t).afterDraft) {
        add('footage_ready', 'Footage Ready', typeConfig(t).afterDraft, 'primary', mgr || m.role_multimedia_journalist === true, 'Only the Multimedia Journalist or a Manager can send an Uncut to editing', row.multimedia_journalist ? '' : 'Pick the Multimedia Journalist first');
      } else {
        add('submit', 'Submit Script', 'Script Submitted', 'primary', can(m, 'can_write_edit_scripts'), 'Needs the “Write & Edit Scripts” permission', row.script && row.script.trim() ? '' : 'Write a script first');
      }
      break;
    case 'Script Submitted':
      add('approve_script', 'Approve Script', afterScript(t), 'primary', can(m, 'can_approve_scripts'), 'Needs the “Approve Scripts” permission');
      add('return_script', 'Send Back', 'Draft', 'ghost', can(m, 'can_approve_scripts'), 'Needs the “Approve Scripts” permission', '', true);
      break;
    case 'Ready for Shoot':
      add(
        'start_shoot',
        'Start Shoot',
        'Shooting',
        'primary',
        canRunShoot(m, row),
        'Only the Camera Operator, Producer, Production Manager or a Manager can start a shoot',
        !row.camera_operator && !m.role_camera_operator ? 'Camera Operator must be assigned first' : ''
      );
      break;
    case 'Shooting':
      add(
        'finish_shoot',
        'Finish Shoot',
        afterShoot(t),
        'primary',
        canRunShoot(m, row),
        'Only the Camera Operator, Producer, Production Manager or a Manager can finish a shoot'
      );
      break;
    case 'Assign Editor': {
      const allowed = can(m, 'can_assign_video_editor') || (row.content_type === 'UNCUT' && m.role_multimedia_journalist === true && row.video_editor === m.full_name);
      add('start_edit', 'Send to Editing', 'Editing', 'primary', allowed, 'Needs the “Assign Video Editor” permission', row.video_editor ? '' : 'Pick a video editor first');
      break;
    }
    case 'Editing':
      add('submit_video', 'Submit Video', 'Video Review', 'primary', mgr || (!!row.video_editor && row.video_editor === m.full_name), 'Assigned editor or managers only', '');
      break;
    case 'Video Review':
      add('approve_video', 'Approve Video', 'Ready to Publish', 'primary', can(m, 'can_review_videos'), 'Needs the “Review Videos” permission');
      add('revise', 'Request Revision', 'Editing', 'ghost', can(m, 'can_review_videos'), 'Needs the “Review Videos” permission', '', true);
      break;
    case 'Ready to Publish':
      add('schedule', 'Mark as Scheduled', 'Scheduled', 'primary', pubOk, 'Assigned Publisher or managers only', row.publisher ? '' : 'Publisher must be assigned first');
      add('publish', 'Publish', 'Published', 'ghost', pubOk, 'Assigned Publisher or managers only', row.publisher ? '' : 'Publisher must be assigned first');
      break;
    case 'Scheduled':
      add('publish', 'Confirm Published', 'Published', 'primary', pubOk, 'Assigned Publisher or managers only', row.publisher ? '' : 'Publisher must be assigned first');
      add('unschedule', 'Cancel Schedule', 'Ready to Publish', 'ghost', pubOk, 'Assigned Publisher or managers only');
      break;
    case 'Published':
      add('drop', 'Drop', 'Dropped', 'danger', mgr, 'Managers only', '', true);
      break;
    case 'On Hold':
      add('resume', 'Resume', row.previous_status || 'Draft', 'primary', mgr, 'Managers only');
      break;
    case 'Dropped':
      add('restore', 'Restore', isRemovedPublished(row) ? 'Published' : 'Draft', 'primary', mgr, 'Managers only');
      break;
    case 'Re-Shoot':
      add('back_to_shoot', 'Back to Shoot Queue', 'Ready for Shoot', 'primary', true);
      break;
    default:
      break;
  }
  if (t !== 'UNCUT' && ['Editing', 'Video Review'].includes(s)) add('reshoot', 'Re-Shoot', 'Re-Shoot', 'ghost', mgr, 'Managers only', '', true);
  if (!['Published', 'Dropped', 'On Hold'].includes(s)) {
    add('hold', 'Hold', 'On Hold', 'ghost', mgr, 'Managers only', '', true);
    add('drop', 'Drop', 'Dropped', 'danger', mgr, 'Managers only', '', true);
  }
  if (s === 'Ready for Shoot' && typeHasScript(t)) {
    add('copy_script', 'Copy Script', '', 'ghost', true);
  }
  return list;
}

/* ------------------------------------------------------------------ */
/* Date / text helpers                                                 */
/* ------------------------------------------------------------------ */
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n) => String(n).padStart(2, '0');

function formatRangeLabel(range) {
  const today = startOfDay(new Date());
  const { start, end } = range;
  const fmt = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  if (sameDay(start, end)) {
    if (sameDay(start, today)) return 'Today';
    if (sameDay(start, addDays(today, 1))) return 'Tomorrow';
    if (sameDay(start, addDays(today, -1))) return 'Yesterday';
    return fmt(start);
  }
  return `${fmt(start)} – ${fmt(end)}`;
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatDay = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};
const formatStamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)}, ${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

/* Slug rule: English only. UPPERCASE in real time, A-Z, 0-9, spaces and hyphen only, max 24 characters. Examples: 'budget 2026: what?' -> 'BUDGET 2026 WHAT'; 'metro rail' -> 'METRO RAIL'; Bengali letters are removed. */
const SLUG_MAX = 24;
function normalizeSlugInput(v) {
  return String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, SLUG_MAX);
}

function photoCardMissing(row, template) {
  const missing = [];
  if (!row || !row.channel) missing.push('channel');
  if (!template || !row || !row.template_id) {
    missing.push('template');
  } else if (Array.isArray(template.fields)) {
    const cardFields = (row.card_fields && typeof row.card_fields === 'object') ? row.card_fields : {};
    for (const f of template.fields) {
      if (f.required) {
        const val = cardFields[f.key] != null ? String(cardFields[f.key]).trim() : '';
        if (!val) {
          missing.push(f.label || f.key);
        } else if (f.type === 'image' && !(val.startsWith('http://') || val.startsWith('https://'))) {
          missing.push(f.label || f.key);
        }
      }
    }
  }
  if (!row || !row.card_source || !String(row.card_source).trim()) {
    missing.push('source');
  }
  return missing;
}

function photoCardSlugFrom(template, values) {
  if (template && Array.isArray(template.fields)) {
    const firstShort = template.fields.find((f) => f.type === 'short');
    if (firstShort) {
      const val = values && values[firstShort.key] != null ? String(values[firstShort.key]).trim() : '';
      if (val) {
        return normalizeSlugInput(val).slice(0, SLUG_MAX);
      }
    }
  }
  if (template) {
    const fallback = `${template.name || 'Template'} #${template.number || ''}`.trim();
    return normalizeSlugInput(fallback).slice(0, SLUG_MAX);
  }
  return '';
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

function generateUserUID(dateIso) {
  const date = dateIso ? new Date(dateIso) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mins = pad(date.getMinutes());
  
  // 6-character random alphanumeric
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `${yyyy}${mm}${dd}-${hh}${mins}BST-${randomStr}`;
}

/* Demo mode only. With Supabase, the database assigns WAVECON-YYYYMMDD_0001 (videos) or WAVECARD-YYYYMMDD_0001 (Photo Cards) itself. */
const makeContentUid = (iso, n, type) => {
  const d = iso ? new Date(iso) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const yyyymmdd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(validDate).replace(/-/g, '');
  const pfx = typeIsCard(type) ? 'WAVECARD-' : 'WAVECON-';
  return `${pfx}${yyyymmdd}_${String(n || 1).padStart(4, '0')}`;
};

const makeNoticeUid = (iso, n) => {
  const d = iso ? new Date(iso) : new Date();
  return `NOTICE-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${String(n || 1).padStart(3, '0')}`;
};

const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};
/* Shorts whose upload time falls inside the rundown range. */
const shortsInRange = (r, start, endEx) =>
  (r.shorts || []).filter((s) => s.publish_at && new Date(s.publish_at) >= start && new Date(s.publish_at) < endEx);
/* Plain-language notes about short clips for a rundown row.
   Examples: main time inside the range, 3 shorts, none due -> { main: 'Main video - has 3 short clips', shorts: [] };
   1 short -> main: 'Main video - has 1 short clip';
   main outside the range, short 2 of 3 due -> { main: '', shorts: [{ id, tag: 'SHORT 2/3', text: 'Short clip 2 of 3, cut from the main video' }] };
   nothing due and main outside the range -> null. */
const shortClipNotes = (r, start, endEx) => {
  const all = r.shorts || [];
  const total = all.length;
  const d = r.scheduled_publish_time ? new Date(r.scheduled_publish_time) : null;
  const mainIn = !!d && d >= start && d < endEx;
  const due = shortsInRange(r, start, endEx);
  if (!mainIn && due.length === 0) return null;
  return {
    main: mainIn && total >= 1 ? `Main video - has ${total} short clip${total === 1 ? '' : 's'}` : '',
    shorts: due.map((s) => {
      const n = all.findIndex((x) => x.id === s.id) + 1;
      return { id: s.id, tag: `SHORT ${n}/${total}`, text: `Short clip ${n} of ${total}, cut from the main video` };
    })
  };
};
const cardEffectiveTime = (row) => {
  if (!row) return '';
  if (typeIsCard(row.content_type) && row.status === 'Published') {
    return row.went_live_at || row.published_at || row.scheduled_publish_time || '';
  }
  return row.scheduled_publish_time || '';
};

const OPEN_CARD_STATUSES = ['Draft', 'Requested', 'Designing', 'In Review', 'Ready to Publish', 'Scheduled'];

const isOpenCard = (row) => {
  return !!row && typeIsCard(row.content_type) && OPEN_CARD_STATUSES.includes(row.status);
};

const cardOpenDays = (row, nowMs = Date.now()) => {
  if (!row) return 0;
  const created = new Date(row.created_at || row.scheduled_publish_time || nowMs).getTime();
  if (isNaN(created)) return 0;
  const diff = Math.max(0, Number(nowMs) - created);
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const openCardInRange = (row, rangeStart, rangeEndExclusive, nowMs = Date.now()) => {
  if (!row || !typeIsCard(row.content_type) || !isOpenCard(row)) return false;
  const timeStr = row.scheduled_publish_time || row.created_at;
  if (!timeStr) return false;
  const cardDate = new Date(timeStr);
  if (isNaN(cardDate.getTime())) return false;
  const cardStart = startOfDay(cardDate);
  const now = new Date(nowMs);
  const todayEnd = addDays(startOfDay(now), 1);
  const rStart = rangeStart instanceof Date ? rangeStart : new Date(rangeStart);
  const rEnd = rangeEndExclusive instanceof Date ? rangeEndExclusive : new Date(rangeEndExclusive);
  return cardStart < rEnd && rStart < todayEnd && cardStart < todayEnd;
};

const rowBelongsInView = (row, rangeStart, rangeEndExclusive) => {
  if (!row) return false;
  const rStart = rangeStart instanceof Date ? rangeStart : new Date(rangeStart);
  const rEnd = rangeEndExclusive instanceof Date ? rangeEndExclusive : new Date(rangeEndExclusive);

  if (row.scheduled_publish_time) {
    const st = new Date(row.scheduled_publish_time);
    if (!isNaN(st.getTime()) && st >= rStart && st < rEnd) return true;
  }
  if (shortsInRange(row, rStart, rEnd).length > 0) return true;
  if (row.status === 'On Hold') return true;
  if (!row.scheduled_publish_time || !String(row.scheduled_publish_time).trim()) return true;
  if (!String(row.channel || '').trim() || !String(row.slug_name || '').trim()) return true;
  if (isOpenCard(row)) return true;
  if (typeIsCard(row.content_type) && row.status === 'Published') {
    const eff = cardEffectiveTime(row);
    if (eff) {
      const et = new Date(eff);
      if (!isNaN(et.getTime()) && et >= rStart && et < rEnd) return true;
    }
  }
  return false;
};

const rowTimeIn = (r, start, endEx) => {
  const eff = cardEffectiveTime(r);
  const t = eff ? new Date(eff) : null;
  if (t && t >= start && t < endEx) return eff;
  const ss = shortsInRange(r, start, endEx).map((s) => s.publish_at).sort();
  return ss[0] || eff;
};
/* A content is "complete" when it has a channel, a slug name and a publish date & time. */
const isComplete = (r) => !!(String(r.channel || '').trim() && String(r.slug_name || '').trim() && r.scheduled_publish_time);
/* What is missing, in plain words. */
const missingFields = (r) => {
  const m = [];
  if (!String(r.channel || '').trim()) m.push('channel');
  if (!String(r.slug_name || '').trim()) m.push('slug');
  if (!r.scheduled_publish_time) m.push('date & time');
  return m;
};
/* Bin: Dropped content that is incomplete. */
const isBin = (r) => r.status === 'Dropped' && !isComplete(r);
/* Parking Zone: On Hold content (complete or not) + incomplete content that is not Dropped.
   Complete content of any status is shown on the rundown (a complete On Hold one shows in both places). */
const isParked = (r) => r.status === 'On Hold' || (r.status !== 'Dropped' && !isComplete(r));
function normalizeRow(r) {
  return {
    ...r,
    content_type: CONTENT_TYPES.includes(r.content_type) ? r.content_type : 'PACKAGE',
    status: r.status || 'Draft',
    script: r.script || '',
    is_script_locked: r.is_script_locked === true,
    shoot_started_at: r.shoot_started_at || null,
    shoot_finished_at: r.shoot_finished_at || null,
    shoot_location: r.shoot_location || '',
    production_notes: r.production_notes || '',
    files_delivered_at: r.files_delivered_at || null,
    files_delivered_by: r.files_delivered_by || null,
    files_received_at: r.files_received_at || null,
    files_received_by: r.files_received_by || null,
    files_problem_at: r.files_problem_at || null,
    files_problem_by: r.files_problem_by || null,
    files_problem_note: r.files_problem_note || '',
    publish_help_at: r.publish_help_at || null,
    publish_help_by: r.publish_help_by || null,
    publish_help_note: r.publish_help_note || '',
    target_platforms: asArray(r.target_platforms),
    shorts: asArray(r.shorts),
    revisions: asArray(r.revisions),
    audit_log: asArray(r.audit_log),
    card_fields: (r.card_fields && typeof r.card_fields === 'object' && !Array.isArray(r.card_fields)) ? r.card_fields : {},
    template_id: r.template_id != null ? r.template_id : null,
    card_source: r.card_source || '',
    designer_instructions: r.designer_instructions || '',
    card_folder: r.card_folder || '',
    linked_content_uid: r.linked_content_uid || '',
    correction_note: r.correction_note || '',
    correction_count: Number(r.correction_count) || 0,
  };
}

function stepProgress(row) {
  if (!row) return { editorial: false, production: false, post: false, publish: false };
  const status = row.status || '';
  const AFTER_SCRIPT = ['Ready for Shoot', 'Shooting', 'Re-Shoot', 'Assign Editor', 'Editing', 'Video Review', 'Ready to Publish', 'Scheduled', 'Published'];
  const AFTER_SHOOT = ['Assign Editor', 'Editing', 'Video Review', 'Ready to Publish', 'Scheduled', 'Published'];
  const READY_PLUS = ['Ready to Publish', 'Scheduled', 'Published'];

  const reached = (set) => {
    if (set.includes(status)) return true;
    if (status === 'On Hold' || status === 'Dropped') {
      const hist = asArray(row.history || row.audit_log);
      return hist.some((e) => e && e.kind === 'status' && set.includes(e.to));
    }
    return false;
  };

  if (typeIsCard(row.content_type)) {
    const CARD_EDITORIAL = ['Requested', 'Designing', 'In Review', 'Ready to Publish', 'Scheduled', 'Published'];
    const CARD_PRODUCTION = ['In Review', 'Ready to Publish', 'Scheduled', 'Published'];
    const editorial = reached(CARD_EDITORIAL);
    const production = reached(CARD_PRODUCTION);
    const post = false;
    const publish = status === 'Published' || !!row.published_at || !!row.went_live_at;
    return { editorial, production, post, publish };
  }

  const hasScript = typeHasScript(row.content_type);
  const editorial = hasScript ? reached(AFTER_SCRIPT) : reached(AFTER_SHOOT);
  const production = status !== 'Re-Shoot' && (!!row.shoot_finished_at || (!typeConfig(row.content_type).skipsShoot && AFTER_SHOOT.includes(status)));
  const post = typeConfig(row.content_type).hasPostStage && reached(READY_PLUS);
  const publish = status === 'Published' || !!row.published_at || !!row.went_live_at;

  return { editorial, production, post, publish };
}

function normalizeMember(m) {
  const out = {
    ...m,
    active: m.active !== false,
    member_type: m.member_type || 'staff',
    external_note: m.external_note || '',
  };
  PERMISSIONS.forEach((p) => {
    out[p.key] = m[p.key] === true;
  });
  return out;
}

const eligibleMembers = (team, roleKey) => (team || []).filter((m) => m.active !== false && !!m[roleKey]);
const presenterMembers = (team) => eligibleMembers(team, 'role_presenter');


/* ------------------------------------------------------------------ */
/* Which permission guards which field                                 */
/* ------------------------------------------------------------------ */
const FIELD_PERM = {
  script: 'can_write_edit_scripts',
  title: 'can_edit_content_details',
  slug_name: 'can_edit_content_details',
  thumbnail_text: 'can_edit_content_details',
  writer: 'can_edit_content_details',
  archive_shelf_id: 'can_edit_content_details',
  target_platforms: 'can_edit_content_details',
  channel: 'can_change_channel',
  scheduled_publish_time: 'can_reschedule_content',
  presenter_name: 'can_assign_presenter',
  video_editor: 'can_assign_video_editor',
  post_caption: 'can_edit_content_details',
  seo_keywords: 'can_edit_content_details',
  hashtags: 'can_edit_content_details',
};

/* Fields whose every change is written to the audit trail (previous value → new value). */
const TRACKED_FIELDS = {
  script: 'Script',
  is_script_locked: 'Script lock',
  title: 'Title',
  thumbnail_text: 'Thumbnail text',
  writer: 'Research & Script Writer',
  multimedia_journalist: 'Multimedia Journalist',
  presenter_name: 'Presenter',
  video_editor: 'Video Editor',
  camera_operator: 'Camera Operator',
  channel: 'Channel',
  scheduled_publish_time: 'Scheduled time',
  shoot_started_at: 'Shoot started',
  shoot_finished_at: 'Shoot finished',
  shoot_location: 'Shoot location',
  files_delivered_at: 'Files delivered',
  production_notes: 'Production notes',
  archive_shelf_id: 'Shelf ID',
  target_platforms: 'Platforms',
  post_caption: 'Post caption',
  seo_keywords: 'SEO keywords',
  hashtags: 'Hashtags',
  template_id: 'Template',
  card_source: 'Source',
  designer_instructions: 'Designer instructions',
  card_folder: 'Card folder',
  linked_content_uid: 'Linked content',
};

/* Default "went live" time shown in the Publish dialog.
   If the scheduled time has already passed, use it; otherwise use now.
   Examples: scheduled 14:00, now 14:07 -> 14:00; scheduled 14:00, now 13:50 -> 13:50; no scheduled time -> now. */
const wentLiveDefault = (row, nowIso) => {
  const sched = row && row.scheduled_publish_time ? new Date(row.scheduled_publish_time).getTime() : NaN;
  const now = new Date(nowIso).getTime();
  return !Number.isNaN(sched) && sched <= now ? new Date(sched).toISOString() : new Date(now).toISOString();
};

function safeHttpUrl(value) {
  if (!value || typeof value !== 'string') return null;
  let urlStr = value.trim();
  if (urlStr.startsWith('www.')) urlStr = 'https://' + urlStr;
  try {
    const u = new URL(urlStr);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    return null;
  } catch (_) {
    return null;
  }
}

function getPublishedLinks(row) {
  if (!row) return {};
  if (row.published_links && typeof row.published_links === 'object' && !Array.isArray(row.published_links)) {
    return row.published_links;
  }
  if (row.live_video_url && typeof row.live_video_url === 'string') {
    const trimmed = row.live_video_url.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    if (safeHttpUrl(trimmed)) {
      const first = (row.target_platforms && row.target_platforms[0]) || 'youtube';
      return { [first]: trimmed };
    }
  }
  return {};
}

/* ------------------------------------------------------------------ */
/* Personal Tasks & Today's Work helpers (N164)                       */
/* ------------------------------------------------------------------ */

const todayDhaka = (date) => {
  const d = date ? (typeof date === 'string' || typeof date === 'number' ? new Date(date) : date) : new Date();
  const valid = isNaN(d.getTime()) ? new Date() : d;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(valid);
};

const parseYmd = (s) => {
  if (!s || typeof s !== 'string') return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { y: parts[0], m: parts[1], d: parts[2] };
};

const ymdToUtcMs = (s) => {
  const p = parseYmd(s);
  if (!p) return 0;
  return Date.UTC(p.y, p.m - 1, p.d);
};

const utcMsToYmd = (ms) => {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDaysYmd = (ymd, n) => {
  return utcMsToYmd(ymdToUtcMs(ymd) + n * 86400000);
};

const getWeekdayYmd = (ymd) => {
  return new Date(ymdToUtcMs(ymd)).getUTCDay(); // 0 = Sun .. 6 = Sat
};

const daysInMonthYmd = (y, m) => {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_ORDER = [6, 0, 1, 2, 3, 4, 5]; // Sat to Fri

const describeRepeat = (task) => {
  if (!task || task.repeat_kind === 'none' || !task.repeat_kind) return '';
  if (task.repeat_kind === 'daily') {
    return task.skip_friday ? 'Every day except Friday' : 'Every day';
  }
  if (task.repeat_kind === 'weekly') {
    const days = Array.isArray(task.repeat_weekdays) ? task.repeat_weekdays : [];
    if (days.length === 7) return 'Every day';
    const sorted = [...days].sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
    const names = sorted.map((d) => WEEKDAY_NAMES_SHORT[d] || String(d));
    return `Every week: ${names.join(', ')}`;
  }
  if (task.repeat_kind === 'monthly') {
    return `Every month: day ${task.repeat_month_day || 1}`;
  }
  return '';
};

const buildTodayPanel = ({ tasks = [], doneRows = [], today }) => {
  const todayStr = today || todayDhaka();
  const overdue = [];
  const todayItems = [];
  const later = [];
  let laterHiddenCount = 0;
  const doneToday = [];

  const doneSet = new Set(doneRows.map((r) => `${r.task_id}:${r.done_on}`));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // 1. Process doneToday from repeating personal_task_done rows whose created_at falls on today's Dhaka date
  doneRows.forEach((r) => {
    if (r.created_at && todayDhaka(r.created_at) === todayStr) {
      const task = taskMap.get(r.task_id);
      if (task) {
        doneToday.push({
          key: `repeat-done-${r.task_id}-${r.done_on}`,
          task,
          kind: 'repeat',
          date: r.done_on,
          time: task.due_time || null,
          overdue: false,
          doneAt: r.created_at,
        });
      }
    }
  });

  // 2. Process tasks
  tasks.forEach((task) => {
    const isRepeat = task.repeat_kind && task.repeat_kind !== 'none';

    if (!isRepeat) {
      // ONE-TIME TASK
      if (task.status === 'done') {
        if (task.done_at && todayDhaka(task.done_at) === todayStr) {
          doneToday.push({
            key: `once-done-${task.id}`,
            task,
            kind: 'once',
            date: task.due_date || todayStr,
            time: task.due_time || null,
            overdue: false,
            doneAt: task.done_at,
          });
        }
      } else if (task.status === 'open') {
        if (!task.due_date) {
          // undated -> "today" bucket (sorted last)
          todayItems.push({
            key: `once-${task.id}`,
            task,
            kind: 'once',
            date: null,
            time: null,
            overdue: false,
          });
        } else if (task.due_date < todayStr) {
          // overdue (stays until done)
          overdue.push({
            key: `once-${task.id}`,
            task,
            kind: 'once',
            date: task.due_date,
            time: task.due_time || null,
            overdue: true,
          });
        } else if (task.due_date === todayStr) {
          // today
          todayItems.push({
            key: `once-${task.id}`,
            task,
            kind: 'once',
            date: task.due_date,
            time: task.due_time || null,
            overdue: false,
          });
        } else {
          // due_date > todayStr
          const diffDays = Math.round((ymdToUtcMs(task.due_date) - ymdToUtcMs(todayStr)) / 86400000);
          if (diffDays >= 1 && diffDays <= 7) {
            later.push({
              key: `once-${task.id}`,
              task,
              kind: 'once',
              date: task.due_date,
              time: task.due_time || null,
              overdue: false,
            });
          } else if (diffDays > 7) {
            laterHiddenCount += 1;
          }
        }
      }
    } else {
      // REPEATING TASK
      if (task.stopped) return;

      if (task.repeat_kind === 'daily') {
        if (task.due_date && task.due_date <= todayStr) {
          const isFriday = getWeekdayYmd(todayStr) === 5;
          if (!(task.skip_friday && isFriday)) {
            const isDone = doneSet.has(`${task.id}:${todayStr}`);
            if (!isDone) {
              todayItems.push({
                key: `repeat-${task.id}-${todayStr}`,
                task,
                kind: 'repeat',
                date: todayStr,
                time: task.due_time || null,
                overdue: false,
              });
            }
          }
        }
      } else if (task.repeat_kind === 'weekly') {
        // weeks run Saturday to Friday
        const todayW = getWeekdayYmd(todayStr);
        const daysSinceSat = (todayW + 1) % 7;
        const satDate = addDaysYmd(todayStr, -daysSinceSat);
        const weekdays = Array.isArray(task.repeat_weekdays) ? task.repeat_weekdays : [];

        for (let cur = satDate; cur <= todayStr; cur = addDaysYmd(cur, 1)) {
          if (task.due_date && cur >= task.due_date) {
            const w = getWeekdayYmd(cur);
            if (weekdays.includes(w)) {
              const isDone = doneSet.has(`${task.id}:${cur}`);
              if (!isDone) {
                if (cur === todayStr) {
                  todayItems.push({
                    key: `repeat-${task.id}-${cur}`,
                    task,
                    kind: 'repeat',
                    date: cur,
                    time: task.due_time || null,
                    overdue: false,
                  });
                } else if (cur < todayStr) {
                  overdue.push({
                    key: `repeat-${task.id}-${cur}`,
                    task,
                    kind: 'repeat',
                    date: cur,
                    time: task.due_time || null,
                    overdue: true,
                  });
                }
              }
            }
          }
        }
      } else if (task.repeat_kind === 'monthly') {
        const p = parseYmd(todayStr);
        if (p) {
          const maxDays = daysInMonthYmd(p.y, p.m);
          const occDay = Math.min(task.repeat_month_day || 1, maxDays);
          const occDate = `${p.y}-${String(p.m).padStart(2, '0')}-${String(occDay).padStart(2, '0')}`;

          if (task.due_date && occDate >= task.due_date) {
            const isDone = doneSet.has(`${task.id}:${occDate}`);
            if (!isDone) {
              if (occDate === todayStr) {
                todayItems.push({
                  key: `repeat-${task.id}-${occDate}`,
                  task,
                  kind: 'repeat',
                  date: occDate,
                  time: task.due_time || null,
                  overdue: false,
                });
              } else if (occDate < todayStr) {
                overdue.push({
                  key: `repeat-${task.id}-${occDate}`,
                  task,
                  kind: 'repeat',
                  date: occDate,
                  time: task.due_time || null,
                  overdue: true,
                });
              }
            }
          }
        }
      }
    }
  });

  // Sorting
  overdue.sort((a, b) => {
    if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return (a.task.title || '').localeCompare(b.task.title || '');
  });

  todayItems.sort((a, b) => {
    const rank = (item) => {
      if (item.time) return 1;
      if (item.date) return 2;
      return 3;
    };
    const rA = rank(a);
    const rB = rank(b);
    if (rA !== rB) return rA - rB;
    if (rA === 1) {
      const tc = a.time.localeCompare(b.time);
      if (tc !== 0) return tc;
    }
    return (a.task.title || '').localeCompare(b.task.title || '');
  });

  later.sort((a, b) => {
    if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return (a.task.title || '').localeCompare(b.task.title || '');
  });

  doneToday.sort((a, b) => {
    const tA = a.doneAt ? new Date(a.doneAt).getTime() : 0;
    const tB = b.doneAt ? new Date(b.doneAt).getTime() : 0;
    return tB - tA;
  });

  return {
    overdue,
    today: todayItems,
    later,
    laterHiddenCount,
    doneToday,
  };
};

export {
  DEFAULT_CHANNELS,
  CONTENT_TYPE_CONFIG,
  CONTENT_TYPES, CONTENT_TYPE_COLORS,
  CONTENT_TYPE_HINT,
  typeConfig,
  typeAfterScript,
  typeHasScript,
  typeAfterDraft,
  typeHiddenCredits,
  typeUsesVideoEditor,
  typeHasPostStage,
  typeSkipsShoot,
  typeShowsLiveCredits,
  typeIsCard,
  PLATFORMS,
  PERMISSIONS,
  ACCESS_LIST, ROLE_LIST,
  rolesInDrawerGroup,
  PRODUCTION_CREW_FIELDS,
  GUARDED_ASSIGN_FIELDS,
  isUncutReporter,
  canAssignProductionCrew,
  canRunShoot,
  canEditShootTimes,
  canTickFilesDelivered,
  canEditProductionNotes,
  canMarkFilesReceived,
  canFixFilesProblem,
  FILES_DELIVERED_STATUSES,
  ROLE_LABEL,
  STATUS_META,
  ALL_STATUSES,
  AD_TYPES,
  AD_STATUSES,
  canEditAds,
  isManager,
  isOwner,
  can,
  afterScript,
  afterShoot,
  getActions,
  startOfDay,
  addDays,
  sameDay,
  MONTHS,
  pad,
  formatRangeLabel,
  toLocalInput,
  fromLocalInput,
  formatTime,
  formatDay,
  formatStamp,
  SLUG_MAX,
  normalizeSlugInput,
  uid,
  generateUserUID,
  makeContentUid,
  makeNoticeUid,
  asArray,
  shortsInRange,
  shortClipNotes,
  rowTimeIn,
  isParked,
  isComplete,
  isBin,
  isRemovedPublished,
  missingFields,
  normalizeRow,
  normalizeMember,
  FIELD_PERM,
  TRACKED_FIELDS,
  wentLiveDefault,
  stepProgress,
  eligibleMembers,
  presenterMembers,
  isExternal,
  canManageExternals,
  normalizePhone,
  memberOptionLabel,
  PUBLISH_CHECK_STATUSES,
  PUBLISH_CHECK_GRACE_MS,
  publishCheckState,
  canAnswerPublishCheck,
  canAnswerPublishCheckNow,
  canRescheduleRow,
  canManagePhotoTemplates,
  canRequestPhotoCards,
  canApprovePhotoCards,
  canSeePhotoCardDesk,
  isCardCreatedBy,
  PHOTO_FIELD_TYPES,
  photoCardMissing,
  photoCardSlugFrom,
  getPublishedLinks,
  OPEN_CARD_STATUSES,
  isOpenCard,
  cardOpenDays,
  cardEffectiveTime,
  openCardInRange,
  rowBelongsInView,
  todayDhaka,
  describeRepeat,
  buildTodayPanel,
};
