// Run: node --experimental-default-type=module tests/n165-content-work.mjs
// (package.json has no type=module, so plain node cannot load lib/core.js)
// Node test suite for N165: Automatic Content Work ("From contents")
import assert from 'node:assert';
import {
  contentWorkFor,
  buildContentWork,
  rowBelongsInView,
  todayDhaka,
} from '../lib/core.js';
import {
  PANEL_OPEN_STATUSES,
  PANEL_SOON_MINUTES,
  PANEL_DONE_LOOKBACK_HOURS,
} from '../utils/constants.js';

console.log('Running N165 test suite...');

const fixedNow = new Date('2026-11-24T12:00:00.000Z');
const ctxNow = { now: fixedNow };

// ====================================================================
// 1. Constants verification
// ====================================================================
assert.strictEqual(PANEL_SOON_MINUTES, 60, 'PANEL_SOON_MINUTES must be 60');
assert.strictEqual(PANEL_DONE_LOOKBACK_HOURS, 36, 'PANEL_DONE_LOOKBACK_HOURS must be 36');
assert.ok(Array.isArray(PANEL_OPEN_STATUSES), 'PANEL_OPEN_STATUSES must be an array');
assert.strictEqual(PANEL_OPEN_STATUSES.length, 13, 'PANEL_OPEN_STATUSES must have 13 statuses');
assert.ok(!PANEL_OPEN_STATUSES.includes('Published'), 'Published must not be open');
assert.ok(!PANEL_OPEN_STATUSES.includes('Dropped'), 'Dropped must not be open');
assert.ok(!PANEL_OPEN_STATUSES.includes('On Hold'), 'On Hold must not be open');
console.log('✓ 1. Constants verification passed');

// ====================================================================
// 2. Empty / invalid inputs
// ====================================================================
assert.strictEqual(contentWorkFor(null, null, ctxNow), null);
assert.strictEqual(contentWorkFor({}, null, ctxNow), null);
assert.strictEqual(contentWorkFor(null, { full_name: 'Alice' }, ctxNow), null);
assert.strictEqual(contentWorkFor({ status: 'Draft' }, { full_name: 'Alice', active: false }, ctxNow), null);
assert.strictEqual(contentWorkFor({ status: 'Published' }, { full_name: 'Alice', role: 'general' }, ctxNow), null);

const emptyBuild = buildContentWork({});
assert.deepStrictEqual(emptyBuild, { items: [], doneToday: [] });
const emptyBuild2 = buildContentWork({ rows: null, actor: null });
assert.deepStrictEqual(emptyBuild2, { items: [], doneToday: [] });
console.log('✓ 2. Empty / invalid inputs passed');

// ====================================================================
// 3. Stage rules for non-managers
// ====================================================================

// Draft (video with script): named writer -> "Submit Script"
const draftRow = { id: 101, content_type: 'EXPLAINER', status: 'Draft', writer: 'Writer Alice', script: 'Hello script' };
const writerActor = { full_name: 'Writer Alice', role: 'general', can_write_edit_scripts: true };
const otherActor = { full_name: 'Bob Other', role: 'general', can_write_edit_scripts: true };

const wItem = contentWorkFor(draftRow, writerActor, ctxNow);
assert.ok(wItem, 'Writer Alice should have work on draft');
assert.strictEqual(wItem.actionId, 'submit');
assert.strictEqual(wItem.label, 'Submit Script');
assert.strictEqual(wItem.blockedNote, null);
assert.strictEqual(contentWorkFor(draftRow, otherActor, ctxNow), null, 'Bob should not have work on draft');

// Non-manager named writer on Draft WITHOUT can_write_edit_scripts:
// Action is unallowed (allowed: false) and has no blockedNote (blocked: ''), so contentWorkFor returns null.
const writerNoPerm = { full_name: 'Writer Alice', role: 'general', can_write_edit_scripts: false };
const wItemNoPerm = contentWorkFor(draftRow, writerNoPerm, ctxNow);
assert.strictEqual(wItemNoPerm, null, 'Writer without can_write_edit_scripts has unallowed action with no blocked note, so contentWorkFor returns null');

// Blocked draft: no script
const emptyScriptDraft = { ...draftRow, script: '' };
const wItemBlocked = contentWorkFor(emptyScriptDraft, writerActor, ctxNow);
assert.ok(wItemBlocked, 'Writer should see blocked draft');
assert.strictEqual(wItemBlocked.blockedNote, 'Write a script first');

// Draft (UNCUT): named multimedia_journalist -> "Footage Ready"
const uncutDraft = { id: 102, content_type: 'UNCUT', status: 'Draft', multimedia_journalist: 'Reporter Rita', role_multimedia_journalist: true };
const ritaActor = { full_name: 'Reporter Rita', role: 'general', role_multimedia_journalist: true };
const rItem = contentWorkFor(uncutDraft, ritaActor, ctxNow);
assert.ok(rItem, 'Rita should see footage ready');
assert.strictEqual(rItem.actionId, 'footage_ready');
assert.strictEqual(rItem.label, 'Footage Ready');
assert.strictEqual(contentWorkFor(uncutDraft, otherActor, ctxNow), null);

// Script Submitted: anyone with can_approve_scripts (queue)
const scriptSubRow = { id: 103, content_type: 'EXPLAINER', status: 'Script Submitted', writer: 'Writer Alice' };
const approverActor = { full_name: 'Charlie Approver', role: 'general', can_approve_scripts: true };
const sItem = contentWorkFor(scriptSubRow, approverActor, ctxNow);
assert.ok(sItem, 'Approver should see script submitted in queue');
assert.strictEqual(sItem.actionId, 'approve_script');
assert.strictEqual(sItem.label, 'Approve Script');
assert.strictEqual(contentWorkFor(scriptSubRow, otherActor, ctxNow), null);

// Ready for Shoot:
// (a) named camera_operator, producer or production_manager
const shootRowNamed = { id: 104, content_type: 'EXPLAINER', status: 'Ready for Shoot', camera_operator: 'Cam Dan' };
const camDan = { full_name: 'Cam Dan', role: 'general', role_camera_operator: true };
const csItem = contentWorkFor(shootRowNamed, camDan, ctxNow);
assert.ok(csItem);
assert.strictEqual(csItem.actionId, 'start_shoot');
assert.strictEqual(csItem.label, 'Start Shoot');

const shootRowProducer = { id: 105, content_type: 'EXPLAINER', status: 'Ready for Shoot', producer: 'Prod Paul' };
const prodPaul = { full_name: 'Prod Paul', role: 'general', role_producer: true };
const cpItem = contentWorkFor(shootRowProducer, prodPaul, ctxNow);
assert.ok(cpItem);
assert.strictEqual(cpItem.actionId, 'start_shoot');

// (b) any camera operator when camera_operator is empty (open for pick-up)
const shootRowOpen = { id: 106, content_type: 'EXPLAINER', status: 'Ready for Shoot', camera_operator: '' };
const camAny = { full_name: 'Cam Any', role: 'general', role_camera_operator: true };
const coItem = contentWorkFor(shootRowOpen, camAny, ctxNow);
assert.ok(coItem, 'Any camera op should pick up open shoot');
assert.strictEqual(coItem.actionId, 'start_shoot');
assert.strictEqual(contentWorkFor(shootRowOpen, otherActor, ctxNow), null, 'Non-cam should not pick up shoot');

// (c) blocked if camera_operator is empty and actor is a producer without cam role
const prodOnly = { full_name: 'Prod Only', role: 'general', role_producer: true };
const shootBlocked = { id: 107, content_type: 'EXPLAINER', status: 'Ready for Shoot', producer: 'Prod Only', camera_operator: '' };
const cbItem = contentWorkFor(shootBlocked, prodOnly, ctxNow);
assert.ok(cbItem);
assert.strictEqual(cbItem.blockedNote, 'Camera Operator must be assigned first');

// Shooting: named camera_operator, producer or production_manager
const shootingRow = { id: 108, content_type: 'EXPLAINER', status: 'Shooting', camera_operator: 'Cam Dan' };
const shItem = contentWorkFor(shootingRow, camDan, ctxNow);
assert.ok(shItem);
assert.strictEqual(shItem.actionId, 'finish_shoot');
assert.strictEqual(shItem.label, 'Finish Shoot');
assert.strictEqual(contentWorkFor(shootingRow, camAny, ctxNow), null, 'Unassigned cam op does not see shooting');

// Assign Editor: holders of can_assign_video_editor (queue)
const assignRow = { id: 109, content_type: 'EXPLAINER', status: 'Assign Editor', video_editor: '' };
const editorAssigner = { full_name: 'Edith Assigner', role: 'general', can_assign_video_editor: true };
const aeItem = contentWorkFor(assignRow, editorAssigner, ctxNow);
assert.ok(aeItem);
assert.strictEqual(aeItem.actionId, 'start_edit');
assert.strictEqual(aeItem.label, 'Send to Editing');
assert.strictEqual(aeItem.blockedNote, 'Pick a video editor first');
assert.strictEqual(contentWorkFor(assignRow, otherActor, ctxNow), null);

// Editing: named video_editor
const editingRow = { id: 110, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor' };
const edEditor = { full_name: 'Ed Editor', role: 'general', role_video_editor: true };
const edItem = contentWorkFor(editingRow, edEditor, ctxNow);
assert.ok(edItem);
assert.strictEqual(edItem.actionId, 'submit_video');
assert.strictEqual(edItem.label, 'Submit Video');
assert.strictEqual(contentWorkFor(editingRow, otherActor, ctxNow), null);

// Video Review: holders of can_review_videos (queue)
const reviewRow = { id: 111, content_type: 'EXPLAINER', status: 'Video Review' };
const reviewer = { full_name: 'Vera Reviewer', role: 'general', can_review_videos: true };
const vrItem = contentWorkFor(reviewRow, reviewer, ctxNow);
assert.ok(vrItem);
assert.strictEqual(vrItem.actionId, 'approve_video');
assert.strictEqual(vrItem.label, 'Approve Video');
assert.strictEqual(contentWorkFor(reviewRow, otherActor, ctxNow), null);

// Ready to Publish and Scheduled: named publisher
const rtpRow = { id: 112, content_type: 'EXPLAINER', status: 'Ready to Publish', publisher: 'Pete Publisher' };
const petePub = { full_name: 'Pete Publisher', role: 'general', role_publisher: true };
const rtpItem = contentWorkFor(rtpRow, petePub, ctxNow);
assert.ok(rtpItem);
assert.strictEqual(rtpItem.actionId, 'schedule');
assert.strictEqual(rtpItem.label, 'Mark as Scheduled');

const schedRow = { id: 113, content_type: 'EXPLAINER', status: 'Scheduled', publisher: 'Pete Publisher' };
const schItem = contentWorkFor(schedRow, petePub, ctxNow);
assert.ok(schItem);
assert.strictEqual(schItem.actionId, 'publish');
assert.strictEqual(schItem.label, 'Confirm Published');

// Re-Shoot: named camera_operator, producer or production_manager
const reshootRow = { id: 114, content_type: 'EXPLAINER', status: 'Re-Shoot', camera_operator: 'Cam Dan' };
const rsItem = contentWorkFor(reshootRow, camDan, ctxNow);
assert.ok(rsItem);
assert.strictEqual(rsItem.actionId, 'back_to_shoot');
assert.strictEqual(rsItem.label, 'Back to Shoot Queue');
console.log('✓ 3. Stage rules for non-managers passed');

// ====================================================================
// 4. Photo card rules
// ====================================================================

// Draft: requested_by is me
const cardDraft = { id: 201, content_type: 'PHOTO CARD', status: 'Draft', requested_by: 'Card Req' };
const cardReq = { full_name: 'Card Req', role: 'general', can_request_photo_cards: true };
const cdItem = contentWorkFor(cardDraft, cardReq, ctxNow);
assert.ok(cdItem);
assert.strictEqual(cdItem.actionId, 'submit_card');
assert.strictEqual(cdItem.label, 'Submit to Design');
assert.strictEqual(contentWorkFor(cardDraft, otherActor, ctxNow), null);

// Requested: role_graphic_designer holders (pick-up)
const cardReqStage = { id: 202, content_type: 'PHOTO CARD', status: 'Requested' };
const designer = { full_name: 'Des Designer', role: 'general', role_graphic_designer: true };
const crItem = contentWorkFor(cardReqStage, designer, ctxNow);
assert.ok(crItem);
assert.strictEqual(crItem.actionId, 'take_card');
assert.strictEqual(crItem.label, "I'm taking it");
assert.strictEqual(contentWorkFor(cardReqStage, otherActor, ctxNow), null);

// Designing: graphic_designer is me (if correction_count > 0 add a correction note)
const cardDesigning = { id: 203, content_type: 'PHOTO CARD', status: 'Designing', graphic_designer: 'Des Designer', correction_count: 2, correction_note: 'Change font size' };
const cdesItem = contentWorkFor(cardDesigning, designer, ctxNow);
assert.ok(cdesItem);
assert.strictEqual(cdesItem.actionId, 'made_card');
assert.strictEqual(cdesItem.label, 'Made, send for review');
assert.strictEqual(cdesItem.blockedNote, 'Correction: Change font size');
assert.strictEqual(contentWorkFor(cardDesigning, otherActor, ctxNow), null);

// In Review: approvers and the requester, never the designer
const cardInReview = { id: 204, content_type: 'PHOTO CARD', status: 'In Review', requested_by: 'Card Req', graphic_designer: 'Des Designer' };
const cardApprover = { full_name: 'Card App', role: 'general', can_approve_photo_cards: true };
assert.ok(contentWorkFor(cardInReview, cardApprover, ctxNow));
assert.ok(contentWorkFor(cardInReview, cardReq, ctxNow));
assert.strictEqual(contentWorkFor(cardInReview, designer, ctxNow), null, 'Designer must NEVER approve own card');
assert.strictEqual(contentWorkFor(cardInReview, otherActor, ctxNow), null);

// Ready to Publish / Scheduled: named publisher, or any role_publisher holder when publisher is empty
const cardRtpOpen = { id: 205, content_type: 'PHOTO CARD', status: 'Ready to Publish', publisher: '' };
const pubGeneral = { full_name: 'General Pub', role: 'general', role_publisher: true };
const crtpItem = contentWorkFor(cardRtpOpen, pubGeneral, ctxNow);
assert.ok(crtpItem, 'Any publisher can pick up open card publish');
assert.strictEqual(crtpItem.actionId, 'schedule');
console.log('✓ 4. Photo card rules passed');

// ====================================================================
// 5. Manager / Owner filter
// ====================================================================
const boss = { full_name: 'Boss Man', role: 'manager' };

// (a) named in slot: boss is writer
const bossDraft = { id: 301, content_type: 'EXPLAINER', status: 'Draft', writer: 'Boss Man', script: 'Boss script' };
assert.ok(contentWorkFor(bossDraft, boss, ctxNow), 'Boss sees own slot draft');

// (b) approval queues:
assert.ok(contentWorkFor(scriptSubRow, boss, ctxNow), 'Boss sees Script Submitted queue');
assert.ok(contentWorkFor(reviewRow, boss, ctxNow), 'Boss sees Video Review queue');
assert.ok(contentWorkFor(cardInReview, boss, ctxNow), 'Boss sees Card In Review queue');

// Boss does NOT see Assign Editor queue when not late/soon
assert.strictEqual(contentWorkFor(assignRow, boss, ctxNow), null, 'Boss does not see Assign Editor queue when normal');

// Boss does NOT see open pick-ups when not late/soon
assert.strictEqual(contentWorkFor(shootRowOpen, boss, ctxNow), null, 'Boss does not see open shoot pick-up when normal');
assert.strictEqual(contentWorkFor(cardReqStage, boss, ctxNow), null, 'Boss does not see card requested pick-up when normal');

// (c) Late or Soon: boss sees them regardless of slot!
const lateRow = { id: 302, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T10:00:00.000Z' }; // 2 hours ago
const lateItem = contentWorkFor(lateRow, boss, ctxNow);
assert.ok(lateItem, 'Boss sees late content in editing');
assert.strictEqual(lateItem.urgency, 'late');

// Manager with Late content in 'Draft' whose writer/slot is someone else:
// Must be shown with a fallback action (tone: primary -> 'submit')
const lateDraftOtherWriter = {
  id: 399,
  content_type: 'EXPLAINER',
  status: 'Draft',
  writer: 'Other Guy',
  script: 'Other script',
  scheduled_publish_time: '2026-11-24T10:00:00.000Z',
};
const bossLateDraftItem = contentWorkFor(lateDraftOtherWriter, boss, ctxNow);
assert.ok(bossLateDraftItem, 'Boss must see late draft even if writer is someone else');
assert.strictEqual(bossLateDraftItem.actionId, 'submit', 'Fallback action for draft is submit');
assert.strictEqual(bossLateDraftItem.urgency, 'late');

const soonRow = { id: 303, content_type: 'EXPLAINER', status: 'Ready for Shoot', camera_operator: 'Cam Dan', scheduled_publish_time: '2026-11-24T12:30:00.000Z' }; // 30 min from now (<=60 min)
const soonItem = contentWorkFor(soonRow, boss, ctxNow);
assert.ok(soonItem, 'Boss sees soon content in shoot');
assert.strictEqual(soonItem.urgency, 'soon');
console.log('✓ 5. Manager / Owner filter passed');

// ====================================================================
// 6. Urgency calculation
// ====================================================================
// now is 12:00:00Z
const tLate = { id: 401, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T11:59:59.000Z' };
assert.strictEqual(contentWorkFor(tLate, edEditor, ctxNow).urgency, 'late');

const tSoon = { id: 402, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T12:59:00.000Z' };
assert.strictEqual(contentWorkFor(tSoon, edEditor, ctxNow).urgency, 'soon');

const tNormal = { id: 403, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T13:30:00.000Z' };
assert.strictEqual(contentWorkFor(tNormal, edEditor, ctxNow).urgency, null);

// Photo cards always null urgency
const cardLateTime = { id: 404, content_type: 'PHOTO CARD', status: 'Designing', graphic_designer: 'Des Designer', scheduled_publish_time: '2026-11-24T10:00:00.000Z' };
assert.strictEqual(contentWorkFor(cardLateTime, designer, ctxNow).urgency, null, 'Cards must have null urgency');
console.log('✓ 6. Urgency calculation passed');

// ====================================================================
// 7. Sorting: late first, then soon, then publishAt ascending, stable by id
// ====================================================================
const rNormal2 = { id: 502, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T16:00:00.000Z' };
const rNormal1 = { id: 501, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T14:00:00.000Z' };
const rNoDate = { id: 503, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: null };
const rLate = { id: 504, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T11:00:00.000Z' };
const rSoon = { id: 505, content_type: 'EXPLAINER', status: 'Editing', video_editor: 'Ed Editor', scheduled_publish_time: '2026-11-24T12:40:00.000Z' };

const sortedRes = buildContentWork({
  rows: [rNormal2, rNoDate, rSoon, rNormal1, rLate],
  actor: edEditor,
  now: fixedNow,
});

assert.strictEqual(sortedRes.items.length, 5);
assert.strictEqual(sortedRes.items[0].row.id, 504, 'Late must be first');
assert.strictEqual(sortedRes.items[1].row.id, 505, 'Soon must be second');
assert.strictEqual(sortedRes.items[2].row.id, 501, '14:00 before 16:00');
assert.strictEqual(sortedRes.items[3].row.id, 502, '16:00 after 14:00');
assert.strictEqual(sortedRes.items[4].row.id, 503, 'No date must be last');
console.log('✓ 7. Sorting passed');

// ====================================================================
// 8. doneToday from audit_log
// ====================================================================
const todayDhakaNow = todayDhaka(fixedNow); // '2026-11-24'
const doneRow = {
  id: 601,
  content_uid: 'WAVECON-20261124_0001',
  title: 'Top Story Today',
  status: 'Ready for Shoot',
  audit_log: [
    { kind: 'status', actor: 'Writer Alice', from: 'Draft', to: 'Script Submitted', time: '2026-11-24T06:00:00.000Z' },
    { kind: 'status', actor: 'Boss Man', from: 'Script Submitted', to: 'Ready for Shoot', time: '2026-11-24T07:00:00.000Z' },
    { kind: 'status', actor: 'Writer Alice', from: 'Draft', to: 'Script Submitted', time: '2026-11-20T06:00:00.000Z' }, // old day
    { kind: 'change', field: 'Title', actor: 'Writer Alice', time: '2026-11-24T06:30:00.000Z' }, // not status kind
  ],
};

const aliceDone = buildContentWork({ rows: [doneRow], actor: writerActor, now: fixedNow });
assert.strictEqual(aliceDone.doneToday.length, 1);
assert.strictEqual(aliceDone.doneToday[0].contentId, 'WAVECON-20261124_0001');
assert.strictEqual(aliceDone.doneToday[0].status, 'Script Submitted');
assert.strictEqual(aliceDone.doneToday[0].label, 'Moved to Script Submitted');

const bossDone = buildContentWork({ rows: [doneRow], actor: boss, now: fixedNow });
assert.strictEqual(bossDone.doneToday.length, 1);
assert.strictEqual(bossDone.doneToday[0].status, 'Ready for Shoot');
assert.strictEqual(bossDone.doneToday[0].label, 'Moved to Ready for Shoot');
console.log('✓ 8. doneToday passed');

// ====================================================================
// 9. rowBelongsInView extension
// ====================================================================
const rRangeStart = new Date('2026-11-01T00:00:00.000Z');
const rRangeEnd = new Date('2026-11-02T00:00:00.000Z');

// Out of range open status
const outOfRangeEditing = { id: 701, channel: 'The Wave 24', slug_name: 'TEST-SLUG', status: 'Editing', scheduled_publish_time: '2026-11-24T12:00:00.000Z' };
assert.strictEqual(rowBelongsInView(outOfRangeEditing, rRangeStart, rRangeEnd), true, 'rowBelongsInView must keep PANEL_OPEN_STATUSES');

// Out of range closed status
const outOfRangePublished = { id: 702, channel: 'The Wave 24', slug_name: 'TEST-SLUG', status: 'Published', scheduled_publish_time: '2026-11-24T12:00:00.000Z' };
assert.strictEqual(rowBelongsInView(outOfRangePublished, rRangeStart, rRangeEnd), false, 'Published out of range must not belong');
console.log('✓ 9. rowBelongsInView extension passed');

console.log('\nALL N165 TESTS PASSED SUCCESSFULLY! ✓');
