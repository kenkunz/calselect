Object.extend(Date.prototype, {

  clone: function(func) {
    date = new Date(this);
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
    date.setDate(date.getDate() - date.getDay() + dayIdx);
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

  monthNames: $w('January February March April May June July August September October November December'),
  getMonthName: function() {
    return this.monthNames[this.getMonth()];
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

  isToday: function() {
    return this.sameDateAs(new Date());
  }

});
