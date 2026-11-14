import test from 'node:test';
import assert from 'node:assert/strict';
import { interactionDescription, pageName, targetName } from '../src/lib/interactionPresentation.ts';
test('Visitor history describes visibility without claiming a click or reading', () => {
 const row = { eventType: 'item_exposure', target: 'open-booking', pageUrl: '/beachclubs/beldi-country-club', durationMs: 3000, deviceType: 'mobile' };
 assert.deepEqual(interactionDescription(row), { action: 'Book now button stayed visible for 3.0 seconds', page: 'Beldi Country Club', detail: 'On mobile' });
 assert.equal(interactionDescription({...row,eventType:'click'}).action,'Clicked Book now button');
 assert.equal(interactionDescription({eventType:'scroll_depth',metadata:{percent:75}}).action,'Reached 75% of the page');
 assert.equal(targetName({target:'hero-slide.7aac1b33-1572-42cd-b13f-8fa4381b76ce'}),'Homepage banner slide');
 assert.equal(targetName({target:'description.0'}),'Product description');
 assert.equal(interactionDescription({eventType:'form_result',metadata:{result:'error'}}).action,'Form showed an error');
 assert.equal(pageName('/fr/beachclubs/beldi-country-club'),'Beldi Country Club');
 assert.equal(pageName('/pay/secret-token'),'Secure payment page');
 assert.ok(!interactionDescription({eventType:'unknown_internal_code',target:'plan.123'}).action.includes('unknown_internal_code'));
});
