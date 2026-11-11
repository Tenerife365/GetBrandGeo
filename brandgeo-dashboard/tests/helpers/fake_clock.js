/**
 * fake_clock.js: puts a whole test process on one scripted clock.
 *
 * WHY. Several affiliate code paths take their "now" from the system and
 * accept no clock from the caller: affiliate-conversions.js handle() calls
 * service.recordConversion() with the default `now = new Date()`, and
 * _affiliate_stripe.js calls markSubscriptionEnded() and reverseConversion()
 * the same way. A test that seeds rows on a fixed date and then runs those
 * paths compares a scripted date with the real one, so it passes until the
 * real date crosses a fixture boundary and fails from that moment on with no
 * source change (2026-11-11 10:00 UTC: a visit dated 2026-09-12 10:00 UTC plus
 * a 60 day attribution window).
 *
 * WHAT. installFakeClock(getNow) replaces the global Date with a constructor
 * that answers `new Date()`, `Date()` and `Date.now()` from getNow() and passes
 * every call that carries arguments straight to the real Date. Those three are
 * the only ways JavaScript reads the wall clock, so after the install no
 * real-time value can reach product code. The objects it builds are real Date
 * instances (same prototype), so `instanceof Date` holds in both directions
 * and nothing downstream can tell the difference.
 *
 * getNow is called on every read, so a test moves time by reassigning the
 * variable its getter closes over:
 *
 *   let clock = new Date('2026-09-12T10:00:00Z')
 *   installFakeClock(() => clock)
 *   ...
 *   clock = new Date('2026-11-01T00:00:00Z')
 *
 * Returns a restore function. Test only: nothing under netlify/ loads this.
 */
function installFakeClock(getNow) {
  if (typeof getNow !== 'function') throw new TypeError('installFakeClock needs a function that returns the current Date')
  const RealDate = global.Date
  const nowMs = () => {
    const v = getNow()
    const ms = v instanceof RealDate ? v.getTime() : Number(v)
    if (!Number.isFinite(ms)) throw new Error('installFakeClock: the clock getter returned an invalid date')
    return ms
  }
  function FakeDate(...args) {
    if (!new.target) return new RealDate(nowMs()).toString()
    return Reflect.construct(RealDate, args.length ? args : [nowMs()], new.target)
  }
  Object.setPrototypeOf(FakeDate, RealDate)   // Date.parse, Date.UTC
  FakeDate.prototype = RealDate.prototype     // real Date instances either way
  FakeDate.now = nowMs
  global.Date = FakeDate
  return function restore() { global.Date = RealDate }
}

module.exports = { installFakeClock }
