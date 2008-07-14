Object.extend(Date.prototype, {

  clone: function(func) {
    date = new Date(this);
    if (func) { func(date) }
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

  same: function(other) {
    return ((other instanceof Date) && (this.toShortString() == other.toShortString()));
  }

});

var TableSectionMethods = {
  addRow: function(tHead) {
    return $(tHead.appendChild(document.createElement('tr')));
  }
};
Element.addMethods('THEAD', TableSectionMethods);
Element.addMethods('TBODY', TableSectionMethods);

var CalSelect = Class.create({

  initialize: function(dateField) {
    this.dateField = $(dateField);
    this.initCalWrapper();
    this.initObservers();
  },

  initCalWrapper: function() {
    this.calWrapper = $(document.createElement('div'));
    this.calWrapper.addClassName('calendar');
    this.calWrapper.hide();
    this.dateField.insert({after: this.calWrapper});
  },

  initObservers: function() {
    this.dateField.observe('focus', this.show.bind(this));
    this.dateField.observe('keydown', function(event) {
      if (event.keyCode == Event.KEY_TAB) {
        this.hide();
      }
    }.bindAsEventListener(this));

    document.observe('click', this.hide.bind(this));

    this.dateField.observe('click', Event.stop);
    this.calWrapper.observe('click', Event.stop);
  },

  show: function() {
    this.dateField.select();
    var selectedDate = this.getDate();
    var pageDate = selectedDate ? selectedDate.clone() : new Date();
    new CalPage(this.calWrapper, pageDate, selectedDate, this.setDate.bind(this));
    this.setPosition();
    this.calWrapper.show();
  },

  setPosition: function() {
    var offset = this.dateField.positionedOffset();
    offset.top += this.dateField.getHeight();
    this.calWrapper.setStyle({left: offset.left+'px', top: offset.top+'px'});    
  },

  hide: function() {
    this.calWrapper.hide();
  },

  getDate: function() {
    var dateStr = $F(this.dateField);
    var dateMatch = dateStr.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{2}(\d{2})?)\s*$/);
    if (dateMatch) {
      var month = dateMatch[1] - 1;
      var day   = dateMatch[2];
      var year  = dateMatch[3];
      if (!dateMatch[4]) { year = '20' + year; }
      return new Date(year, month, day);
    } else {
      return null;
    }
  },

  setDate: function(date) {
    this.dateField.setValue(date.toShortString());
    this.hide();
  }

})

var CalPage = Class.create({

  initialize: function(calWrapper, pageDate, selectedDate, dateSelectCallback) {
    this.pageDate = pageDate;
    this.selectedDate = selectedDate;
    this.dateSelectCallback = dateSelectCallback;
    this.insertCalPage(calWrapper);
  },

  insertCalPage: function(calWrapper) {
    this.createCalTable();
    calWrapper.innerHTML = '';
    calWrapper.insert(this.calTable);
  },

  createCalTable: function() {
    this.calTable = $(document.createElement('table'));
    var tHead = $(document.createElement('thead'));
    this.calTable.insert(tHead);

    this.createMonthHeader();
    this.createDayHeaders();
    this.createMonth();
  },

  createMonthHeader: function() {
    var tr = this.calTable.tHead.addRow();

    this.createLeftPager(tr);

    var month = $(document.createElement('th'));
    month.colSpan = 5;
    tr.insert(month);
    month.insert(this.pageDate.getMonthName() + ' ' + this.pageDate.getFullYear());
    
    this.createRightPager(tr);
  },

  createLeftPager: function(tr) {
    this.createPager(tr, '&#171;', -1);
  },

  createRightPager: function(tr) {
    this.createPager(tr, '&#187;', 1);
  },

  createPager: function(tr, text, months) {
    var th = $(document.createElement('th'));
    th.addClassName('pager');
    tr.insert(th);
    th.insert(text);
    th.observe('click', this.page.bind(this, months));
  },

  page: function(months) {
    // TODO: refactor - just instantiate a new CalPage with the right args!
    // also, rename to "advance" or something
    var oldPage = this.calTable;
    this.pageDate.setMonth(this.pageDate.getMonth() + months);
    this.createCalTable();
    oldPage.replace(this.calTable);
  },

  createDayHeaders: function() {
    var tr = this.calTable.tHead.addRow();
    $w('S M T W T F S').each(function(day) {
      var th = $(document.createElement('th'));
      tr.insert(th);
      th.insert(day);
    });
  },

  createMonth: function() {
    var tBody = $(document.createElement('tbody'));
    this.calTable.insert(tBody);
    var tr, td;

    var begin = this.pageDate.startOfMonth().startOfWeek();
    var end   = this.pageDate.endOfMonth().endOfWeek();
    var month = this.pageDate.getMonth();

    var callback = this.dateSelectCallback;
    var selectedDate = this.selectedDate;
    var today = new Date();

    $R(begin, end).each(function(date) {
      if (date.getDay() == 0) { tr = tBody.addRow(); }
      td = $(document.createElement('td'));
      if (date.getMonth() != month) { td.addClassName('other'); }
      if (date.same(selectedDate)) { td.addClassName('selected'); }
      if (date.same(today)) { td.addClassName('today'); }
      tr.insert(td);
      td.insert(date.getDate());
      td.observe('click', callback.curry(date));
    });
  }

});
