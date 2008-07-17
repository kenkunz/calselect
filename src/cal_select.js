var CalSelect = Class.create({

  initialize: function(dateField) {
    this.dateField = $(dateField);
    this.initCalWrapper();
    this.initObservers();
  },

  initCalWrapper: function() {
    this.calWrapper = $(document.createElement('div'));
    this.calWrapper.observe('calSelect:dateClicked', function(event) {
      this.setDate(event.memo.date);
    }.bindAsEventListener(this));
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
    var calPage = new CalPage(pageDate, selectedDate);
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

  initialize: function(pageDate, selectedDate) {
    this.pageDate = pageDate.startOfMonth();
    this.selectedDate = selectedDate;
  },

  monthIdx: function() {
    return this.pageDate.getMonth();
  },

  toElement: function() {
    this.calTable = $(document.createElement('table'));

    var tHead = $(document.createElement('thead'));
    tHead.observe('calSelect:pagerClicked', function(event) {
      this.advance(event.memo.advanceBy);
    }.bindAsEventListener(this));
    this.calTable.insert(tHead);

    this.calTable.tHead.insert(new CalMonthHeader(this.pageDate));
    this.calTable.tHead.insert(new CalDayHeader());
    this.calTable.insert(new CalMonth(this.pageDate, this.selectedDate));
    
    return this.calTable;
  },

  advance: function(months) {
    this.pageDate.setMonth(this.pageDate.getMonth() + months);
    this.calTable.replace(this);
  },

});

var CalMonthHeader = Class.create({

  initialize: function(date) {
    this.pageDate = date;
  },

  toElement: function() {
    var tr = $(document.createElement('tr'));

    tr.insert(new CalPagerLeft());

    var month = $(document.createElement('th'));
    month.colSpan = 5;
    tr.insert(month);
    month.insert(this.pageDate.getMonthName() + ' ' + this.pageDate.getFullYear());
    
    tr.insert(new CalPagerRight());

    return tr;
  },

});

// This is basically an abstract class; subclasses should define displayVal
// and advanceBy attributes
var CalPager = Class.create({

  toElement: function() {
    var th = $(document.createElement('th'));
    th.addClassName('pager');
    th.insert(this.displayVal);
    th.observe('click', function() {
      th.fire("calSelect:pagerClicked", {advanceBy: this.advanceBy});
    }.bind(this));
    return th;
  }

});

var CalPagerLeft = Class.create(CalPager, {
  displayVal: '&#171;',
  advanceBy: -1
});

var CalPagerRight = Class.create(CalPager, {
  displayVal: '&#187;',
  advanceBy: 1
});


var CalDayHeader = Class.create({
  headers: $w('S M T W T F S'),
  toElement: function() {
    var row = $(document.createElement('tr'));
    this.headers.each(function(day) {
      var cell = $(document.createElement('th'));
      row.insert(cell.insert(day));
    });
    return row;
  }
});

var CalMonth = Class.create({

  initialize: function(pageDate, selectedDate) {
    this.pageDate = pageDate;
    this.selectedDate = selectedDate;
  },

  dateRange: function() {
    return $R(this.pageDate.startOfMonth().startOfWeek(),
              this.pageDate.endOfMonth().endOfWeek());
  },

  toElement: function() {
    var calBody = $(document.createElement('tbody'));
    var calRow;

    this.dateRange().each(function(date) {
      if (date.getDay() == 0) {
        calRow = $(document.createElement('tr'));
        calBody.appendChild(calRow);
      }
      calRow.insert(new CalDate(date, this.pageDate, this.selectedDate));
    }.bind(this));

    return calBody;
  }

});

var CalDate = Class.create({
  
  initialize: function(date, pageDate, selectedDate) {
    this.date = date;

    this.classNames = $H({
      other:    !date.sameMonthAs(pageDate),
      selected: date.sameDateAs(selectedDate),
      today:    date.isToday()
    });
  },

  toElement: function() {
    var calCell = $(document.createElement('td'));
    this.addClassNames(calCell);
    calCell.insert(this.date.getDate());
    calCell.observe('click', function() {
      calCell.fire("calSelect:dateClicked", {date: this.date});
    }.bind(this));
    return calCell;
  },

  addClassNames: function(element) {
    this.classNames.each(function(pair) {
      if (pair.value) element.addClassName(pair.key);
    });
  }
  
});