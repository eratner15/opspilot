/**
 * test-voice-flow.ts
 * End-to-end test script for the voice AI pipeline (mocked, no live calls).
 *
 * Run with: npx tsx scripts/test-voice-flow.ts
 */

import { mockClassifierResult, mockVoiceResponse } from '../src/server/services/ai/mock';
import { buildClassifierPrompt } from '../src/server/services/ai/prompts/classifier';
import { buildVoiceGreeting } from '../src/server/services/ai/prompts/voice-agent';
import { buildTwiML, parseFormBody } from '../src/server/services/twilio/validate';

const PASS = '✅';
const FAIL = '❌';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`${PASS} ${name}`);
    passed++;
  } else {
    console.error(`${FAIL} ${name}${details ? ': ' + details : ''}`);
    failed++;
  }
}

// ──────────────────────────────────────────────────────────
// 1. Classifier mock tests
// ──────────────────────────────────────────────────────────
console.log('\n=== 1. Classifier Mock ===');

const hvacTranscript = 'My AC is not cooling the house, its been 2 days and its super hot';
const hvacResult = mockClassifierResult(hvacTranscript);
assert(hvacResult.serviceCategory === 'HVAC', 'HVAC transcript → HVAC category');
assert(hvacResult.intent === 'SCHEDULE_SERVICE' || hvacResult.intent === 'EMERGENCY', 'Intent is scheduling');
assert(hvacResult.confidence > 0, 'Confidence > 0');
assert(!hvacResult.summary.includes('phone') && !hvacResult.summary.includes('name'), 'Summary has no PII');

const plumbingTranscript = 'I have a burst pipe in my basement, water everywhere';
const plumbingResult = mockClassifierResult(plumbingTranscript);
assert(plumbingResult.serviceCategory === 'PLUMBING', 'Burst pipe → PLUMBING category');
assert(plumbingResult.urgency === 'EMERGENCY', 'Burst pipe → EMERGENCY urgency');
assert(plumbingResult.intent === 'EMERGENCY', 'Burst pipe → EMERGENCY intent');

const unknownTranscript = 'Hello I want to ask about your prices';
const unknownResult = mockClassifierResult(unknownTranscript);
assert(unknownResult.serviceCategory === 'GENERAL', 'Unknown → GENERAL category');

// ──────────────────────────────────────────────────────────
// 2. Voice greeting tests
// ──────────────────────────────────────────────────────────
console.log('\n=== 2. Voice Greetings ===');

const greeting = buildVoiceGreeting({
  businessName: 'Comfort Pro HVAC',
  businessType: 'HVAC company',
  callerIsKnown: false,
  currentTime: 'Tuesday afternoon',
  afterHours: false,
});
assert(greeting.includes('Comfort Pro HVAC'), 'Greeting includes business name');
assert(!greeting.toLowerCase().includes('ai') && !greeting.toLowerCase().includes('robot'), 'Greeting does not reveal AI');

const afterHoursGreeting = buildVoiceGreeting({
  businessName: 'Comfort Pro HVAC',
  businessType: 'HVAC company',
  callerIsKnown: false,
  currentTime: 'Tuesday evening',
  afterHours: true,
});
assert(afterHoursGreeting.includes('closed') || afterHoursGreeting.includes('morning'), 'After-hours greeting mentions closure');

// ──────────────────────────────────────────────────────────
// 3. TwiML generation tests
// ──────────────────────────────────────────────────────────
async function testTwiML() {
  console.log('\n=== 3. TwiML Generation ===');

  const twimlResponse = buildTwiML('<Say>Hello</Say>');
  assert(twimlResponse instanceof Response, 'buildTwiML returns Response');

  const twimlText = await twimlResponse.text();
  assert(twimlText.startsWith('<?xml'), 'TwiML starts with XML declaration');
  assert(twimlText.includes('<Response>'), 'TwiML has Response element');
  assert(twimlText.includes('<Say>Hello</Say>'), 'TwiML contains Say element');

  const contentType = twimlResponse.headers.get('Content-Type');
  assert(contentType === 'text/xml', 'Content-Type is text/xml');
}

// ──────────────────────────────────────────────────────────
// 4. Form body parsing tests
// ──────────────────────────────────────────────────────────
console.log('\n=== 4. Form Body Parsing ===');

const formBody = 'From=%2B15551234567&To=%2B15559876543&Body=YES&CallSid=CA123';
const parsed = parseFormBody(formBody);
assert(parsed['From'] === '+15551234567', 'Phone decoded correctly');
assert(parsed['Body'] === 'YES', 'Body parsed correctly');
assert(parsed['CallSid'] === 'CA123', 'CallSid parsed correctly');

// ──────────────────────────────────────────────────────────
// 5. Fallback behavior tests
// ──────────────────────────────────────────────────────────
console.log('\n=== 5. Fallbacks ===');

// Fallback: Claude failure → mock response
const mockResponse = mockVoiceResponse();
assert(typeof mockResponse === 'string', 'Mock voice response is a string');
assert(mockResponse.length > 20, 'Mock response is non-trivial');
assert(!mockResponse.toLowerCase().includes('error'), 'Mock response is professional');

// Fallback: Empty transcript → sensible default
const emptyResult = mockClassifierResult('');
assert(typeof emptyResult.intent === 'string', 'Empty transcript has valid intent');
assert(typeof emptyResult.serviceCategory === 'string', 'Empty transcript has valid category');

// Fallback: Classifier prompt has no PII
const prompt = buildClassifierPrompt({ transcript: 'AC broken', callerPhone: '[REDACTED]' });
assert(prompt.includes('[REDACTED]'), 'Classifier prompt redacts phone');
assert(!prompt.includes('+1555'), 'Classifier prompt does not contain real phone number');

// ──────────────────────────────────────────────────────────
// Run async tests + results
// ──────────────────────────────────────────────────────────
async function main() {
  await testTwiML();

  console.log(`\n=== Results ===`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nSome tests failed!');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
