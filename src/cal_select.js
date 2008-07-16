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
      if (event.keyCode == Event.KEY_TAB) { this.hide(); }
    }.bindAsEventListener(this));

    document.observe('click', this.hide.bind(this));

    this.dateField.observe('click', Event.stop);
    this.calWrapper.observe('click', Event.stop);
  },

  show: function() {
    this.dateField.select();
    var selectedDate = this.getDate();
    var pageDate = selectedDate ? selectedDate.clone() : new Date();
    var calPage = new CalPage(pageDate, selectedDate, this.setDate.bind(this));
    this.calWrapper.update(calPage);
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

});

var CalPage = Class.create({

  initialize: function(pageDate, selectedDate, dateSelectCallback) {
    this.pageDate = pageDate.startOfMonth();
    this.selectedDate = selectedDate;
    this.dateSelectCallback = dateSelectCallback;
  },

  monthIdx: function() {
    return this.pageDate.getMonth();
  },

  toElement: function() {
    this.calTable = $(document.createElement('table'));
    var tHead = $(document.createElement('thead'));
    this.calTable.insert(tHead);

    this.calTable.tHead.insert(new CalMonthHeader(this.pageDate, this.advance.bind(this)));
    this.calTable.tHead.insert(new CalDayHeader());
    this.calTable.insert(new CalMonth(this));
    
    return this.calTable;
  },

  advance: function(months) {
    this.pageDate.setMonth(this.pageDate.getMonth() + months);
    this.calTable.replace(this);
  },

});

var CalMonthHeader = Class.create({

  initialize: function(date, pagerCallback) {
    this.pageDate = date;
    this.pagerCallback = pagerCallback;
  },

  toElement: function() {
    var tr = document.createElement('tr');

    tr.insert(new CalPager('left', this.pagerCallback));

    var month = $(document.createElement('th'));
    month.colSpan = 5;
    tr.insert(month);
    month.insert(this.pageDate.getMonthName() + ' ' + this.pageDate.getFullYear());
    
    tr.insert(new CalPager('right', this.pagerCallback));

    return tr;
  },

});

var CalPager = Class.create({

  initialize: function(direction, pagerCallback) {
    this.direction = direction.capitalize();
    this.pagerCallback = pagerCallback;
  },

  createLeftPager: function() {
    return this.createPager('&#171;', -1);
  },

  createRightPager: function() {
    return this.createPager('&#187;', 1);
  },

  createPager: function(text, months) {
    var th = $(document.createElement('th'));
    th.addClassName('pager');
    th.insert(text);
    th.observe('click', this.pagerCallback.curry(months));
    return th
  },

  toElement: function() {
    return this['create'+this.direction+'Pager']();
  }
  
});

var CalDayHeader = Class.create({
  headers: $w('S M T W T F S'),
  toElement: function() {
    var row = document.createElement('tr')
    this.headers.each(function(day) {
      var cell = $(document.createElement('th'));
      row.insert(cell.insert(day));
    });
    return row;
  }
});

var CalMonth = Class.create({

  initialize: function(calPage) {
    this.calPage = calPage;
  },

  dateRange: function() {
    return $R(this.calPage.pageDate.startOfMonth().startOfWeek(),
      this.calPage.pageDate.endOfMonth().endOfWeek());
  },

  toElement: function() {
    var calBody = $(document.createElement('tbody'));
    var calRow;
    var calPage = this.calPage;

    this.dateRange().each(function(date) {
      if (date.getDay() == 0) { calRow = calBody.addRow(); }
      calRow.insert(new CalDate(date, calPage));
    });

    return calBody;
  }

});

var CalDate = Class.create({
  
  initialize: function(date, calPage) {
    this.date = date;
    this.calPage = calPage;
    this.selectCallback = calPage.dateSelectCallback.curry(date);

    this.isOtherMonth = (date.getMonth() != calPage.monthIdx());
    this.isSelected   = (date.sameDateAs(calPage.selectedDate));
    this.isToday      = (this.date.isToday());
  },

  cssClassMap: $H({isOtherMonth: 'other', isSelected: 'selected', isToday: 'today'}),
  addConditionalClasses: function(element) {
    this.cssClassMap.each(function(pair) {
      if (this[pair.key]) { element.addClassName(pair.value); }
    }.bind(this));
  },

  toElement: function() {
    var calCell = $(document.createElement('td'));
    this.addConditionalClasses(calCell);
    calCell.insert(this.date.getDate());
    calCell.observe('click', this.selectCallback);
    return calCell;
  }
  
});