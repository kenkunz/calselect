// Class methods
Object.extend(Date, {

  today: function() {
    return new Date().startOfDay();
  },

  // expects date in MM/DD/YY or MM/DD/YYYY format; if year is given as YY,
  // sets full year to year within ±50 years of today
  smartParse: function(dateStr) {
    var dateMatch = dateStr.match(/^\s*\d{1,2}\/\d{1,2}\/\d{2}(\d{1,2})?\s*$/);
    if (dateMatch) {
      date = new Date(dateStr);
      dateMatch[1] || date._setCorrectYear();
      return date;
    }
  },

});

// Instance methods
Object.extend(Date.prototype, {

  clone: function(func) {
    var date = new Date(this);
    func && func(date);
    return date;
  },

  succ: function() {
    return this.clone(function(date) {
      date.setDate(date.getDate() + 1);
    });
  },

  startOfMonth: function() {
    return this.clone(function(date) {
      date.setDate(1);
    });
  },
  
  endOfMonth: function() {
    return this.clone(function(date) {
      date.setDate(1);
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
    });
  },

  setDayOfWeek: function(dayIdx) {
    this.setDate(this.getDate() - this.getDay() + dayIdx);
  },

  startOfWeek: function() {
    return this.clone(function(date) {
      date.setDayOfWeek(0);
    });
  },

  endOfWeek: function() {
    return this.clone(function(date) {
      date.setDayOfWeek(6);
    });
  },

  startOfDay: function() {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
  },

  monthNames: $w('January February March April May June July August September October November December'),
  getMonthName: function() {
    return this.monthNames[this.getMonth()];
  },

  getMonthYearHeader: function() {
    return this.getMonthName() + ' ' + this.getFullYear();
  },

  getCentury: function() {
    return (this.getFullYear() / 100).floor();
  },

  setCentury: function(century) {
    var yearOfCentury = this.getFullYear() % 100;
    return this.setFullYear(century * 100 + yearOfCentury);
  },

  toShortString: function() {
    var dd = this.getDate().toPaddedString(2);
    var mm = (this.getMonth() + 1).toPaddedString(2);
    var yy = this.getFullYear().toString().substr(2,2);
    return [ mm, dd, yy ].join('/');
  },

  sameDateAs: function(other) {
    return ((other instanceof Date) && (this.toShortString() == other.toShortString()));
  },

  sameMonthAs: function(other) {
    return ((other instanceof Date) &&
      (this.getFullYear() == other.getFullYear()) &&
      (this.getMonth() == other.getMonth()));
  },

  isToday: function() {
    return this.sameDateAs(new Date());
  },

  advanceYearBy: function(years) {
    return this.setFullYear(this.getFullYear() + years);
  },

  advanceCenturyBy: function(centuries) {
    return this.setCentury(this.getCentury() + centuries);
  },

  // internal method used by Date.smartParse
  // sets full year to year within ±50 years of today
  _setCorrectYear: function() {
    var today = Date.today();
    var upperDate = today.clone(function(d) { d.advanceYearBy(50); });
    var lowerDate = today.clone(function(d) { d.advanceYearBy(-50); });

    this.setCentury(today.getCentury());
    if (this > upperDate)
      this.advanceCenturyBy(-1);
    else if (this <= lowerDate)
      this.advanceCenturyBy(1);
  }
  
});
