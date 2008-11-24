Object.extend(Test.Unit.Testcase.prototype, {
  assertDateEqual: function(expected, actual) {
    var message = arguments[2] || "assertDateEqual";
    try { expected.valueOf() == actual.valueOf() ? this.pass() :
            this.fail(message + ': expected ' + Test.Unit.inspect(expected) +
              ', actual ' + Test.Unit.inspect(actual)); }
    catch(e) { this.error(e); }
  }
});
